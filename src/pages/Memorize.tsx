import { useState, useEffect, useRef } from 'react';
import { calculateNextReview } from '../utils/srs';
import NothingCard from '../components/ArtCard';
import { BrainCircuit, Check, X, RotateCw, Mic, MicOff } from 'lucide-react';
import { useData } from '../store/useData';
import * as diff from 'diff';

// Extend window for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Memorize() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diffResult, setDiffResult] = useState<diff.Change[]>([]);
  const recognitionRef = useRef<any>(null);

  const { bookmarks, updateBookmark } = useData();
  const activeBookmarks = bookmarks.filter(b => b.dueDate <= Date.now() || b.status === 'NEW');

  useEffect(() => {
    setIsFlipped(false);
    setTranscript('');
    setDiffResult([]);
    setIsListening(false);
  }, [currentIndex]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + ' ' + currentTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      compareTranscript();
    } else {
      setTranscript('');
      setDiffResult([]);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const compareTranscript = () => {
    if (!activeBookmarks[currentIndex]) return;
    const targetText = activeBookmarks[currentIndex].verse.text;
    
    const clean = (s: string) => s.replace(/[^a-z0-9\s]/gi, '').toLowerCase().replace(/\s+/g, ' ').trim();
    
    const changes = diff.diffWords(clean(targetText), clean(transcript));
    setDiffResult(changes);
    setIsFlipped(true); // Auto-flip to show result!
  };

  if (activeBookmarks.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 bg-black text-white text-center">
        <BrainCircuit size={48} className="text-white/20 mb-6" strokeWidth={1} />
        <h2 className="text-2xl font-sans font-black tracking-tighter mb-2">MEMORY CORE OPTIMIZED</h2>
        <p className="text-white/50 font-mono text-xs tracking-[0.2em] uppercase max-w-[250px]">No pending verses. Synchronization complete.</p>
      </div>
    );
  }

  const currentBookmark = activeBookmarks[currentIndex];
  const currentVerse = currentBookmark.verse;

  const handleScore = async (score: 1 | 2 | 3 | 4) => {
    let result: 'EASY' | 'GOOD' | 'PRACTICE' | 'DIFFICULT' = 'GOOD';
    if (score === 1) result = 'DIFFICULT';
    if (score === 2) result = 'PRACTICE';
    if (score === 3) result = 'GOOD';
    if (score === 4) result = 'EASY';

    const updates = calculateNextReview(currentBookmark, result);
    await updateBookmark(currentBookmark.id, updates);
    
    if (currentIndex < activeBookmarks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-full bg-black text-white flex flex-col pb-24">
      <header className="px-6 pt-12 pb-4 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-md z-30">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-tighter">RECALL</h1>
          <p className="font-mono text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Protocol Active
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans font-black text-2xl">{currentIndex + 1}<span className="text-white/30 text-lg">/{activeBookmarks.length}</span></p>
          <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase">Queue</p>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col justify-center max-w-[400px] mx-auto w-full">
        <NothingCard 
          verseDetails={currentVerse}
          userData={currentBookmark}
          isFlipped={isFlipped}
          onClick={() => setIsFlipped(!isFlipped)}
        />
        
        {!isFlipped && (
          <div className="mt-8 flex flex-col items-center">
            <div className="flex gap-4">
              {recognitionRef.current ? (
                <button 
                  onClick={toggleListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse' : 'bg-[#111] text-white border border-white/20 hover:border-white'}`}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              ) : (
                <p className="text-xs text-white/50 font-mono text-center">Speech Recognition not supported in this browser.</p>
              )}
              
              <button 
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(currentVerse.text);
                    utterance.rate = 0.9; // Slightly slower for better dictation
                    window.speechSynthesis.cancel(); // Stop any currently playing audio
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-[#111] text-white border border-white/20 hover:border-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </button>
            </div>
            
            {transcript && !isFlipped && (
              <p className="mt-6 text-sm font-sans text-center text-white/70 px-4">
                "{transcript}..."
              </p>
            )}
          </div>
        )}

        {isFlipped && diffResult.length > 0 && (
          <div className="mt-8 p-4 bg-[#111] border border-white/20">
            <h4 className="font-mono text-red-500 text-[10px] uppercase tracking-widest font-bold mb-3">Speech Analysis</h4>
            <div className="font-sans text-lg leading-relaxed">
              {diffResult.map((part, i) => {
                if (part.added) return <span key={i} className="text-white/30 line-through decoration-red-500">{part.value}</span>;
                if (part.removed) return <span key={i} className="text-red-500 font-bold border-b border-red-500">{part.value}</span>;
                return <span key={i} className="text-white">{part.value}</span>;
              })}
            </div>
          </div>
        )}

        <div className={`mt-8 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <p className="text-center font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase mb-4 font-bold">Assess Accuracy</p>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleScore(1)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-red-500 hover:bg-red-500/10 transition-colors">
              <X size={18} className="text-red-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Fail</span>
            </button>
            <button onClick={() => handleScore(2)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-orange-500 hover:bg-orange-500/10 transition-colors">
              <RotateCw size={18} className="text-orange-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Hard</span>
            </button>
            <button onClick={() => handleScore(3)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-blue-500 hover:bg-blue-500/10 transition-colors">
              <Check size={18} className="text-blue-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Good</span>
            </button>
            <button onClick={() => handleScore(4)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-green-500 hover:bg-green-500/10 transition-colors">
              <Check size={18} className="text-green-500 mb-2" strokeWidth={3} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Easy</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
