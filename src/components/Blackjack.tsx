import { useState, useRef } from 'react';
import { Play, Sparkles, Coins, HelpCircle, Check, Compass, RefreshCw } from 'lucide-react';
import { Card } from '../types';

interface BlackjackProps {
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

export default function Blackjack({ balance, onUpdateBalance }: BlackjackProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'resolved'>('betting');
  const [bet, setBet] = useState(100);
  const [gameMessage, setGameMessage] = useState<string>('Place your bet and receive your initial hand.');
  const [statusBadge, setStatusBadge] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Synth via Web Audio API
  const playSound = (type: 'deal' | 'win' | 'bust' | 'draw') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'deal') {
        // Crisp rustle card tick sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        // High win trumpets
        const notes = [329.63, 392.00, 523.25, 659.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      } else if (type === 'bust') {
        // Sad falling sliding tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio synthesis bypassed:', e);
    }
  };

  const createAndShuffleDeck = () => {
    const newDeck: Card[] = [];
    SUITS.forEach((suit) => {
      VALUES.forEach((v) => {
        newDeck.push({
          suit,
          value: v.val,
          rank: v.rank,
        });
      });
    });

    // Fisher-Yates shuffle algorithm
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  };

  // Score Calculator (Dynamic Ace ranking check)
  const calculateHandScore = (hand: Card[]) => {
    let score = 0;
    let aceCount = 0;

    hand.forEach((card) => {
      if (card.value === 'A') {
        score += 11;
        aceCount++;
      } else if (['K', 'Q', 'J', '10'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value, 10);
      }
    });

    while (score > 21 && aceCount > 0) {
      score -= 10;
      aceCount--;
    }

    return score;
  };

  // Launch initial deal flow
  const startGame = () => {
    if (balance < bet) {
      setGameMessage('Insufficient chips. Please claim daily reload chips below.');
      return;
    }

    onUpdateBalance(-bet);
    const activeDeck = createAndShuffleDeck();

    const pCard1 = activeDeck.pop()!;
    const dCard1 = activeDeck.pop()!;
    const pCard2 = activeDeck.pop()!;
    const dCard2 = activeDeck.pop()!;

    const initialPlayer = [pCard1, pCard2];
    const initialDealer = [dCard1, dCard2];

    setPlayerHand(initialPlayer);
    setDealerHand(initialDealer);
    setDeck(activeDeck);
    
    const pScore = calculateHandScore(initialPlayer);
    
    playSound('deal');

    if (pScore === 21) {
      // Natural Blackjack!
      setGameState('resolved');
      const payout = Math.round(bet * 2.5);
      onUpdateBalance(payout);
      setGameMessage(`🃏 Natural Blackjack! Paid 3:2 (₹${payout})`);
      setStatusBadge('BLACKJACK');
      playSound('win');
    } else {
      setGameState('playing');
      setGameMessage('Choose to Hit, Stand, or Double Down your bet.');
      setStatusBadge(null);
    }
  };

  const hit = () => {
    if (gameState !== 'playing') return;

    const drawnCard = deck.pop()!;
    const updatedHand = [...playerHand, drawnCard];
    setPlayerHand(updatedHand);
    setDeck([...deck]);
    
    playSound('deal');

    const score = calculateHandScore(updatedHand);
    if (score > 21) {
      setGameState('resolved');
      setGameMessage(`💥 BUSTED! Your total score is ${score}. Dealer takes chips.`);
      setStatusBadge('BUST');
      playSound('bust');
    } else {
      setGameMessage(`Hits card: ${drawnCard.value}. Hand score is ${score}.`);
    }
  };

