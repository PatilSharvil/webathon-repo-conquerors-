import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PropertyDetail from './pages/PropertyDetail';
import Search from './pages/Search';
import DocumentUpload from './pages/DocumentUpload';
import Chat from './pages/Chat';
import { useState, useEffect } from 'react';

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/dashboard', label: 'Properties' },
    { to: '/search', label: 'Search' },
    { to: '/chat', label: 'AI Chat', highlight: true },
    { to: '/upload', label: 'Documents' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'nav-glass shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-accent to-orange-warm flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-xl font-semibold text-brown-rich font-['Fraunces']">LandIntel</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative transition-colors ${
                link.highlight
                  ? 'bg-gradient-to-r from-orange-accent to-orange-warm text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-orange/20 hover:scale-105 transition-all'
                  : location.pathname === link.to
                    ? 'text-orange-accent after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-orange-accent'
                    : 'text-brown hover:text-orange-accent after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-orange-accent after:transition-all hover:after:w-full'
              }`}
            >
              {link.highlight && <span className="mr-1">💬</span>}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream">
        <Nav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
