# Findoe product demo video

A 1920×1080, 30 fps feature walkthrough of the working prototype at
[findoe.vercel.app](https://findoe.vercel.app), built with [Remotion](https://www.remotion.dev).
Real app captures in a browser frame, camera moves, cursor, glow callouts and two motion-graphics
overlays for the Findoe agent, timed to an ElevenLabs voiceover.

**Deliverables** (committed in `out/`):

| File                         | What                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `out/findoe-demo.mp4`        | The video, H.264 + AAC, under 80 s                                |
| `out/findoe-demo-poster.png` | Poster frame (the decision tree, fully lit, at 69.5 s)            |
| `out/vo/*.mp3`               | The six voiceover lines as used (trimmed, normalized to −16 LUFS) |

## Setup

```bash
cd video
npm install
npx playwright install chromium   # only needed to re-capture the app
```

Remotion ships its own ffmpeg/ffprobe; the scripts use those, so nothing else needs installing.

## Preview in Remotion Studio

```bash
npm run dev
```

Open the URL it prints. `FindoeDemo` is the full video; the **Scenes** folder has each scene on its
own timeline (same timing, measured from the same voiceover).

## Re-capture the app

```bash
npm run capture                                   # live prototype
FINDOE_URL=http://localhost:3000 npm run capture  # or a local dev server
```

`scripts/capture.ts` signs on with the demo chips (husband, then advisor, then wife), takes 1920×1080
stills at deviceScaleFactor 2 and one screen recording (the Ask Findoe answer), and writes everything
to `public/captures/` with `manifest.json`: the box of every element a ring or the cursor points at,
the clip's interaction times, and the labels the overlays quote (rulebook version, the decision path).
The video reads the manifest, so after an app change a re-capture keeps rings on their elements.

The wife's after-loss view only exists once the bank records a death. The script records Husband's
death the way the demo does — Advisor Home → ⋮ **More actions** → **Record a death notice** →
**Record and notify** — in its own browser context (it's localStorage only; nothing else changes).
See `SCREEN_MAP.md` for every screen and label used.

## Regenerate the voiceover

The lines, voices and settings are in `scripts/vo-lines.json` (ElevenLabs `eleven_v4`; Voice A
_Carolyn – Warm Grounded Narrator_, Voice B _Aabo – Engaging Confident Explainer_; "Findoe" is
sent as the IPA `/ˈfɪndoʊ/`, FIN-doe). The takes used are in `vo-raw/`.

```bash
npm run vo                                      # re-process vo-raw/ into public/vo/ and out/vo/
ELEVENLABS_API_KEY=... npm run vo -- --generate            # regenerate every line, then process
ELEVENLABS_API_KEY=... npm run vo -- --generate 03-widow   # just one line
```

Processing trims the silence at each end, shortens pauses longer than 0.38 s (cut from the middle of
the silence) and normalizes each line to −16 LUFS integrated with peaks under −1 dBTP. The
composition's `calculateMetadata` measures the files, so scene lengths follow the new audio. If a
line's wording changes, re-check its cue times in `src/config.ts` (cues are seconds from the start
of that line).

## Render

```bash
npm run render       # out/findoe-demo.mp4
npm run poster       # out/findoe-demo-poster.png
npm run review       # checks the render: ≤ 80 s, loudness, VO windows; frames to out/review/
```

`npm run typecheck` and `npm run lint` check the code.

## How it fits together

- `src/config.ts` — every timing: spacing around the voiceover, crossfade length, the cue sheet.
- `src/timeline.ts` — lays the five scenes out around the measured voiceover lengths.
- `src/metadata.ts` — `calculateMetadata`: measures `public/vo/` with Mediabunny.
- `src/FindoeDemo.tsx` — the scenes in a `TransitionSeries` (12-frame crossfades) plus the VO track.
- `src/scenes/` — one file per scene.
- `src/components/` — `TitleCard`, `BrowserFrame` (per-layer zoom/pan camera), `Cursor`,
  `Callout` (glow ring + feature tag), `AgentSpotlight`, `DataSourcePanel`, `DecisionTree`,
  `EndCard`, plus `Backdrop` and `FindoeMark`.
- `src/camera.ts` — camera keyframes and projecting page boxes into the frame.
- Colours come from the app's tokens; type is Montserrat (the app's display face).

## Music

There is no music bed: no track with a licence clearly covering public and competition use was
verified, so the mix is voiceover only.
