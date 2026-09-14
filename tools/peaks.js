#!/usr/bin/env node
/* Waveform peaks for a DJ set, computed once here so the browser never has to.
 *
 *   node tools/peaks.js <input audio> <output json>
 *   node tools/peaks.js --self-check
 *
 * A set is an hour of audio, ~55MB as mp3. src/setPlayer.js draws its waveform from the
 * JSON this writes (~4KB) instead of fetching and decoding the file: the shape is on
 * screen before a single byte of audio has been asked for, and the mp3 is only ever
 * requested when someone presses play.
 *
 * Run by hand, like tools/export_glb.py - not a build step.
 */
/* global process, Buffer */
// This one runs in node, not in a browser, and eslint.config.js declares only the browser's
// globals. A flat config ignores `eslint-env`, so the two this file needs are named here.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import assert from 'node:assert';

// The file holds more buckets than any layout draws: setPlayer.js takes the max over a
// slice of these per bar, so one file serves the narrow panel beside the drawer, the wider
// one on the flat wall, every resize and both pixel ratios. 1000 is comfortably above the
// ~200 bars the widest realistic layout wants, and still under 4KB.
const BUCKETS = 1000;
// Peaks survive downsampling - we want the envelope, not the audio. 8kHz mono is a
// ninth of the samples CD rate would hand us and draws the same shape.
const RATE = 8000;

/** RMS per bucket, normalised against the loudest bucket.
 *  RMS and not absolute peak: an hour of mastered techno sits within a couple of dB of
 *  ceiling for 55 of its 60 minutes, so a peak envelope of it is a solid rectangle - a
 *  waveform that says nothing and reads as a rendering bug. RMS keeps the breakdowns and
 *  the builds visible, which is the only reason to draw the thing at all. */
export function bucketPeaks(pcm, count) {
  const samples = pcm.length >> 1; // signed 16-bit little-endian
  const out = new Array(count).fill(0);
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * samples) / count);
    const end = Math.max(start + 1, Math.floor(((i + 1) * samples) / count));
    let sum = 0;
    let n = 0;
    for (let s = start; s < end && s < samples; s++) {
      const v = pcm.readInt16LE(s * 2);
      sum += v * v;
      n++;
    }
    out[i] = n ? Math.sqrt(sum / n) : 0;
  }
  const loudest = Math.max(...out, 1);
  return out.map((v) => Math.round((v / loudest) * 100) / 100);
}

function selfCheck() {
  // three buckets' worth of samples, each bucket at a different constant level - RMS of a
  // constant magnitude is that magnitude, so the expected output is just the levels
  // normalised by the loudest
  const levels = [1000, 8000, 4000];
  const perBucket = 10;
  const pcm = Buffer.alloc(levels.length * perBucket * 2);
  levels.forEach((level, b) => {
    for (let i = 0; i < perBucket; i++) {
      // alternate the sign: squaring must make the sign irrelevant
      pcm.writeInt16LE(i % 2 ? -level : level, (b * perBucket + i) * 2);
    }
  });
  assert.deepStrictEqual(bucketPeaks(pcm, 3), [0.13, 1, 0.5]);
  // asking for more buckets than there are samples must still fill every slot and never
  // divide by zero
  const dense = bucketPeaks(pcm, 100);
  assert.strictEqual(dense.length, 100);
  assert.ok(dense.every((v) => v >= 0 && v <= 1));
  console.log('peaks self-check ok');
}

function main() {
  const [input, output] = process.argv.slice(2);
  if (input === '--self-check') return selfCheck();
  if (!input || !output) {
    console.error('usage: node tools/peaks.js <input audio> <output json>');
    process.exit(1);
  }

  const ff = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', input, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'],
    // An hour at this rate is ~58MB of PCM and the default cap is 1MB, which would truncate
    // the tail of every set into silence rather than fail loudly. Held whole rather than
    // streamed: 58MB is nothing on a laptop, and one contiguous buffer means there is no
    // chunk boundary to split a 16-bit sample across.
    { maxBuffer: 512 * 1024 * 1024 },
  );
  if (ff.status !== 0) {
    console.error(ff.stderr?.toString() || 'ffmpeg failed');
    process.exit(1);
  }

  const pcm = ff.stdout;
  if (!pcm.length) {
    console.error(`no audio decoded from ${input}`);
    process.exit(1);
  }
  const duration = Math.round((pcm.length >> 1) / RATE);
  const peaks = bucketPeaks(pcm, BUCKETS);

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({ duration, peaks })}\n`);

  console.log(`${output} - ${BUCKETS} peaks, ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`for content.js:  duration: ${duration},`);
}

main();
