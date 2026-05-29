import React, { useState, useEffect, useRef } from 'react';
import { Coins, HelpCircle, RotateCcw, Flame, ShieldAlert } from 'lucide-react';

interface LuckyWheelProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface BetState {
  [key: string]: number; // e.g. '0': 100, 'odd': 500
}

export default function LuckyWheel({ balance, onUpdateBalance }: LuckyWheelProps) {
  const [bets, setBets] = useState<BetState>({});
  const [lastBets, setLastBets] = useState<BetState>({});
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [outcomeMessage, setOutcomeMessage] = useState<string>('Select chip value and put your bets on 0-9 or Odd/Even!');
  const [timerSeconds, setTimerSeconds] = useState<number>(25);
  const [history, setHistory] = useState<number[]>([5, 1, 2, 2, 1, 5, 4, 7, 8, 3]);
  const [latestWin, setLatestWin] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Wheel configuration
  const digits = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // Order counter-clockwise on the wheel to map correct sector
  const digitColors: { [key: number]: string } = {
    0: 'bg-emerald-600',
    1: 'bg-cyan-500',
    2: 'bg-emerald-500',
    3: 'bg-pink-500',
    4: 'bg-yellow-500',
    5: 'bg-rose-600',
    6: 'bg-sky-500',
    7: 'bg-blue-500',
    8: 'bg-indigo-500',
    9: 'bg-purple-500',
  };

  const getBorderColor = (num: number) => {
    switch(num) {
      case 0: return 'border-emerald-500';
      case 1: return 'border-cyan-400';
      case 2: return 'border-emerald-400';
      case 3: return 'border-pink-400';
      case 4: return 'border-yellow-400';
      case 5: return 'border-rose-500';
      case 6: return 'border-sky-400';
      case 7: return 'border-blue-400';
      case 8: return 'border-indigo-400';
      case 9: return 'border-purple-400';
      default: return 'border-slate-700';
    }
  };

  const playSynthesizedSound = (type: 'chip' | 'tick' | 'win' | 'lose' | 'alert') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chip') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } else if (type === 'win') {
        // Multi-tone fanfare
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, index) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, ctx.currentTime + index * 0.1);
          g.gain.setValueAtTime(0.03, ctx.currentTime + index * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.3);
          o.start(ctx.currentTime + index * 0.1);
          o.stop(ctx.currentTime + index * 0.1 + 0.3);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      // Audio fallback silent
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (isSpinning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Trigger automatic spin
          triggerSpin();
          return 25;
        }
        if (prev <= 4) {
          playSynthesizedSound('alert');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bets, isSpinning]);

  const placeBet = (target: string) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      setOutcomeMessage('❌ Insufficient balance to place this chip bet!');
      playSynthesizedSound('lose');
      return;
    }

    onUpdateBalance(-selectedChip);
    playSynthesizedSound('chip');

    setBets((prev) => ({
      ...prev,
      [target]: (prev[target] || 0) + selectedChip,
    }));
    setOutcomeMessage(`Placed ₹${selectedChip} on zone [${target.toUpperCase()}]`);
  };

  const clearBets = () => {
    if (isSpinning) return;
    const totalBetAmount = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (totalBetAmount > 0) {
      onUpdateBalance(totalBetAmount);
      setBets({});
      setOutcomeMessage('All bets returned to your balance.');
      playSynthesizedSound('tick');
    }
  };

  const doubleBets = () => {
    if (isSpinning) return;
    const currentBetTotal = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (currentBetTotal === 0) {
      setOutcomeMessage('⚠️ No bets placed to double!');
      return;
    }
    if (balance < currentBetTotal) {
      setOutcomeMessage('❌ Insufficient balance to double your current bets!');
      playSynthesizedSound('lose');
      return;
    }

    onUpdateBalance(-currentBetTotal);
    playSynthesizedSound('chip');

    const doubled: BetState = {};
    Object.keys(bets).forEach((k) => {
      doubled[k] = bets[k] * 2;
    });
    setBets(doubled);
    setOutcomeMessage(`All active bets successfully doubled! (Total Bet: ₹${(currentBetTotal * 2).toLocaleString()})`);
  };

  const repeatBets = () => {
    if (isSpinning) return;
    const lastBetTotal = Object.keys(lastBets).reduce((a, b) => a + (lastBets[b] || 0), 0);
    if (lastBetTotal === 0) {
      setOutcomeMessage('⚠️ No previous hands recorded as memory.');
      return;
    }
    if (balance < lastBetTotal) {
      setOutcomeMessage('❌ Insufficient balance to repeat your last bets!');
      playSynthesizedSound('lose');
      return;
    }

    // Clear current bets first and refund them
    const currentBetTotal = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    onUpdateBalance(currentBetTotal - lastBetTotal);

    setBets(lastBets);
    setOutcomeMessage(`Repeated last bets of ₹${lastBetTotal.toLocaleString()} successfully!`);
    playSynthesizedSound('chip');
  };

  const triggerSpin = () => {
    if (isSpinning) return;
    const totalPlaced = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (totalPlaced === 0) {
      setOutcomeMessage('⚠️ Place at least one bet to spin the Lucky Wheel!');
      playSynthesizedSound('alert');
      return;
    }

    setIsSpinning(true);
    setOutcomeMessage('🎰 Spinning the wheel... good luck!');
    setLatestWin(null);

    // Pick a winning number (0-9)
    const winningNumber = Math.floor(Math.random() * 10);
    const winIndex = digits.indexOf(winningNumber);

    // Each segment has 36 degrees of width
    // Wheel rotated by: full spins + correct offset for top pointer (which is at index 0 on wheel, representing 0)
    // 360 deg * random full spins + degree offset
    const fullSpins = 5;
    const degOffset = winIndex * 36;
    const targetRotation = wheelRotation + (fullSpins * 360) + degOffset - (wheelRotation % 360);

    setWheelRotation(targetRotation);

    // Play synthesized tick-tick sounds during the spin simulation
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 18) {
        playSynthesizedSound('tick');
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setTimerSeconds(25); // Reset Countdown timer

      let winningsValue = 0;
      let matchedBets: string[] = [];

      // Calculate Direct Hits (0-9 pays 9x)
      if (bets[winningNumber.toString()]) {
        const betAmt = bets[winningNumber.toString()];
        winningsValue += betAmt * 9;
        matchedBets.push(`Number ${winningNumber} (9x)`);
      }

      // Calculate Odd / Even payouts (odds/evens pays 2x)
      const isOddNum = winningNumber % 2 !== 0;
      if (isOddNum && bets['odd']) {
        const betAmt = bets['odd'];
        winningsValue += betAmt * 2;
        matchedBets.push('ODDS (2x)');
      } else if (!isOddNum && winningNumber !== 0 && bets['even']) {
        const betAmt = bets['even'];
        winningsValue += betAmt * 2;
        matchedBets.push('EVENS (2x)');
      }

      // Save history
      setHistory(prev => [winningNumber, ...prev.slice(0, 9)]);

      // Save last bets memory and reset board
      setLastBets(bets);
      setBets({});

      if (winningsValue > 0) {
        onUpdateBalance(winningsValue);
        setLatestWin(winningsValue);
        setOutcomeMessage(`🎉 WINNER! Lander landed on Segment [ ${winningNumber} ]. Paid ${matchedBets.join(' & ')}! Win: +₹${winningsValue.toLocaleString()}`);
        playSynthesizedSound('win');
      } else {
        setOutcomeMessage(`Lander landed on [ ${winningNumber} ]. Better luck next spin!`);
        playSynthesizedSound('lose');
      }
    }, 3200);
  };

  const totalBetPlaced = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);

  return (
    <div className="bg-[#0b031b] border-2 border-purple-500/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with live panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-purple-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-xl animate-pulse">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-[#a855f7] font-extrabold block">Single-Digit Arcade</span>
              <h3 className="font-sans font-black text-white text-lg mt-0.5">Lucky 10-Digit Spinner</h3>
            </div>
          </div>
        </div>

        {/* Live digital timer & statistics feed */}
        <div className="flex items-center gap-3">
          <div className="bg-[#05020a] border border-[#231542] rounded-2xl px-4 py-2 flex items-center gap-3">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block leading-none">NEXT SPIN</span>
            <span className={`font-mono text-xl font-bold tracking-tight ${timerSeconds <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
              00:{timerSeconds.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="bg-[#05020a] border border-[#231542] rounded-2xl px-4 py-2 flex flex-col items-end">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block leading-none">PLAY CHIPS</span>
            <span className="text-emerald-400 font-mono font-bold text-sm mt-0.5">₹{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Spinning Wheel Graphics */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
          
          {/* Top pointer marker triangle */}
          <div className="absolute top-1 z-35 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-yellow-400 -mt-1 shadow-md shadow-yellow-500/50" />
          </div>

          {/* Core Wheel Outer Frame */}
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-yellow-500/80 shadow-[0_0_40px_rgba(168,85,247,0.25)] relative overflow-hidden flex items-center justify-center bg-[#06030c] scale-[0.98] transition-transform duration-[3200ms] ease-out select-none"
               style={{ transform: `rotate(-${wheelRotation}deg)` }}
          >
            {/* Ten beautiful sector background pieces */}
            {digits.map((num, i) => {
              const rotation = i * 36;
              return (
                <div key={num} 
                     className="absolute top-0 left-0 w-full h-full origin-center select-none"
                     style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {/* Styled wedge connector to divide our sectors */}
                  <div className={`absolute top-0 left-1/2 -ml-px w-0.5 h-1/2 bg-[#090315] opacity-35 z-20`} />
                  
                  {/* Colored indicator box positioned nicely in center of wedge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-start z-10 select-none">
                    <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black font-mono text-base text-white shadow-lg border-2 ${getBorderColor(num)} ${digitColors[num]}`}>
                      {num}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Luxurious glowing center hub wheel core */}
            <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-slate-950 p-1 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0d071a] flex flex-col items-center justify-center text-center">
                <span className="text-[7px] text-slate-400 block font-black uppercase tracking-widest leading-none">LUCKY</span>
                <span className="text-yellow-400 font-bold font-mono text-sm leading-none mt-1">10</span>
              </div>
            </div>
          </div>

          {/* History tracker strip underneath */}
          <div className="mt-6 w-full max-w-sm">
            <span className="text-[9px] text-[#5c5485] font-black uppercase tracking-wider block mb-2 text-center">LATEST WHEEL OUTCOMES</span>
            <div className="flex gap-1.5 justify-center items-center overflow-x-auto py-1">
              {history.map((histNum, idx) => (
                <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white font-mono shadow-sm border ${getBorderColor(histNum)} ${digitColors[histNum]} ${idx === 0 ? 'scale-115 ring-2 ring-yellow-400 outline-none' : 'opacity-60'}`}>
                  {histNum}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Betting Layout Grid */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-[#05020a]/75 border border-[#1b0d35] rounded-2xl p-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-3">SELECT SINGLE-DIGIT TARGET (PAYOUT 9X)</span>
            
            {/* Grid 2x5 Numbers */}
            <div className="grid grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                const activeBet = bets[num.toString()] || 0;
                return (
                  <button
                    key={num}
                    onClick={() => placeBet(num.toString())}
                    disabled={isSpinning}
                    className={`relative rounded-xl border-2 p-3 flex flex-col items-center justify-between transition-all aspect-square min-h-[64px] hover:scale-103 cursor-pointer ${
                      activeBet > 0 
                        ? 'bg-slate-900 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.25)]' 
                        : 'bg-[#080313]/90 border-[#1f103b]/40 hover:border-[#4c2a8f]'
                    }`}
                  >
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black font-mono text-sm text-white ${digitColors[num]}`}>
                      {num}
                    </span>

                    {activeBet > 0 ? (
                      <span className="absolute -bottom-1.5 bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full border border-slate-950 flex items-center gap-0.5">
                        ₹{activeBet >= 1000 ? `${(activeBet/1000).toFixed(0)}k` : activeBet}
                      </span>
                    ) : (
                      <span className="text-[8px] text-slate-500 font-bold mt-1">9x</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category payouts (ODDS vs EVENS) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => placeBet('odd')}
              disabled={isSpinning}
              className={`py-3.5 px-4 rounded-2xl border-2 font-sans font-black text-xs text-center transition-all relative cursor-pointer ${
                bets['odd'] 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300' 
                  : 'bg-[#05020a]/90 border-[#1b0d35] text-slate-400 hover:border-slate-800'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider block">ODDS (1, 3, 5, 7, 9)</div>
              <div className="text-[9px] text-[#a855f7] font-bold mt-0.5">PAYOUT 2.0x MULTIPLIER</div>
              {bets['odd'] && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-full border border-slate-950">
                  ₹{bets['odd']}
                </span>
              )}
            </button>

            <button
              onClick={() => placeBet('even')}
              disabled={isSpinning}
              className={`py-3.5 px-4 rounded-2xl border-2 font-sans font-black text-xs text-center transition-all relative cursor-pointer ${
                bets['even'] 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-300' 
                  : 'bg-[#05020a]/90 border-[#1b0d35] text-slate-400 hover:border-slate-800'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider block">EVENS (2, 4, 6, 8)</div>
              <div className="text-[9px] text-[#a855f7] font-bold mt-0.5">PAYOUT 2.0x MULTIPLIER</div>
              {bets['even'] && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-full border border-slate-950">
                  ₹{bets['even']}
                </span>
              )}
            </button>
          </div>

          {/* Chip selectors section */}
          <div className="bg-[#05020a]/80 border border-[#1b0d35] rounded-2xl p-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-2.5">CHIP SELECTION VALUE (RUPEES ₹)</span>
            <div className="flex gap-2 flex-wrap items-center">
              {[10, 50, 100, 500, 1000].map((chipVal) => (
                <button
                  key={chipVal}
                  onClick={() => {
                    setSelectedChip(chipVal);
                    playSynthesizedSound('chip');
                  }}
                  disabled={isSpinning}
                  className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border-4 font-mono font-black text-xs transition-all tracking-tighter cursor-pointer ${
                    selectedChip === chipVal
                      ? 'scale-115 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.45)] border-yellow-500 bg-[#0c051d]'
                      : 'border-slate-800 bg-[#0d0a1b]/60 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-slate-700/50 flex items-center justify-center">
                    ₹{chipVal}
                  </div>
                </button>
              ))}

              <div className="ml-auto text-right">
                <span className="text-[8px] text-slate-500 block font-black uppercase tracking-wider">ACTIVE BET TOTAL</span>
                <span className="text-sm font-mono font-black text-amber-400 block mt-0.5">₹{totalBetPlaced.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={doubleBets}
              disabled={isSpinning || totalBetPlaced === 0}
              className="py-2.5 px-3 bg-[#11092b] hover:bg-[#23154e]/50 text-slate-200 border border-purple-900/30 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              x2 Double
            </button>
            <button
              onClick={repeatBets}
              disabled={isSpinning || Object.keys(lastBets).length === 0}
              className="py-2.5 px-3 bg-[#11092b] hover:bg-[#23154e]/50 text-slate-200 border border-purple-900/30 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↺ Repeat Last
            </button>
            <button
              onClick={clearBets}
              disabled={isSpinning || totalBetPlaced === 0}
              className="py-2.5 px-3 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 border border-rose-950/35 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel Bets
            </button>
          </div>

          {/* Play/Audit Status output banner */}
          <div className="bg-[#0e0722] border border-purple-950 rounded-2xl p-4 shadow-inner">
            <div className={`text-xs text-center font-bold font-sans tracking-wide leading-relaxed p-1 rounded-lg ${
              latestWin !== null 
                ? 'text-yellow-400 animate-pulse bg-yellow-950/20 border border-yellow-500/25' 
                : 'text-slate-300'
            }`}>
              {outcomeMessage}
            </div>

            <button
              onClick={triggerSpin}
              disabled={isSpinning || totalBetPlaced === 0}
              className="w-full py-3.5 bg-gradient-to-r from-yellow-405 from-yellow-500 to-indigo-650 hover:from-yellow-400 hover:to-indigo-550 text-slate-950 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 font-black text-xs tracking-widest uppercase rounded-2xl transition-all shadow-xl font-sans cursor-pointer block mt-3"
            >
              {isSpinning ? 'SPINNING WHEEL LANDER...' : 'DEAL INSTANT WHEEL SPIN'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
