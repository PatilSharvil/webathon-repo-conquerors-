import { useState } from 'react';
import axios from 'axios';

export default function DocumentUpload() {
  const [file, setFile] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('document', file);
    if (propertyId) formData.append('propertyId', propertyId);

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
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
      <div className="relative bg-gradient-to-b from-cream-dark via-cream to-cream pb-10 pt-8">
        <div className="absolute top-0 left-20 w-48 h-48 bg-gradient-to-br from-orange/8 to-transparent rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-36 h-36 bg-gradient-to-tl from-tan/10 to-transparent rounded-full blur-[50px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-brown-deep tracking-tight">Document Intelligence</h1>
          <p className="text-brown/60 mt-3 text-lg">Upload property documents for AI-powered analysis</p>
          <div className="w-12 h-1 bg-gradient-to-r from-orange-accent to-orange-warm mx-auto mt-4 rounded-full" />
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 -mt-4 pb-16">
        {/* Upload Form with gradient */}
        <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-8 border border-beige/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[50px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-tan/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10">
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brown/70 mb-2">Property ID (optional)</label>
                <input
                  type="text"
                  value={propertyId}
                  onChange={e => setPropertyId(e.target.value)}
                  placeholder="Link to existing property"
                  className="w-full bg-gradient-to-r from-white/70 to-beige/20 border border-beige/50 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-accent/50 focus:ring-2 focus:ring-orange-accent/10 text-brown-deep placeholder-brown/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown/70 mb-2">Document</label>
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                    ${file 
                      ? 'border-orange-accent/40 bg-gradient-to-br from-orange-accent/5 to-orange-warm/3' 
                      : 'border-beige/40 bg-gradient-to-br from-white/40 to-beige/10 hover:border-orange-accent/30 hover:from-orange-accent/3'}`}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    type="file"
                    id="fileInput"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={e => setFile(e.target.files[0])}
                    className="hidden"
                  />
                  {file ? (
                    <div>
                      <div className="text-3xl mb-2 relative inline-block">
                        📄
                        <div className="absolute inset-0 w-10 h-10 mx-auto bg-gradient-to-br from-orange/10 to-transparent rounded-full blur-lg -z-10" />
                      </div>
                      <p className="font-medium text-brown-deep">{file.name}</p>
                      <p className="text-xs text-brown/40 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <p className="text-xs text-orange-accent mt-2">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-3 relative inline-block">
                        📁
                        <div className="absolute inset-0 w-12 h-12 mx-auto bg-gradient-to-br from-tan/10 to-transparent rounded-full blur-lg -z-10" />
                      </div>
                      <p className="text-brown-deep font-medium">Click to upload or drag & drop</p>
                      <p className="text-sm text-brown/40 mt-1">PDF, TXT, or DOC up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full btn-primary btn-glow py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing with AI...
                  </>
                ) : '🧠 Upload & Analyze'}
              </button>
            </form>
          </div>
        </div>

        {/* Results with gradient */}
        {result && (
          <div className="mt-8 bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-8 border border-beige/30 animate-scale-in relative overflow-hidden">
            {/* Gradient glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[50px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-tan/5 to-transparent rounded-full blur-[40px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-accent to-orange-warm flex items-center justify-center text-white shadow-lg">
                  🧠
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brown-deep">Analysis Results</h2>
                  <p className="text-xs text-brown/50">{result.fileName}</p>
                </div>
              </div>

              <div className="space-y-5">
                {result.extractedContent?.ownerNames?.length > 0 && (
                  <div>
                    <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-2">👤 Owner Names Found</p>
                    <div className="flex flex-wrap gap-2">
                      {result.extractedContent.ownerNames.map((n, i) => (
                        <span key={i} className="bg-gradient-to-r from-beige/50 to-beige/20 text-brown-medium px-3 py-1.5 rounded-lg text-sm border border-beige/30">{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.extractedContent?.dates?.length > 0 && (
                  <div>
                    <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-2">📅 Dates Found</p>
                    <div className="flex flex-wrap gap-2">
                      {result.extractedContent.dates.map((d, i) => (
                        <span key={i} className="bg-gradient-to-r from-beige/40 to-beige/10 text-brown px-3 py-1.5 rounded-lg text-sm border border-beige/20">
                          {new Date(d).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.extractedContent?.legalClauses?.length > 0 && (
                  <div>
                    <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-2">📋 Legal Clauses</p>
                    <ul className="space-y-2">
                      {result.extractedContent.legalClauses.map((c, i) => (
                        <li key={i} className="bg-gradient-to-r from-white/60 to-beige/10 p-3 rounded-xl text-sm text-brown/80 border border-beige/20">• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.extractedContent?.riskIndicators?.length > 0 && (
                  <div>
                    <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-2">⚠️ Risk Indicators</p>
                    <ul className="space-y-2">
                      {result.extractedContent.riskIndicators.map((r, i) => (
                        <li key={i} className="bg-gradient-to-r from-[#D4845A]/10 to-[#D4845A]/3 text-[#D4845A] p-3 rounded-xl text-sm border border-[#D4845A]/20">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.extractedContent?.summary && (
                  <div>
                    <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-2">📝 Summary</p>
                    <div className="bg-gradient-to-r from-white/60 to-beige/10 p-4 rounded-xl text-sm text-brown/80 leading-relaxed border border-beige/20">
                      {result.extractedContent.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="h-16 bg-gradient-to-t from-cream-dark to-cream" />
    </div>
  );
}
