"use client";

import { motion } from "framer-motion";

export function ThankYouScreen({ message }: { message: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-xl text-center"
      >
        <div className="mb-6 text-5xl" aria-hidden>
          🎉
        </div>
        <h1 className="text-3xl font-semibold text-ink">
          {message?.trim() || "Thanks for completing this form!"}
        </h1>
        <p className="mt-4 text-ink-soft">Your response has been recorded.</p>
        <p className="mt-10 text-xs text-ink-soft opacity-60">
          Powered by <span className="font-semibold">Formly</span>
        </p>
      </motion.div>
    </div>
  );
}
