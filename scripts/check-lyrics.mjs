import test from 'node:test'
import assert from 'node:assert/strict'
import { activeLyricIndex, lyricCentreOffset, parseLrc } from '../src/lyrics.ts'

test('LRC accepts common fractional stamps, offsets, and multiple timestamps on one row', () => {
  const lines = parseLrc('\uFEFF[ar:Artist]\r\n[offset:+250]\r\n[00:01]第一句\r\n[00:02.5][00:03.25][00:04.125]第二句')
  assert.deepEqual(lines, [
    { time: 1.25, text: '第一句' },
    { time: 2.75, text: '第二句' },
    { time: 3.5, text: '第二句' },
    { time: 4.375, text: '第二句' },
  ])
})

test('LRC clamps negative offset times, ignores metadata-only rows, and keeps lyric markup as text', () => {
  const lines = parseLrc('[ti:Album]\n[offset:-9000]\n[00:02.00]\n[00:01.00]<b>safe text</b>')
  assert.deepEqual(lines, [{ time: 0, text: '<b>safe text</b>' }])
})

test('active lyric lookup uses binary-search boundary semantics', () => {
  const lines = parseLrc('[00:01]A\n[00:03]B\n[00:05]C')
  assert.equal(activeLyricIndex(lines, 0.99), -1)
  assert.equal(activeLyricIndex(lines, 1), 0)
  assert.equal(activeLyricIndex(lines, 4.9), 1)
  assert.equal(activeLyricIndex(lines, 5), 2)
})

test('lyric centring puts the active line in the middle of a scrolled list', () => {
  // 2000px of content in a 400px viewport: 50 lines of 40px, target line 25.
  const offset = lyricCentreOffset({
    lineTop: 25 * 40,
    lineHeight: 40,
    viewportHeight: 400,
    scrollHeight: 2000,
  })
  assert.equal(offset, 1000 - 180)
})

test('lyric centring clamps at the list edges instead of stopping the first line short', () => {
  const viewportHeight = 400
  const scrollHeight = 2000
  assert.equal(
    lyricCentreOffset({ lineTop: 0, lineHeight: 40, viewportHeight, scrollHeight }),
    0,
    'the first line must sit at the top rather than scrolling negative',
  )
  assert.equal(
    lyricCentreOffset({ lineTop: 49 * 40, lineHeight: 40, viewportHeight, scrollHeight }),
    1600,
    'the last line must clamp to the maximum scroll instead of overshooting',
  )
})

test('lyric centring survives short lists, tall lines and a not-yet-measured list', () => {
  assert.equal(
    lyricCentreOffset({ lineTop: 100, lineHeight: 40, viewportHeight: 400, scrollHeight: 300 }),
    0,
    'a list shorter than its viewport cannot scroll',
  )
  assert.equal(
    lyricCentreOffset({ lineTop: 200, lineHeight: 600, viewportHeight: 400, scrollHeight: 2000 }),
    200,
    'a line taller than the viewport centres on its own top edge',
  )
  assert.equal(
    lyricCentreOffset({ lineTop: 0, lineHeight: 0, viewportHeight: 0, scrollHeight: 0 }),
    0,
    'an unmeasured list must not produce a negative or NaN offset',
  )
  assert.ok(
    Number.isFinite(
      lyricCentreOffset({ lineTop: 900, lineHeight: 40, viewportHeight: 400, scrollHeight: 2000 }),
    ),
    'the offset must always be a finite number',
  )
})
