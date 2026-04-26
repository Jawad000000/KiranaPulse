'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Protocol() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const steps = [
    {
      num: "01",
      title: "POS Integration",
      desc: "Capture real-time sales data at the shop level to understand exactly what customers are buying.",
      visual: (
        <div className="relative flex items-center justify-center h-full">
          <div className="absolute w-32 h-32 border-4 border-[var(--color-dark)] rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-20 h-20 border-4 border-[var(--color-dark)]/40 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full z-10" />
        </div>
      )
    },
    {
      num: "02",
      title: "Auto-Trigger",
      desc: "When the system detects a need, it automatically suggests or places an order to the distributor.",
      visual: (
        <div className="flex items-center justify-center h-full w-full px-8">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-auto overflow-visible">
            <path 
              strokeDasharray="100" 
              strokeDashoffset="100" 
              d="M0,15 L20,15 L25,5 L35,25 L40,15 L100,15"
              className="animate-[dash_2s_linear_infinite]" 
              stroke="var(--color-dark)" 
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              to { stroke-dashoffset: 0; }
            }
          `}} />
        </div>
      )
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.protocol-card');
      
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top 100",
          endTrigger: cards[i + 1],
          end: "top 100",
          scrub: true,
          animation: gsap.to(card, { 
            scale: 0.9, 
            opacity: 0.5, 
            filter: 'blur(10px)', 
            ease: 'none',
            transformOrigin: 'top center'
          }),
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="protocol" className="py-32 px-6 md:px-12 lg:px-20 bg-[var(--color-background)] text-[var(--color-dark)]">
      <div className="max-w-4xl mx-auto" ref={containerRef}>
        <h2 className="font-heading font-bold text-4xl md:text-6xl mb-24 tracking-tight">Protocol Archive.</h2>
        
        <div className="flex flex-col gap-12 relative">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="protocol-card sticky top-24 bg-white border border-[var(--color-dark)]/10 rounded-[3rem] p-10 md:p-16 min-h-[60vh] flex flex-col justify-between shadow-2xl shadow-[var(--color-dark)]/5 will-change-transform overflow-hidden"
            >
              <div>
                <span className="font-data text-[var(--color-accent)] text-xl font-bold tracking-widest">{step.num} //</span>
                <h3 className="font-heading font-bold text-4xl md:text-5xl mt-6 mb-4">{step.title}</h3>
                <p className="text-xl md:text-2xl text-[var(--color-dark)]/70 max-w-xl leading-relaxed">{step.desc}</p>
              </div>
              
              <div className="h-48 md:h-64 mt-12 w-full bg-[var(--color-background)]/50 rounded-2xl flex items-center justify-center overflow-hidden">
                {step.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
