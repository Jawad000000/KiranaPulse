'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-element', {
        y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', delay: 0.2,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-[100dvh] w-full flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden bg-[var(--color-dark)] text-center"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518005020951-eccb12b2e882?q=80&w=2800&auto=format&fit=crop"
          alt="Brutalist Architecture"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-[#111111]/30" />
      </div>

      <div className="relative z-10 max-w-5xl text-[var(--color-primary)] flex flex-col items-center">
        <h1 className="flex flex-col gap-2 md:gap-4">
          <span className="hero-element font-heading font-bold text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight">
            SYNC THE SUPPLY CHAIN.
          </span>
          <span className="hero-element text-drama text-5xl md:text-[6rem] lg:text-[8rem] leading-[1]">
            SAVE TIME &amp; SPACE.
          </span>
        </h1>
        <p className="hero-element mt-8 text-lg md:text-xl font-data text-[var(--color-primary)]/80 max-w-3xl mx-auto leading-relaxed">
          An All-in-One platform using AI to forecast demand and automate shop inventory replenishment.
        </p>
        <div className="hero-element mt-10 flex justify-center">
          <Link
            href="/login"
            className="bg-[var(--color-accent)] text-[var(--color-primary)] px-8 py-4 rounded-[2rem] text-lg font-bold hover:scale-[1.03] transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden relative group"
          >
            <span className="relative z-10 transition-colors group-hover:text-[var(--color-primary)]">Launch Dashboard</span>
            <div className="absolute inset-0 bg-[var(--color-dark)] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
