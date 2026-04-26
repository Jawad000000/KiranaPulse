import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-full flex flex-col items-center">
      <header className="mt-8 bg-[#E5E0D8]/50 backdrop-blur-md border border-white/20 rounded-full px-2 py-2 flex items-center gap-8 shadow-sm">
        <div className="font-sans font-bold text-lg pl-6">KiranaPulse</div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-sans font-medium text-gray-700">
          <Link href="#features" className="hover:text-black transition-colors">Features</Link>
          <Link href="#philosophy" className="hover:text-black transition-colors">Philosophy</Link>
          <Link href="#protocol" className="hover:text-black transition-colors">Protocol</Link>
        </nav>
        <Link href="/login" className="btn-pill shadow-md">
          LOGIN
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-8 py-20">
        <h1 className="text-5xl md:text-7xl font-sans font-bold mb-20 text-dark">
          Functional Artifacts.
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="flex flex-col gap-6">
            <div className="card-soft h-64 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-white rounded-[2rem] shadow-sm translate-y-2 scale-[0.98] -z-10 border border-black/5"></div>
              <div className="absolute inset-0 bg-white rounded-[2rem] shadow-sm translate-y-4 scale-[0.96] -z-20 border border-black/5"></div>
              <h2 className="text-2xl font-sans font-bold text-dark">Demand Surges</h2>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-sans text-dark mb-3">Smart Stocking</h3>
              <p className="font-mono text-sm text-gray-600 leading-relaxed">
                See exactly what customers in your area want to buy before you run out.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-6">
            <div className="card-dark h-64 flex flex-col p-8 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-signal-red animate-pulse"></div>
                <span className="font-mono text-signal-red text-sm font-bold tracking-widest">LIVE FEED</span>
              </div>
              <div className="flex items-end gap-2 h-full mt-auto">
                <div className="w-4 h-12 bg-signal-red rounded-sm"></div>
                <div className="w-4 h-8 bg-[#333] rounded-sm"></div>
                <div className="w-4 h-16 bg-[#333] rounded-sm"></div>
                <div className="w-4 h-6 bg-[#333] rounded-sm"></div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-sans text-dark mb-3">Profit Tracker</h3>
              <p className="font-mono text-sm text-gray-600 leading-relaxed">
                See your daily earnings and find out which items are making you the most money.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-6">
            <div className="card-soft h-64 flex flex-col p-8 relative">
              <div className="flex justify-between items-center w-full px-2">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold ${day === 'T' && i === 2 ? 'bg-signal-red text-white shadow-lg shadow-signal-red/30' : 'bg-gray-100 text-gray-400'}`}>
                    {day}
                  </div>
                ))}
              </div>
              <button className="btn-dark mt-auto self-end text-sm px-8 py-3">
                Sync Data
              </button>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-sans text-dark mb-3">Direct Connect</h3>
              <p className="font-mono text-sm text-gray-600 leading-relaxed">
                Distributors and shops stay synced so deliveries are never late or wrong.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
