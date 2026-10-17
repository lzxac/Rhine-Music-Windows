// 本机听后感（评论），按曲目存储。
//
// 为什么存在应用数据目录、而不是像 .lrc 那样写在音频旁边：
// 音乐根目录是**用户的原始曲库**——可能只读、可能被网盘或同步工具管理。歌词是只读地“找同名
// .lrc”，而评论是我们自己产生的数据，写进去就等于改动用户的音乐文件夹。所以评论与其他应用
// 数据（playlists.json 等）放在一起，曲目只作键。
import { createHash } from 'node:crypto'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { writeJsonAtomic } from './music-library.mjs'

const MAX_PER_TRACK = 500
const MAX_LENGTH = 2000
const MAX_TRACKS = 20000

const text = (value) => (typeof value === 'string' ? value.trim() : '')
const key = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 24)
const now = () => new Date().toISOString()

function validText(value) {
  const body = text(value)
  if (!body) throw new Error('评论内容不能为空')
  if (body.length > MAX_LENGTH) throw new Error(`评论最多 ${MAX_LENGTH} 个字符`)
  // 控制字符会破坏界面排版（也容易是从别处粘贴进来的残留），直接拒绝。
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body)) throw new Error('评论包含不可见控制字符')
  return body
}

function validate(value) {
  if (!value || value.version !== 1 || typeof value.tracks !== 'object' || value.tracks === null)
    throw new Error('听后感数据格式不受支持，已保留原文件')
  const tracks = {}
  for (const [id, list] of Object.entries(value.tracks)) {
    if (!Array.isArray(list)) throw new Error('听后感数据格式不受支持，已保留原文件')
    tracks[id] = list
      .map((entry) => ({
        id: text(entry?.id),
        text: text(entry?.text),
        createdAt: text(entry?.createdAt) || now(),
      }))
      .filter((entry) => entry.id && entry.text)
      .slice(0, MAX_PER_TRACK)
  }
  return { version: 1, tracks }
}

export class CommentStore {
  /**
   * @param dataDir 数据目录
   * @param identify (trackId) => 稳定标识 | null。标识由元数据构成（见 music-library 的
   *   commentIdentity），**不含路径**，所以移动文件不会丢评论。由服务端注入，因为只有它持有
   *   曲库索引；客户端始终只传 trackId，路由与前端都不用改。
   */
  constructor({ dataDir, identify = null }) {
    this.dataDir = path.resolve(dataDir)
    this.file = path.join(this.dataDir, 'comments.json')
    this.value = { version: 1, tracks: {} }
    this.saveChain = Promise.resolve()
    this.identify = identify
  }

