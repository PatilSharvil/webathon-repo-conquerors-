import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`/api/properties/${id}`),
      axios.get(`/api/risk/${id}`).catch(() => null)
    ]).then(([propRes, riskRes]) => {
      setProperty(propRes.data);
      setAssessment(riskRes?.data);
      setLoading(false);
    });
  }, [id]);

  const runAssessment = async () => {
    setAssessing(true);
    try {
      const res = await axios.post(`/api/risk/assess/${id}`);
      setAssessment(res.data);
    } finally {
      setAssessing(false);
    }
  };

  if (loading) return (
    <div className="pt-20 flex items-center justify-center min-h-screen bg-cream">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-beige/30 border-t-orange-accent rounded-full animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-warm/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
    </div>
  );
  if (!property) return (
    <div className="pt-20 text-center py-20 bg-cream min-h-screen">
      <p className="text-xl text-brown/60">Property not found</p>
    </div>
  );

  const riskConfig = assessment ? {
    'Low': { color: 'text-[#4A7C59]', bg: 'bg-[#4A7C59]/10', border: 'border-[#4A7C59]/30', emoji: '✅', gradient: 'from-[#4A7C59]/15 to-[#4A7C59]/5' },
    'Medium': { color: 'text-[#D4A843]', bg: 'bg-[#D4A843]/10', border: 'border-[#D4A843]/30', emoji: '⚠️', gradient: 'from-[#D4A843]/15 to-[#D4A843]/5' },
    'High': { color: 'text-[#D4845A]', bg: 'bg-[#D4845A]/10', border: 'border-[#D4845A]/30', emoji: '🔶', gradient: 'from-[#D4845A]/15 to-[#D4845A]/5' },
    'Critical': { color: 'text-[#B94E48]', bg: 'bg-[#B94E48]/10', border: 'border-[#B94E48]/30', emoji: '🚨', gradient: 'from-[#B94E48]/15 to-[#B94E48]/5' },
  }[assessment.riskLevel] : {};

  return (
    <div className="min-h-screen page-gradient">
      <div className="h-20" />
      
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Back button with gradient */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-brown/60 hover:text-orange-accent transition-colors mb-6 text-sm group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Properties
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header with gradient */}
            <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-8 border border-beige/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-tan/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-brown-deep">{property.surveyNumber}</h1>
                    <p className="text-brown/60 mt-1">{property.ownerName} • {property.area} acres</p>
                  </div>
                  {property.landType && (
                    <span className="bg-gradient-to-r from-beige/60 to-beige/30 text-brown-medium text-xs px-4 py-2 rounded-full font-medium border border-beige/40">{property.landType}</span>
                  )}
                </div>
                <p className="text-brown/70 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-accent to-orange-warm" /> {property.location}, {property.district}
                </p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-orange-accent to-transparent mt-4" />
              </div>
            </div>

            {/* Ownership History with gradient timeline */}
            <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-8 border border-beige/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-beige/10 to-transparent rounded-full blur-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-brown-deep mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-accent/20 to-orange-warm/10 flex items-center justify-center text-sm">📜</span> Ownership History
                </h2>
                {property.ownershipHistory?.length === 0 ? (
                  <p className="text-brown/40 text-center py-8">No ownership records</p>
                ) : (
                  <div className="relative">
                    {/* Gradient timeline line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-orange-accent via-tan to-beige/30" />
                    <div className="space-y-4">
                      {property.ownershipHistory.map((o, i) => (
                        <div key={i} className="relative flex items-center gap-6 pl-10 group">
                          {/* Timeline dot with gradient */}
                          <div className="absolute left-[14px] w-4 h-4 rounded-full bg-gradient-to-br from-orange-accent to-orange-warm border-3 border-cream shadow-md group-hover:scale-125 transition-transform" />
                          <div className="flex-1 bg-gradient-to-r from-white/60 to-beige/10 rounded-xl p-4 border border-beige/20 group-hover:border-orange-accent/20 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-brown-deep">{o.ownerName}</span>
                              <span className="text-xs text-brown/50 bg-beige/40 px-3 py-1 rounded-full">{o.transferType}</span>
                            </div>
                            <p className="text-xs text-brown/50 mt-1">{new Date(o.transferDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Loans & Disputes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[30px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-semibold text-brown-deep mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-accent/20 to-orange-warm/10 flex items-center justify-center text-sm">💰</span> Loans
                  </h2>
                  {property.loans?.length === 0 ? (
                    <p className="text-brown/40 text-center py-6">No loans</p>
                  ) : (
                    <div className="space-y-3">
                      {property.loans.map((l, i) => (
                        <div key={i} className="bg-gradient-to-r from-white/60 to-beige/10 rounded-xl p-4 border border-beige/20">
                          <p className="font-medium text-brown-deep">{l.lender}</p>
                          <p className="text-sm text-brown/60 mt-1">₹{l.amount?.toLocaleString() || 'N/A'}</p>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
                            l.status === 'active' ? 'bg-gradient-to-r from-[#D4845A]/15 to-[#D4845A]/5 text-[#D4845A] border border-[#D4845A]/20' : 'bg-gradient-to-r from-[#4A7C59]/15 to-[#4A7C59]/5 text-[#4A7C59] border border-[#4A7C59]/20'
                          }`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full blur-[30px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-semibold text-brown-deep mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-accent/20 to-orange-warm/10 flex items-center justify-center text-sm">⚖️</span> Disputes
                  </h2>
                  {property.disputes?.length === 0 ? (
                    <p className="text-brown/40 text-center py-6">No disputes</p>
                  ) : (
                    <div className="space-y-3">
                      {property.disputes.map((d, i) => (
                        <div key={i} className="bg-gradient-to-r from-white/60 to-beige/10 rounded-xl p-4 border-l-[3px] border-gradient-to-b from-[#D4845A] to-[#B94E48]" style={{ borderLeftColor: '#D4845A' }}>
                          <p className="font-medium text-[#D4845A]">{d.type}</p>
                          <p className="text-sm text-brown/60 mt-1">{d.description}</p>
                          <p className="text-xs text-brown/40 mt-2 capitalize">{d.status}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — Risk Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 sticky top-24 relative overflow-hidden">
              {/* Subtle gradient glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-brown-deep mb-6">Risk Assessment</h2>
                
                {!assessment ? (
                  <button 
                    onClick={runAssessment} 
                    disabled={assessing}
                    className="w-full btn-primary btn-glow py-3 rounded-xl text-sm disabled:opacity-50"
                  >
                    {assessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : '🛡️ Run Assessment'}
                  </button>
                ) : (
                  <div className="space-y-6 animate-scale-in">
                    {/* Score Ring with gradient */}
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                          <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={assessment.score >= 80 ? '#4A7C59' : assessment.score >= 60 ? '#D4A843' : assessment.score >= 40 ? '#D4845A' : '#B94E48'} />
                              <stop offset="100%" stopColor={assessment.score >= 80 ? '#5A9C69' : assessment.score >= 60 ? '#E4B853' : assessment.score >= 40 ? '#E4946A' : '#C95E58'} />
                            </linearGradient>
                          </defs>
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8D5C0" strokeWidth="3" />
                          <circle 
                            cx="18" cy="18" r="15.9" fill="none" 
                            stroke="url(#scoreGrad)" 
                            strokeWidth="3" 
                            strokeDasharray={`${assessment.score} 100`} 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-brown-deep">{assessment.score}</span>
                          <span className="text-xs text-brown/50">/100</span>
                        </div>
                      </div>
                      <div className={`font-semibold text-lg bg-gradient-to-r ${riskConfig.gradient} px-4 py-1 rounded-full inline-block ${riskConfig.color}`}>
                        {riskConfig.emoji} {assessment.riskLevel} Risk
                      </div>
                    </div>

                    {/* Risk Factors with gradient */}
                    {assessment.factors?.length > 0 && (
                      <div className="space-y-2">
                        {assessment.factors.map((f, i) => (
                          <div key={i} className={`p-3 rounded-xl bg-gradient-to-r ${riskConfig.gradient} border ${riskConfig.border}`}>
                            <p className="text-sm text-brown-deep font-medium">⚠️ {f.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Insights with gradient separator */}
                    {assessment.insights?.length > 0 && (
                      <div className="border-t border-beige/30 pt-4 relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-beige to-transparent" />
                        <p className="text-xs text-brown/50 uppercase tracking-wider mb-2 font-medium">Key Insights</p>
                        <ul className="space-y-1.5">
                          {assessment.insights.map((ins, i) => (
                            <li key={i} className="text-xs text-brown/70 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-accent to-orange-warm mt-1.5 flex-shrink-0" /> {ins}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Temporal Chart with gradient fill */}
            {assessment?.temporalData?.length > 0 && (
              <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-6 border border-beige/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[30px] pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-brown-deep mb-4">Risk Timeline</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={assessment.temporalData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E07B3C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#E07B3C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={d => new Date(d).getFullYear()} 
                        stroke="#C8A882" 
                        fontSize={11}
                      />
                      <YAxis stroke="#C8A882" fontSize={11} domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={d => new Date(d).toLocaleDateString()}
                        contentStyle={{ background: 'linear-gradient(135deg, #FAF7F2, #F5F0E8)', border: '1px solid #E8D5C0', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulativeScore" 
                        stroke="#D4845A" 
                        strokeWidth={2.5} 
                        fill="url(#colorScore)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeScore" 
                        stroke="#D4845A" 
                        strokeWidth={0}
                        dot={{ fill: '#D4845A', r: 4 }}
                        activeDot={{ r: 6, fill: '#E07B3C' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Explainability with gradient */}
            {assessment?.explanation && (
              <div className="bg-gradient-to-br from-brown-rich/5 via-orange-accent/5 to-orange-warm/5 rounded-2xl p-6 border border-beige/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-accent/10 to-transparent rounded-full blur-[20px] pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-gradient mb-3 flex items-center gap-2">
                    <span>🧠</span> AI Explanation
                  </h3>
                  <p className="text-sm text-brown/70 leading-relaxed">{assessment.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="h-16 bg-gradient-to-t from-cream-dark to-cream" />
    </div>
  );
}
