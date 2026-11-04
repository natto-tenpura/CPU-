import React from 'react';
import { RotateCcw, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  timeSlipCount: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  timeSlipCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-md bg-[#16141a] border-2 border-rose-600/80 rounded-2xl shadow-2xl p-6 text-gray-200 relative overflow-hidden">
        {/* Warning Accent Header Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-400 mb-3 shadow-lg shadow-rose-950/60">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">
            ゲームデータ完全リセット
          </h2>
          <p className="text-xs text-rose-400 font-semibold mt-1">
            ⚠️ この操作を実行すると元に戻すことはできません
          </p>
        </div>

        {/* Warning Details Card */}
        <div className="bg-[#0e0c12] border border-rose-900/60 rounded-xl p-4 text-xs space-y-2.5 mb-5">
          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>リセットされる内容:</span>
          </div>
          <ul className="text-gray-300 space-y-1.5 pl-4 list-disc text-[11px] leading-relaxed">
            <li>
              現在の所持資金および獲得累計資金（<strong className="text-rose-400">$0にリセット</strong>）
            </li>
            <li>
              CPUスペック（クロック周波数、コア数、キャッシュ倍率）
            </li>
            <li>
              アーキテクチャ進化段階（初期の <strong className="text-white">Intel 4004</strong> に戻ります）
            </li>
            <li>
              世界線情報（現在: 第 <strong className="text-purple-300">{timeSlipCount + 1}</strong> 世代 → <strong className="text-white">第 1 世代</strong>）
            </li>
            <li>
              解放した実績およびプレイ統計データ
            </li>
          </ul>
          <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800">
            ※バックアップを残したい場合は、事前に「バックアップ・引継ぎ」画面からコードを保存してください。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            キャンセル
          </button>

          <button
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/60"
          >
            <RotateCcw className="w-4 h-4" />
            全データを初期化
          </button>
        </div>
      </div>
    </div>
  );
};
