import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.post('/api/search/semantic', { query });
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-gradient">
      <div className="h-20" />
      
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-b from-cream-dark via-cream to-cream pb-12 pt-8">
        <div className="absolute top-0 right-20 w-48 h-48 bg-gradient-to-bl from-orange/8 to-transparent rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-36 h-36 bg-gradient-to-tr from-tan/10 to-transparent rounded-full blur-[50px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-brown-deep tracking-tight">Semantic Search</h1>
          <p className="text-brown/60 mt-3 text-lg">Find properties using natural language</p>
          <div className="w-12 h-1 bg-gradient-to-r from-orange-accent to-orange-warm mx-auto mt-4 rounded-full" />
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 -mt-4 pb-16">
        {/* Search Box with gradient */}
        <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder='Try: "properties in Pune with low risk"'
                  className="w-full bg-gradient-to-r from-white/70 to-beige/20 border border-beige/50 rounded-xl px-5 py-3.5 focus:outline-none focus:border-orange-accent/50 focus:ring-2 focus:ring-orange-accent/10 text-brown-deep placeholder-brown/30"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="btn-primary btn-glow px-8 py-3.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </>
                ) : 'Search'}
              </button>
            </div>

            {/* Quick filters with gradient pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Pune', 'Nashik', 'Nagpur', 'Agricultural', 'Residential'].map(tag => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); }}
                  className="text-xs bg-gradient-to-r from-beige/50 to-beige/20 text-brown-medium hover:from-orange-accent/15 hover:to-orange-warm/10 hover:text-orange-accent px-3 py-1.5 rounded-full transition-all border border-beige/30 hover:border-orange-accent/30"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="text-5xl mb-4">🔍</div>
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-br from-orange/10 to-transparent rounded-full blur-xl -z-10" />
            </div>
            <p className="text-brown/50 text-lg">No properties found for "{query}"</p>
            <p className="text-brown/30 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-accent/20 to-orange-warm/10 flex items-center justify-center text-sm">📊</div>
              <p className="text-sm text-brown/50">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
            </div>
            {results.map(p => (
              <Link 
                key={p._id} 
                to={`/property/${p._id}`} 
                className="card-hover block bg-gradient-to-r from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 hover:border-orange-accent/30 group relative overflow-hidden"
              >
                {/* Card gradient hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-accent/3 via-transparent to-tan/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-brown-deep group-hover:text-gradient transition-all">{p.surveyNumber}</h3>
                    <p className="text-brown/60 text-sm mt-0.5">{p.ownerName} • {p.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.landType && (
                      <span className="text-xs bg-gradient-to-r from-beige/50 to-beige/20 text-brown-medium px-3 py-1 rounded-full border border-beige/30">{p.landType}</span>
                    )}
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-accent/10 to-orange-warm/10 flex items-center justify-center text-orange-accent group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="h-16 bg-gradient-to-t from-cream-dark to-cream" />
    </div>
  );
}
