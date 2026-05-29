import React, { useState, useEffect, useRef } from 'react';
import { Compass, Info, Coins, ShieldAlert, Award } from 'lucide-react';

interface LuckyRouletteProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface BetState {
  [key: string]: number; // e.g. '0': 500, 'red': 1000
}

export default function LuckyRoulette({ balance, onUpdateBalance }: LuckyRouletteProps) {
  const [bets, setBets] = useState<BetState>({});
  const [lastBets, setLastBets] = useState<BetState>({});
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentWin, setCurrentWin] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('Welcome to Lucky Roulette! Tap cells to place bets.');
  const [timer, setTimer] = useState<number>(30);
  const [history, setHistory] = useState<{ number: number; color: 'red' | 'black' | 'green' }[]>([
    { number: 18, color: 'red' },
    { number: 9, color: 'red' },
    { number: 22, color: 'black' },
    { number: 0, color: 'green' },
    { number: 29, color: 'black' },
    { number: 7, color: 'red' }
  ]);

  const [lastWinningNumber, setLastWinningNumber] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // European roulette layout
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getNumColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const playSynthSound = (type: 'chip' | 'ball' | 'win' | 'lose' | 'alert') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chip') {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'ball') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'win') {
        const chord = [261.63, 329.63, 392.00, 523.25];
        chord.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
          g.gain.setValueAtTime(0.03, ctx.currentTime + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
          o.start(ctx.currentTime + idx * 0.08);
          o.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Failed silently
    }
  };

  // Timer Countdown Auto-Spin
  useEffect(() => {
    if (isSpinning) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          triggerSpin();
          return 30;
        }
        if (prev <= 5) {
          playSynthSound('alert');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bets, isSpinning]);

  const placeBet = (key: string) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      setMessage('❌ Insufficient points balance to place this chip bet!');
      playSynthSound('lose');
      return;
    }

    onUpdateBalance(-selectedChip);
    playSynthSound('chip');

    setBets((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip,
    }));
    setMessage(`Bet ₹${selectedChip} added to [${key.toUpperCase()}]`);
  };

  const clearBoard = () => {
    if (isSpinning) return;
    const totalBetAmount = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (totalBetAmount > 0) {
      onUpdateBalance(totalBetAmount);
      setBets({});
      setMessage('All bets returned to your balance.');
      playSynthSound('chip');
    }
  };

  const doubleBoard = () => {
    if (isSpinning) return;
    const currentBetTotal = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (currentBetTotal === 0) {
      setMessage('⚠️ No bets placed to double!');
      return;
    }
    if (balance < currentBetTotal) {
      setMessage('❌ Insufficient balance to double your current bets!');
      playSynthSound('lose');
      return;
    }

    onUpdateBalance(-currentBetTotal);
    playSynthSound('chip');

    const doubled: BetState = {};
    Object.keys(bets).forEach((k) => {
      doubled[k] = bets[k] * 2;
    });
    setBets(doubled);
    setMessage(`All active bets successfully doubled! (Total: ₹${(currentBetTotal * 2).toLocaleString()})`);
  };

  const repeatBoard = () => {
    if (isSpinning) return;
    const lastBetTotal = Object.keys(lastBets).reduce((a, b) => a + (lastBets[b] || 0), 0);
    if (lastBetTotal === 0) {
      setMessage('No previous round bets found.');
      return;
    }
    if (balance < lastBetTotal) {
      setMessage('❌ Insufficient balance to repeat your last bets!');
      playSynthSound('lose');
      return;
    }

    // Clear and refund current bets
    const currentBetTotal = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    onUpdateBalance(currentBetTotal - lastBetTotal);

    setBets(lastBets);
    setMessage(`Repeated last bets of ₹${lastBetTotal.toLocaleString()} successfully!`);
    playSynthSound('chip');
  };

  const triggerSpin = () => {
    if (isSpinning) return;
    const totalBetPlaced = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);
    if (totalBetPlaced === 0) {
      setMessage('⚠️ Place at least one bet on the blue layout to Spin!');
      playSynthSound('alert');
      return;
    }

    setIsSpinning(true);
    setMessage('🎡 Virtual roulette wheel spinning... Ball launched!!');
    setCurrentWin(null);

    // Pick winning number 0-36
    const winningNum = Math.floor(Math.random() * 37);
    const winColor = getNumColor(winningNum);

    // Sound intervals
    let count = 0;
    const ballTimer = setInterval(() => {
      if (count < 22) {
        playSynthSound('ball');
        count++;
      } else {
        clearInterval(ballTimer);
      }
    }, 120);

    // Wheel rotation animation duration (3.5 seconds)
    setTimeout(() => {
      clearInterval(ballTimer);
      setIsSpinning(false);
      setTimer(30); // Reset timer
      setLastWinningNumber(winningNum);

      let winPayout = 0;
      let matchedBetsStr: string[] = [];

      // Calculate Direct Number hits (35 to 1, pays 36x)
      if (bets[winningNum.toString()]) {
        winPayout += bets[winningNum.toString()] * 36;
        matchedBetsStr.push(`Single Number [${winningNum}] (36x)`);
      }

      // Calculate Red / Black (payout 2x)
      if (winColor === 'red' && bets['red']) {
        winPayout += bets['red'] * 2;
        matchedBetsStr.push('Red Color (2x)');
      } else if (winColor === 'black' && bets['black']) {
        winPayout += bets['black'] * 2;
        matchedBetsStr.push('Black Color (2x)');
      }

      // Odds / Evens (payout 2x, excluding 0)
      if (winningNum !== 0) {
        const isOdd = winningNum % 2 !== 0;
        if (isOdd && bets['odd']) {
          winPayout += bets['odd'] * 2;
          matchedBetsStr.push('ODDS (2x)');
        } else if (!isOdd && bets['even']) {
          winPayout += bets['even'] * 2;
          matchedBetsStr.push('EVENS (2x)');
        }
      }

      // High / Low (payout 2x, 1-18 low, 19-36 high)
      if (winningNum >= 1 && winningNum <= 18 && bets['low']) {
        winPayout += bets['low'] * 2;
        matchedBetsStr.push('1-18 Low (2x)');
      } else if (winningNum >= 19 && winningNum <= 36 && bets['high']) {
        winPayout += bets['high'] * 2;
        matchedBetsStr.push('19-36 High (2x)');
      }

      // Dozens (payout 3x, 1-12, 13-24, 25-36)
      if (winningNum >= 1 && winningNum <= 12 && bets['dozen1']) {
        winPayout += bets['dozen1'] * 3;
        matchedBetsStr.push('1st Dozen (3x)');
      } else if (winningNum >= 13 && winningNum <= 24 && bets['dozen2']) {
        winPayout += bets['dozen2'] * 3;
        matchedBetsStr.push('2nd Dozen (3x)');
      } else if (winningNum >= 25 && winningNum <= 36 && bets['dozen3']) {
        winPayout += bets['dozen3'] * 3;
        matchedBetsStr.push('3rd Dozen (3x)');
      }

      // Set History
      setHistory((prev) => [{ number: winningNum, color: winColor }, ...prev.slice(0, 11)]);

      // Reset bets
      setLastBets(bets);
      setBets({});

      if (winPayout > 0) {
        onUpdateBalance(winPayout);
        setCurrentWin(winPayout);
        setMessage(`🎉 ROULETTE HIT! Number [ ${winningNum} ${winColor.toUpperCase()} ] landed! Wins: +₹${winPayout.toLocaleString()} via ${matchedBetsStr.join(' & ')}!`);
        playSynthSound('win');
      } else {
        setMessage(`Kroupier announces: [ ${winningNum} ${winColor.toUpperCase()} ]. Table bets cleared.`);
        playSynthSound('lose');
      }
    }, 3500);
  };

  const totalBetAmount = Object.keys(bets).reduce((a, b) => a + (bets[b] || 0), 0);

  // Group columns for our layout grid
  const col1 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  const col2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  const col3 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

  return (
    <div className="bg-[#05112e] border-2 border-[#12316e] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient from-indigo-900/10 to-[#05112e] pointer-events-none" />

      {/* Header element */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-3 border-b border-[#12316e]/40 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/10 text-cyan-400 border border-blue-500/20 rounded-xl">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-[#60a5fa] font-extrabold block">European Classic Felt</span>
              <h3 className="font-sans font-black text-white text-lg mt-0.5">Lucky Roulette 1-36</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#05020a]/80 border border-[#1b0d35] rounded-2xl px-4 py-1.5 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="font-mono text-xs text-slate-300 font-bold uppercase tracking-wider">Timer: {timer}s</span>
          </div>
          <div className="bg-[#05020a]/80 border border-[#1b0d35] rounded-2xl px-4 py-1 flex flex-col items-end">
            <span className="text-[8px] text-slate-500 font-black uppercase leading-none">VIRTUAL CHIPS</span>
            <span className="text-yellow-400 font-mono font-bold text-sm mt-0.5">₹{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Central panel columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Graphics Wheel Panel */}
        <div className="xl:col-span-4 flex flex-col items-center justify-start xl:border-r border-[#12316e]/40 xl:pr-6">
          <div className="text-center mb-1">
            <span className="text-[14px] font-black tracking-widest text-yellow-400/90 font-serif border-b border-yellow-500/20 pb-0.5 block">LUCKY GAMZ</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block mt-1">LUCKY 36 MINI TIMER</span>
          </div>

          {/* Graphical representation of roulette wheel */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 my-4 select-none flex items-center justify-center">
            {/* Round outer casing */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] to-[#111] rounded-full border-[10px] border-[#382a1a] shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_12px_24px_rgba(0,0,0,0.6)] flex items-center justify-center">
              
              {/* Spinning middle disk */}
              <div className={`w-full h-full rounded-full border-4 border-yellow-600 relative overflow-hidden ${isSpinning ? 'animate-spin' : ''}`}
                   style={{ animationDuration: '4s' }}
              >
                {/* Visual design wedges or circles */}
                <div className="absolute inset-1 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-[#02130e] to-[#043325] flex items-center justify-center">
                  <div className="text-[20px] font-black font-serif text-yellow-400 opacity-60">
                    {lastWinningNumber !== null ? lastWinningNumber : '🎡'}
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Winner Display in Center */}
            <div className="absolute w-20 h-20 rounded-full bg-slate-950/90 border-[3px] border-yellow-400 p-0.5 shadow-xl flex flex-col items-center justify-center text-center z-13">
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest">OUTCOME</span>
              <span className={`text-xl font-mono font-black block leading-none mt-1 ${
                lastWinningNumber !== null 
                  ? getNumColor(lastWinningNumber) === 'red' 
                    ? 'text-red-500' 
                    : getNumColor(lastWinningNumber) === 'black' 
                      ? 'text-yellow-400' 
                      : 'text-emerald-400'
                  : 'text-yellow-400'
              }`}>
                {lastWinningNumber !== null ? lastWinningNumber : '--'}
              </span>
            </div>
          </div>

          {/* Scrolling roulette statistics */}
          <div className="w-full">
            <span className="text-[9px] text-[#60a5fa] font-black uppercase tracking-widest block text-center mb-1.5">PAST WINNING HISTORY</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {history.map((hist, idx) => (
                <span
                  key={idx}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs text-white border ${
                    hist.color === 'red' 
                      ? 'bg-red-650 border-red-500 bg-red-600' 
                      : hist.color === 'black' 
                        ? 'bg-slate-950 border-slate-800' 
                        : 'bg-emerald-600 border-emerald-500'
                  } ${idx === 0 ? 'ring-2 ring-yellow-400 scale-110 shadow-lg' : 'opacity-55'}`}
                >
                  {hist.number}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Layout Felt Board Selection */}
        <div className="xl:col-span-8 flex flex-col justify-between space-y-4">
          
          {/* Main Felt Canvas Grid */}
          <div className="bg-[#05112e]/55 border border-[#163882] rounded-2xl p-4 overflow-x-auto">
            <div className="min-w-[500px]">
              
              {/* layout wrapping: [0] [Numbers columns 1-3] */}
              <div className="flex select-none">
                
                {/* Green Zero element */}
                <button
                  onClick={() => placeBet('0')}
                  disabled={isSpinning}
                  className={`w-14 bg-emerald-600 hover:bg-emerald-500 border-2 rounded-l-xl border-emerald-500 flex flex-col justify-center items-center transition-all cursor-pointer relative min-h-[140px]`}
                >
                  <span className="font-mono text-xl font-black text-white">0</span>
                  <span className="text-[8px] text-emerald-250 font-black tracking-widest block mt-1">36x</span>
                  {bets['0'] && (
                    <span className="absolute bg-yellow-450 bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-1 rounded-full border border-slate-950">
                      ₹{bets['0']}
                    </span>
                  )}
                </button>

                {/* Grid columns containing standard numbers */}
                <div className="flex-1 grid grid-cols-12 gap-1.5 p-1.5 bg-[#03091c]/80 rounded-r-xl border-y border-r border-[#163882]/40">
                  
                  {/* Column 1 (top row) */}
                  {col1.map((num) => {
                    const colorState = getNumColor(num);
                    const activeBet = bets[num.toString()] || 0;
                    return (
                      <button
                        key={num}
                        onClick={() => placeBet(num.toString())}
                        disabled={isSpinning}
                        className={`p-2 font-mono text-sm font-black text-white hover:scale-104 flex flex-col items-center justify-between rounded-lg border aspect-[3/4] min-w-[32px] transition-all cursor-pointer relative ${
                          colorState === 'red' ? 'bg-red-600 border-red-550' : 'bg-slate-950 border-slate-800'
                        } ${activeBet > 0 ? 'ring-2 ring-yellow-400 shadow-md' : 'hover:border-blue-450 hover:border-blue-500'}`}
                      >
                        <span>{num}</span>
                        {activeBet > 0 && (
                          <span className="absolute bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-0.5 rounded border border-slate-950 scale-90 bottom-0.5">
                            ₹{activeBet}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Column 2 (middle row) */}
                  {col2.map((num) => {
                    const colorState = getNumColor(num);
                    const activeBet = bets[num.toString()] || 0;
                    return (
                      <button
                        key={num}
                        onClick={() => placeBet(num.toString())}
                        disabled={isSpinning}
                        className={`p-2 font-mono text-sm font-black text-white hover:scale-104 flex flex-col items-center justify-between rounded-lg border aspect-[3/4] min-w-[32px] transition-all cursor-pointer relative ${
                          colorState === 'red' ? 'bg-red-650 bg-red-600 border-red-550' : 'bg-slate-950 border-slate-800'
                        } ${activeBet > 0 ? 'ring-2 ring-yellow-400 shadow-md' : 'hover:border-blue-450 hover:border-blue-500'}`}
                      >
                        <span>{num}</span>
                        {activeBet > 0 && (
                          <span className="absolute bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-0.5 rounded border border-slate-950 scale-90 bottom-0.5">
                            ₹{activeBet}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Column 3 (bottom row) */}
                  {col3.map((num) => {
                    const colorState = getNumColor(num);
                    const activeBet = bets[num.toString()] || 0;
                    return (
                      <button
                        key={num}
                        onClick={() => placeBet(num.toString())}
                        disabled={isSpinning}
                        className={`p-2 font-mono text-sm font-black text-white hover:scale-104 flex flex-col items-center justify-between rounded-lg border aspect-[3/4] min-w-[32px] transition-all cursor-pointer relative ${
                          colorState === 'red' ? 'bg-red-600 border-red-550' : 'bg-slate-950 border-slate-800'
                        } ${activeBet > 0 ? 'ring-2 ring-yellow-400 shadow-md' : 'hover:border-blue-450 hover:border-blue-500'}`}
                      >
                        <span>{num}</span>
                        {activeBet > 0 && (
                          <span className="absolute bg-yellow-400 text-slate-950 font-mono font-black text-[9px] px-0.5 rounded border border-slate-950 scale-90 bottom-0.5">
                            ₹{activeBet}
                          </span>
                        )}
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* Outside Dozens row matching layout */}
              <div className="flex gap-1.5 mt-2 ml-14">
                {['dozen1', 'dozen2', 'dozen3'].map((dozenKey, idx) => {
                  const dozenBet = bets[dozenKey] || 0;
                  const label = idx === 0 ? '1st 12' : idx === 1 ? '2nd 12' : '3rd 12';
                  return (
                    <button
                      key={dozenKey}
                      onClick={() => placeBet(dozenKey)}
                      disabled={isSpinning}
                      className={`flex-1 py-1.5 bg-[#0a1b42] hover:bg-[#12316e] border border-[#163882]/80 text-xs font-black uppercase text-slate-200 rounded-xl transition-all relative cursor-pointer min-h-[36px]`}
                    >
                      {label}
                      <span className="text-[8px] opacity-40 block">3x Payout</span>
                      {dozenBet > 0 && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-mono font-black text-[9.5px] px-1.5 py-0.5 rounded-full border border-slate-950">
                          ₹{dozenBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Outside Columns zones */}
              <div className="flex gap-1.5 mt-2 ml-14">
                {[
                  { key: 'low', label: '1 to 18' },
                  { key: 'even', label: 'EVEN' },
                  { key: 'red', label: '🔴 RED' },
                  { key: 'black', label: '⚫ BLACK' },
                  { key: 'odd', label: 'ODD' },
                  { key: 'high', label: '19 to 36' }
                ].map((item) => {
                  const itemBet = bets[item.key] || 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => placeBet(item.key)}
                      disabled={isSpinning}
                      className={`flex-1 py-1.5 bg-[#040e2b] hover:bg-[#0a205a] border border-[#163882]/70 text-[9.5px] font-black uppercase text-slate-300 rounded-lg transition-all relative cursor-pointer min-h-[38px]`}
                    >
                      {item.label}
                      <span className="text-[7.5px] opacity-45 block leading-none mt-0.5">2x Payout</span>
                      {itemBet > 0 && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-mono font-black text-[9.5px] px-1.5 py-0.5 rounded-full border border-slate-950">
                          ₹{itemBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Bottom section with Chips, controls, information, outcomes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Chips selector columns */}
            <div className="md:col-span-8 flex flex-wrap items-center gap-2 bg-[#05020a]/75 border border-[#1b0d35] p-3.5 rounded-2xl">
              {/* Chip buttons mimicking Image 2 chips style */}
              {[10, 50, 100, 500, 1000].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedChip(c);
                    playSynthSound('chip');
                  }}
                  disabled={isSpinning}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full border-4 font-mono font-black text-xs transition-all tracking-tighter cursor-pointer ${
                    selectedChip === c
                      ? 'scale-115 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] border-cyan-400 bg-slate-900'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-slate-700/50 flex flex-col items-center justify-center">
                    ₹{c}
                  </div>
                </button>
              ))}

              <div className="ml-auto flex flex-col items-end">
                <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">TOTAL LAYOUT BET</span>
                <span className="text-sm font-mono font-black text-cyan-400">₹{totalBetAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick felt actions */}
            <div className="md:col-span-4 grid grid-cols-3 gap-1.5">
              <button
                onClick={doubleBoard}
                disabled={isSpinning || totalBetAmount === 0}
                className="py-3 bg-[#0a183d] hover:bg-[#12285a] text-slate-350 border border-[#163882]/40 rounded-xl font-bold text-[8.5px] uppercase tracking-widest transition-all cursor-pointer"
              >
                DOUBLE
              </button>
              <button
                onClick={repeatBoard}
                disabled={isSpinning || Object.keys(lastBets).length === 0}
                className="py-3 bg-[#0a183d] hover:bg-[#12285a] text-slate-350 border border-[#163882]/40 rounded-xl font-bold text-[8.5px] uppercase tracking-widest transition-all cursor-pointer"
              >
                REPEAT
              </button>
              <button
                onClick={clearBoard}
                disabled={isSpinning || totalBetAmount === 0}
                className="py-3 bg-[#0a183d] hover:bg-[#12285a] text-rose-450 text-rose-400 border border-[#163882]/40 rounded-xl font-bold text-[8.5px] uppercase tracking-widest transition-all cursor-pointer"
              >
                CLEAR
              </button>
            </div>

          </div>

          {/* Outcome notification and launch spin section */}
          <div className="bg-[#04102d] border border-[#12316e] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-wider font-extrabold text-[#60a5fa]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>FOR AMUSEMENT SECURE SANDBOX ONLY</span>
              </div>
              <p className="text-[11px] text-slate-350 mt-1">{message}</p>
            </div>

            <button
              onClick={triggerSpin}
              disabled={isSpinning || totalBetAmount === 0}
              className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-yellow-500 from-amber-500 to-cyan-500 hover:from-yellow-405 hover:from-yellow-400 hover:to-cyan-400 text-[#05112e] disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 font-sans font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-cyan-500/10 shrink-0 cursor-pointer"
            >
              {isSpinning ? 'SPINNING...' : 'DEAL ROTATION'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
