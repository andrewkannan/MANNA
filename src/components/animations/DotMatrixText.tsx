import React, { useEffect, useRef } from 'react';

export const DotMatrixText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    
    // Clear initial
    textRef.current.textContent = '';
    
    let i = 0;
    let lastTime = 0;
    const intervalMs = 20; // 20ms per character
    let animationFrameId: number;

    const typeText = (time: number) => {
      if (!lastTime) lastTime = time;
      
      if (time - lastTime >= intervalMs) {
        if (textRef.current && i < text.length) {
          textRef.current.textContent += text.charAt(i);
          i++;
        }
        lastTime = time;
      }
      
      if (i < text.length) {
        animationFrameId = requestAnimationFrame(typeText);
      }
    };

    animationFrameId = requestAnimationFrame(typeText);

    return () => cancelAnimationFrame(animationFrameId);
  }, [text]);

  return (
    <span className={className}>
      <span ref={textRef} />
      <span className="animate-pulse inline-block w-[8px] h-[1em] bg-red-500 ml-1 translate-y-[2px]" />
    </span>
  );
};
