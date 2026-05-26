import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Shield, MessageCircle, Volume2, UserCheck, Play, Tv } from 'lucide-react';

interface ChatMessage {
  sender: string;
  text: string;
  isAi: boolean;
  time: string;
}

const CHAT_LOG_PRESETS = [
  { sender: 'CryptoQueen', text: 'Blackjack is super hot today! Just hit a natural payout!', time: '12:04' },
  { sender: 'SpinMaximus', text: 'Sophia deal me a beautiful 777 on Neon Reels please!', time: '12:04' },
  { sender: 'VegasVibe', text: 'This single-zero wheel roulette operates like a dream.', time: '12:05' },
];

export default function LiveDealer() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'Sophia_Croupier',
      text: 'Welcome VIP Player pkbusiness! I am Sophia, your AI Table Host today. Ask me about blackjack strategy sheets, slot math configurations, or simply tell me how your chips stack up! How can I help you conquer the lounge today?',
      isAi: true,
      time: '12:03',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveStreamStatus, setLiveStreamStatus] = useState<'idle' | 'searching' | 'connected'>('connected');
  const [audienceCount, setAudienceCount] = useState(128);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat list
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle auto audience simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setAudienceCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(120, prev + change);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Periodic guest comments feed ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const luckyIndex = Math.floor(Math.random() * CHAT_LOG_PRESETS.length);
      const randomPreset = CHAT_LOG_PRESETS[luckyIndex];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setMessages((prev) => [
        ...prev,
        {
          sender: randomPreset.sender,
          text: randomPreset.text,
          isAi: false,
          time: timeStr,
        },
      ].slice(0, 30)); // retain max 30 chat rows
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const sendMessageToAiDealer = async () => {
    const text = inputText.trim();
    if (!text) return;

    setIsSending(true);
    setInputText('');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user chat
    const updatedMessages = [
      ...messages,
      {
        sender: 'You [VIP Player]',
        text: text,
        isAi: false,
        time: timeStr,
      },
    ];
    setMessages(updatedMessages);

    try {
      // Setup payload matching standard chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            // Send user prompt accompanied with the croupier system context
            {
              role: 'user',
              text: `You are Sophia, an energetic, friendly, professional live casino croupier and dealer at Neon Spin Casino. You deal Blackjack, Slots, Roulette, and Poker. Speak in the style of an enthusiastic live-stream casino host, offering playful banter, smart game guides, bankroll tips, and congratulations. Keep responses short and spicy (max 3-4 sentences total) and address the user pkbusiness politely like a VIP high-roller. User said: "${text}"`,
            }
          ],
          useSearch: false,
          useMaps: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Dealer network interface issue.');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'Sophia_Croupier',
          text: data.text || 'I am ready to deal the next hand. Place your bets!',
          isAi: true,
          time: timeStr,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'Sophia_Croupier',
          text: 'The table microphone seems static, but your slot reels remain live! Carry on player.',
          isAi: true,
          time: timeStr,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Top statistical header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">VIP Live Lounge</h3>
            <p className="text-[11px] text-slate-400">Interaction with croupier hosts Sophia & Marcus</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-rose-950/40 text-rose-400 border border-rose-900/30 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          <span>● LIVE STREAM</span>
        </div>
      </div>

      {/* Main split viewport layout: video and chat feed */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        
        {/* Animated stream mock screen */}
        <div className="md:col-span-5 bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[180px] select-none">
          {/* Moving scanlines & filters */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-2 text-center text-[10px] bg-slate-950/80 p-2 border border-slate-900 mx-3 rounded-lg text-slate-350 z-20 backdrop-blur-sm truncate">
            "Welcome pkbusiness, best of luck today on our tables!"
          </div>

          <div className="flex items-center justify-between z-20">
            <span className="text-[10px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-cyan-400">
              AUDIENCE: {audienceCount} HighRollers
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-emerald-400">
              1080p 60fps
            </span>
          </div>

          {/* Graphical AI avatar representations */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-indigo-650 to-cyan-400 p-1 animate-pulse">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">S</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-black text-white flex items-center gap-1 justify-center">
                Sophia (Table Host) <UserCheck className="w-3 h-3 text-cyan-400" />
              </div>
              <p className="text-[9px] text-[#475569] uppercase tracking-wider font-mono">Real-Time LLM response</p>
            </div>
          </div>
        </div>

        {/* Real-time live dealer interactive logs chat list */}
        <div className="md:col-span-7 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col justify-between min-h-[225px] overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[175px]">
            {messages.map((m, idx) => (
              <div key={idx} className="text-[12px] leading-relaxed">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`font-black ${m.isAi ? 'text-cyan-400 text-xs' : 'text-slate-450 text-slate-400'}`}>
                    @{m.sender}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{m.time}</span>
                </div>
                <p className="text-slate-300 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-900 mt-1 whitespace-pre-wrap leading-tight">
                  {m.text}
                </p>
              </div>
            ))}
            
            {isSending && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 italic p-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Sophia is dictating response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick chat composer prompts */}
          <div className="border-t border-slate-900 p-2 bg-slate-950 flex items-center gap-2">
            <input
              id="live-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessageToAiDealer()}
              placeholder="Ask Sophia for a customized blackjack tip or lucky numbers..."
              className="flex-1 bg-slate-900 border-0 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              id="btn-live-chat-submit"
              disabled={isSending || !inputText.trim()}
              onClick={sendMessageToAiDealer}
              className="py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