  const doubleDown = () => {
    if (gameState !== 'playing') return;
    if (balance < bet) {
      setGameMessage("Inadequate chips to double. Request bonus reload.");
      return;
    }

    // Process double bet deduction
    onUpdateBalance(-bet);
    const totalBet = bet * 2;

    const drawnCard = deck.pop()!;
    const updatedHand = [...playerHand, drawnCard];
    setPlayerHand(updatedHand);
    setDeck([...deck]);

    playSound('deal');
    const score = calculateHandScore(updatedHand);

    if (score > 21) {
      setGameState('resolved');
      setGameMessage(`💥 Double Down Bust! Score is ${score}. Dealer wins chips.`);
      setStatusBadge('DOUBLE BUST');
      playSound('bust');
    } else {
      // Draw standard single card, then force dealer resolution
      resolveDealerTurn(updatedHand, totalBet);
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    resolveDealerTurn(playerHand, bet);
  };

  // Run dealer computer AI
  const resolveDealerTurn = (currentPlayerHand: Card[], activeBet: number) => {
    setGameState('dealerTurn');
    let currentDeck = [...deck];
    let currentDealerHand = [...dealerHand];
    let dScore = calculateHandScore(currentDealerHand);

    const runDealerCycle = setInterval(() => {
      if (dScore < 17) {
        // Hit
        const nextCard = currentDeck.pop()!;
        currentDealerHand.push(nextCard);
        dScore = calculateHandScore(currentDealerHand);
        setDealerHand([...currentDealerHand]);
        playSound('deal');
      } else {
        clearInterval(runDealerCycle);
        concludeGame(currentPlayerHand, currentDealerHand, activeBet);
      }
    }, 600);
  };

  const concludeGame = (pHand: Card[], dHand: Card[], finalBet: number) => {
    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);
    setGameState('resolved');

    if (dScore > 21) {
      const payout = finalBet * 2;
      onUpdateBalance(payout);
      setGameMessage(`🎉 Dealer BUSTED with ${dScore}! You win ₹${payout.toLocaleString()}`);
      setStatusBadge('YOU WIN');
      playSound('win');
    } else if (pScore > dScore) {
      const payout = finalBet * 2;
      onUpdateBalance(payout);
      setGameMessage(`🎉 You win with score ${pScore} vs ${dScore}! Paid ₹${payout.toLocaleString()}`);
      setStatusBadge('YOU WIN');
      playSound('win');
    } else if (pScore < dScore) {
      setGameMessage(`Dealer wins with score ${dScore} vs ${pScore}. Better luck next deal.`);
      setStatusBadge('DEALER WINS');
      playSound('bust');
    } else {
      onUpdateBalance(finalBet); // return bet
      setGameMessage(`🤝 Push/Tie hand! Both have score ${pScore}. Your bet has been returned.`);
      setStatusBadge('PUSH');
    }
  };

  // Suit graphic glyph mapping
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
    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6 w-full">
      
