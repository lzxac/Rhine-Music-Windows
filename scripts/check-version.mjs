import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'version.mjs')
const temp = await mkdtemp(path.join(os.tmpdir(), 'rhine-version-check-'))
const root = path.join(temp, 'project')
const output = path.join(root, 'outputs')
await mkdir(path.join(root, 'src'), { recursive: true })
await mkdir(path.join(root, 'work'), { recursive: true })
await mkdir(output, { recursive: true })

const initialVersion = '0.6.0-dev.1'
await writeFile(path.join(root, 'version.json'), JSON.stringify({
  baseVersion: '0.6.0', channel: 'dev', sequence: 1, version: initialVersion, dataSchema: 'music-data-v3',
}, null, 2))
await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: initialVersion }, null, 2))
await writeFile(path.join(root, 'package-lock.json'), JSON.stringify({
  name: 'fixture', version: initialVersion,
  packages: { '': { name: 'fixture', version: initialVersion } },
}, null, 2))
await writeFile(path.join(root, 'DesktopProgram.cs'), [
  '[assembly: AssemblyVersion("0.6.0.1")]',
  '[assembly: AssemblyFileVersion("0.6.0.1")]',
  `[assembly: AssemblyInformationalVersion("${initialVersion}")]`,
  `private const string AppVersion = "${initialVersion}";`,
].join('\n'))
await writeFile(path.join(root, 'app.manifest'), '<assemblyIdentity version="0.6.0.1" name="RhineMusic.Desktop" />\n')
await writeFile(path.join(root, 'src', 'build-version.ts'), `export const BUILD_VERSION = "${initialVersion}";\n`)
await writeFile(path.join(root, 'README.md'), [
  `Windows build: ${initialVersion} (pending)`,
  `${initialVersion} 是本机开发候选包，验收待完成。`,
  `启动 Rhine-Music-Desktop-${initialVersion}.exe，程序位于 app-v${initialVersion}。`,
].join('\n'))
await writeFile(path.join(root, 'CHANGELOG.md'), '# Changelog\n')
await writeFile(path.join(output, `Rhine-Music-Desktop-${initialVersion}.exe`), 'preserved dev.1')

function start(args) {
  const child = spawn(process.execPath, [script, '--root', root, '--output-dir', output, ...args], { windowsHide: true })
  let stdout = '', stderr = ''
  child.stdout.setEncoding('utf8').on('data', value => { stdout += value })
  child.stderr.setEncoding('utf8').on('data', value => { stderr += value })
  return new Promise((resolve, reject) => child.on('error', reject).on('close', (code) => resolve({ code, stdout, stderr })))
}

function run(args, expectedCode = 0) {
  const result = spawnSync(process.execPath, [script, '--root', root, '--output-dir', output, ...args], {
    encoding: 'utf8', windowsHide: true,
  })
  assert.equal(result.status, expectedCode, `${args.join(' ')} failed: ${result.stderr}`)
  return result
}

