/**
 * Checks a render for the review loop.
 *
 *   npm run review -- out/findoe-demo.mp4
 *
 * - duration must be at most 80.0 s
 * - extracts a frame every 2 s plus one just after every scene boundary into
 *   out/review/<name>/ (1280 px wide, for looking at)
 * - integrated loudness and true peak of the mix
 * - each voiceover line is audible in its window, and the gaps between lines are silent
 */
import { mkdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { FPS, TRANSITION_FRAMES, VO_LINES, type VoDurations } from "../src/config.ts";
import { buildTimeline } from "../src/timeline.ts";
import { durationOf, ffmpeg, loudness, ROOT } from "./ffmpeg.ts";

const file = process.argv[2] ?? join(ROOT, "out", "findoe-demo.mp4");
const name = basename(file).replace(/\.mp4$/, "");
const dir = join(ROOT, "out", "review", name);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

let ok = true;
const fail = (msg: string) => {
  ok = false;
  console.log(`  FAIL ${msg}`);
};

const duration = durationOf(file);
console.log(`duration ${duration.toFixed(3)} s`);
if (duration > 80.0) fail("longer than 80.0 s");
if (duration < 70) fail("shorter than 70 s");

const vo = Object.fromEntries(
  VO_LINES.map((l) => [l.id, durationOf(join(ROOT, "public", l.file))]),
) as VoDurations;
const t = buildTimeline(vo);
console.log(`timeline ${(t.durationInFrames / FPS).toFixed(3)} s`);
for (const [id, s] of Object.entries(t.scenes))
  console.log(
    `  scene ${id.padEnd(8)} ${(s.from / FPS).toFixed(2)}–${((s.from + s.durationInFrames) / FPS).toFixed(2)} s`,
  );

// Frames to look at.
const times = new Set<number>();
for (let s = 1; s < duration; s += 2) times.add(s);
for (const s of Object.values(t.scenes)) times.add((s.from + TRANSITION_FRAMES + 3) / FPS);
times.add(duration - 0.1);
for (const s of [...times].sort((a, b) => a - b)) {
  ffmpeg([
    "-v",
    "error",
    "-y",
    "-ss",
    s.toFixed(3),
    "-i",
    file,
    "-frames:v",
    "1",
    "-vf",
    "scale=1280:-2",
    join(dir, `t${s.toFixed(2).padStart(6, "0")}.png`),
  ]);
}
console.log(`${times.size} frames in ${dir}`);

// Loudness of the mix.
const l = loudness(file);
console.log(`loudness ${l.input_i} LUFS, true peak ${l.input_tp} dBTP`);
if (Math.abs(Number(l.input_i) + 16) > 1) fail("integrated loudness not within 1 LU of -16");
if (Number(l.input_tp) > -0.5) fail("true peak above -0.5 dBTP");

// Voiceover windows vs. detected speech.
const report = ffmpeg([
  "-i",
  file,
  "-af",
  "silencedetect=noise=-40dB:d=0.25",
  "-vn",
  "-f",
  "null",
  "-",
]);
const starts = [...report.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...report.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const silences = starts.map((s, i) => [s, ends[i] ?? duration] as const);
for (const line of t.vo) {
  const a = line.from / FPS;
  const b = a + vo[line.id];
  const inside = silences.filter(([s, e]) => s > a + 0.2 && e < b - 0.2 && e - s > 0.9);
  const loud = !silences.some(([s, e]) => s <= a + 0.3 && e >= b - 0.3);
  console.log(
    `  vo ${line.id.padEnd(12)} ${a.toFixed(2)}–${b.toFixed(2)} s ${loud ? "audible" : "SILENT"}`,
  );
  if (!loud) fail(`${line.id} is silent`);
  if (inside.length) fail(`${line.id} has a long silence inside`);
}
const ordered = [...t.vo].sort((x, y) => x.from - y.from);
for (let i = 1; i < ordered.length; i++) {
  const prevEnd = ordered[i - 1].from / FPS + vo[ordered[i - 1].id];
  if (prevEnd > ordered[i].from / FPS) fail(`${ordered[i - 1].id} overlaps ${ordered[i].id}`);
}
console.log(ok ? "review: all checks passed" : "review: checks FAILED");
process.exit(ok ? 0 : 1);
