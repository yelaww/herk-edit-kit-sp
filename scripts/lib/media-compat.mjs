// Shared helpers added for the "SP" fork (Aymeric, TikTok santé publique).
//
// 1. filterScriptArgs(): ffmpeg 7+ reads a filtergraph file with
//    `-/filter_complex <file>`; ffmpeg 6 (Ubuntu 24.04, many Windows builds)
//    does not know that syntax and needs `-filter_complex_script <file>`.
// 2. refineDeletesWithAudio(): transcript word timestamps are often offset by
//    50-200 ms (especially with Whisper), so a cut placed "between two words"
//    can clip the end or the start of a word. We decode the real audio, find
//    the quiet frames, and shrink every delete range so that it only removes
//    frames that are actually silent.

import { spawnSync } from "node:child_process";

let cachedMajor = null;
export function ffmpegMajorVersion() {
  if (cachedMajor !== null) return cachedMajor;
  const r = spawnSync("ffmpeg", ["-hide_banner", "-version"], { encoding: "utf8" });
  const m = /ffmpeg version n?(\d+)/.exec(r.stdout ?? "");
  cachedMajor = m ? Number(m[1]) : 0;
  return cachedMajor;
}

export function filterScriptArgs(scriptPath) {
  return ffmpegMajorVersion() >= 7
    ? ["-/filter_complex", scriptPath]
    : ["-filter_complex_script", scriptPath];
}

const RATE = 16000;
const HOP = 0.01; // 10 ms analysis frames

/** Returns { db: Float64Array (dBFS per 10 ms frame), threshold, floor }. */
export function analyseLoudness(mediaPath, { marginDb = 10 } = {}) {
  const r = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", mediaPath, "-vn", "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"],
    { maxBuffer: 1 << 30 },
  );
  if (r.status !== 0 || !r.stdout?.length) throw new Error(`ffmpeg audio decode failed for ${mediaPath}`);
  const buf = r.stdout;
  const samples = buf.length >> 1;
  const hop = Math.round(RATE * HOP);
  const frames = Math.floor(samples / hop);
  const db = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) {
      const s = buf.readInt16LE(i * 2) / 32768;
      sum += s * s;
    }
    db[f] = 10 * Math.log10(sum / hop + 1e-12);
  }
  const sorted = Array.from(db).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const speech = sorted[Math.floor(sorted.length * 0.9)];
  // Quiet = within marginDb of the noise floor, but never above halfway to speech level.
  const threshold = Math.min(floor + marginDb, (floor + speech) / 2);
  return { db, threshold, floor, speech };
}

/**
 * Shrink each delete range to the silent part of the audio.
 * - start is pushed forward until `minQuiet` s of continuous quiet begin
 * - end is pulled back until the quiet run that precedes it
 * - `guard` s of quiet are left on each side so word attacks/decays survive
 * Ranges that become shorter than `minLen` are dropped.
 */
export function refineDeletesWithAudio(ranges, loud, { minQuiet = 0.06, guard = 0.04, minLen = 0.08, duration } = {}) {
  const { db, threshold } = loud;
  const n = db.length;
  const quiet = (f) => f >= 0 && f < n && db[f] <= threshold;
  const need = Math.max(1, Math.round(minQuiet / HOP));
  const g = Math.round(guard / HOP);
  const out = [];
  for (const r of ranges) {
    let s = Math.max(0, Math.round(r.start / HOP));
    let e = Math.min(n, Math.round(r.end / HOP));
    const isHead = r.start <= 0.001;
    const isTail = duration && r.end >= duration - 0.001;
    if (!isHead) {
      // advance s to the first frame starting a run of `need` quiet frames
      while (s < e) {
        let ok = true;
        for (let k = 0; k < need; k++) if (!quiet(s + k)) { ok = false; s += k + 1; break; }
        if (ok) break;
      }
      s += g;
    }
    if (!isTail) {
      while (e > s) {
        let ok = true;
        for (let k = 1; k <= need; k++) if (!quiet(e - k)) { ok = false; e -= k; break; }
        if (ok) break;
      }
      e -= g;
    }
    const start = isHead ? r.start : s * HOP;
    const end = isTail ? r.end : e * HOP;
    if (end - start >= minLen) out.push({ ...r, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) });
  }
  return out;
}