try {
  const first = JSON.parse(run(['--allocate-dev']).stdout)
  assert.equal(first.version, '0.6.0-dev.2', 'an existing dev.1 executable forces the next candidate')
  assert.equal(JSON.parse(await readFile(path.join(root, 'package.json'))).version, first.version)
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json')))
  assert.equal(lock.version, first.version)
  assert.equal(lock.packages[''].version, first.version)
  assert.match(await readFile(path.join(root, 'src', 'build-version.ts'), 'utf8'), new RegExp(first.version.replaceAll('.', '\\.')))
  const desktop = await readFile(path.join(root, 'DesktopProgram.cs'), 'utf8')
  assert.match(desktop, /AssemblyVersion\("0\.6\.0\.2"\)/)
  assert.match(desktop, /AssemblyFileVersion\("0\.6\.0\.2"\)/)
  assert.match(desktop, /AssemblyInformationalVersion\("0\.6\.0-dev\.2"\)/)
  assert.match(desktop, /AppVersion = "0\.6\.0-dev\.2"/)
  assert.match(await readFile(path.join(root, 'app.manifest'), 'utf8'), /assemblyIdentity version="0\.6\.0\.2"/)
  const readme = await readFile(path.join(root, 'README.md'), 'utf8')
  assert.match(readme, /Windows build: 0\.6\.0-dev\.2/)
  assert.match(readme, /Rhine-Music-Desktop-0\.6\.0-dev\.2\.exe/)
  assert.match(readme, /app-v0\.6\.0-dev\.2/)
  assert.match(await readFile(path.join(root, 'CHANGELOG.md'), 'utf8'), /## 0\.6\.0-dev\.2 /)

  await writeFile(path.join(output, 'Rhine-Music-Native-0.6.0-dev.5.exe'), 'later native candidate')
  await writeFile(path.join(root, 'version.json'), JSON.stringify({
    baseVersion: '0.6.0', channel: 'dev', sequence: 1, version: initialVersion, dataSchema: 'music-data-v3',
  }, null, 2))
  const recovered = JSON.parse(run(['--allocate-dev']).stdout)
  assert.equal(recovered.version, '0.6.0-dev.6', 'artifact scan prevents reuse after a stale version-state restore')

  const parallel = await Promise.all([start(['--allocate-dev']), start(['--allocate-dev'])])
  for (const result of parallel) assert.equal(result.code, 0, result.stderr)
  const allocated = parallel.map(result => JSON.parse(result.stdout).version).sort()
  assert.deepEqual(allocated, ['0.6.0-dev.7', '0.6.0-dev.8'], 'concurrent package builds receive serialized unique candidates')
  const finalState = JSON.parse(await readFile(path.join(root, 'version.json')))
  assert.equal(finalState.version, '0.6.0-dev.8')

  const beforeSync = await readFile(path.join(root, 'version.json'), 'utf8')
  run(['--sync'])
  assert.equal(await readFile(path.join(root, 'version.json'), 'utf8'), beforeSync, '--sync never allocates a new build')
  const dryRun = JSON.parse(run(['--dry-run']).stdout)
  assert.equal(dryRun.version, '0.6.0-dev.9')
  assert.equal(await readFile(path.join(root, 'version.json'), 'utf8'), beforeSync, '--dry-run never mutates version state')
  const blockedFinalize = run(['--finalize'], 1)
  assert.match(blockedFinalize.stderr, /performance-acceptance\.json/)
  assert.equal(JSON.parse(await readFile(path.join(root, 'version.json'))).version, '0.6.0-dev.8')
  assert.equal(await readFile(path.join(output, `Rhine-Music-Desktop-${initialVersion}.exe`), 'utf8'), 'preserved dev.1')
  // --- rollback-to ---------------------------------------------------------------
  // 1. A valid rollback rewrites every synchronised metadata location, and the freed
  //    number is allocated again by the next build.
  const rolledBack = JSON.parse(run(['--rollback-to', '0.6.0-dev.7']).stdout)
  assert.equal(rolledBack.version, '0.6.0-dev.7')
  assert.equal(rolledBack.sequence, 7)
  assert.equal(JSON.parse(await readFile(path.join(root, 'version.json'))).version, '0.6.0-dev.7')
  assert.equal(JSON.parse(await readFile(path.join(root, 'package.json'))).version, '0.6.0-dev.7')
  const rollbackLock = JSON.parse(await readFile(path.join(root, 'package-lock.json')))
  assert.equal(rollbackLock.version, '0.6.0-dev.7')
  assert.equal(rollbackLock.packages[''].version, '0.6.0-dev.7')
  assert.match(await readFile(path.join(root, 'src', 'build-version.ts'), 'utf8'), /0\.6\.0-dev\.7/)
  assert.match(await readFile(path.join(root, 'DesktopProgram.cs'), 'utf8'), /AssemblyInformationalVersion\("0\.6\.0-dev\.7"\)/)
  assert.match(await readFile(path.join(root, 'DesktopProgram.cs'), 'utf8'), /AppVersion = "0\.6\.0-dev\.7"/)
  assert.match(await readFile(path.join(root, 'app.manifest'), 'utf8'), /assemblyIdentity version="0\.6\.0\.7"/)
  assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /Windows build: 0\.6\.0-dev\.7/)
  const reallocated = JSON.parse(run(['--allocate-dev']).stdout)
  assert.equal(reallocated.version, '0.6.0-dev.8', 'a rolled-back number is allocated again')

  // 2. Rolling forward is refused and leaves the state untouched.
  const forward = run(['--rollback-to', '0.6.0-dev.9'], 1)
  assert.match(forward.stderr, /only moves backwards/)
  assert.equal(JSON.parse(await readFile(path.join(root, 'version.json'))).version, '0.6.0-dev.8')

  // 3. A target whose artifacts already exist is refused (two builds must not share a version).
  await writeFile(path.join(output, 'Rhine-Music-Desktop-0.6.0-dev.7.exe'), 'already built')
  const occupied = run(['--rollback-to', '0.6.0-dev.7'], 1)
  assert.match(occupied.stderr, /artifacts for it already exist/)
  assert.equal(JSON.parse(await readFile(path.join(root, 'version.json'))).version, '0.6.0-dev.8')

  // 4. Concurrent rollbacks serialize: the second one sees the new state and refuses.
  const rollbackRace = await Promise.all([
    start(['--rollback-to', '0.6.0-dev.6']),
    start(['--rollback-to', '0.6.0-dev.6']),
  ])
  assert.equal(rollbackRace.filter((result) => result.code === 0).length, 1, 'exactly one concurrent rollback applies')
  assert.equal(JSON.parse(await readFile(path.join(root, 'version.json'))).version, '0.6.0-dev.6')

  console.log('Version allocation passed: metadata sync, output collision scan, stale-state recovery, concurrent builds, dry run, sync-only, rollback-to guards, and final-release gate.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
