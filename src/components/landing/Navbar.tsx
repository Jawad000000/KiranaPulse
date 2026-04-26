'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
          setIsScrolled(self.direction === 1 || self.scroll() > 50);
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <nav className={cn(
      "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out px-6 py-3 rounded-[2rem] flex items-center gap-8",
      isScrolled
        ? "bg-[var(--color-primary)]/90 backdrop-blur-xl border border-[var(--color-dark)]/10 text-[var(--color-dark)] shadow-sm"
        : "bg-transparent text-[var(--color-primary)]"
    )}>
      <div className="font-heading font-bold text-xl tracking-tight whitespace-nowrap">KiranaPulse</div>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="#features" className="hover:-translate-y-px transition-transform">Features</Link>
        <Link href="#philosophy" className="hover:-translate-y-px transition-transform">Philosophy</Link>
        <Link href="#protocol" className="hover:-translate-y-px transition-transform">Protocol</Link>
      </div>
      <Link
        href="/login"
        className="bg-[var(--color-accent)] text-[var(--color-primary)] px-5 py-2 rounded-[2rem] text-sm font-bold hover:scale-[1.03] transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden relative group whitespace-nowrap"
      >
        <span className="relative z-10 transition-colors group-hover:text-[var(--color-primary)]">Launch Dashboard</span>
        <div className="absolute inset-0 bg-[var(--color-dark)] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
      </Link>
    </nav>
  );
}
