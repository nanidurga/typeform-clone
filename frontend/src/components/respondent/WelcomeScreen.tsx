"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

interface WelcomeScreenProps {
  title: string;
  message: string | null;
  onStart: () => void;
}

export function WelcomeScreen({ title, message, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -60 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-2xl text-center"
      >
        <h1 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
        {message && (
          <p className="mt-4 text-lg text-ink-soft md:text-xl">{message}</p>
        )}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="accent" size="lg" onClick={onStart}>
            Start
          </Button>
          <span className="text-xs text-ink-soft">
            press <span className="font-semibold">Enter ↵</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
