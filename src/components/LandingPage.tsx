import React from 'react';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-6xl font-extrabold tracking-tight mb-4">
          Génie en Herbe: Le Quiz
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-2xl text-gray-300 mb-8"
        >
          APPRENTIS EXPLORATEURS / PLASTIC ODYSSEY
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: 'backOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center mx-auto shadow-lg"
        >
          <PlayCircle className="w-8 h-8 mr-3" />
          Commencer à jouer
        </motion.button>
      </motion.div>
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-4 text-gray-500"
      >
        <p>Développé avec ❤️ par MQC</p>
      </motion.footer>
    </div>
  );
};