import React, { useState } from 'react';
import {
  Server,
  X,
  Plus,
  Check,
  Edit2,
  Cpu,
  Zap,
  TrendingUp,
  Hourglass,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  CpuServer,
  getArchitecture,
  formatCurrency,
  SERVER_PRESET_NAMES,
  MULTI_SERVER_UNLOCK_TIMELINE,
} from '../types.ts';

interface ServerClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeServerId: string;
  servers: CpuServer[];
  maxTimelineReached: number;
  currentTimeline: number;
  isUnlocked: boolean;
  onSwitchServer: (serverId: string) => void;
  onCreateServer: (serverName: string) => void;
  onRenameServer: (serverId: string, newName: string) => void;
  formatNumber: (num: number) => string;
  formatClock: (khz: number) => string;
}

export const ServerClusterModal: React.FC<ServerClusterModalProps> = ({
  isOpen,
  onClose,
  activeServerId,
  servers,
  maxTimelineReached,
  currentTimeline,
  isUnlocked,
  onSwitchServer,
  onCreateServer,
  onRenameServer,
  formatNumber,
  formatClock,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Default suggested name for new server
  const nextServerIndex = servers.length + 1;
  const suggestedPreset =
    SERVER_PRESET_NAMES[(nextServerIndex - 1) % SERVER_PRESET_NAMES.length];
  const [newServerName, setNewServerName] = useState(
    `サーバー #${nextServerIndex} (${suggestedPreset})`
  );

  if (!isOpen) return null;

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];
  const totalCores = servers.reduce((acc, s) => acc + (s.cores || 1), 0);
  const standbyCount = Math.max(0, servers.length - 1);
  const clusterBonusPct = standbyCount * 10;

  const handleStartRename = (server: CpuServer) => {
    setEditingServerId(server.id);
    setEditingName(server.name);
  };

  const handleSaveRename = (serverId: string) => {
    if (editingName.trim()) {
      onRenameServer(serverId, editingName.trim());
    }
    setEditingServerId(null);
  };

  const handleConfirmCreate = () => {
    const finalName = newServerName.trim()
      ? newServerName.trim()
      : `サーバー #${servers.length + 1} (${suggestedPreset})`;
    onCreateServer(finalName);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-2xl bg-[#121620] border-2 border-cyan-500/70 rounded-2xl shadow-2xl p-5 sm:p-6 text-gray-200 relative max-h-[92vh] flex flex-col">
        {/* Top Glowing Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#21262d]">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/50">
            <Server className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                サーバークラスタ管理 (Server Cluster)
              </h2>
              {isUnlocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold">
                  第90世代突破 特典稼働中
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 border border-gray-700">
                  第90世代世界線で解放
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              別サーバーへの跳躍・CPU独立管理。他サーバーのCPUはすべて安全に保管・並列維持されます。
            </p>
          </div>
        </div>

        {/* Cluster Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-[#181f2c] border border-cyan-900/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-gray-400 block">総サーバー台数</span>
            <span className="text-base sm:text-lg font-black text-cyan-300">
              {servers.length} <span className="text-xs font-normal text-gray-400">台</span>
            </span>
          </div>

          <div className="bg-[#181f2c] border border-blue-900/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-gray-400 block">総クラスタコア数</span>
            <span className="text-base sm:text-lg font-black text-blue-300">
              {totalCores} <span className="text-xs font-normal text-gray-400">Cores</span>
            </span>
          </div>

          <div className="bg-[#181f2c] border border-purple-900/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-gray-400 block">クラスタ同期ボーナス</span>
            <span className="text-base sm:text-lg font-black text-purple-300">
              +{clusterBonusPct}%
            </span>
          </div>

          <div className="bg-[#181f2c] border border-emerald-900/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-gray-400 block">現接続ノード</span>
            <span className="text-xs font-bold text-emerald-300 truncate block mt-1" title={activeServer.name}>
              {activeServer.name}
            </span>
          </div>
        </div>

        {/* Unlock Status / Promotion Banner */}
        {!isUnlocked ? (
          <div className="bg-[#151a24] border border-amber-500/40 rounded-xl p-3.5 mb-4 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>異界サーバー増設は「第90世代世界線」を越えると解放されます</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              現在: <strong className="text-white">第 {currentTimeline} 世代世界線</strong> （あと{' '}
              <strong className="text-amber-300">{Math.max(1, 91 - currentTimeline)}</strong> 回のタイムスリップが必要）。
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              第90世代世界線を越えると、別のサーバーで初期状態（4-bit / 740kHz / $0）から新しい歴史を開始でき、かつ育てた他のCPUはすべて残ります。
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-cyan-950/60 via-purple-950/40 to-slate-900/60 border border-cyan-500/50 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="text-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>第90世代突破特典: 異界サーバー増設が可能！</span>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                別のサーバーを開設して最初からスタート可能。他のCPUは安全に保持され、いつでも切替可能です。
              </p>
            </div>

            {!isCreating && (
              <button
                onClick={() => {
                  setNewServerName(
                    `サーバー #${servers.length + 1} (${
                      SERVER_PRESET_NAMES[servers.length % SERVER_PRESET_NAMES.length]
                    })`
                  );
                  setIsCreating(true);
                }}
                className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新サーバーを開設</span>
              </button>
            )}
          </div>
        )}

        {/* New Server Creation Form (Collapsible) */}
        {isCreating && (
          <div className="bg-[#181f2f] border-2 border-cyan-400/80 rounded-xl p-4 mb-4 text-xs animate-fade-in shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> 新規サーバー配備（最初からスタート）
              </span>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                キャンセル
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-300 block mb-1">サーバー名:</label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="例: サーバー #2 (月面量子クラスタ)"
                  className="w-full bg-[#0d1118] border border-[#30363d] focus:border-cyan-400 text-white px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              {/* Safety reassurance banner */}
              <div className="bg-[#0e131d] border border-emerald-800/60 rounded-lg p-2.5 text-[11px] text-emerald-300 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>CPU保持の保証:</span>
                </div>
                <p className="text-gray-300 pl-5">
                  現在のサーバー（{activeServer.name}）のCPU（
                  <strong className="text-white">
                    {getArchitecture(activeServer.architectureLevel).name}
                  </strong>
                  、{formatClock(activeServer.clockKhz)}、{activeServer.cores}コア）は
                  <strong className="text-emerald-300"> 完全にそのまま残ります</strong>。
                </p>
                <p className="text-gray-300 pl-5">
                  新サーバーでは、初期状態（4-bit Microprocessor, 740kHz, 1コア, $0）から新しい歴史を開始します。
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 flex items-center gap-1 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>新サーバーを起動して移動</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Server List (Rack view) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            配備済みサーバーラック一覧 ({servers.length} 台)
          </span>

          {servers.map((server, idx) => {
            const isActive = server.id === activeServerId;
            const arch = getArchitecture(server.architectureLevel);
            const isEditing = editingServerId === server.id;

            return (
              <div
                key={server.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-[#151f2e] border-cyan-500/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-[#121722] border-[#252c38] hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-[#0b0f16] border border-cyan-400 text-white px-2 py-0.5 rounded text-xs outline-none flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(server.id);
                            if (e.key === 'Escape') setEditingServerId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveRename(server.id)}
                          className="p-1 rounded bg-cyan-700 text-white hover:bg-cyan-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {server.name}
                        </span>
                        <button
                          onClick={() => handleStartRename(server)}
                          className="text-gray-500 hover:text-gray-300 p-0.5"
                          title="名前を変更"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold">
                        ● 稼働中 (Active)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        ○ スタンバイ (Standby)
                      </span>
                    )}
                  </div>
                </div>

                {/* CPU Specs & Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#0b0e14] p-2.5 rounded-lg border border-[#1d2430] mb-2.5">
                  <div>
                    <span className="text-gray-400 text-[10px] block">搭載CPUモデル</span>
                    <span
                      className="font-bold truncate block"
                      style={{ color: arch.color }}
                      title={arch.name}
                    >
                      {arch.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] block">クロック / コア</span>
                    <span className="font-semibold text-gray-200">
                      {formatClock(server.clockKhz)} / {server.cores}C
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] block">到達世界線</span>
                    <span className="font-semibold text-purple-300">
                      第 {server.timeSlipCount + 1} 世代
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] block">所持資金</span>
                    <span className="font-semibold text-amber-300 truncate block">
                      {formatCurrency(server.money, server.moneyTier || 0, formatNumber)}
                    </span>
                  </div>
                </div>

                {/* Switch Action */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    ID: {server.id} | ノード: {arch.node}
                  </span>

                  {isActive ? (
                    <span className="text-xs text-cyan-400 font-bold px-3 py-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 現在接続中のサーバー
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onSwitchServer(server.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-950"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>このサーバーに切替</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 mt-3 border-t border-[#21262d] flex items-center justify-between text-xs text-gray-400">
          <span className="text-[11px] flex items-center gap-1 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            全サーバーのCPU・世界線データは安全に自動保存されます
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
