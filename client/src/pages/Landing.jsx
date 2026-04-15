import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

function Landing() {
  const featuresRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-cream overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center noise-overlay hero-gradient">
        {/* Decorative blobs with gradient blending */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-orange/15 to-orange/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-gradient-to-tr from-tan/20 to-beige/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] bg-gradient-to-br from-orange-light/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        {/* Bottom gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-dark to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-beige/60 to-beige/30 backdrop-blur px-4 py-2 rounded-full text-sm text-brown-rich font-medium border border-beige/40">
                <span className="w-2 h-2 bg-gradient-to-r from-orange-accent to-orange-warm rounded-full animate-pulse" />
                AI-Powered Land Intelligence
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-brown-deep leading-[1.1] tracking-tight">
                Smart Land{' '}
                <span className="text-gradient">
                  Analysis
                </span>{' '}
                for Confident Decisions
              </h1>
              <p className="text-lg md:text-xl text-brown/70 max-w-lg leading-relaxed">
                Transform raw land records into actionable insights. Detect risks, predict disputes, and verify property integrity — all in one platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard" className="btn-primary btn-glow px-8 py-4 rounded-xl text-base">
                Explore Properties →
              </Link>
              <Link to="/upload" className="btn-secondary px-8 py-4 rounded-xl text-base">
                Upload Document
              </Link>
            </div>

            {/* Stats with gradient separators */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brown-deep">50+</div>
                <div className="text-xs text-brown/60 uppercase tracking-wider">Properties</div>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-beige to-transparent" />
              <div className="text-center">
                <div className="text-2xl font-bold text-brown-deep">AI</div>
                <div className="text-xs text-brown/60 uppercase tracking-wider">Powered</div>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-beige to-transparent" />
              <div className="text-center">
                <div className="text-2xl font-bold text-brown-deep">Local</div>
                <div className="text-xs text-brown/60 uppercase tracking-wider">First</div>
              </div>
            </div>
          </div>

          {/* Hero visual — animated dashboard preview */}
          <div className="relative animate-float hidden lg:block">
            <div className="bg-gradient-to-br from-cream-dark/90 via-cream/80 to-cream-dark/70 backdrop-blur rounded-2xl border border-beige/50 p-6 shadow-2xl card-gradient">
              {/* Gradient glow behind card */}
              <div className="absolute -inset-1 bg-gradient-to-br from-orange/20 via-transparent to-tan/20 rounded-2xl blur-xl -z-10" />
              
              {/* Mock score gauge */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8D5C0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#gaugeGradient)" strokeWidth="3" strokeDasharray="70 100" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E07B3C" />
                        <stop offset="100%" stopColor="#C26B3F" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-brown-deep">70</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brown-deep">Medium Risk</p>
                  <p className="text-xs text-brown/60">Score out of 100</p>
                </div>
              </div>
              {/* Mock risk factors with gradient backgrounds */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-white/70 to-beige/20 rounded-lg p-3 flex items-center gap-3">
                  <span className="w-2 h-2 bg-gradient-to-r from-orange-accent to-orange-warm rounded-full" />
                  <span className="text-xs text-brown">Active loan detected</span>
                </div>
                <div className="bg-gradient-to-r from-white/70 to-beige/20 rounded-lg p-3 flex items-center gap-3">
                  <span className="w-2 h-2 bg-gradient-to-r from-brown to-brown-rich rounded-full" />
                  <span className="text-xs text-brown">3 ownership transfers</span>
                </div>
                <div className="bg-gradient-to-r from-white/70 to-beige/20 rounded-lg p-3 flex items-center gap-3">
                  <span className="w-2 h-2 bg-gradient-to-r from-tan to-beige-dark rounded-full" />
                  <span className="text-xs text-brown">1 dispute on record</span>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-white to-cream rounded-xl shadow-lg px-4 py-2 border border-beige/30">
              <span className="text-xs font-semibold text-gradient">🧠 AI Analysis</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-beige/60 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-gradient-to-b from-orange-accent to-orange-warm rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ===== FEATURES — with gradient fade from hero ===== */}
      <section className="relative py-24 noise-overlay" style={{ background: 'linear-gradient(180deg, #F5F0E8 0%, #FAF7F2 50%, #F5F0E8 100%)' }}>
        {/* Top gradient blend */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cream-dark to-transparent pointer-events-none" />
        {/* Bottom gradient blend */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-brown-deep mb-4">
              Intelligent Features
            </h2>
            <p className="text-brown/70 max-w-2xl mx-auto text-lg">
              Everything you need to evaluate land records with confidence and clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Risk Assessment', desc: 'AI-powered trust scoring that evaluates ownership patterns, loans, and disputes to give you a clear risk level.', gradient: 'from-orange-accent/8 to-orange-warm/3' },
              { icon: '🔍', title: 'Semantic Search', desc: 'Search properties using natural language. "Show me high-risk properties in Pune" — just ask.', gradient: 'from-tan/8 to-beige/3' },
              { icon: '📄', title: 'Document Intelligence', desc: 'Upload PDFs and documents. Our AI extracts owner names, dates, clauses, and risk indicators automatically.', gradient: 'from-beige/8 to-cream-dark/3' },
              { icon: '📊', title: 'Temporal Timeline', desc: 'See how property risk evolves over time. Track ownership changes, loans, and disputes on an interactive timeline.', gradient: 'from-brown/6 to-brown-rich/2' },
              { icon: '🧠', title: 'Explainable AI', desc: 'Every assessment comes with clear reasoning. No black boxes — understand why a property is flagged as risky.', gradient: 'from-orange/6 to-orange-accent/2' },
              { icon: '🔒', title: 'Local-First Privacy', desc: 'Your data stays local. Run everything on your machine with local MongoDB and Ollama for complete privacy.', gradient: 'from-beige-dark/6 to-tan/2' },
            ].map((f, i) => (
              <div key={i} className={`reveal bg-gradient-to-br ${f.gradient} backdrop-blur rounded-2xl p-6 border border-beige/30 card-hover transition-all card-gradient`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-brown-deep mb-2">{f.title}</h3>
                <p className="text-sm text-brown/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-24 hero-gradient">
        {/* Top gradient blend */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cream-dark to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-brown-deep mb-4">
              How It Works
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-orange-accent to-transparent mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Add or Search', desc: 'Search existing properties or add new land records with ownership history, loans, and disputes.' },
              { step: '02', title: 'Run Assessment', desc: 'Click assess on any property. Our AI engine analyzes patterns and computes a risk score.' },
              { step: '03', title: 'Get Insights', desc: 'View detailed risk breakdown, temporal timeline, AI explanations, and actionable recommendations.' },
            ].map((s, i) => (
              <div key={i} className="reveal text-center relative group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-accent to-orange-warm text-white text-xl font-bold mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-brown-deep mb-3">{s.title}</h3>
                <p className="text-brown/70 max-w-sm mx-auto">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <div className="border-t-2 border-dashed bg-gradient-to-r from-beige to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 noise-overlay" style={{ background: 'linear-gradient(135deg, #5C3D2E 0%, #3D2B1F 50%, #5C3D2E 100%)' }}>
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,132,90,0.2),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-accent/10 via-transparent to-orange-warm/10 pointer-events-none" />
        {/* Top gradient blend */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cream to-transparent pointer-events-none" style={{ background: 'linear-gradient(to bottom, #FAF7F2, transparent)' }} />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 reveal text-white">
            Ready to Analyze?
          </h2>
          <p className="text-beige/80 text-lg mb-8 reveal">
            Start exploring properties, run risk assessments, and make informed land decisions today.
          </p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 bg-gradient-to-r from-white to-cream text-brown-deep font-semibold px-8 py-4 rounded-xl hover:from-cream hover:to-beige transition-all shadow-xl reveal hover:shadow-2xl hover:scale-105">
            Go to Dashboard
            <span>→</span>
          </Link>
        </div>

        {/* Bottom gradient blend to footer */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream-dark to-transparent pointer-events-none" />
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-cream-dark border-t border-beige/30 py-8 relative">
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-cream-dark pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-accent to-orange-warm flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-sm font-semibold text-brown-rich">LandIntel</span>
          </div>
          <p className="text-xs text-brown/50">Built with ❤️ for the DYPCET Webathon 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
