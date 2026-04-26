import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark)] text-[var(--color-primary)] rounded-t-[4rem] px-6 md:px-12 lg:px-20 py-20 mt-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-[var(--color-primary)] text-[var(--color-dark)] rounded-[3rem] p-16 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12 mb-32">
          <div>
            <h2 className="font-heading font-bold text-4xl md:text-6xl tracking-tight mb-4">Ready to Grow?</h2>
            <p className="font-data text-lg opacity-80 max-w-md">Join the network connecting local stores to global supply chains.</p>
          </div>
          <Link
            href="/login"
            className="bg-[var(--color-accent)] text-[var(--color-primary)] px-8 py-4 rounded-[2rem] text-lg font-bold hover:scale-[1.03] transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden relative group whitespace-nowrap"
          >
            <span className="relative z-10 transition-colors group-hover:text-[var(--color-primary)]">Launch Dashboard</span>
            <div className="absolute inset-0 bg-[var(--color-dark)] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-[var(--color-primary)]/10 pt-16">
          <div className="col-span-1 md:col-span-2">
            <div className="font-heading font-bold text-3xl tracking-tight mb-4">KiranaPulse</div>
            <p className="font-data text-[var(--color-primary)]/60 mb-8 max-w-sm">Sync the supply chain. Save time and space.</p>
            <div className="border border-[var(--color-primary)]/20 rounded-full px-4 py-2 w-fit flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-data text-xs tracking-widest font-bold">SYSTEM OPERATIONAL</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-bold text-lg mb-2">Navigation</h4>
            <Link href="#features" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Features</Link>
            <Link href="#philosophy" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Philosophy</Link>
            <Link href="#protocol" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Protocol</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-bold text-lg mb-2">Legal</h4>
            <a href="#" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Terms of Service</a>
            <a href="#" className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors">Data Processing</a>
          </div>
        </div>
        
        <div className="mt-20 text-center font-data text-xs text-[var(--color-primary)]/40">
          &copy; {new Date().getFullYear()} KiranaPulse. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
