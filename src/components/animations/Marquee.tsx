import React from 'react';
import { motion } from 'framer-motion';

export const Marquee: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  return (
    <div className={`overflow-hidden whitespace-nowrap flex bg-red-600 text-black py-1 ${className}`}>
      <motion.div
        className="flex gap-4 items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 10,
        }}
      >
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">{text}</span>
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">{text}</span>
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">{text}</span>
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">{text}</span>
      </motion.div>
    </div>
  );
};
