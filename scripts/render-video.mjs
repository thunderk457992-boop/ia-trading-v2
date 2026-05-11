import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { bundle } from "@remotion/bundler"
import { renderMedia, selectComposition } from "@remotion/renderer"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const entryPoint = path.join(projectRoot, "src", "remotion", "index.ts")
const compositionId = process.argv[2] || "AxiomCinematicAdV5"
const outputLocation = path.resolve(
  projectRoot,
  process.argv[3] || path.join("out", "axiom-cinematic-ad-v5.mp4")
)
const voiceoverPath = path.join(projectRoot, "public", "audio", "voiceover.mp3")
const musicPath = path.join(projectRoot, "public", "audio", "music.mp3")
const inputProps = {
  hasMusic: existsSync(musicPath),
  hasVoiceover: existsSync(voiceoverPath),
}

const log = (message) => {
  process.stdout.write(`${message}\n`)
}

await mkdir(path.dirname(outputLocation), { recursive: true })

log("Bundling Remotion composition...")
const bundleLocation = await bundle({
  entryPoint,
  webpackOverride: (config) => config,
})

log("Selecting composition...")
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps,
})

if (inputProps.hasMusic || inputProps.hasVoiceover) {
  log(
    `Audio detected: music=${inputProps.hasMusic ? "yes" : "no"}, voiceover=${inputProps.hasVoiceover ? "yes" : "no"}`
  )
} else {
  log("No audio assets detected, rendering silent video.")
}

log("Rendering MP4...")
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation,
  inputProps,
  overwrite: true,
  logLevel: "info",
})

log(`Video rendered successfully: ${outputLocation}`)
