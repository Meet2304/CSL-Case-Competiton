/**
 * Prepares the voiceover: one MP3 per line in public/vo/, trimmed of leading
 * and trailing silence, with long pauses shortened to MAX_PAUSE, and normalized to -16 LUFS integrated (peaks kept under -1 dBTP).
 *
 *   npm run vo                 process the takes in vo-raw/ (the ones in the video)
 *   npm run vo -- --generate   first regenerate every line with the ElevenLabs API
 *                              (needs ELEVENLABS_API_KEY; text, voices and settings
 *                              come from scripts/vo-lines.json)
 *   npm run vo -- --generate 03-widow   regenerate just that line
 *
 * The video measures each processed file with calculateMetadata, so new takes
 * re-time the scenes automatically. Re-check the cue times in src/config.ts if
 * a line's wording changes.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { durationOf, ffmpeg, loudness, ROOT } from "./ffmpeg.ts";

type Line = { id: string; voice: "A" | "B"; text: string; maxPause?: number };
type Config = {
  model: string;
  voices: Record<string, { voiceId: string; settings: Record<string, number> }>;
  lines: Line[];
};

const config: Config = JSON.parse(readFileSync(join(ROOT, "scripts", "vo-lines.json"), "utf8"));
const RAW = join(ROOT, "vo-raw");
const OUT = join(ROOT, "public", "vo");
const COPY = join(ROOT, "out", "vo");
const TARGET_LUFS = -16;
const MAX_TRUE_PEAK = -1;
/** Longest pause kept inside a line, in seconds (a line can set its own `maxPause`). */
const MAX_PAUSE = 0.38;

async function generate(line: Line) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Set ELEVENLABS_API_KEY to regenerate lines.");
  const voice = config.voices[line.voice];
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: line.text,
        model_id: config.model,
        voice_settings: voice.settings,
      }),
    },
  );
  if (!res.ok) throw new Error(`${line.id}: ElevenLabs ${res.status} ${await res.text()}`);
  writeFileSync(join(RAW, `${line.id}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log(`[vo] generated ${line.id}`);
}

/**
 * The parts of a take to keep: speech plus a breath either side, with any pause longer than
 * `maxPause` shortened to it (cut from the middle of the silence, so no word is touched).
 */
function keepSegments(file: string, maxPause: number): [number, number][] {
  const total = durationOf(file);
  const report = ffmpeg(["-i", file, "-af", "silencedetect=noise=-45dB:d=0.05", "-f", "null", "-"]);
  const starts = [...report.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...report.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const silences = starts.map((s, i) => [s, ends[i] ?? total] as [number, number]);
  let from = 0;
  let to = total;
  const cuts: [number, number][] = [];
  for (const [s, e] of silences) {
    if (s < 0.01) from = Math.max(0, e - 0.04);
    else if (e >= total - 0.08) to = Math.min(total, s + 0.12);
    else if (e - s > maxPause) cuts.push([s + maxPause / 2, e - maxPause / 2]);
  }
  const keep: [number, number][] = [];
  let cursor = from;
  for (const [a, b] of cuts) {
    keep.push([cursor, a]);
    cursor = b;
  }
  keep.push([cursor, to]);
  return keep;
}

/** A filter graph that joins the kept segments of input 0 into [edit]. */
function editGraph(keep: [number, number][]): string {
  const parts = keep.map(
    ([a, b], i) =>
      `[0:a]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS[k${i}]`,
  );
  const labels = keep.map((_, i) => `[k${i}]`).join("");
  return `${parts.join(";")};${labels}concat=n=${keep.length}:v=0:a=1[edit]`;
}

/** loudnorm's analysis of the edited take. */
function analyze(src: string, graph: string) {
  const r = ffmpeg([
    "-i",
    src,
    "-filter_complex",
    `${graph};[edit]loudnorm=print_format=json[out]`,
    "-map",
    "[out]",
    "-f",
    "null",
    "-",
  ]);
  return JSON.parse(r.slice(r.lastIndexOf("{"), r.lastIndexOf("}") + 1)) as {
    input_i: string;
    input_tp: string;
    input_lra: string;
    input_thresh: string;
    target_offset: string;
  };
}

function process_(line: Line) {
  const src = join(RAW, `${line.id}.mp3`);
  const dest = join(OUT, `${line.id}.mp3`);
  const keep = keepSegments(src, line.maxPause ?? MAX_PAUSE);
  const graph = editGraph(keep);
  // Two-pass loudnorm. Its dynamic mode is the only limiter in Remotion's ffmpeg, and these takes
  // peak high for their loudness, so a plain gain can't reach the target under the peak ceiling.
  // Dynamic mode lands a little under its target, so nudge the target until the file measures right.
  const m = analyze(src, graph);
  let target = TARGET_LUFS;
  for (let attempt = 0; attempt < 4; attempt++) {
    const norm = [
      `loudnorm=I=${target.toFixed(2)}:TP=${MAX_TRUE_PEAK}:LRA=11`,
      `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}`,
      `measured_thresh=${m.input_thresh}:offset=${m.target_offset}`,
    ].join(":");
    ffmpeg([
      "-y",
      "-i",
      src,
      "-filter_complex",
      `${graph};[edit]${norm},aresample=44100[out]`,
      "-map",
      "[out]",
      "-ac",
      "1",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      dest,
    ]);
    const error = TARGET_LUFS - Number(loudness(dest).input_i);
    if (Math.abs(error) <= 0.3) break;
    target += error;
  }
  copyFileSync(dest, join(COPY, `${line.id}.mp3`));
  const after = loudness(dest);
  console.log(
    `[vo] ${line.id}: ${durationOf(src).toFixed(2)}s -> ${durationOf(dest).toFixed(2)}s ` +
      `(${keep.length - 1} pauses shortened), ${after.input_i} LUFS, ${after.input_tp} dBTP`,
  );
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(COPY, { recursive: true });
  const args = process.argv.slice(2);
  if (args.includes("--generate")) {
    const only = args.filter((a) => !a.startsWith("--"));
    for (const line of config.lines)
      if (!only.length || only.includes(line.id)) await generate(line);
  }
  for (const line of config.lines) process_(line);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
