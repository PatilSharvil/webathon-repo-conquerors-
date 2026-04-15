import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(<pre key={`code-${i}`} className="bg-cream-dark rounded-lg p-3 my-2 text-xs overflow-x-auto border border-beige/30"><code>{codeLines.join('\n')}</code></pre>);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }
    if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); return; }

    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-brown-deep font-semibold">$1</strong>');
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic text-brown">$1</em>');

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-semibold text-brown-deep mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processedLine.replace('### ', '') }} />);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-brown-deep mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processedLine.replace('## ', '') }} />);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-brown-deep mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processedLine.replace('# ', '') }} />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className="ml-4 flex items-start gap-2" dangerouslySetInnerHTML={{ __html: `<span class="text-orange-accent mt-1.5">•</span><span>${processedLine.replace(/^[-*] /, '')}</span>` }} />);
    } else {
      elements.push(<p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />);
    }
  });

  return <div className="space-y-1">{elements}</div>;
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentThinking, setCurrentThinking] = useState('');
  const [responseMeta, setResponseMeta] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const sendMessage = async (text) => {
    if (!text.trim() || streaming) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setCurrentResponse('');
    setCurrentThinking('');
    setResponseMeta(null);

    try {
      // Use Vite proxy to avoid CORS issues
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sessionId }),
        signal: abortRef.current?.signal,
      });

      const data = await response.json();
      
      // Simulate typing effect for better UX
      if (data.source === 'direct') {
        // Stream direct answers character by character
        const chars = (data.answer || '').split('');
        let typed = '';
        for (let i = 0; i < chars.length; i += 2) {
          typed += chars.slice(i, i + 2).join('');
          setCurrentResponse(typed);
          await new Promise(r => setTimeout(r, 8));
        }
      } else {
        // For Ollama, show thinking first then response
        if (data.thinking) {
          setCurrentThinking(data.thinking);
          await new Promise(r => setTimeout(r, 500));
        }
        setCurrentResponse(data.answer || '');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'No response.',
        source: data.source || 'ollama',
        model: data.model || null,
        propertiesReferenced: data.propertiesReferenced || 0,
        confidence: data.source === 'direct' ? 1 : 0.85
      }]);

      if (!sessionId && data.sessionId) setSessionId(data.sessionId);
      setCurrentResponse('');
      setCurrentThinking('');
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Connection error. Please try again.',
          source: 'error'
        }]);
      }
    } finally {
      setStreaming(false);
    }
  };

  const suggestions = [
    'How many properties are in the database?',
    'Show me all properties with disputes',
    'Which properties have high risk?',
    'List properties with active loans',
    'What can you tell me about SV-001?'
  ];

  return (
    <div className="min-h-screen page-gradient flex flex-col">
      <div className="h-20" />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-4">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-cream-dark via-cream to-cream pb-6 pt-8 rounded-b-3xl mb-4">
          <div className="absolute top-0 right-20 w-40 h-40 bg-gradient-to-bl from-orange/8 to-transparent rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-accent to-orange-warm flex items-center justify-center text-white shadow-lg">🧠</div>
              <h1 className="text-3xl md:text-4xl font-bold text-brown-deep">AI Property Chat</h1>
            </div>
            <p className="text-brown/60">Powered by <span className="font-semibold text-orange-accent">Groq Llama 3.3</span> with RAG</p>
            <div className="w-12 h-1 bg-gradient-to-r from-orange-accent to-orange-warm mx-auto mt-3 rounded-full" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {messages.length === 0 && !currentResponse && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <div className="text-5xl">💬</div>
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-br from-orange/10 to-transparent rounded-full blur-xl -z-10" />
              </div>
              <p className="text-brown/50 mb-6 text-lg">Ask me anything about your properties</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="text-sm bg-gradient-to-r from-beige/50 to-beige/20 text-brown-medium hover:from-orange-accent/15 hover:to-orange-warm/10 hover:text-orange-accent px-4 py-2 rounded-full transition-all border border-beige/30 hover:border-orange-accent/30">{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-gradient-to-r from-orange-accent to-orange-warm text-white rounded-br-md' : 'bg-gradient-to-br from-cream-dark via-cream to-cream-dark border border-beige/30 rounded-bl-md'}`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div>
                    <MarkdownText text={msg.content} />
                    <div className="mt-3 pt-2 border-t border-beige/30 flex items-center gap-2 flex-wrap">
                      {msg.source === 'direct' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Direct Answer</span>
                      ) : (
                        <>
                          <span className="text-xs bg-gradient-to-r from-orange-accent/15 to-orange-warm/10 text-orange-accent px-2 py-0.5 rounded-full font-medium">🤖 AI</span>
                          {msg.model && <span className="text-xs bg-beige/40 text-brown-medium px-2 py-0.5 rounded-full">{msg.model}</span>}
                        </>
                      )}
                      <span className="text-xs text-brown/40">{msg.propertiesReferenced} properties</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-gradient-to-br from-cream-dark via-cream to-cream-dark border border-beige/30 rounded-2xl rounded-bl-md p-4">
                {/* Thinking section */}
                {currentThinking && (
                  <div className="mb-3 p-3 bg-cream/50 rounded-xl border border-beige/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-orange-accent rounded-full animate-pulse" />
                      <span className="text-xs text-brown/50 font-medium">Thinking...</span>
                    </div>
                    <p className="text-xs text-brown/40 italic leading-relaxed whitespace-pre-wrap">{currentThinking}</p>
                  </div>
                )}
                <MarkdownText text={currentResponse} />
                {/* Blinking cursor */}
                <span className="inline-block w-2 h-5 bg-orange-accent ml-1 animate-pulse" />
                {responseMeta && (
                  <div className="mt-3 pt-2 border-t border-beige/30 flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gradient-to-r from-orange-accent/15 to-orange-warm/10 text-orange-accent px-2 py-0.5 rounded-full font-medium">🤖 AI</span>
                    {responseMeta.model && <span className="text-xs bg-beige/40 text-brown-medium px-2 py-0.5 rounded-full">{responseMeta.model}</span>}
                    <span className="text-xs text-brown/40">{responseMeta.propertiesReferenced} properties</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {streaming && !currentResponse && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark border border-beige/30 rounded-2xl rounded-bl-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-orange-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-orange-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-brown/40 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-gradient-to-br from-cream-dark via-cream to-cream-dark rounded-2xl p-3 border border-beige/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange/5 to-transparent rounded-full blur-[30px] pointer-events-none" />
          <div className="relative z-10 flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about properties, risks, loans, disputes..."
              className="flex-1 bg-gradient-to-r from-white/70 to-beige/20 border border-beige/50 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-accent/50 focus:ring-2 focus:ring-orange-accent/10 text-brown-deep placeholder-brown/30"
              disabled={streaming}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              className="btn-primary btn-glow px-6 py-3 rounded-xl disabled:opacity-40"
            >
              {streaming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
