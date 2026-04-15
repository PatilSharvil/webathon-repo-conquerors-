import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/properties')
      .then(res => setProperties(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen page-gradient">
      {/* Nav blend spacer */}
      <div className="h-20" />
      
      {/* Hero section with gradient */}
      <div className="relative bg-gradient-to-b from-cream-dark via-cream to-cream pb-16 pt-8">
        {/* Decorative gradient blobs */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-orange/8 to-transparent rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-gradient-to-tr from-tan/10 to-transparent rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-brown-deep tracking-tight">Properties</h1>
              <p className="text-brown/70 mt-2 text-lg">Your intelligent land analysis dashboard</p>
              <div className="w-12 h-1 bg-gradient-to-r from-orange-accent to-orange-warm mt-4 rounded-full" />
            </div>
            <Link to="/search" className="btn-primary btn-glow px-6 py-3 rounded-xl text-sm hidden md:inline-flex items-center gap-2">
              🔍 Semantic Search
            </Link>
          </div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-beige/30 border-t-orange-accent rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-warm/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-12 text-center border border-beige/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange/3 via-transparent to-tan/3 pointer-events-none" />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🏠</div>
              <p className="text-brown/70 mb-6 text-lg">No properties found. Add some sample data to get started.</p>
              <button 
                onClick={async () => {
                  const sampleData = [
                    { surveyNumber: 'SV-001', ownerName: 'Rajesh Kumar', area: 2.5, location: 'Pune', district: 'Pune', landType: 'Agricultural', ownershipHistory: [{ ownerName: 'Rajesh Kumar', transferDate: '2010-03-15', transferType: 'sale', documentRef: 'DOC-001' }], loans: [], disputes: [] },
                    { surveyNumber: 'SV-002', ownerName: 'Priya Sharma', area: 1.8, location: 'Nashik', district: 'Nashik', landType: 'Residential', ownershipHistory: [{ ownerName: 'Amit Patil', transferDate: '2018-06-20', transferType: 'sale', documentRef: 'DOC-001' }, { ownerName: 'Priya Sharma', transferDate: '2020-01-10', transferType: 'sale', documentRef: 'DOC-002' }, { ownerName: 'Priya Sharma', transferDate: '2023-08-05', transferType: 'sale', documentRef: 'DOC-003' }], loans: [{ lender: 'SBI Bank', amount: 500000, startDate: '2020-02-01', status: 'active' }], disputes: [{ filedDate: '2022-11-15', type: 'Boundary Dispute', status: 'active', description: 'Neighboring owner claims boundary overlap' }] },
                    { surveyNumber: 'SV-003', ownerName: 'Sunil Deshmukh', area: 5.0, location: 'Nagpur', district: 'Nagpur', landType: 'Commercial', ownershipHistory: [{ ownerName: 'Vijay Jadhav', transferDate: '2015-09-01', transferType: 'inheritance', documentRef: 'DOC-001' }, { ownerName: 'Sunil Deshmukh', transferDate: '2019-04-12', transferType: 'sale', documentRef: 'DOC-002' }], loans: [{ lender: 'HDFC', amount: 1200000, startDate: '2019-05-01', status: 'closed', endDate: '2024-05-01' }], disputes: [] }
                  ];
                  for (const p of sampleData) {
                    await axios.post('/api/properties', p);
                  }
                  window.location.reload();
                }}
                className="btn-primary btn-glow px-8 py-3 rounded-xl"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <Link 
                key={p._id} 
                to={`/property/${p._id}`} 
                className="card-hover bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 hover:border-orange-accent/30 group block relative overflow-hidden"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Card gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-accent/3 via-transparent to-tan/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-brown-deep group-hover:text-gradient transition-all">{p.surveyNumber}</h3>
                      <p className="text-brown/60 text-sm mt-1">{p.ownerName}</p>
                    </div>
                    <span className="text-xs bg-gradient-to-r from-beige/60 to-beige/30 text-brown-medium px-3 py-1 rounded-full font-medium border border-beige/40">{p.landType || 'N/A'}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-brown/70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-accent to-orange-warm" /> {p.location}, {p.district}
                    </p>
                    <p className="text-brown/70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-tan to-beige-dark" /> {p.area} acres
                    </p>
                    <p className="text-brown/70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-beige to-beige-dark" /> {p.ownershipHistory?.length || 0} ownership record{p.ownershipHistory?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-beige/30 flex items-center justify-between">
                    <span className="text-xs text-brown/50">Click to analyze risk</span>
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-accent/10 to-orange-warm/10 flex items-center justify-center text-orange-accent group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom gradient fade to footer area */}
      <div className="h-16 bg-gradient-to-t from-cream-dark to-cream" />
    </div>
  );
}
