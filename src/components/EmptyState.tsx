import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[50vh]"
    >
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-700" />
        <div className="relative w-24 h-24 border border-white/20 rounded-full flex items-center justify-center bg-black">
          <Icon size={40} className="text-white/60" strokeWidth={1} />
        </div>
        {/* Geometric dots ornament */}
        <div className="absolute -top-4 -right-4 w-8 h-8 flex flex-wrap gap-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-red-500 rounded-full opacity-50" />
          ))}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-3 tracking-tight font-display">{title}</h3>
      <p className="text-white/50 mb-8 max-w-[250px] leading-relaxed text-sm">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="px-6 py-3 bg-white text-black font-semibold rounded-full text-sm hover:bg-gray-200 transition-colors border-2 border-transparent active:border-white/50"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
