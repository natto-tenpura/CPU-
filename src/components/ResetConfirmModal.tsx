import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (resetAllServers: boolean) => void;
  timeSlipCount: number;
  currentServerName?: string;
  serverCount?: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  timeSlipCount,
  currentServerName = '現在のサーバー',
  serverCount = 1,
}) => {
  const [resetScope, setResetScope] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const hasMultipleServers = serverCount > 1;

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
            リセット確認
          </h2>
          <p className="text-xs text-rose-400 font-semibold mt-1">
            ⚠️ この操作を実行すると初期状態に戻ります
          </p>
        </div>

        {/* Server Scope Selector if multiple servers exist */}
        {hasMultipleServers && (
          <div className="mb-4 bg-[#0e0c12] p-2.5 rounded-xl border border-rose-900/40 space-y-2">
            <span className="text-[11px] font-bold text-gray-300 block">リセット範囲の選択:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetScope('current')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  resetScope === 'current'
                    ? 'bg-blue-950/80 border-blue-400 text-blue-200 ring-1 ring-blue-400'
                    : 'bg-[#141419] border-[#292933] text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  現サーバーのみ
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  他の{serverCount - 1}台のCPUは保持
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResetScope('all')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  resetScope === 'all'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                    : 'bg-[#141419] border-[#292933] text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  全サーバー初期化
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  全{serverCount}台を完全リセット
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Warning Details Card */}
        <div className="bg-[#0e0c12] border border-rose-900/60 rounded-xl p-4 text-xs space-y-2 mb-5">
          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {resetScope === 'current' && hasMultipleServers
                ? `「${currentServerName}」のみリセットされます:`
                : 'リセットされる内容:'}
            </span>
          </div>
          <ul className="text-gray-300 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
            <li>
              対象サーバーの所持資金（<strong className="text-rose-400">$0にリセット</strong>）
            </li>
            <li>
              対象サーバーのCPUスペック（クロック周波数 740kHz、1コアに戻ります）
            </li>
            <li>
              対象サーバーのアーキテクチャ（初期の <strong className="text-white">4-bit Microprocessor</strong> に戻ります）
            </li>
            <li>
              対象サーバーの世界線（現在: 第 <strong className="text-purple-300">{timeSlipCount + 1}</strong> 世代 → <strong className="text-white">第 1 世代</strong>）
            </li>
            {resetScope === 'current' && hasMultipleServers ? (
              <li className="text-emerald-400 font-bold">
                ✅ 他のサーバーとそのCPUは一切消去されずそのまま残ります。
              </li>
            ) : (
              <li className="text-rose-400">
                ⚠️ 全サーバーの全データが工場出荷時の初期状態になります。
              </li>
            )}
          </ul>
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
              onConfirmReset(resetScope === 'all' || !hasMultipleServers);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/60"
          >
            <RotateCcw className="w-4 h-4" />
            {resetScope === 'current' && hasMultipleServers ? 'このサーバーを初期化' : '全データを初期化'}
          </button>
        </div>
      </div>
    </div>
  );
};
