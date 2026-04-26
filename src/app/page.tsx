import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Philosophy from '@/components/landing/Philosophy';
import Protocol from '@/components/landing/Protocol';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'KiranaPulse — Sync The Supply Chain',
  description: 'An AI-powered platform that forecasts demand and automates inventory replenishment for Kirana stores, distributors, and manufacturers.',
};

export default function LandingPage() {
  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <Protocol />
      <Footer />
    </div>
  );
}
