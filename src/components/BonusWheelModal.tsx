import { useState, useRef } from 'react';
import { Gift, Play, Sparkles, X, Coins, Trophy } from 'lucide-react';

interface BonusWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (amount: number) => void;
}

export default function BonusWheelModal({ isOpen, onClose, onRewardClaimed }: BonusWheelModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  if (!isOpen) return null;

  const PRIZES = [
    { label: '₹25,000', value: 25000, color: 'bg-rose-600' },
    { label: '₹5,000', value: 5000, color: 'bg-[#ca8a04]' },
    { label: '₹15,000', value: 15000, color: 'bg-purple-600' },
    { label: '₹10,000', value: 10000, color: 'bg-emerald-600' },
    { label: '₹5,000', value: 5000, color: 'bg-indigo-600' },
    { label: '₹10,000', value: 10000, color: 'bg-yellow-600' },
    { label: '₹15,000', value: 15000, color: 'bg-pink-600' },
    { label: '₹25,000', value: 25000, color: 'bg-purple-900' }
  ];

  const playSpinSfx = (type: 'spin' | 'win_chime') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'spin') {
        // Fast succession of tick beeps
        for (let i = 0; i < 15; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(300 + (i * 45), ctx.currentTime + (i * 0.12));
          gain.gain.setValueAtTime(0.04, ctx.currentTime + (i * 0.12));
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.12) + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + (i * 0.12));
          osc.stop(ctx.currentTime + (i * 0.12) + 0.08);
        }
      } else if (type === 'win_chime') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.5);
        });
      }
    } catch {
      // Audio fallback
    }
  };

  const triggerSpin = () => {
    if (isSpinning) return;
    setWonPrize(null);
    setIsSpinning(true);
    playSpinSfx('spin');

    // Randomize winning angle segment
    const randomPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentDegrees = 360 / PRIZES.length;
    // Align angle so pointer at the top lands perfectly
    const bonusSpins = 5 * 360; // 5 full loops
    const finalAngle = bonusSpins + (randomPrizeIndex * segmentDegrees);

    setRotation(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const landedPrize = PRIZES[randomPrizeIndex];
      setWonPrize(landedPrize.value);
      playSpinSfx('win_chime');
    }, 2000);
  };

  const claimBonusFunds = () => {
    if (wonPrize !== null) {
      onRewardClaimed(wonPrize);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-[#0b0520] border-2 border-yellow-500/35 rounded-3xl p-6 relative max-w-md w-full shadow-2xl overflow-hidden purple-neon-glow flex flex-col items-center">
        
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative ambient rays */}
        <div className="absolute top-[-20%] inset-x-0 h-[40%] bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none"></div>

        {/* Header Title inside Wheel Dialog */}
        <div className="text-center space-y-1 mb-6">
          <div className="p-2.5 mx-auto w-11 h-11 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-2xl flex items-center justify-center">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-white mt-3 font-sans uppercase tracking-tight">Free Virtual Faucet Wheel</h3>
          <p className="text-xs text-purple-400">Tap spin below to credit complementary high roller tokens instantly!</p>
        </div>

        {/* The Graphic Segment Wheel Canvas */}
        <div className="relative w-64 h-64 flex items-center justify-center my-4">
          
          {/* Static Top Pointer Needle Arrow */}
          <div className="absolute top-[-10px] z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"></div>

          {/* Inner Circular Spinner Layout */}
          <div 
            className="w-full h-full rounded-full border-4 border-yellow-500/40 relative overflow-hidden transition-transform duration-[2000ms] cubic-bezier(0.2, 0.8, 0.3, 1) shadow-lg"
            style={{ 
              transform: `rotate(${-rotation}deg)`,
              backgroundImage: 'radial-gradient(circle at center, #0e0524 0%, #03010b 100%)' 
            }}
          >
            {/* Pie Segment slices overlay */}
            {PRIZES.map((prize, idx) => {
              const rotationDegree = idx * (360 / PRIZES.length);
              return (
                <div 
                  key={idx}
                  className="absolute inset-0 origin-center pointer-events-none flex items-start justify-center pt-3"
                  style={{ transform: `rotate(${rotationDegree}deg)` }}
                >
                  <div className="text-center">
                    <span className="font-mono font-black text-[11px] text-white tracking-tighter filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                      {prize.label}
                    </span>
                    {/* Tiny visual segment line */}
                    <div className="w-0.5 h-14 bg-yellow-500/20 mx-auto mt-2 origin-top"></div>
                  </div>
                </div>
              );
            })}
            
            {/* Center Golden Pin Anchor Cap */}
            <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center shadow-lg pointer-events-none z-10">
              <Coins className="w-5 h-5 text-[#03010b] animate-spin-slow" />
            </div>

          </div>
        </div>

        {/* Won Payout Presentation block */}
        {wonPrize !== null ? (
          <div className="text-center space-y-4 w-full mt-6 animate-bounce-slow">
            <div className="bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl p-4">
              <div className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase">SPIN OUTCOME DECLARED:</div>
              <strong className="text-2xl font-mono text-white tracking-widest font-black block mt-1">
                +₹{wonPrize.toLocaleString()} TOKENS
              </strong>
            </div>

            <button
              onClick={claimBonusFunds}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              CLAIM REWARD & MERGE WALLET
            </button>
          </div>
        ) : (
          <button
            onClick={triggerSpin}
            disabled={isSpinning}
            className="w-full mt-6 py-4 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 hover:from-yellow-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950 shrink-0" />
            {isSpinning ? 'REEDS SPINNING...' : 'TAP TO SPIN WHEEL'}
          </button>
        )}

        <p className="text-[9px] text-[#423a6f] text-center uppercase tracking-widest mt-4">
          Limit 1 free booster Spin claims per day
        </p>

      </div>
    </div>
  );
}
