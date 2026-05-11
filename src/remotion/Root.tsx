import React from "react"
import { Composition } from "remotion"
import { AxiomCinematicAd } from "./AxiomCinematicAd"
import { AxiomCinematicAdV3 } from "./AxiomCinematicAdV3"
import { AxiomCinematicAdV4 } from "./AxiomCinematicAdV4"
import { AxiomCinematicAdV5 } from "./AxiomCinematicAdV5"
import { AxiomShortVideo } from "./AxiomShortVideo"

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="AxiomShortVideo"
        component={AxiomShortVideo}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AxiomCinematicAd"
        component={AxiomCinematicAd}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AxiomCinematicAdV3"
        component={AxiomCinematicAdV3}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AxiomCinematicAdV4"
        component={AxiomCinematicAdV4}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AxiomCinematicAdV5"
        component={AxiomCinematicAdV5}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
