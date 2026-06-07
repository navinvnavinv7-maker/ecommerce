import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function ToastNotification({ toastMessage }) {
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          id="toast_notification"
          className="fixed top-20 right-6 z-50 bg-zinc-900 border border-zinc-800 text-zinc-100 py-3 px-5 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <p className="text-sm font-medium tracking-wide">{toastMessage}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
