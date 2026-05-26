import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  Coins, 
  RotateCcw, 
  HelpCircle, 
  Compass, 
  Tv, 
  Layers, 
  Shuffle, 
  ShieldCheck, 
  Navigation,
  Globe,
  DollarSign,
  User,
  Power,
  ChevronRight,
  Gift,
  Home as HomeIcon,
  Wallet as WalletIcon,
  Award,
  Settings as SettingsIcon,
  Search,
  Bell,
  ArrowLeft,
  Volume2,
  VolumeX,
  TrendingUp,
  ExternalLink,
  ChevronLeft,
  Crown
} from 'lucide-react';

import Slots from './components/Slots';
import Blackjack from './components/Blackjack';
import Roulette from './components/Roulette';
import Poker from './components/Poker';
import LiveDealer from './components/LiveDealer';
import WalletPanel from './components/WalletPanel';
import BonusWheelModal from './components/BonusWheelModal';
import { GameType, WalletState } from './types';

interface LeaderboardEntry {
  rank: number;
  name: string;
  winnings: number;
  game: string;
  tier: string;
}

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    tier: 'Bronze',
    totalHandsPlayed: 0,
  });

  const [username, setUsername] = useState('pkbusiness');
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'leaderboard' | 'settings'>('home');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [showBonusClaim, setShowBonusClaim] = useState(false);
  const [bonusWheelState, setBonusWheelState] = useState<'idle' | 'spinning' | 'claimed'>('idle');
  const [bonusAmount, setBonusAmount] = useState(0);

  // Sound and security toggles inside Settings
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulating live casino jackpot ticker
  const [megaJackpot, setMegaJackpot] = useState(4892910.42);

  useEffect(() => {
    const interval = setInterval(() => {
      setMegaJackpot((prev) => prev + (Math.random() * 25 + 2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateBalance = (amount: number) => {
    setWallet((prev) => {
      const nextBalance = Math.max(0, prev.balance + amount);
      let nextTier: WalletState['tier'] = 'Bronze';
      
      if (nextBalance > 25000) nextTier = 'VIP Diamond';
      else if (nextBalance > 12000) nextTier = 'Gold';
      else if (nextBalance > 5000) nextTier = 'Silver';

      return {
        ...prev,
        balance: nextBalance,
        tier: nextTier,
        totalHandsPlayed: prev.totalHandsPlayed + 1,
      };
    });
  };

  const handleBonusClaim = () => {
    if (bonusWheelState !== 'idle') return;
    setBonusWheelState('spinning');
    
    setTimeout(() => {
      const rewards = [2500, 5000, 10000, 15000, 25000];
      const selectedReward = rewards[Math.floor(Math.random() * rewards.length)];
      setBonusAmount(selectedReward);
      updateBalance(selectedReward);
      setBonusWheelState('claimed');
    }, 1500);
  };

  // High Roller mockup data for leaderboard
  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'SovereignGold', winnings: 849200, game: 'Neon Reels', tier: 'VIP Diamond' },
    { rank: 2, name: 'Vegas_Oracle', winnings: 591240, game: 'Crypto Wheel', tier: 'VIP Diamond' },
    { rank: 3, name: 'pkbusiness', winnings: 15750, game: 'Neon Jack 21', tier: 'Gold' },
    { rank: 4, name: 'LotusWhisper', winnings: 92800, game: 'Texas Hold\'em', tier: 'Silver' },
    { rank: 5, name: 'ApexStriker', winnings: 74200, game: 'Neon Reels', tier: 'Bronze' },
  ];

  // Elegant game templates for our premium carousel items
  const premiumGames = [
    {
      id: 'slots' as GameType,
      title: 'Neon Reels',
      subtitle: 'VOLATILITY: HIGH • RTP 98.4%',
      emoji: '🍒 💎 7️⃣',
      badge: 'POPULAR JACKPOT',
      playersCount: 1428,
      accentColor: 'from-[#ec4899] via-[#854d0e] to-purple-950',
      tagline: '3-reel multiplier madness with audio synthesis'
    },
    {
      id: 'blackjack' as GameType,
      title: 'Neon Jack 21',
      subtitle: 'VIP CLUB STANDARD • RTP 99.2%',
      emoji: '🃏 ♦ ♠',
      badge: 'STRATEGY CLASSIC',
      playersCount: 844,
      accentColor: 'from-[#3b82f6] via-[#1e1b4b] to-[#12072b]',
      tagline: 'Instant payouts, stands on soft 17s'
    },
    {
      id: 'roulette' as GameType,
      title: 'Crypto Wheel',
      subtitle: 'EUROPEAN LAYOUT • RTP 97.3%',
      emoji: '🔴 🎰 ⚫',
      badge: '35x MULTIPLIER',
      playersCount: 1957,
      accentColor: 'from-[#ca8a04] via-[#7c3aed] to-[#010816]',
      tagline: 'Swirling high resolution European single-zero layout'
    },
    {
      id: 'poker' as GameType,
      title: 'Jacks Video Poker',
      subtitle: 'DRAW FORMAT • RTP 99.5%',
      emoji: '👑 🎴 ✨',
      textRepresentation: 'Texas Hold\'em Vibe',
      badge: 'JACKS OR BETTER',
      playersCount: 611,
      accentColor: 'from-amber-400 via-purple-900 to-[#0c051a]',
      tagline: '5-card draw format trainer with video paytable'
    },
    {
      id: 'live' as GameType,
      title: 'AI Croupier Lounge',
      subtitle: 'REAL-TIME LLM HOST • RTP 98%',
      emoji: '🎙 Sophia 🔮',
      badge: 'LIVE INTERACTIVE',
      playersCount: 3491,
      accentColor: 'from-purple-600 via-indigo-950 to-slate-950',
      tagline: 'Ask Sophia for custom strategies, bankroll tricks, or chat!'
    }
  ];

  const filteredGames = premiumGames.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="premium-lounge-root" className="min-h-screen bg-[#060411] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Decorative Neon background orbs for Behance premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7c3aed]/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ca8a04]/10 blur-[180px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[130px] pointer-events-none" />

      {/* 1. iOS / Android Luxury Header Profile Dashboard */}
      <header className="sticky top-0 z-[40] glass-panel backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4">
        
        {/* User profile with luxurious gold laurels avatar decoration */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-300 via-purple-600 to-yellow-500 p-[2px] shadow-lg purple-neon-glow">
              <div className="w-full h-full rounded-full bg-[#0d0724] flex items-center justify-center overflow-hidden">
                <span className="text-sm font-black text-amber-300">VIP</span>
              </div>
            </div>
            {/* Croupier status indicator badge */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#09031c]"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-white leading-none tracking-wide">
                {username}
              </h2>
              <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                PRO HIGHROLLER
              </span>
            </div>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1">
              CLUB TIER: <span className="gold-text">{wallet.tier}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Mega Progressive Jackpot Meter */}
        <div className="hidden lg:flex flex-col items-center border-x border-slate-900/60 px-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">MEGA PROGRESSIVE</span>
          <span className="text-xl font-black text-yellow-400 font-mono tracking-tight glow-text animate-pulse">
            ₹{megaJackpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Coin ledger Balance with premium golds and purples */}
        <div className="flex items-center gap-2">
          {/* Quick Faucet Claim btn */}
          <button
            onClick={() => {
              setShowBonusClaim(true);
              setBonusWheelState('idle');
              setBonusAmount(0);
            }}
            className="p-2 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:bg-purple-800/40 transition-all cursor-pointer relative"
            title="Spin Daily Wheel Faucet"
          >
            <Gift className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
          </button>

          {/* Golden Balance */}
          <div className="bg-gradient-to-r from-amber-500/10 via-[#0d0724] to-yellow-600/5 border border-yellow-500/45 px-4 py-2 rounded-2xl relative shadow-xl gold-neon-glow flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-yellow-400 animate-bounce-slow" />
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none block">VIRTUAL CHIPS:</span>
              <span className="gold-text font-black font-mono text-base tracking-tighter block">
                ₹{wallet.balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* No KYC Safety banner with gold sparkles */}
      {showPrivacyNotice && (
        <div className="bg-gradient-to-r from-[#170e30] via-[#09031d] to-[#12072b] border-b border-yellow-500/20 px-6 py-2 flex items-center justify-between text-xs text-slate-300 relative">
          <span className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>
              <strong className="text-yellow-400">Pure Anon Sandbox:</strong> Fully private experience with zero validation papers or KYC prompts. Funds stored securely in state!
            </span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateBalance(10000)}
              className="text-[11px] font-black tracking-wider uppercase text-cyan-400 hover:text-cyan-300"
            >
              + Instant ₹10,000 Refill
            </button>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="text-slate-500 hover:text-slate-300 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Active gameplay dashboard wrapper or main lobby directory */}
      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 pb-32">
        
        {selectedGame ? (
          /* Active game play interactive container frame with gold and purple neon border wrapper */
          <div className="bg-[#09031c] rounded-3xl border border-yellow-500/30 p-4 md:p-6 shadow-2xl relative purple-neon-glow transition-all">
            
            {/* Interactive Header to go back to Lobby list carousel */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setSelectedGame(null)}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Exit to Premium Lobby
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">Active Game Console</span>
              </div>
            </div>

            {/* Render selected active game */}
            <div className="w-full">
              {selectedGame === 'slots' && <Slots balance={wallet.balance} onUpdateBalance={updateBalance} />}
              {selectedGame === 'blackjack' && <Blackjack balance={wallet.balance} onUpdateBalance={updateBalance} />}
              {selectedGame === 'roulette' && <Roulette balance={wallet.balance} onUpdateBalance={updateBalance} />}
              {selectedGame === 'poker' && <Poker balance={wallet.balance} onUpdateBalance={updateBalance} />}
              {selectedGame === 'live' && <LiveDealer />}
            </div>

          </div>
        ) : (
          /* Show Main Hub options filtered under the active chosen bottom-navigation tab */
          <>
            {activeTab === 'home' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* VIP Banner / Progressive Jackpot Card */}
                <div className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-yellow-905/10 to-indigo-950/40 border border-yellow-500/25 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left z-10 flex-grow">
                    <span className="bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-950 font-black text-[9px] tracking-widest px-2.5 py-1 rounded-full uppercase">
                      VIP Lounge Active
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-extrabold text-white mt-1">
                      Welcome back, <span className="gold-text">Sovereign Highroller</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                      Enjoy five of our custom-coded virtual tables. Spin, play, draw, or live chat with Sophia with no KYC limitations. Live RTP indexes and synthetic audio are preconfigured.
                    </p>
                  </div>

                  {/* Progressive meter */}
                  <div className="z-10 bg-[#0c051a] border border-yellow-500/20 px-5 py-3 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[200px] shadow-lg">
                    <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">LIVE POOL JACKPOT</span>
                    <span className="text-2xl font-black font-mono gold-text tracking-wide block mt-1 animate-pulse">
                      ₹{megaJackpot.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-[#475569] font-black uppercase mt-1">98.4% Guaranteed Payout</span>
                  </div>
                </div>

                {/* Search / filter games section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Vibrant VIP Game Chambers</h3>
                    <p className="text-xs text-purple-400">Select any vibrant, highly detailed thumbnail below to enter session</p>
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search game, layout, rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#110b28] border border-[#2b1f4d] rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-purple-400/40"
                    />
                  </div>
                </div>

                {/* Vibrant Game Carousel Card Grid in Gold & Deeep Purple */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <div 
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
                      className="group cursor-pointer rounded-3xl p-5 border border-yellow-500/15 bg-gradient-to-b from-[#120a28]/90 to-[#06030e] hover:border-yellow-500/50 hover:shadow-2xl hover:scale-[1.03] duration-300 transition-all relative flex flex-col justify-between overflow-hidden min-h-[250px] shadow-lg overflow-y-hidden"
                    >
                      {/* Inner gold glow overlay reflection */}
                      <div className="absolute top-0 inset-x-0 h-[60%] bg-gradient-to-b from-yellow-300/[0.04] to-transparent pointer-events-none"></div>
                      
                      {/* Ambient background accent color blob */}
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-tr ${game.accentColor} opacity-[0.25] blur-2xl group-hover:opacity-[0.4] transition-opacity`}></div>

                      <div>
                        {/* Game Status/Badge indicators at top of thumbnail */}
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black tracking-widest uppercase bg-purple-900/60 text-purple-300 border border-purple-500/20 px-2 py-1 rounded-md leading-none">
                            {game.badge}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1 bg-slate-950/60 px-1.5 py-0.5 rounded leading-none">
                            🟢 {game.playersCount.toLocaleString()} Live
                          </span>
                        </div>

                        {/* Title of Chambers */}
                        <h4 className="text-xl font-black text-white mt-4 font-sans tracking-wide block">
                          {game.title}
                        </h4>
                        <span className="text-[10px] text-yellow-500 font-bold tracking-widest uppercase font-mono block mt-1 leading-none">
                          {game.subtitle}
                        </span>

                        {/* Description tagline */}
                        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-sans line-clamp-2">
                          {game.tagline}
                        </p>
                      </div>

                      {/* Display Emojis & Launch arrow */}
                      <div className="flex items-end justify-between mt-6 pt-3 border-t border-purple-900/10 z-10">
                        {/* Thumbnail Iconography */}
                        <div className="text-3xl select-none filter drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-pulse">
                          {game.emoji}
                        </div>

                        {/* Play Action Trigger */}
                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-650 to-purple-600 group-hover:from-yellow-400 group-hover:to-amber-500 font-black text-[10px] tracking-widest text-white group-hover:text-slate-950 uppercase flex items-center gap-1 hover:shadow-lg transition-all border border-transparent group-hover:border-yellow-200">
                          LAUNCH TABLE <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Decorative layout border line */}
                      <div className="absolute left-0 bottom-0 h-1.5 w-full bg-gradient-to-r from-yellow-500 via-purple-600 to-yellow-500 opacity-60"></div>
                    </div>
                  ))}

                  {filteredGames.length === 0 && (
                    <div className="col-span-3 text-center py-20 border border-dashed border-slate-900 rounded-3xl">
                      <p className="text-slate-500 text-sm">No game found matching prompt. Use dynamic search parameters.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-purple-400 font-bold tracking-wider mt-2 underline"
                      >
                        Reset search filters
                      </button>
                    </div>
                  )}
                </div>

                {/* High quality live chat notification ticker mockup */}
                <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500"></span>
                    </span>
                    <div>
                      <p className="text-xs text-slate-350">
                        <strong className="text-yellow-400">Marcus_Croupier</strong> just dealt a Jackpot payout of <strong className="text-emerald-400">₹62,500</strong> to Player_Apex!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGame('live')}
                    className="text-[10px] text-purple-300 font-black tracking-widest uppercase hover:text-white"
                  >
                    Open AI Lounge & Chat
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Financial overview */}
                <div className="glass-panel rounded-3xl p-6 border-yellow-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-black text-yellow-500">Virtual ledger balance</span>
                    <h3 className="text-3xl font-mono font-black text-white mt-1">
                      ₹{wallet.balance.toLocaleString()}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">
                      Simulated play chip balance. Safe play sandbox regulations applied. Zero risk, instant reloads.
                    </p>
                  </div>
                </div>

                <WalletPanel 
                  balance={wallet.balance} 
                  onUpdateBalance={updateBalance} 
                />

              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="text-center md:text-left space-y-2">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <h3 className="text-xl font-bold text-white">High Roller Standings</h3>
                  </div>
                  <p className="text-xs text-slate-400">Live scoreboard of top simulated casino players from around the sandbox</p>
                </div>

                {/* Table data scoreboard */}
                <div className="bg-[#0c061d] border border-purple-500/20 rounded-3xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left text-xs text-slate-350">
                    <thead className="bg-[#120a2e] text-slate-400 font-extrabold border-b border-purple-900/40 text-[10px] uppercase">
                      <tr>
                        <th className="p-4">Rank Indicator</th>
                        <th className="p-4">Pseudonym</th>
                        <th className="p-4">Top Game Winner</th>
                        <th className="p-4">Club tier status</th>
                        <th className="p-4 text-right">Sum Total Payouts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10 font-mono">
                      {mockLeaderboard.map((player) => (
                        <tr 
                          key={player.rank}
                          className={`hover:bg-purple-900/10 transition-colors ${
                            player.name === username ? 'bg-yellow-500/5' : ''
                          }`}
                        >
                          <td className="p-4 font-bold">
                            {player.rank === 1 ? '👑 1st' : player.rank === 2 ? '🥈 2nd' : player.rank === 3 ? '🥉 3rd' : `${player.rank}th`}
                          </td>
                          <td className="p-4 font-sans font-bold text-white flex items-center gap-1.5">
                            {player.name}
                            {player.name === username && (
                              <span className="text-[8px] bg-yellow-500 text-slate-950 font-black px-1 rounded">YOU</span>
                            )}
                          </td>
                          <td className="p-4 font-sans text-slate-400">{player.game}</td>
                          <td className="p-4 text-purple-400 font-sans font-bold text-[11px]">{player.tier}</td>
                          <td className="p-4 text-right text-yellow-400 font-bold">₹{player.winnings.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-center">
                  <p className="text-slate-500 text-[11px]">Scoreboard updates automatically in real-time on key hands completed.</p>
                </div>

              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
                
                <div className="glass-panel rounded-3xl p-6 space-y-6">
                  
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-purple-400" /> Platform Configurations
                  </h3>

                  {/* Nickname setting */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">VIP Highroller Nickname</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. pk_player"
                      className="w-full bg-[#110b28] border border-[#2b1f4d] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-[10px] text-[#475569]">Changes happen instantly. Completely local state.</p>
                  </div>

                  {/* Audio enable switcher */}
                  <div className="flex items-center justify-between py-3 border-t border-purple-900/20">
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Browser Audio Synth FX</h4>
                      <p className="text-[10px] text-slate-500">Enable crisp synth beep bops and dealer chimes</p>
                    </div>

                    <button
                      onClick={() => setSoundsEnabled(!soundsEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                        soundsEnabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {soundsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      {soundsEnabled ? 'ENABLE SOUND' : 'MUTED'}
                    </button>
                  </div>

                  {/* Simulated Latency */}
                  <div className="flex items-center justify-between py-3 border-t border-purple-900/20">
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Network Ingress Latency</h4>
                      <p className="text-[10px] text-slate-500">Live system diagnostic parameters</p>
                    </div>

                    <span className="font-mono text-xs font-bold text-emerald-400">
                      12 ms (PROVABLY FAST)
                    </span>
                  </div>

                  {/* Reset storage button */}
                  <div className="pt-4 border-t border-purple-900/20">
                    <button
                      onClick={() => {
                        setWallet({
                          balance: 0,
                          tier: 'Bronze',
                          totalHandsPlayed: 0
                        });
                        alert("Simulated parameters re-initialized!");
                      }}
                      className="w-full py-2.5 bg-rose-950/40 text-rose-450 text-rose-400 border border-rose-900/20 hover:bg-rose-900/20 rounded-xl text-xs font-bold transition-all"
                    >
                      RESET WALLET STATE DATA TO DEFAULT
                    </button>
                  </div>

                </div>

                {/* Licensing consulting footnotes card */}
                <div className="bg-[#0e0a24]/40 border border-purple-900/25 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed text-center">
                  <p>
                    <strong className="text-yellow-500">Consulting PM Footnote:</strong> Social mobile gaming configurations bypass traditional gaming authority procedures. Perfect sandbox design layout for showcasing high resolution Behance aesthetics. 
                  </p>
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* 2. Sleek Bottom Navigation Bar with gold and purple accents */}
      <div id="premium-bottom-bar" className="fixed bottom-0 inset-x-0 z-[49] p-4 flex justify-center pointer-events-none md:p-6 lg:p-8">
        <nav className="pointer-events-auto w-full max-w-lg rounded-2xl border-2 border-yellow-500/30 bg-[#0c081e]/90 backdrop-blur-xl p-2.5 shadow-2xl purple-neon-glow flex justify-around items-center">
          
          <button
            onClick={() => {
              setActiveTab('home');
              setSelectedGame(null); // Return to list view
            }}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 transition-all rounded-xl ${
              activeTab === 'home' 
                ? 'text-yellow-400 bg-yellow-500/10' 
                : 'text-slate-450 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[9px] font-black tracking-widest uppercase">Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('wallet');
              setSelectedGame(null);
            }}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 transition-all rounded-xl ${
              activeTab === 'wallet' 
                ? 'text-yellow-400 bg-yellow-500/10' 
                : 'text-slate-450 text-slate-400 hover:text-slate-200'
            }`}
          >
            <WalletIcon className="w-5 h-5" />
            <span className="text-[9px] font-black tracking-widest uppercase">Wallet</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('leaderboard');
              setSelectedGame(null);
            }}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 transition-all rounded-xl ${
              activeTab === 'leaderboard' 
                ? 'text-yellow-400 bg-yellow-500/10' 
                : 'text-slate-450 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[9px] font-black tracking-widest uppercase">VIP Ranks</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setSelectedGame(null);
            }}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 transition-all rounded-xl ${
              activeTab === 'settings' 
                ? 'text-yellow-400 bg-yellow-500/10' 
                : 'text-slate-450 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[9px] font-black tracking-widest uppercase">Settings</span>
          </button>

        </nav>
      </div>

      <BonusWheelModal 
        isOpen={showBonusClaim} 
        onClose={() => setShowBonusClaim(false)} 
        onRewardClaimed={(amt) => updateBalance(amt)} 
      />

    </div>
  );
}
