import React from 'react';
import { Clock, DollarSign, Award, Check } from 'lucide-react';

interface OfflineEarningsModalProps {
  elapsedSeconds: number;
  offlineEarned: number;
  flops: number;
  onClaim: () => void;
  formatNumber: (num: number) => string;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  elapsedSeconds,
  offlineEarned,
  flops,
  onClaim,
  formatNumber,
}) => {
  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0) parts.push(`${hours}時間`);
    if (minutes > 0) parts.push(`${minutes}分`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

    return parts.join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-md bg-[#161b22] border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-6 text-gray-200 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mb-3">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">おかえりなさい！</h2>
          <p className="text-xs text-gray-400 mt-1">
            ゲーム終了中もCPUが自動で演算を継続していました
          </p>
        </div>

        {/* Stats card */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              不在経過時間:
            </span>
            <span className="text-gray-200 font-semibold">{formatDuration(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2">
            <span>当時の演算能力:</span>
            <span className="text-gray-200 font-semibold">{formatNumber(flops)} FLOP/s</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-gray-300">不在時獲得資金:</span>
            <span className="text-xl font-bold text-amber-400 flex items-center">
              <DollarSign className="w-5 h-5 -mr-0.5" />
              {formatNumber(offlineEarned)}
            </span>
          </div>
        </div>

        <button
          onClick={onClaim}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Check className="w-4 h-4" />
          報酬を受け取って再開
        </button>

        <p className="text-[11px] text-gray-500 text-center mt-3">
          セーブデータは安全に自動保存されています
        </p>
      </div>
    </div>
  );
};
