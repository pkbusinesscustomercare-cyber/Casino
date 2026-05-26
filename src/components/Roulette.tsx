import { useState, useRef } from 'react';
import { Play, Sparkles, Coins, Compass, RotateCw } from 'lucide-react';

interface RouletteProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface BetOption {
  id: string;
  label: string;
  multiplier: number;
  type: 'color' | 'parity' | 'number';
  value: string; // "red", "black", "even", "odd", or number "0", "7", "17", "23" etc.
}

const ROULETTE_NUMBERS = [
  { num: 0, color: 'green' },
  { num: 32, color: 'red' },
  { num: 15, color: 'black' },
  { num: 19, color: 'red' },
  { num: 4, color: 'black' },
  { num: 21, color: 'red' },
  { num: 2, color: 'black' },
  { num: 25, color: 'red' },
  { num: 17, color: 'black' },
  { num: 34, color: 'red' },
  { num: 6, color: 'black' },
  { num: 27, color: 'red' },
  { num: 13, color: 'black' },
  { num: 36, color: 'red' },
  { num: 11, color: 'black' },
  { num: 30, color: 'red' },
  { num: 8, color: 'black' },
  { num: 23, color: 'red' },
  { num: 10, color: 'black' },
  { num: 5, color: 'black' },
  { num: 24, color: 'red' },
  { num: 16, color: 'black' },
  { num: 33, color: 'red' },
  { num: 1, color: 'black' },
  { num: 20, color: 'black' },
  { num: 14, color: 'red' },
  { num: 31, color: 'black' },
  { num: 9, color: 'red' },
  { num: 22, color: 'black' },
  { num: 18, color: 'red' },
  { num: 29, color: 'black' },
  { num: 7, color: 'red' },
  { num: 28, color: 'black' },
  { num: 12, color: 'red' },
  { num: 35, color: 'black' },
  { num: 3, color: 'red' },
  { num: 26, color: 'black' },
];

const BETS: BetOption[] = [
  { id: 'red', label: '🔴 RED', multiplier: 2, type: 'color', value: 'red' },
  { id: 'black', label: '⚫ BLACK', multiplier: 2, type: 'color', value: 'black' },
  { id: 'even', label: 'EVEN', multiplier: 2, type: 'parity', value: 'even' },
  { id: 'odd', label: 'ODD', multiplier: 2, type: 'parity', value: 'odd' },
  { id: 'num0', label: '0 GREEN', multiplier: 35, type: 'number', value: '0' },
  { id: 'num7', label: '7 RED', multiplier: 35, type: 'number', value: '7' },
  { id: 'num17', label: '17 BLACK', multiplier: 35, type: 'number', value: '17' },
  { id: 'num23', label: '23 RED', multiplier: 35, type: 'number', value: '23' },
  { id: 'num36', label: '36 RED', multiplier: 35, type: 'number', value: '36' },
];

