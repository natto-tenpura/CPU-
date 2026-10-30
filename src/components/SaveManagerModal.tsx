import React, { useState } from 'react';
import {
  ShieldCheck,
  Save,
  Download,
  Upload,
  RotateCcw,
  X,
  Copy,
  Check,
  AlertTriangle,
  FileCode,
} from 'lucide-react';
import { GameSaveData } from '../types.ts';
import { exportSaveCode, importSaveCode } from '../storage.ts';

interface SaveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameData: GameSaveData;
  onManualSave: () => void;
  onDataRestored: (newData: GameSaveData) => void;
  onResetGame: () => void;
  lastSavedAt: number;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  isOpen,
  onClose,
  currentGameData,
  onManualSave,
  onDataRestored,
  onResetGame,
  lastSavedAt,
}) => {
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const saveCode = exportSaveCode(currentGameData);

  const handleCopy = () => {
    navigator.clipboard.writeText(saveCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentGameData, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cpu-evolver-save-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(false);

    if (!importInput.trim()) {
      setImportError('セーブコードまたはJSONデータを入力してください。');
      return;
    }

    const result = importSaveCode(importInput);
    if (result.success && result.data) {
      setImportSuccess(true);
      setTimeout(() => {
        onDataRestored(result.data!);
        onClose();
      }, 1000);
    } else {
      setImportError(result.error || 'データの読み込みに失敗しました。');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportInput(content);
      }
    };
    reader.readAsText(file);
  };

  const triggerManualSave = () => {
    onManualSave();
    setManualSaveSuccess(true);
    setTimeout(() => setManualSaveSuccess(false), 2500);
  };

  const timeAgoSec = Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl p-6 text-gray-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">データ保護・バックアップ管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protection Status Banner */}
        <div className="bg-[#0d1117] border border-emerald-900/50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              自動セーブ機能: 常時稼働中 (自動保護)
            </span>
            <span className="text-gray-400">最終保存: {timeAgoSec}秒前</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            ゲーム進行・購入・進化のたびに即座にブラウザの内部ストレージ（PrimaryおよびBackup二重スロット）に保存されるため、タブを閉じてもリロードしてもデータは消えません。
          </p>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={triggerManualSave}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              今すぐ手動保存を実行
            </button>
            {manualSaveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 二重スロット保存完了！
              </span>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-[#0f141c] border border-gray-800 rounded-xl p-4 mb-5">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            セーブデータのエクスポート (引継ぎ・外部保存)
          </h3>
          <p className="text-[11px] text-gray-400 mb-3">
            別のPCやブラウザへ移行する場合や、ブラウザのキャッシュ消去対策としてバックアップコードを保存できます。
          </p>

          <div className="relative mb-3">
            <textarea
              readOnly
              value={saveCode}
              rows={2}
              className="w-full text-[11px] bg-[#090d14] text-gray-300 rounded-lg p-2.5 border border-gray-800 font-mono resize-none focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] border border-gray-700 text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'クリップボードにコピー完了！' : 'コードをコピー'}
            </button>

            <button
              onClick={handleDownloadFile}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] border border-gray-700 text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              JSONファイルでダウンロード
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-[#0f141c] border border-gray-800 rounded-xl p-4 mb-5">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            セーブデータの復元 (インポート)
          </h3>
          <p className="text-[11px] text-gray-400 mb-2">
            エクスポートしたバックアップコード、またはJSONファイルを貼り付けて復元します。
          </p>

          <textarea
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="CPUEV-... または JSONデータをここに貼り付け"
            rows={2}
            className="w-full text-[11px] bg-[#090d14] text-gray-200 rounded-lg p-2.5 border border-gray-800 font-mono mb-2 focus:border-amber-500 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center gap-1">
              <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
              <FileCode className="w-3.5 h-3.5" /> ファイルを選択...
            </label>

            <button
              onClick={handleImport}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
            >
              データを読み込んで復元
            </button>
          </div>

          {importError && (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {importError}
            </p>
          )}

          {importSuccess && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> データを正常に復元しました！
            </p>
          )}
        </div>

        {/* Danger Zone: Reset */}
        <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-xs">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-rose-400/80 hover:text-rose-400 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              データを最初からやり直す (リセット)
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full justify-between bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60">
              <span className="text-rose-300 text-[11px]">本当に全データを初期化しますか？</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    onResetGame();
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  実行する
                </button>
              </div>
            </div>
          )}
          <span className="text-gray-500 text-[10px]">CPU Evolver v1.0</span>
        </div>
      </div>
    </div>
  );
};
