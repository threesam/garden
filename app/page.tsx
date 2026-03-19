import { Canvas } from "@/components/canvas/canvas";
import { Mood } from "@/components/canvas/mood";
import { Thoughts } from "@/components/canvas/thoughts";
import { Breakout } from "@/components/canvas/breakout";
import { CloudCanvas } from "@/components/canvas/cloud-canvas";

export default function Home() {
  return (
    <Canvas>
      <Mood title="garden">
        <CloudCanvas invert />
      </Mood>

      <Thoughts>
        <p>placeholder.</p>

        <Breakout>this is where it starts.</Breakout>

        <p>placeholder.</p>
      </Thoughts>
    </Canvas>
  );
}
