import { motion } from "framer-motion";
import { PROFILE } from "../content/portfolio";

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onStart}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white font-pixel text-center px-6 cursor-pointer select-none"
    >
      <motion.h1
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
        className="text-lg sm:text-2xl mb-6 leading-relaxed"
      >
        {PROFILE.name.toUpperCase()}
      </motion.h1>
      <p className="text-xs sm:text-base text-yellow-400 mb-10">{PROFILE.title.toUpperCase()}</p>
      <motion.p
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-[10px] sm:text-sm"
      >
        PRESS START
      </motion.p>
    </motion.div>
  );
}
