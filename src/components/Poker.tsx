import { useState, useRef } from 'react';
import { Play, Sparkles, Coins, RefreshCw, Layers, Check } from 'lucide-react';
import { Card } from '../types';

interface PokerProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = [
  { val: '2', rank: 2 },
  { val: '3', rank: 3 },
  { val: '4', rank: 4 },
  { val: '5', rank: 5 },
  { val: '6', rank: 6 },
  { val: '7', rank: 7 },
  { val: '8', rank: 8 },
  { val: '9', rank: 9 },
  { val: '10', rank: 10 },
  { val: 'J', rank: 11 },
  { val: 'Q', rank: 12 },
  { val: 'K', rank: 13 },
  { val: 'A', rank: 14 },
];

export default function Poker({ balance, onUpdateBalance }: PokerProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [heldIndices, setHeldIndices] = useState<boolean[]>([false, false, false, false, false]);
  const [gameState, setGameState] = useState<'betting' | 'heldSelection' | 'resolved'>('betting');
  const [bet, setBet] = useState(100);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [gameMessage, setGameMessage] = useState<string>('Select bet and deal to draw initial 5-card poker hands.');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play browser sound synthesizer
  const playSound = (type: 'deal' | 'hold' | 'win' | 'lose') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'deal') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'hold') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'win') {
        const notes = [392.00, 523.25, 659.25, 783.99]; // Uplifting triad chords
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.006, ctx.currentTime + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio bypassed:', e);
    }
  };

  const createAndShuffleDeck = () => {
    const newDeck: Card[] = [];
    SUITS.forEach((suit) => {
      VALUES.forEach((v) => {
        newDeck.push({ suit, value: v.val, rank: v.rank });
      });
    });

    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const dealInitialHand = () => {
    if (balance < bet) {
      setGameMessage('Insufficient chips. Please reload bonus funds from daily spin.');
      return;
    }

    onUpdateBalance(-bet);
    const activeDeck = createAndShuffleDeck();
    const initialHand: Card[] = [];
    
    for (let i = 0; i < 5; i++) {
      initialHand.push(activeDeck.pop()!);
    }

    setHand(initialHand);
    setDeck(activeDeck);
    setHeldIndices([false, false, false, false, false]);
    setGameState('heldSelection');
    setEvaluation(null);
    setGameMessage('Select / Click on the cards you wish to HOLD, then tap DRAW to match replacements.');
    playSound('deal');
  };

  const drawSecondPhase = () => {
    if (gameState !== 'heldSelection') return;

    let currentDeck = [...deck];
    const finalHand = hand.map((card, idx) => {
      if (heldIndices[idx]) {
        return card; // Keep
      } else {
        return currentDeck.pop()!; // Replace
      }
    });

    setHand(finalHand);
    setDeck(currentDeck);
    setGameState('resolved');
    playSound('deal');

    // Run complete Video Poker evaluations payouts
    evaluateFinalHand(finalHand);
  };

  const toggleHold = (idx: number) => {
    if (gameState !== 'heldSelection') return;
    const nextHolds = [...heldIndices];
    nextHolds[idx] = !nextHolds[idx];
    setHeldIndices(nextHolds);
    playSound('hold');
  };

  const evaluateFinalHand = (cards: Card[]) => {
    // Collect ranks sorted
    const ranks = cards.map(c => c.rank).sort((a,b) => a-b);
    const suits = cards.map(c => c.suit);

    // Occurrences maps
    const rankCounts: { [key: number]: number } = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);

    const counts = Object.values(rankCounts).sort((a,b) => b-a);
    const uniqueRanks = Object.keys(rankCounts).length;

    // Check flush
    const isFlush = suits.every(s => s === suits[0]);

    // Check straight (including wheel straight A-2-3-4-5 rank: 14-2-3-4-5)
    let isStraight = false;
    if (uniqueRanks === 5) {
      if (ranks[4] - ranks[0] === 4) {
        isStraight = true;
      } else if (ranks[4] === 14 && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5) {
        isStraight = true; // Wheel Straight Ace low
      }
    }

    // Classify combinations
    let payoutMultiple = 0;
    let handName = 'No Pair';

    if (isFlush && isStraight) {
      if (ranks[4] === 14 && ranks[3] === 13) {
        handName = '🔮 ROYAL FLUSH';
        payoutMultiple = 250;
      } else {
        handName = '🚀 STRAIGHT FLUSH';
        payoutMultiple = 50;
      }
    } else if (counts[0] === 4) {
      handName = '💎 FOUR OF A KIND';
      payoutMultiple = 25;
    } else if (counts[0] === 3 && counts[1] === 2) {
      handName = '🔥 FULL HOUSE';
      payoutMultiple = 9;
    } else if (isFlush) {
      handName = '🌊 FLUSH';
      payoutMultiple = 6;
    } else if (isStraight) {
      handName = '🧭 STRAIGHT';
      payoutMultiple = 4;
    } else if (counts[0] === 3) {
      handName = '⚡ THREE OF A KIND';
      payoutMultiple = 3;
    } else if (counts[0] === 2 && counts[1] === 2) {
      handName = '✨ TWO PAIR';
      payoutMultiple = 2;
    } else if (counts[0] === 2) {
      // Jacks or Better check (ranks 11, 12, 13, 14 represent Jack, Queen, King, Ace)
      const pairRank = Number(Object.keys(rankCounts).find(k => rankCounts[Number(k)] === 2));
      if (pairRank >= 11) {
        handName = '🃏 JACKS OR BETTER';
        payoutMultiple = 1.25; // standard payout
      } else {
        handName = 'Pair (Under Jacks)';
        payoutMultiple = 0;
      }
    }

    const totalPayout = Math.round(bet * payoutMultiple);

    if (totalPayout > 0) {
      onUpdateBalance(totalPayout);
      setEvaluation(handName);
      setGameMessage(`Payout won! ${handName} pays x${payoutMultiple} (+₹${totalPayout.toLocaleString()})`);
      playSound('win');
    } else {
      setEvaluation('DEFEAT');
      setGameMessage(`Hand: ${handName}. Draw again for better ranks.`);
    }
  };

  const getSuitGlyph = (suit: string) => {
    switch (suit) {
      case 'hearts': return { char: '♥', color: 'text-rose-500' };
      case 'diamonds': return { char: '♦', color: 'text-amber-500' };
      case 'clubs': return { char: '♣', color: 'text-cyan-400' };
      case 'spades': return { char: '♠', color: 'text-indigo-400' };
      default: return { char: '?', color: 'text-slate-400' };
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Top statistical bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Video Jacks Draw Poker</h3>
            <p className="text-[11px] text-slate-400 font-medium">Standard 5-card draw format trainer</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold font-mono text-slate-355">BAL: ₹{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Poker cards layout viewport */}
      <div className="bg-gradient-to-b from-indigo-950/20 to-slate-950 border-2 border-slate-800 rounded-2xl p-4 flex flex-col gap-4 relative justify-center min-h-[220px]">
        {evaluation && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-wider ${
              evaluation === 'DEFEAT' ? 'bg-slate-900 text-slate-550 border border-slate-800' : 'bg-cyan-500 text-slate-950'
            }`}>
              {evaluation}
            </span>
          </div>
        )}

        {/* Five cards grid list */}
        <div className="grid grid-cols-5 gap-2.5 py-3">
          {gameState === 'betting' ? (
            <div className="col-span-5 text-center text-xs text-slate-500 py-10 italic">
              Wager bet below and tap Deal initial hand
            </div>
          ) : (
            hand.map((card, idx) => {
              const glyph = getSuitGlyph(card.suit);
              const isHeld = heldIndices[idx];

              return (
                <div 
                  key={idx} 
                  onClick={() => toggleHold(idx)}
                  className={`relative cursor-pointer transition-all aspect-[2/3] max-w-[70px] rounded-2xl p-2 flex flex-col justify-between border-2 bg-slate-900 ${
                    isHeld 
                      ? 'border-cyan-400 scale-102 ring-2 ring-cyan-400/20 -translate-y-2.5' 
                      : 'border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black font-sans leading-none text-white">{card.value}</span>
                  <span className={`text-2xl self-center leading-none ${glyph.color} select-none`}>{glyph.char}</span>
                  <span className="text-xs font-black font-sans leading-none self-end text-white">{card.value}</span>

                  {/* Absolute Card status tag */}
                  {isHeld && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-950 text-[8px] font-black tracking-widest px-1 py-0.5 rounded uppercase leading-none shadow-sm shadow-cyan-400/30">
                      HELD
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Live instructional guidelines banner */}
        <div className="text-center text-xs py-2 px-3 bg-slate-950 rounded-xl border border-slate-900 font-medium text-slate-300">
          {gameMessage}
        </div>
      </div>

      {/* Inputs controls and button groups */}
      <div className="flex flex-col gap-4">
        {gameState === 'betting' ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Wager multiplier:</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850 gap-2">
                {[50, 100, 200, 500].map((bValue) => (
                  <button 
                    key={bValue}
                    onClick={() => setBet(bValue)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${bet === bValue ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    ₹{bValue}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-deal-poker"
              onClick={dealInitialHand}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-400 hover:to-indigo-550 text-white font-black text-xs tracking-widest rounded-xl transition-all shadow-md mt-1"
            >
              DEAL INITIAL POKER HAND (₹{bet})
            </button>
          </>
        ) : (
          <button
            id="btn-draw-replacements"
            disabled={gameState !== 'heldSelection'}
            onClick={drawSecondPhase}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            DRAW REPLACEMENTS & EVALUATE
          </button>
        )}

        {gameState === 'resolved' && (
          <button
            onClick={() => {
              setGameState('betting');
              setGameMessage('Select bet and deal to draw initial 5-card poker hands.');
              setEvaluation(null);
            }}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 font-bold text-xs rounded-xl"
          >
            DEAL NEXT HAND
          </button>
        )}
      </div>

      {/* Paytable legends guidelines at bottom */}
      <div className="border-t border-slate-850 pt-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block mb-2">Jacks Video Paytable Multipliers</span>
        <div className="grid grid-cols-4 gap-2 text-[9px] text-slate-400">
          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900 flex justify-between">
            <span>Royal Flush</span> <span className="text-amber-400">250x</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900 flex justify-between">
            <span>Straight Flush</span> <span className="text-pink-400">50x</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900 flex justify-between">
            <span>Full House</span> <span className="text-cyan-400">9x</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-900 flex justify-between">
            <span>Jacks+</span> <span className="text-green-400">1.25x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
