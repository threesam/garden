import { Canvas } from "@/components/canvas/canvas";
import { Mood } from "@/components/canvas/mood";
import { Thoughts } from "@/components/canvas/thoughts";
import { Breakout } from "@/components/canvas/breakout";

export default function Home() {
  return (
    <Canvas>
      <Mood title="garden" />

      <Thoughts>
        <p>placeholder.</p>

        <Breakout>this is where it starts.</Breakout>

        <p>placeholder.</p>
      </Thoughts>
    </Canvas>
  );
}
