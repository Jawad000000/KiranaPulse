import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-primary)] font-data selection:bg-[var(--color-accent)] selection:text-[var(--color-dark)] pt-32 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-primary)]/60 hover:text-[var(--color-accent)] transition-colors mb-12 uppercase tracking-widest text-xs font-bold">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Signal
        </Link>
        
        <h1 className="font-heading font-bold text-5xl md:text-8xl tracking-tighter mb-8">
          TRANSMISSION<br/>
          <span className="text-[var(--color-accent)]">ESTABLISHED.</span>
        </h1>
        
        <div className="h-px w-full bg-[var(--color-primary)]/20 mb-16" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-6">The Architect</h2>
            <p className="text-[var(--color-primary)]/80 text-lg leading-relaxed mb-8">
              KiranaPulse was engineered and designed by <strong className="text-[var(--color-accent)]">Mohd Jawwad</strong>. It is a proprietary system built to model the synchronization of localized supply chains.
            </p>
            <p className="text-[var(--color-primary)]/60 text-sm">
              For inquiries regarding deployment, architecture, or platform ownership, establish contact via the secure channels provided.
            </p>
          </div>
          
          <div className="flex flex-col gap-6">
            <a 
              href="https://github.com/Jawad000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group border border-[var(--color-primary)]/20 hover:border-[var(--color-accent)] bg-[var(--color-primary)]/5 p-8 flex flex-col transition-colors"
            >
              <span className="text-xs uppercase tracking-widest text-[var(--color-primary)]/50 mb-2">Repository Profile</span>
              <span className="font-heading font-bold text-2xl group-hover:text-[var(--color-accent)] transition-colors">GitHub / Jawad000000</span>
            </a>
            
            <a 
              href="mailto:jawwad@example.com" 
              className="group border border-[var(--color-primary)]/20 hover:border-[var(--color-accent)] bg-[var(--color-primary)]/5 p-8 flex flex-col transition-colors relative overflow-hidden"
            >
              <span className="text-xs uppercase tracking-widest text-[var(--color-primary)]/50 mb-2">Direct Comms</span>
              <span className="font-heading font-bold text-2xl group-hover:text-[var(--color-accent)] transition-colors">Email Transmission</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
