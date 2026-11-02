import React from 'react';
import {
  Hourglass,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  Architecture,
  getArchitecture,
  getTimeSlipCost,
  getTimeSlipMultiplier,
} from '../types.ts';

interface TimeSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlipCount: number;
  currentMoney: number;
  onConfirmTimeSlip: () => void;
  formatNumber: (num: number) => string;
}

export const TimeSlipModal: React.FC<TimeSlipModalProps> = ({
  isOpen,
  onClose,
  timeSlipCount,
  currentMoney,
  onConfirmTimeSlip,
  formatNumber,
}) => {
  if (!isOpen) return null;

  const currentCost = getTimeSlipCost(timeSlipCount);
  const nextNextCost = getTimeSlipCost(timeSlipCount + 1);
  const canAfford = currentMoney >= currentCost;

  const currentTimelineNum = timeSlipCount + 1;
  const nextTimelineNum = timeSlipCount + 2;

  const currentMultiplier = getTimeSlipMultiplier(timeSlipCount);
  const nextMultiplier = getTimeSlipMultiplier(timeSlipCount + 1);

  // The architecture currently capped, and the one that will be newly unlocked
  const currentMaxLevel = 6 + timeSlipCount;
  const currentMaxArch: Architecture = getArchitecture(currentMaxLevel);
  const newlyUnlockedArch: Architecture = getArchitecture(currentMaxLevel + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-lg bg-[#141a24] border-2 border-purple-500/80 rounded-2xl shadow-2xl p-6 text-gray-200 relative max-h-[92vh] overflow-y-auto">
        {/* Cosmic Header Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-900/60 to-pink-900/40 border border-purple-400/40 text-purple-300 mb-3 shadow-lg shadow-purple-950">
            <Hourglass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wider flex items-center justify-center gap-2">
            <span>タイムスリップ（時空跳躍）</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
              第 {currentTimelineNum} 世代世界線
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
            <span className="px-2.5 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-500/40 font-bold">
              第 {nextTimelineNum} 世代世界線へ跳躍
            </span>
          </div>
        </div>

        {/* Required Cost Banner */}
        <div
          className={`p-4 rounded-xl border mb-5 transition-all ${
            canAfford
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg'
              : 'bg-rose-950/30 border-rose-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>タイムスリップ必要資金 (今回):</span>
            <span className="text-[11px] text-gray-400">
              {canAfford ? '✅ 条件達成' : '⚠️ 資金不足'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">
              ${formatNumber(currentCost)}
            </span>
            <span className="text-xs text-gray-400">
              所持: <strong className="text-white">${formatNumber(currentMoney)}</strong>
            </span>
          </div>
          {!canAfford && (
            <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              あと ${formatNumber(currentCost - currentMoney)} 必要です
            </p>
          )}
        </div>

        {/* What Happens Section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            タイムスリップ実行時の変化
          </h3>

          {/* Reset Warning */}
          <div className="bg-[#0b0f16] border border-rose-900/40 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>リセットされるデータ (世界線の再構築)</span>
            </div>
            <ul className="text-gray-400 space-y-1 pl-4 list-disc text-[11px]">
              <li>
                <strong className="text-rose-300">所持資金が全額リセット ($0)</strong> になります。
              </li>
              <li>
                クロック・コア・キャッシュ・現行アーキテクチャは初期状態へ戻ります。
              </li>
            </ul>
          </div>

          {/* Permanent Transcendence Rewards */}
          <div className="bg-[#0b0f16] border border-emerald-800/40 rounded-xl p-3.5 text-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>永久獲得される超越効果（引き継ぎ）</span>
            </div>

            <div className="space-y-2">
              {/* Higher Evolution Unlock */}
              <div className="flex items-start gap-2 bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/30">
                <TrendingUp className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-[11px]">
                  <span className="text-purple-300 font-bold block">
                    🔓 更なる高次元進化の解放！
                  </span>
                  <span className="text-gray-300">
                    現在の限界「{currentMaxArch.name}」を超え、新たに
                    <strong className="text-pink-300">「{newlyUnlockedArch.name} ({newlyUnlockedArch.node})」</strong>
                    へのプロセス微細化が可能になります！
                  </span>
                </div>
              </div>

              {/* Permanent Multiplier */}
              <div className="flex items-start gap-2 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30">
                <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-[11px]">
                  <span className="text-amber-300 font-bold block">
                    ⚡ 恒久全演算能力 10倍ブースト！
                  </span>
                  <span className="text-gray-300">
                    倍率が <span className="line-through text-gray-500">x{currentMultiplier.toLocaleString()}</span> →{' '}
                    <strong className="text-amber-400 text-xs">x{nextMultiplier.toLocaleString()}倍</strong> に強化。
                    リセット後も初期から超高速で資金が溜まります！
                  </span>
                </div>
              </div>

              {/* Escalating Future Cost Notice */}
              <div className="flex items-start gap-2 bg-blue-950/20 p-2.5 rounded-lg border border-blue-500/20 text-[11px] text-gray-400">
                <ShieldAlert className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-blue-300 font-semibold block">次回跳躍費用の高騰:</span>
                  次回のタイムスリップ必要資金は{' '}
                  <strong className="text-gray-200">${formatNumber(nextNextCost)}</strong> に上昇します。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            キャンセル
          </button>

          <button
            onClick={() => {
              if (canAfford) {
                onConfirmTimeSlip();
                onClose();
              }
            }}
            disabled={!canAfford}
            className="flex-2 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canAfford
                ? 'linear-gradient(135deg, #9333ea 0%, #db2777 50%, #ea580c 100%)'
                : '#374151',
              boxShadow: canAfford ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none',
              color: 'white',
            }}
          >
            <Hourglass className="w-4 h-4" />
            {canAfford ? '時空を超越してタイムスリップ！' : `資金不足 ($${formatNumber(currentCost)}必要)`}
          </button>
        </div>
      </div>
    </div>
  );
};