  async init() {
    await fs.mkdir(this.dataDir, { recursive: true })
    try {
      this.value = validate(JSON.parse(await fs.readFile(this.file, 'utf8')))
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`无法读取听后感 ${this.file}: ${error.message}`)
      await this.save()
    }
    // 迁移在 init 里就跑掉（服务端不必记得单独调用），结果留在 `migration` 上供调用方报告。
    // 这里**不吞异常**：迁移失败必须让启动失败可见，否则会静默地留下一份没搬的数据。
    this.migration = await this.migrate()
    return this
  }

  async save() {
    const snapshot = structuredClone(this.value)
    this.saveChain = this.saveChain.catch(() => {}).then(() => writeJsonAtomic(this.file, snapshot))
    await this.saveChain
  }

  /** 桶键：优先按稳定标识；没有 identify（或用例未提供）时退回旧的 trackId 哈希。 */
  bucketKey(trackId) {
    const id = text(trackId)
    const identity = this.identify ? this.identify(id) : null
    return key(identity || id)
  }

  /**
   * 一次性迁移：把按「trackId 哈希」存的旧桶，改挂到「标识哈希」下。
   *
   * 迁移是**幂等**的：搬完后 key(trackId) 这个桶就被删掉了，再跑一次没有可搬的东西。
   * 已经落在标识键上的数据不受影响（`key(identity)` 已存在时只做合并去重）。
   * 库索引里找不到对应文件的旧桶**原样保留**，不做静默丢弃 —— 用户可能只是暂时移除了那个
   * 目录，重新加回来评论就该回来。
   */
  async migrate() {
    if (!this.identify) return { moved: 0, merged: 0, unmatched: 0 }
    let moved = 0
    let merged = 0
    let unmatched = 0
    // **先快照键**：下面会删旧键、加新键，而在 `Object.entries` 迭代中增删键会改变枚举集合
    // （新增的键会被顺带访问到），那会让计数错乱、还可能处理到刚写好的桶。
    const buckets = Object.keys(this.value.tracks)
    for (const bucket of buckets) {
      if (!this.value.tracks[bucket]) continue
      const identity = this.identifyByBucket(bucket)
      if (!identity) {
        unmatched += 1
        continue
      }
      const target = key(identity)
      if (target === bucket) continue
      const list = this.value.tracks[bucket]
      const existing = this.value.tracks[target] ?? []
      const known = new Set(existing.map((entry) => entry.id))
      const incoming = list.filter((entry) => !known.has(entry.id))
      if (incoming.length) {
        this.value.tracks[target] = [...existing, ...incoming].slice(0, MAX_PER_TRACK)
        if (existing.length) merged += incoming.length
        else moved += incoming.length
      }
      delete this.value.tracks[bucket]
    }
    if (moved || merged) await this.save()
    return { moved, merged, unmatched }
  }

  /** 把桶键反查成标识：遍历曲目，谁的 trackId 哈希等于这个键，就是它。 */
  identifyByBucket(bucket) {
    for (const trackId of this.trackIds ?? []) {
      if (key(trackId) === bucket) {
        const identity = this.identify(trackId)
        if (identity) return identity
      }
    }
    return null
  }

  /** 服务端在迁移前调用：告诉存储有哪些 trackId 可供反查（顺序无关）。 */
  withTrackIds(ids) {
    this.trackIds = Array.isArray(ids) ? ids : []
    return this
  }

  /** 一首歌的全部听后感，最新在前（写评论的人最想先看到自己刚写的）。 */
  list(trackId) {
    const list = this.value.tracks[this.bucketKey(trackId)] ?? []
    return list
      .map((entry) => ({ ...entry }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  }

  count(trackId) {
    return (this.value.tracks[this.bucketKey(trackId)] ?? []).length
  }

  async add(trackId, body) {
    const id = text(trackId)
    if (!id) throw new Error('缺少曲目 ID')
    const entry = { id: key(`${id}\0${now()}\0${Math.random()}`), text: validText(body), createdAt: now() }
    const bucketKey = this.bucketKey(id)
    const bucket = this.value.tracks[bucketKey] ?? (this.value.tracks[bucketKey] = [])
    if (bucket.length >= MAX_PER_TRACK) throw new Error(`单曲听后感最多 ${MAX_PER_TRACK} 条`)
    if (Object.keys(this.value.tracks).length >= MAX_TRACKS && !this.value.tracks[bucketKey])
      throw new Error('听后感条目过多，请先清理')
    bucket.push(entry)
    await this.save()
    return entry
  }

  async remove(trackId, commentId) {
    const bucketKey = this.bucketKey(trackId)
    const bucket = this.value.tracks[bucketKey]
    const id = text(commentId)
    if (!bucket || !id) throw Object.assign(new Error('没有找到这条听后感'), { status: 404 })
    const before = bucket.length
    this.value.tracks[bucketKey] = bucket.filter((entry) => entry.id !== id)
    if (this.value.tracks[bucketKey].length === before)
      throw Object.assign(new Error('没有找到这条听后感'), { status: 404 })
    if (!this.value.tracks[bucketKey].length) delete this.value.tracks[bucketKey]
    await this.save()
    return true
  }
}
