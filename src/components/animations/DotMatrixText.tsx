import React, { useEffect, useState } from 'react';

export const DotMatrixText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15); // Adjust typing speed here
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse inline-block w-[8px] h-[1em] bg-red-500 ml-1 translate-y-[2px]" />
    </span>
  );
};
