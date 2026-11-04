import React from 'react';
import {
  BarChart3,
  X,
  Trophy,
  Clock,
  MousePointerClick,
  Zap,
  Layers,
  DollarSign,
  Hourglass,
  Sparkles,
} from 'lucide-react';
import { GameStats, Architecture, getTimeSlipMultiplier, formatCurrency } from '../types.ts';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  currentArch: Architecture;
  timeSlipCount: number;
  formatNumber: (num: number) => string;
  unlockedAchievements: string[];
}

interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_click', title: '最初のクロック', desc: '手動で1回演算サイクルを実行した', icon: '⚡' },
  { id: 'mhz_barrier', title: 'メガヘルツ突破', desc: 'クロック周波数が 1.00 MHz 以上に到達', icon: '🚀' },
  { id: 'ghz_barrier', title: 'ギガヘルツ到達', desc: 'クロック周波数が 1.00 GHz 以上に到達', icon: '💥' },
  { id: 'octa_core', title: '並列処理の覇者', desc: 'CPUコア数が 8 コア以上に到達', icon: '⚙️' },
  { id: 'pentium_era', title: 'パーソナルPC黎明期', desc: '32-bit Pentium世代へ進化', icon: '💾' },
  { id: 'euv_era', title: 'ナノメートル微細化', desc: 'Extreme EUV Processor (3nm) へ進化', icon: '🔬' },
  { id: 'quantum_era', title: '量子超越性', desc: '超伝導・量子プロセッサに到達', icon: '🌌' },
  { id: 'timeslip_1', title: '時空跳躍者', desc: '初めてタイムスリップを実行し次世代世界線へ突入', icon: '⏳' },
  { id: 'photonic_era', title: '光速光子演算', desc: 'タイムスリップ後、光子ニューロモルフィックへ進化', icon: '💡' },
  { id: 'timeslip_3', title: '多元宇宙の観測者', desc: 'タイムスリップを累計3回以上実行', icon: '🌀' },
  { id: 'timeslip_30', title: '全自動演算の境地', desc: '第30世代世界線に到達し最安自動アップグレードを解放', icon: '🤖' },
  { id: 'googol_tier', title: 'グーゴル領域突入', desc: '所持資金が10^100を超えて新通貨単位「G$」を解放', icon: '🪐' },
  { id: 'millionaire', title: '演算長者', desc: '累計獲得資金が $1,000,000 を突破', icon: '👑' },
  { id: 'billionaire', title: 'ギガ富豪', desc: '累計獲得資金が $1,000,000,000 を突破', icon: '💎' },
];

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  currentArch,
  timeSlipCount,
  formatNumber,
  unlockedAchievements,
}) => {
  if (!isOpen) return null;

  const playTimeSeconds = Math.max(0, Math.floor((Date.now() - stats.gameStartTime) / 1000));
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}時間 ${m}分 ${s}秒`;
  };

  const timeSlipMult = getTimeSlipMultiplier(timeSlipCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl p-6 text-gray-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">統計情報 & 達成記録</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Slip / Timeline Banner */}
        <div className="bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-purple-950/40 border border-purple-500/40 rounded-xl p-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-900/50 text-purple-300 border border-purple-500/30">
              <Hourglass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-purple-300 font-bold block">
                第 {timeSlipCount + 1} 世代 世界線タイムライン
              </span>
              <span className="text-[11px] text-gray-400">
                跳躍実行回数: {stats.timesTimeSlipped || 0} 回
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-purple-300 block">恒久全演算倍率</span>
            <span className="text-base font-black text-amber-400">
              x{timeSlipMult.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 累計獲得資金
            </div>
            <div className="text-base font-bold text-amber-400">
              {formatCurrency(stats.totalMoneyEarned, stats.totalMoneyTier || 0, formatNumber)}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-1">
              <MousePointerClick className="w-3.5 h-3.5 text-blue-400" /> 手動演算回数
            </div>
            <div className="text-base font-bold text-gray-200">{stats.totalClicks.toLocaleString()} 回</div>
          </div>

          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> 総稼働プレイ時間
            </div>
            <div className="text-xs font-bold text-gray-200 truncate">{formatTime(playTimeSeconds)}</div>
          </div>

          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> 放置収益累計受取
            </div>
            <div className="text-base font-bold text-emerald-400">
              {formatCurrency(stats.offlineEarningsClaimedTotal, stats.offlineEarningsClaimedTier || 0, formatNumber)}
            </div>
          </div>
        </div>

        {/* Current Architecture details */}
        <div className="bg-[#0f141c] border border-gray-800 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">現行アーキテクチャ:</span>
            <span className="font-bold text-white">{currentArch.name}</span>
          </div>
          <span className="text-gray-400 font-mono">{currentArch.node}</span>
        </div>

        {/* Achievements Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              実績マイルストーン ({unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length})
            </h3>
          </div>

          <div className="space-y-2">
            {ALL_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                    isUnlocked
                      ? 'bg-amber-950/20 border-amber-500/40 text-gray-200'
                      : 'bg-[#0d1117] border-gray-800/80 text-gray-500 opacity-60'
                  }`}
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-gray-400'}`}>
                        {ach.title}
                      </h4>
                      <span className="text-[10px]">
                        {isUnlocked ? '✅ 達成済み' : '🔒 未達成'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{ach.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