      {/* Top statistics section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Neon Jack 21</h3>
            <p className="text-[11px] text-slate-400">Standard dealer tables. Stands on Soft 17s</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold font-mono text-slate-355">BAL: ₹{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Main casino table viewport and cards */}
      <div className="bg-gradient-to-b from-emerald-950/40 to-slate-950 border-2 border-slate-800 rounded-2xl p-5 flex flex-col gap-4 relative justify-center overflow-hidden min-h-[300px]">
        {/* Absolute status badges */}
        {statusBadge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider">
              {statusBadge}
            </span>
          </div>
        )}

        {/* Dealer Hand */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">Croupier Dealer Hand:</span>
            {gameState !== 'betting' && (
              <span className="text-xs font-mono font-bold bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-slate-400">
                Score: {gameState === 'playing' ? '?' : calculateHandScore(dealerHand)}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 p-1.5 overflow-x-auto min-h-[95px]">
            {gameState === 'betting' ? (
              <div className="text-xs text-slate-500 italic py-4">Dealt on game start...</div>
            ) : (
              dealerHand.map((card, idx) => {
                const glyph = getSuitGlyph(card.suit);
                // Hide second card if playing
                const hideCard = gameState === 'playing' && idx === 1;

                if (hideCard) {
                  return (
                    <div key={idx} className="w-14 h-20 bg-gradient-to-br from-indigo-900 to-indigo-800 border-2 border-indigo-500/40 rounded-xl flex items-center justify-center shadow-lg relative shrink-0">
                      <div className="absolute inset-1.5 border border-dashed border-indigo-400/20 rounded-lg flex items-center justify-center">
                        <span className="font-serif text-white/20 select-none">♠</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="w-14 h-20 bg-slate-900 border-2 border-slate-850 rounded-xl p-1.5 flex flex-col justify-between shadow hover:border-slate-700 transition-all shrink-0 hover:-translate-y-1">
                    <span className="text-xs font-black font-sans leading-none text-white">{card.value}</span>
                    <span className={`text-xl self-center ${glyph.color} select-none`}>{glyph.char}</span>
                    <span className="text-xs font-black font-sans leading-none self-end text-white">{card.value}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Divider table line */}
        <div className="border-t border-dashed border-slate-800 my-1"></div>

        {/* Player hand */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400">Your Hand:</span>
            {gameState !== 'betting' && (
              <span className="text-xs font-mono font-bold bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-cyan-400">
                Score: {calculateHandScore(playerHand)}
              </span>
            )}
          </div>

          <div className="flex gap-2 p-1.5 overflow-x-auto min-h-[95px]">
            {gameState === 'betting' ? (
              <div className="text-xs text-slate-500 italic py-4">Place bet below to receive your cards...</div>
            ) : (
              playerHand.map((card, idx) => {
                const glyph = getSuitGlyph(card.suit);
                return (
                  <div key={idx} className="w-14 h-20 bg-slate-900 border-2 border-slate-850 rounded-xl p-1.5 flex flex-col justify-between shadow hover:border-slate-700 transition-all shrink-0 hover:-translate-y-1">
                    <span className="text-xs font-black font-sans leading-none text-white">{card.value}</span>
                    <span className={`text-xl self-center ${glyph.color} select-none`}>{glyph.char}</span>
                    <span className="text-xs font-black font-sans leading-none self-end text-white">{card.value}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* State notification/guider banner */}
        <div className="text-center text-xs py-2 px-3 bg-slate-950 rounded-xl border border-slate-900 font-medium text-slate-300">
          {gameMessage}
        </div>
      </div>

      {/* Inputs and actions interface area */}
      <div className="flex flex-col gap-4">
        {gameState === 'betting' ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Configure bet:</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850 gap-2">
                {[50, 100, 200, 500].map((bValue) => (
                  <button 
                    key={bValue}
                    onClick={() => setBet(bValue)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${bet === bValue ? 'bg-indigo-605 bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    ₹{bValue}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-deal-blackjack"
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-widest rounded-xl transition-all shadow-md complex-hover"
            >
              DEAL HAND (₹{bet})
            </button>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-blackjack-hit"
              disabled={gameState !== 'playing'}
              onClick={hit}
              className="py-3 font-bold text-xs bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-slate-800 disabled:opacity-30 rounded-xl transition-all flex flex-col items-center gap-1"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" /> HIT / DRAW
            </button>
            <button
              id="btn-blackjack-double"
              disabled={gameState !== 'playing' || balance < bet}
              onClick={doubleDown}
              className="py-3 font-black text-xs bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900 border border-indigo-900/30 disabled:opacity-30 rounded-xl transition-all flex flex-col items-center gap-1"
            >
              <Sparkles className="w-4 h-4" /> DOUBLE X2
            </button>
            <button
              id="btn-blackjack-stand"
              disabled={gameState !== 'playing'}
              onClick={stand}
              className="py-3 font-black text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-30 rounded-xl transition-all flex flex-col items-center gap-1"
            >
              <Check className="w-4 h-4" /> STAND
            </button>
          </div>
        )}

        {gameState === 'resolved' && (
          <button
            onClick={() => {
              setGameState('betting');
              setGameMessage('Place your bet and receive your initial hand.');
              setStatusBadge(null);
            }}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-bold text-xs rounded-xl"
          >
            PLAY ANOTHER ROUND
          </button>
        )}
      </div>
    </div>
  );
}
