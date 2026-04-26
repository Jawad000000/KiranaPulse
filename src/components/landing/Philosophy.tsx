'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.parallax-bg', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });
      
      gsap.from('.split-word-2', { 
        y: 60, 
        opacity: 0, 
        duration: 1.2, 
        stagger: 0.08, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const headline = "FROM GUESSWORK TO ABSOLUTE ACCURACY.";
  const words = headline.split(" ");

  return (
    <section 
      id="philosophy" 
      ref={sectionRef}
      className="relative py-32 px-6 md:px-12 lg:px-20 bg-[var(--color-dark)] text-[var(--color-primary)] overflow-hidden flex flex-col items-center justify-center text-center min-h-[70vh]"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1518005020951-eccb12b2e882?q=80&w=2800&auto=format&fit=crop" 
          alt="Texture" 
          className="parallax-bg w-full h-[120%] object-cover opacity-15 origin-top" 
        />
      </div>
      
      <div className="relative z-10 max-w-5xl">
        <h2 className="font-drama text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-12 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {words.map((word, i) => (
            <span key={i} className="split-word-2 inline-block will-change-transform">{word}</span>
          ))}
        </h2>
        <p className="font-data text-xl md:text-2xl text-[var(--color-primary)]/80 max-w-3xl mx-auto leading-relaxed">
          Eliminate 'dead stock' and never miss a sale again by connecting the retail frontline to the factory.
        </p>
      </div>
    </section>
  );
}
