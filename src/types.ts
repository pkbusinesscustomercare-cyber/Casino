export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  rank: number; // 2-14
}

export type GameType = 'slots' | 'blackjack' | 'roulette' | 'poker' | 'live';

export interface WalletState {
  balance: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'VIP Diamond';
  totalHandsPlayed: number;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  method: 'USDT (TRC20)' | 'USDC (ERC20)' | 'BTC Chain' | 'Instant Bank Pay';
  address: string;
  status: 'Auditing RNG Play' | 'In Progress' | 'Approved & Disbursed' | 'Blocked (Check KYC)';
  timestamp: string;
}

export interface AffiliateState {
  referralCode: string;
  totalReferrals: number;
  commissionBalance: number;
  totalEarnedCommission: number;
}

