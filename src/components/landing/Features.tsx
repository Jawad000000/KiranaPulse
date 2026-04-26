'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MousePointer2 } from 'lucide-react';

function DiagnosticShuffler() {
  const [labels, setLabels] = useState(["Demand Surges", "Local Forecasting", "Inventory Alerts"]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLabels(prev => {
        const newArr = [...prev];
        const last = newArr.pop()!;
        newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative h-48 w-full mt-4">
        {labels.map((label, index) => {
          // index 0 is front, 1 is middle, 2 is back
          return (
            <div 
              key={label}
              className="absolute top-0 left-0 w-full bg-white border border-[var(--color-dark)]/10 rounded-[2rem] shadow-sm h-48 flex items-center justify-center p-6 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
              style={{
                transform: `translateY(${index * 20}px) scale(${1 - index * 0.05})`,
                opacity: 1 - index * 0.3,
                zIndex: 3 - index,
              }}
            >
              <h3 className="font-heading font-bold text-xl md:text-2xl text-center">{label}</h3>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <h3 className="font-heading font-bold text-2xl mb-2">Smart Replenishment</h3>
        <p className="text-[var(--color-dark)]/70">AI tracks inventory levels and automatically triggers re-orders when stock is low, keeping shelves full and waste low.</p>
      </div>
    </div>
  );
}

function TelemetryTypewriter() {
  const fullText = "SCANNING SHELVES...\nSTOCK LEVEL: CRITICAL...\nREORDER TRIGGERED...";
  const [text, setText] = useState("");
  
  useEffect(() => {
    let i = 0;
    let timer: NodeJS.Timeout;
    
    const type = () => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        timer = setTimeout(() => {
          i = 0;
          type();
        }, 2000);
      } else {
        timer = setTimeout(type, 100);
      }
    };
    
    type();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-dark)] text-[var(--color-primary)] rounded-[2rem] p-6 md:p-8 h-64 shadow-lg flex flex-col mt-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="text-[var(--color-accent)] font-data font-bold tracking-widest text-xs">LIVE FEED</span>
        </div>
        <div className="font-data text-sm md:text-base whitespace-pre-wrap flex-1 opacity-90 leading-relaxed">
          {text}
          <span className="inline-block w-2.5 h-5 bg-[var(--color-accent)] animate-pulse align-middle ml-1" />
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-heading font-bold text-2xl mb-2">Live Inventory Pulse</h3>
        <p className="text-[var(--color-dark)]/70">Real-time tracking of every sale to keep your stock levels perfect and your shelves never empty.</p>
      </div>
    </div>
  );
}

function CursorProtocolScheduler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      
      tl.to('.fake-cursor', { opacity: 1, duration: 0.3 })
        .to('.fake-cursor', { x: 90, y: 45, duration: 1, ease: 'power2.inOut' })
        .to('.fake-cursor', { scale: 0.8, duration: 0.1 })
        .call(() => setActiveDay(2))
        .to('.fake-cursor', { scale: 1, duration: 0.1 })
        .to('.fake-cursor', { x: 180, y: 150, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to('.fake-cursor', { scale: 0.8, duration: 0.1 })
        .to('.fake-cursor', { scale: 1, duration: 0.1 })
        .to('.fake-cursor', { opacity: 0, duration: 0.3, delay: 0.5 })
        .set('.fake-cursor', { x: 0, y: 0 })
        .call(() => setActiveDay(null));
        
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div ref={containerRef} className="bg-white border border-[var(--color-dark)]/10 rounded-[2rem] p-6 md:p-8 h-64 shadow-sm overflow-hidden relative mt-4">
        <div className="grid grid-cols-7 gap-2 mb-12">
          {days.map((day, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-full flex items-center justify-center font-data text-xs font-bold transition-colors ${activeDay === i ? 'bg-[var(--color-accent)] text-[var(--color-primary)]' : 'bg-[var(--color-background)] text-[var(--color-dark)]/50'}`}
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <div className="bg-[var(--color-dark)] text-[var(--color-primary)] px-6 py-3 rounded-full font-heading font-bold text-sm shadow-md">
            Sync Data
          </div>
        </div>
        
        <div className="fake-cursor absolute top-4 left-4 opacity-0 pointer-events-none z-10 text-[var(--color-dark)]">
          <MousePointer2 className="w-8 h-8 fill-white" strokeWidth={1.5} />
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-heading font-bold text-2xl mb-2">Unified Data Pulse</h3>
        <p className="text-[var(--color-dark)]/70">One platform connecting Point-of-Sale (POS) data from Kirana stores directly to manufacturers.</p>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 md:px-12 lg:px-20 bg-[var(--color-background)] text-[var(--color-dark)]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading font-bold text-4xl md:text-6xl mb-24 tracking-tight">Functional Artifacts.</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          <DiagnosticShuffler />
          <TelemetryTypewriter />
          <CursorProtocolScheduler />
        </div>
      </div>
    </section>
  );
}
