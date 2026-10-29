import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The video/ folder. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Remotion ships ffmpeg/ffprobe in its compositor package; use those so nothing else needs installing. */
export function remotionBinary(name: "ffmpeg" | "ffprobe"): string {
  const dir = join(ROOT, "node_modules", "@remotion");
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const found = ["-msvc", "-gnu", "-musl", ""]
    .map((suffix) => join(dir, `compositor-${process.platform}-${process.arch}${suffix}`, exe))
    .find((p) => existsSync(p));
  if (!found) throw new Error(`Could not find Remotion's ${name}; run npm install in video/.`);
  return found;
}

function run(name: "ffmpeg" | "ffprobe", args: string[]) {
  const res = spawnSync(remotionBinary(name), args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`${name} ${args.join(" ")}\n${res.stderr}`);
  return res;
}

/** Runs ffmpeg and returns its stderr, where reports such as loudnorm's and silencedetect's land. */
export function ffmpeg(args: string[]): string {
  return run("ffmpeg", ["-hide_banner", "-nostats", ...args]).stderr;
}

/** Duration of a media file in seconds. */
export function durationOf(file: string): number {
  const out = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]).stdout;
  return Number(out.trim());
}

/** Integrated loudness (LUFS) and true peak (dBTP) of a file's audio, via loudnorm's analysis pass. */
export function loudness(file: string): {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
} {
  const report = ffmpeg(["-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const json = report.slice(report.lastIndexOf("{"), report.lastIndexOf("}") + 1);
  return JSON.parse(json);
}
