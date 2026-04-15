import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PropertyDetail from './pages/PropertyDetail';
import Search from './pages/Search';
import DocumentUpload from './pages/DocumentUpload';
import { useState, useEffect } from 'react';

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link to="/dashboard" className="text-brown hover:text-orange-accent transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-orange-accent after:transition-all hover:after:w-full">Properties</Link>
          <Link to="/search" className="text-brown hover:text-orange-accent transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-orange-accent after:transition-all hover:after:w-full">Search</Link>
          <Link to="/upload" className="text-brown hover:text-orange-accent transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-orange-accent after:transition-all hover:after:w-full">Documents</Link>
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
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
