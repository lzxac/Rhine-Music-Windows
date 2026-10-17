import type { MusicAlbum } from "./music-types";

export type MusicSortMode = "genre" | "artist" | "album";

const collator = new Intl.Collator("zh-CN-u-co-pinyin", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
});
const normalize = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-CN");
const stableCompare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Formatting differences share a column without rewriting artist metadata. */
export const musicArtistKey = (album: MusicAlbum) => normalize(album.artist);

/**
 * 合作专辑的歌手串分隔符。**只认半角 `/`**，刻意不认其它字符：
 * - `&` 常常是**组合名的一部分**（这张库里就有 `Lucas & Steve`），切了会把一个乐队变成两个人；
 * - `_` 是**曲目级**歌手的分隔符（`周杰伦 _ 费玉清`），专辑级不用它。
 */
const ARTIST_SEPARATOR = "/";

/**
 * 这些值本身代表"很多人"，不是某位歌手：拆开只会得到无意义的列
 * （`多位艺人` 是真正的合辑标记，`未知艺术家` 是解析失败的兜底）。
 */
const ARTIST_SENTINELS = new Set([
  "多位艺人",
  "未知艺术家",
  "未知歌手",
  "群星",
  "various artists",
  "unknown artist",
]);

/**
 * 把歌手串拆成**参与歌手**列表。
 *
 * 目的：`林俊杰/周杰伦` 这种合作作品，以前会自成一个歌手列，导致在"林俊杰"和"周杰伦"两边
 * 都找不到它。拆开之后它可以同时挂到每位参与歌手的列里（见 orderMusicArtistEntries）。
 *
 * 保守策略：拆不出两个及以上、或其中出现哨兵值，就原样返回整串。
 */
export function splitMusicArtists(artist: string): string[] {
  const raw = String(artist ?? "").trim();
  const parts = raw
    .split(ARTIST_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  if (!unique.length) return ["未知歌手"];
  // 同一个名字重复（`林俊杰/林俊杰`）归一成一个人，而不是留着整串当歌手名。
  if (unique.length === 1) return unique;
  if (unique.some((part) => ARTIST_SENTINELS.has(normalize(part)))) return [raw];
  return unique;
}

/** 用于分组的键（与 `musicArtistKey` 同一套归一化）。 */
export const musicArtistNameKey = (artist: string) => normalize(artist);

export interface MusicArtistEntry {
  album: MusicAlbum;
  /** 这张专辑要挂到哪位歌手下面。 */
  artist: string;
}

/**
 * 按「(专辑, 歌手)」展开成条目：合作专辑会在每位参与歌手的列里**各出现一次**。
 *
 * 为什么是"展开成独立条目"而不是"让同一个索引重复出现在多列"：`fileLocation()`（scene.ts）
 * 只返回**第一个**包含该索引的列，索引重复会让"从第二列打开却跳回第一列"。展开后每个条目
 * 索引唯一，3D 布局、槽位与上下键都不需要改。
 */
export function orderMusicArtistEntries(albums: readonly MusicAlbum[]): MusicArtistEntry[] {
  const entries: MusicArtistEntry[] = [];
  for (const album of albums) {
    for (const artist of splitMusicArtists(album.artist)) entries.push({ album, artist });
  }
  return entries.sort((a, b) => {
    const keyA = musicArtistNameKey(a.artist);
    const keyB = musicArtistNameKey(b.artist);
    return (
      collator.compare(keyA, keyB) ||
      stableCompare(keyA, keyB) ||
      collator.compare(normalize(a.album.title), normalize(b.album.title)) ||
      stableCompare(a.album.id, b.album.id)
    );
  });
}

/** Return a new view order, retaining each album and its original metadata. */
export function orderMusicAlbums(albums: readonly MusicAlbum[], mode: MusicSortMode = "genre") {
  const ordered = [...albums];
  if (mode === "genre") return ordered;
  return ordered.sort((a, b) => {
    if (mode === "artist") {
      const artistA = musicArtistKey(a), artistB = musicArtistKey(b);
      // Keep distinct artist keys contiguous even when locale collation treats
      // their spellings as equivalent; album IDs resolve equivalent titles.
      const artist = collator.compare(artistA, artistB) || stableCompare(artistA, artistB);
      if (artist) return artist;
    }
    return collator.compare(normalize(a.title), normalize(b.title)) || stableCompare(a.id, b.id);
  });
}
