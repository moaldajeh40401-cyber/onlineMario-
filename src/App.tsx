import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import StartScreen from "./components/StartScreen";
import TouchControls from "./components/TouchControls";
import MarioPortfolio from "./game/MarioPortfolio";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <>
      {started && <MarioPortfolio />}
      {started && <TouchControls />}
      <AnimatePresence>{!started && <StartScreen onStart={() => setStarted(true)} />}</AnimatePresence>
    </>
  );
}
