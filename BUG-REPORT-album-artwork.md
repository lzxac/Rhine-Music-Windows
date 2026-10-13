# Bug report: local album artwork bleeds across unrelated albums

**Component:** `scripts/music-library.mjs` (local library scanner)
**Affects:** every build up to and including `0.6.0-dev.57`
**Fixed in:** `0.6.0-dev.58`
**Reported by:** a user with a 666-track local library
**Status:** fixed locally; reported upstream as [Bong712/Rhine-Music-Windows#4](https://github.com/Bong712/Rhine-Music-Windows/pull/4) (2026-10-13)

---

## 1. Symptom

Every track that the scanner pooled into one artist-level folder displayed the **same album cover** — the artwork embedded in whichever file the scanner happened to read first. Files were fine: an independent tag editor (MusicTag) showed the correct, distinct cover for each song, so the metadata itself was never the problem.

Measured on the reporting user's library (`D:\Music\林子汐的车载电台`, 666 audio files, mostly FLAC):

| | Before fix (`dev.57`) | After fix (`dev.58`) |
|---|---|---|
| Albums indexed | 169 | 169 |
| Albums exposing artwork | 119 | 118 |
| **Distinct artwork images used** | **79** | **118** |
| Images reused by more than one album | **1 image shared by 41 albums** | **0** |

A direct metadata probe of the 43 files in `林子汐\` found **41 distinct embedded covers**, while the app served one single image (`c21ebcaa2d7528fac6e1dc01.jpg`) for 41 separate albums.

---

## 2. Reproduction

Layout — this is the common "one folder per artist, one folder per album" collection, where an artist folder additionally holds loose singles:

```
D:\Music\林子汐的车载电台\          <- configured scan root; contains no audio itself
├── 林子汐\                        <- artist folder holding 43 LOOSE files
│   ├── 林子汐 - 爱不在焉.flac       album="爱不在焉"  + own embedded cover
│   ├── 林子汐 - 冰箱.flac          album="冰箱"     + own embedded cover
│   └── ... 41 more, each a different album tag with different artwork
├── 周杰伦\
│   ├── 八度空间\                   <- a genuine album folder, 10 tracks
│   └── 合唱\                       <- compilation folder, 24 tracks from many releases
└── 林俊杰\
    └── 100天\                      <- a genuine album folder
```

Steps:

1. Add the root above as a library folder and scan.
2. Open the album shelf.
3. **Observed:** all 41 albums derived from `林子汐\` show the cover of `爱不在焉.flac`.
4. **Expected:** each album shows its own embedded cover.

Minimal synthetic form of the same bug: put several files with **different `album` tags and different embedded pictures** into a folder that is **one level below** a configured scan root. They all receive the first file's artwork. Move the same files **directly into** the scan root and the bug disappears — that single-variable contrast isolates the faulty condition.

---

## 3. Root cause

Three cooperating defects. The first is the primary one.

### 3.1 `walkAlbums()` treated any subfolder as exactly one release

`scripts/music-library.mjs:135` (in `dev.57`):

```js
if (folder === root) {
  for (const file of tracks) {
    // every loose file directly in the SCAN ROOT becomes its own single entry
    folders.push({ folder, tracks: [file], singleFile: file, cover: ... })
  }
} else {
  // ANY other folder becomes ONE album entry holding all its files
  folders.push({ folder, tracks, cover: images[0] ? path.join(folder, images[0].name) : undefined })
}
```

The "loose files are singles" rule was bound to `folder === root`, i.e. only to files sitting **directly in the configured scan root**. Real collections are organised `root / artist / album / track`, so an artist folder is one level deeper and always took the `else` branch: its 43 unrelated singles became a **single** source entry with 43 tracks.

### 3.2 `readAlbum()` then pooled one cover across that whole entry

`scripts/music-library.mjs:479` and `:492`:

```js
let cover = entry.singleFile ? undefined : fileCover   // 479
...
try { metadata = await this.parseFile(file, { duration: true, skipCovers: !!cover }) }  // 492
...
if (!cover) { /* read the embedded picture, then cover = embedded */ }                 // 496
```

`cover` is scoped to the entry, not to the file. The first file populated it, and every later file was parsed with `skipCovers: true`, so their artwork was **never read at all**. Instrumenting the parser confirmed this: `skipCovers=true` for 42 of the 43 files.

### 3.3 `combineAlbums()` let any source lend its cover

`scripts/music-library.mjs:203–204` (in `dev.57`):

```js
const coverSources = sources.filter((source) => source._cover && !source.offline).concat(...)
const coverSource = coverSources.find(...) ?? coverSources[0]
```

The only requirement was that a source *had* a cover — not that the cover belonged to the album being assembled. Because all 41 albums descended from the one entry produced by 3.1, they all inherited `sources[0]._cover`.

Both `combineAlbums` and `readAlbum` already computed a "single" notion, but it inherited the root-bound assumption from `walkAlbums`, so the whole chain agreed on the wrong granularity.

### 3.4 Why it looked like "everything shows one cover"

`artworkFile(id)` resolves artwork per **album id**, and the frontend's atlas keys a tile by **cover URL** (`src/cover-atlas.ts:499–500`). Both were behaving correctly — 41 albums genuinely received 41 identical `coverUrl`s, so the UI correctly de-duplicated them into a single tile and printed it 41 times. The frontend, the hashing (`artwork/<sha256-of-picture-data>.<ext>`), and the HTTP route were all innocent; a self-check confirmed 78/78 artwork filenames matched the sha256 of their contents with no collisions.

---

## 4. Fix

### 4.1 Detect loose-single and compilation folders

Added `oneReleaseEntry()`: a folder may share one embedded cover **only while its files agree on the album tag**. Folders with conflicting tags — artist folders full of singles, and compilation folders — are treated as many releases, so each file's artwork is read.

```js
oneReleaseEntry(entry, previous) {
  if (entry.cover || entry.singleFile || entry.tracks.length < 2) return true
  let known = 0
  const tags = new Set()
  for (const file of entry.tracks) {
    const cached = previous?.tracks.get(pathKey(file))
    if (!cached) continue
    known += 1
    tags.add(normalizeAlbumName(cached._common?.album))
  }
  return known === entry.tracks.length && tags.size <= 1
}
```

A cold scan has no previously read tags, so it reads each file's artwork and lets the grouping choose; this is what makes the **first** scan after upgrading already correct, rather than needing a second rescan.

### 4.2 Carry artwork per track

When a folder is not one release, each track stores its own image as `_ownCover`, and `readAlbum` no longer skips picture parsing for it. The per-image file is still content-addressed and written once, so a shared image is not duplicated on disk.

### 4.3 Choose the cover that belongs to the album

`combineAlbums()` now prefers, in order:

1. the single image all of the album's own tracks agree on (`_ownCover`);
2. a source that is **itself titled like the album** (`normalizeAlbumName(source.title) === group.key`) — a same-titled release merged from another folder can no longer lend an unrelated cover;
3. otherwise the album's own first track artwork, never a folder image owned by a different release.

### 4.4 Let an existing index repair itself

`LIBRARY_LAYOUT_VERSION` plus a per-track `_entryId` invalidate cached per-file metadata when the grouping rules changed. Without this, `readAlbum`'s cache fast path (`:510`) would keep reusing the pooled cover of the entry a track previously belonged to — verified as a real regression: with a warm cache the fix initially still leaked, and only a cold cache repaired it. Now an upgrade repairs on the next scan.

### 4.5 Files changed

| File | Change |
|---|---|
| `scripts/music-library.mjs` | `oneReleaseEntry()`, per-track `_ownCover`, title-matched cover selection, `LIBRARY_LAYOUT_VERSION` / `_entryId` cache invalidation, `cachedEntryId()`; `splitLooseSingles()` added in the scan loop |
| `scripts/check-music-library.mjs` | two regression tests (see below) |

Both `combineAlbums` and `readAlbum` already had a "single" notion; the fix completes the chain in `walkAlbums`/`readAlbum` instead of relying on the root-bound assumption.

---

## 5. Verification

**Regression tests added** (`scripts/check-music-library.mjs`):

- `loose singles in an artist folder keep their own cover instead of the first file art` — three files in a subfolder, each with its own album tag and its own picture, must yield three albums with three distinct covers, both on the first scan and after a rescan.
- `tracks sharing one album tag still share one cover after loose-single handling` — a genuine three-track album folder must still collapse to one album with one shared cover.

**Suite:** `node --test scripts/check-music-library.mjs` → **14/14 pass** (12 previously, 2 added). The pre-existing tests that pin the opposite behaviours — multi-disc folders grouped by matching album tag (`:114`) and normalized-title merging across roots (`:133`) — still pass unchanged.

**Real library (666 tracks):** 169 albums, 118 with artwork, **118 distinct images, zero reuse**, verified from a cold scan and re-verified with a warm cache.

### Pre-existing failure, unrelated to this bug

`node scripts/check-music-scene.mjs` aborts with:

```
TypeError: Cannot read properties of undefined (reading 'getImageData')
    at CoverAtlas.writePageTile (src/cover-atlas.ts:351)
    at scripts/check-music-scene.mjs:128
```

That check drives the canvas atlas without a browser canvas implementation. It fails **identically on the unmodified `dev.57` tree** (confirmed by stashing the fix), so it is neither caused nor hidden by this change, but it does mean `npm run check:music` cannot run to completion in this environment. Worth fixing separately so the suite can serve as a gate again.

---

## 6. Scope and impact

Any library is affected when a folder below the scan root holds files that belong to **different** releases, which includes two very common layouts:

- **artist folders containing loose singles** — one artist folder with N unrelated downloads collapses to N songs sharing one cover;
- **compilation / "合唱" / "精选" folders** — tracks from many releases collapse to one cover.

Single-release album folders (all files sharing one album tag) were never affected.

**Temporary workaround in `dev.57` without patching:** point the configured library folder at each album folder individually, or move loose singles directly into the scan root. Both make `folder === root` or give the folder a single consistent album tag.

**Separate, unrelated finding for the same library:** 51 of the 169 albums have no artwork because those files genuinely contain no embedded picture (verified by reading every file's tags) and their folders hold no image file. The app correctly renders a "no cover" placeholder for them; they need tagging, not a code fix.

---

## 7. Suggested hardening for the project

1. Add a test asserting that **distinct files in one folder produce distinct covers**. Every existing cover test asserted per album only, never compared two albums' artwork, and the atlas test (`check-music-scene.mjs:182–195`) deliberately feeds three *distinct* cover URLs — so the whole suite was blind to this class of bug.
2. Consider making the "loose files are singles" rule independent of how deep the folder sits under the scan root; the current rule's meaning changes with the user's directory layout.
3. `check-music-scene.mjs` needs a canvas implementation (or a guard) to run outside a browser, otherwise `npm run check:music` cannot be used as a pre-release gate.