export default function Roulette({ balance, onUpdateBalance }: RouletteProps) {
  const [selectedBet, setSelectedBet] = useState<BetOption>(BETS[0]);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{ num: number; color: string } | null>(null);
  const [displayAngle, setDisplayAngle] = useState(0);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [historicSpins, setHistoricSpins] = useState<{ num: number; color: string }[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play browser synthetized sound effects
  const playSound = (type: 'spin' | 'clink' | 'win' | 'lose') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'spin') {
        // Long dynamic decelerating swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.8);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      } else if (type === 'clink') {
        // Roulette marble bounce
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'win') {
        // High upbeat melody
        const notes = [293.66, 349.23, 440.00, 587.33]; // D minor arpeggio
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
        });
      }
    } catch (e) {
      console.warn('Audio synthesis bypassed:', e);
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (balance < betAmount) {
      setOutcomeMessage('Inadequate chips. Reload chips before wagering!');
      return;
    }

    onUpdateBalance(-betAmount);
    setIsSpinning(true);
    setOutcomeMessage(null);
    setSpinResult(null);
    playSound('spin');

    // Spin full random cycles
    const extraRotations = 5 + Math.floor(Math.random() * 5); // 5 to 9 spins
    const targetSectorIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const targetSector = ROULETTE_NUMBERS[targetSectorIdx];
    
    // Calculate final rotation degrees: 360 / ROULETTE_NUMBERS.length approx 9.73 deg per sector
    const sectorAngle = 360 / ROULETTE_NUMBERS.length;
    const finalAngle = extraRotations * 360 + (targetSectorIdx * sectorAngle);
    
    setDisplayAngle(finalAngle);

    // Marble bounce ticks
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 12) {
        playSound('clink');
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 150);

    // Stop wheel rotation
    setTimeout(() => {
      setIsSpinning(false);
      setSpinResult(targetSector);
      playSound('clink');

      // Check results
      let isWinner = false;
      const numVal = targetSector.num;
      const colVal = targetSector.color;

      if (selectedBet.type === 'color') {
        isWinner = (selectedBet.value === colVal);
      } else if (selectedBet.type === 'parity') {
        if (numVal === 0) {
          isWinner = false; // Zero is neither even nor odd in standard roulette betting
        } else {
          const isEven = numVal % 2 === 0;
          isWinner = selectedBet.value === 'even' ? isEven : !isEven;
        }
      } else if (selectedBet.type === 'number') {
        isWinner = (parseInt(selectedBet.value, 10) === numVal);
      }

      const totalWin = isWinner ? Math.round(betAmount * selectedBet.multiplier) : 0;

      if (isWinner) {
        onUpdateBalance(totalWin);
        setOutcomeMessage(`🎉 WINNER! Lander landed on ${colVal.toUpperCase()} ${numVal}. Paid x${selectedBet.multiplier} (₹${totalWin})`);
        playSound('win');
      } else {
        setOutcomeMessage(`Lander landed on ${colVal.toUpperCase()} ${numVal}. Bets cleared.`);
      }

      setHistoricSpins((prev) => [targetSector, ...prev].slice(0, 7));
    }, 2000);
  };

  return (
    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <RotateCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Crypto Wheel Roulette</h3>
            <p className="text-[11px] text-slate-400 font-medium">Single-zero European wheel standard layout</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold font-mono text-slate-355">BAL: ₹{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Wheel visual container */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 justify-center overflow-hidden min-h-[220px]">
        
        {/* Dynamic spinning wheel representation */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          {/* Wheel visual */}
          <div 
            id="roulette-wheel-spin"
            className="w-full h-full rounded-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border-4 border-amber-600/60 shadow-2xl relative flex items-center justify-center transition-transform"
            style={{
              transform: `rotate(-${displayAngle}deg)`,
              transition: isSpinning ? 'transform 2s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
            }}
          >
            {/* Center crown spindle */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500/80 to-yellow-600 border border-yellow-400 z-10 shadow flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950" />
            </div>
            {/* Spindle segments sectors design */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/50"></div>
            {/* Rotating numbers labels mockup to look high fidelity */}
            <div className="absolute inset-1 border border-indigo-400/10 rounded-full"></div>
            <div className="absolute top-2.5 text-[9px] font-black text-emerald-400 font-mono">0</div>
            <div className="absolute bottom-2.5 text-[9px] font-black text-rose-500 font-mono">32</div>
            <div className="absolute left-2.5 text-[9px] font-black text-slate-300 font-mono">15</div>
            <div className="absolute right-2.5 text-[9px] font-black text-rose-500 font-mono">19</div>
          </div>

          {/* Absolute static pointer pointer */}
          <div className="absolute top-0 z-20 flex flex-col items-center">
            <span className="w-4 h-4 bg-amber-500 clip-triangle shadow-md" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></span>
            <div className="w-1.5 h-1.5 bg-white rounded-full -mt-1.5 shadow" />
          </div>
        </div>

        {/* Dynamic center board results */}
        <div className="flex-1 flex flex-col gap-3.5 w-full">
          {spinResult ? (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Winning Number</span>
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-mono text-sm shadow-md ${
                  spinResult.color === 'green' ? 'bg-emerald-500 text-slate-950' : spinResult.color === 'red' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
                }`}>
                  {spinResult.num}
                </span>
                <span className="text-xs uppercase font-extrabold font-mono text-slate-200">
                  {spinResult.color} Sector
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-900 border-dashed p-4 rounded-xl text-center text-xs text-slate-500 italic flex items-center justify-center h-[76px]">
              {isSpinning ? 'Wheel rotating... tracking landing slot' : 'Place bet & tap Spin wheel'}
            </div>
          )}

          {/* Outcome prompt summary */}
          {outcomeMessage && (
            <div className={`text-xs text-center font-bold py-2 px-3 rounded-lg border leading-relaxed ${
              outcomeMessage.includes('WINNER') ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' : 'bg-slate-950 text-slate-400 border-slate-850'
            }`}>
              {outcomeMessage}
            </div>
          )}
        </div>
      </div>

      {/* Bets Selection and Board Grid */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">1. Select Betting Options</span>
        <div className="grid grid-cols-3 gap-1.5">
          {BETS.map((betOpt) => (
            <button
              key={betOpt.id}
              onClick={() => setSelectedBet(betOpt)}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                selectedBet.id === betOpt.id 
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                  : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <span>{betOpt.label}</span>
              <span className={`text-[9px] mt-1 font-mono uppercase ${selectedBet.id === betOpt.id ? 'text-slate-800' : 'text-slate-500'}`}>
                pays {betOpt.multiplier}:1
              </span>
            </button>
          ))}
        </div>

        {/* Select chip stacks wagers */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">2. Select Chip size:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850 gap-2">
            {[10, 50, 100, 500].map((bValue) => (
              <button 
                key={bValue}
                onClick={() => setBetAmount(bValue)}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${betAmount === bValue ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ₹{bValue}
              </button>
            ))}
          </div>
        </div>

        {/* Spin trigger action buttons */}
        <button
          id="btn-spin-roulette"
          disabled={isSpinning || balance < betAmount}
          onClick={spinWheel}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 disabled:text-slate-500 font-black text-xs tracking-widest rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
        >
          <Compass className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'SPINNING WHEEL...' : `SPIN WHEEL (₹${betAmount})`}
        </button>

        {/* Historic spins tracking list */}
        {historicSpins.length > 0 && (
          <div className="mt-3 border-t border-slate-850 pt-3">
            <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block mb-2 text-slate-400">Previous Spins History</span>
            <div className="flex gap-2 p-1 overflow-x-auto">
              {historicSpins.map((hist, i) => (
                <span 
                  key={i} 
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shadow-sm ${
                    hist.color === 'green' ? 'bg-emerald-500 text-slate-950' : hist.color === 'red' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {hist.num}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
