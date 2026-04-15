import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
      style={{ background: '#7BA7A0' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* ===== LOGO SECTION ===== */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          {/* Paper airplane logo icon */}
          <div className="transition-transform duration-500 ease-in-out group-hover:scale-110">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M 3 12 L 15 8 L 18 16 L 6 19 Z" stroke="#E891B2" strokeWidth="2" fill="white"/>
              <path d="M 6 19 L 12 13" stroke="#E891B2" strokeWidth="1.5"/>
            </svg>
          </div>
          
          {/* Logo Text - Two lines like Pilot Properties */}
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-widest" style={{ color: '#1A3C34', fontFamily: 'Fraunces, serif' }}>
              LAND
            </span>
            <span className="text-sm font-bold tracking-widest" style={{ color: '#1A3C34', fontFamily: 'Fraunces, serif' }}>
              INTEL
            </span>
          </div>
        </Link>

        {/* ===== DESKTOP MENU ===== */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-xs font-semibold uppercase tracking-widest transition-all duration-300 hover:opacity-75" 
            style={{ color: '#FAF7F2' }}
          >
            Services
          </Link>
          
          <Link 
            to="#about" 
            className="text-xs font-semibold uppercase tracking-widest transition-all duration-300 hover:opacity-75" 
            style={{ color: '#FAF7F2' }}
          >
            About
          </Link>
          
          <Link
            to="#contact"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-all duration-300 hover:scale-105"
            style={{ background: '#E891B2', color: '#FAF7F2' }}
          >
            Contact Us
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M 2 7 L 9 5 L 11 9 L 4 11 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.3"/>
            </svg>
          </Link>
        </div>

        {/* ===== MOBILE MENU TOGGLE ===== */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 transition-all duration-300"
          style={{ color: '#FAF7F2' }}
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* ===== MOBILE MENU ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden pb-4 border-t animate-fade-in" style={{ borderColor: 'rgba(250, 247, 242, 0.2)' }}>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/" className="text-xs font-semibold uppercase tracking-widest transition-all duration-300 hover:opacity-75" style={{ color: '#FAF7F2' }} onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
            <Link to="#about" className="text-xs font-semibold uppercase tracking-widest transition-all duration-300 hover:opacity-75" style={{ color: '#FAF7F2' }} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link to="#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-all duration-300" style={{ background: '#E891B2', color: '#FAF7F2' }} onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
