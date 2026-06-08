import React from "react";
import { Composition } from "remotion";
import { MapScene } from "./MapScene";
import spec from "./data/spec.json";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Mapa"
      component={MapScene}
      durationInFrames={Math.ceil((spec as any).meta.duracao * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
