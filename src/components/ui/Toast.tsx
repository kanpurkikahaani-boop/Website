"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

/** Lightweight polite toast. Parent controls visibility via `message`. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-dark px-5 py-3 text-sm text-cream shadow-lg"
          >
            <CheckCircle2 size={18} className="text-accent" aria-hidden />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
