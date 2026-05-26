import React, { useState, useRef } from 'react';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  X,
  CreditCard,
  Banknote,
  Coins,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface WalletPanelProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface LedgerTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  destination: string;
  status: 'Pending' | 'Approved' | 'Disbursed' | 'Failed';
  timestamp: string;
}

export default function WalletPanel({ balance, onUpdateBalance }: WalletPanelProps) {
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [depositMethod, setDepositMethod] = useState<string>('UPI (GPay/PhonePe)');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2000');
  const [withdrawMethod, setWithdrawMethod] = useState<string>('Instant Bank Transfer');
  const [withdrawDestination, setWithdrawDestination] = useState<string>('user@okaxis');
  
  const [ledger, setLedger] = useState<LedgerTx[]>([
    {
      id: 'TXN-82910',
      type: 'deposit',
      amount: 10000,
      method: 'UPI (GPay/PhonePe)',
      destination: 'Self Deposit Refill',
      status: 'Approved',
      timestamp: '2026-05-25 10:14:05'
    },
    {
      id: 'TXN-48122',
      type: 'withdrawal',
      amount: 5000,
      method: 'Instant Bank Transfer',
      destination: 'HDFC Bank ending in *9821',
      status: 'Disbursed',
      timestamp: '2026-05-24 14:30:12'
    }
  ]);

  const [toast, setToast] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const playChime = (success: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const freqs = success ? [523.25, 659.25, 783.99] : [300, 220];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
      });
    } catch {
      // Audio support fallback
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('⚠️ Please enter a valid deposit amount.');
      playChime(false);
      return;
    }

    onUpdateBalance(amt);
    
    const newTxId = `TXN-${Math.floor(Math.random() * 90000) + 10000}`;
    const newTx: LedgerTx = {
      id: newTxId,
      type: 'deposit',
      amount: amt,
      method: depositMethod,
      destination: 'Self Deposit Refill',
      status: 'Approved',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setLedger(prev => [newTx, ...prev]);
    showToast(`✅ Successfully registered virtual deposit of ₹${amt.toLocaleString()}!`);
    playChime(true);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('⚠️ Please enter a valid withdrawal amount.');
      playChime(false);
      return;
    }

    if (amt > balance) {
      showToast('❌ Insufficient balance to process your withdrawal request!');
      playChime(false);
      return;
    }

    if (!withdrawDestination.trim()) {
      showToast('⚠️ Please enter a deposit destination account / UPI handle.');
      playChime(false);
      return;
    }

    onUpdateBalance(-amt);

    const newTxId = `TXN-${Math.floor(Math.random() * 90000) + 10000}`;
    const newTx: LedgerTx = {
      id: newTxId,
      type: 'withdrawal',
      amount: amt,
      method: withdrawMethod,
      destination: withdrawDestination,
      status: 'Pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setLedger(prev => [newTx, ...prev]);
    showToast(`⏳ Withdrawal of ₹${amt.toLocaleString()} submitted! Automated safe math checks running...`);
    playChime(true);

    // Staggered simulation updates to demonstrate real ledger verification
    setTimeout(() => {
      setLedger(prev => prev.map(t => {
        if (t.id === newTxId) {
          return { ...t, status: 'Approved' };
        }
        return t;
      }));
      showToast(`💸 Transaction ${newTxId} passed automated fair audit verification.`);
    }, 5000);

    setTimeout(() => {
      setLedger(prev => prev.map(t => {
        if (t.id === newTxId) {
          return { ...t, status: 'Disbursed' };
        }
        return t;
      }));
      showToast(`✅ Transaction ${newTxId} successfully Disbursed to your account!`);
      playChime(true);
    }, 12000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[99] max-w-sm w-full bg-[#110729]/95 border border-yellow-500/40 p-4 rounded-xl shadow-2xl animate-slide-in">
          <div className="flex items-start gap-2">
            <Coins className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">LEDGER SECURITY AGENT</h4>
              <p className="text-[11px] text-slate-300 mt-1">{toast}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Deposit and Withdrawal Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Deposit Box */}
        <div className="bg-[#0e0722] border-2 border-emerald-500/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[350px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-extrabold block">Virtual Ledger Cash-In</span>
                <h3 className="font-sans font-black text-white text-lg mt-0.5">Quick Virtual Deposit</h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Instantly replenish your play balance securely. All inputs are virtual funds designed for simulated high roller gameplay. No real payment required.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">INR Deposit Method</label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full bg-[#05020a] border border-[#231542] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  >
                    <option value="UPI (GPay/PhonePe)">UPI (GPay, PhonePe, Paytm)</option>
                    <option value="Net Banking (SBI/HDFC)">Net Banking (SBI, HDFC, ICICI)</option>
                    <option value="RuPay/Visa Card">RuPay / Visa Card Direct</option>
                    <option value="INR Crypto Exchange">INR Crypto Exchange Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Amount in ₹ (Rupees)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono font-bold">₹</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#05020a] border border-[#231542] rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {['1000', '5000', '15000', '50000'].map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => setDepositAmount(pack)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                      depositAmount === pack 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-[#05020a] text-slate-400 border-[#231542] hover:text-white'
                    }`}
                  >
                    + ₹{parseFloat(pack).toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer block mt-2"
              >
                PROCEED INSTANT DEPOSIT
              </button>
            </form>
          </div>
        </div>

        {/* Withdrawal Box */}
        <div className="bg-[#0e0722] border-2 border-yellow-500/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[350px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[8px] uppercase tracking-widest text-yellow-500 font-extrabold block">Secure Ledger Cash-Out</span>
                <h3 className="font-sans font-black text-white text-lg mt-0.5">Automated Withdrawal</h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Transfer simulated game profits back into your virtual account wallet. Submissions are audited instantly to prevent RNG integrity conflicts.
            </p>

            <form onSubmit={handleWithdrawal} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Withdraw Mode</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-[#05020a] border border-[#231542] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 font-sans"
                  >
                    <option value="Instant Bank Transfer">Instant Bank Direct Wire</option>
                    <option value="UPI Handle Transfer">UPI (paytm/phonepe/gpay)</option>
                    <option value="Crypto INR Stablecoin">Crypto INR Stablecoin Token</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Amount in ₹ (Rupees)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono font-bold">₹</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full bg-[#05020a] border border-[#231542] rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono font-bold"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">Destination UPI Address or Bank Account Info</label>
                <input
                  type="text"
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  placeholder="e.g. pkbusiness@okicici or IFSC Code & Savings Acc Number"
                  className="w-full bg-[#05020a] border border-[#231542] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 hover:from-yellow-450 hover:to-amber-550 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-yellow-500/10 cursor-pointer block"
              >
                DISBURSE COMPLEMENTARY WITHDRAWAL
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Audit History Log Ledger */}
      <div className="bg-[#0a041a] border border-purple-500/20 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-sans font-black text-white text-sm uppercase tracking-wider">Simulated Ledger Auditing History</h4>
            <p className="text-[10px] text-slate-500">Official proof-of-work state ledger for virtual deposits & withdrawals.</p>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400 text-[10px] uppercase font-bold font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Provably Secure
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[600px]">
            <thead className="bg-[#05020a]/80 text-[#5c5485] font-black border-b border-purple-950 text-[9px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Type</th>
                <th className="p-3">Method Option</th>
                <th className="p-3 font-mono">Destination Account Details</th>
                <th className="p-3">Rupees Transferred</th>
                <th className="p-3 text-right">Verification Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b0c36]/30">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-purple-950/10 transition-colors">
                  <td className="p-3 font-mono font-black text-[10px] text-slate-400">{tx.id}</td>
                  <td className="p-3 text-[10px] text-slate-500">{tx.timestamp}</td>
                  <td className="p-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      tx.type === 'deposit' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-3 text-purple-300 font-bold">{tx.method}</td>
                  <td className="p-3 font-mono text-slate-400 text-[10px]">{tx.destination}</td>
                  <td className={`p-3 font-mono font-black text-sm ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`text-[8.5px] font-black tracking-widest uppercase font-mono px-2 py-0.5 rounded ${
                      tx.status === 'Disbursed' || tx.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-550/25'
                        : tx.status === 'Pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
