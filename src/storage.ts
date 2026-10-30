/**
 * CPU Evolver - Storage Service & Data Persistence
 * 
 * Provides fail-safe multi-tier data persistence to ensure progress is never lost:
 * 1. Primary localStorage save with automatic periodic syncing.
 * 2. Secondary backup slot to prevent corrupted state loss.
 * 3. Beforeunload & visibilitychange handlers for immediate persistence when closing/tabbing.
 * 4. Offline earnings calculation upon reopening.
 * 5. Export / Import functionality (JSON & Base64 save codes) for external backup.
 */

import { GameSaveData } from './types.ts';

export const PRIMARY_SAVE_KEY = 'cpu_evolver_save_v1';
export const BACKUP_SAVE_KEY = 'cpu_evolver_save_backup_v1';
export const SAVE_FORMAT_VERSION = 1;

export const DEFAULT_SAVE_DATA: GameSaveData = {
  version: SAVE_FORMAT_VERSION,
  money: 0,
  clockKhz: 740,
  cores: 1,
  clickMultiplier: 1,
  architectureLevel: 0,
  costs: {
    clock: 10,
    core: 50,
    cache: 100,
  },
  stats: {
    totalMoneyEarned: 0,
    totalClicks: 0,
    gameStartTime: Date.now(),
    lastSavedTimestamp: Date.now(),
    offlineEarningsClaimedTotal: 0,
    timesUpgraded: 0,
  },
  settings: {
    soundEnabled: true,
    autoSaveIntervalSec: 2,
  },
  unlockedAchievements: [],
};

/**
 * Validate and sanitize numeric properties to ensure no NaN/Infinity corrupts state.
 */
function sanitizeSaveData(data: Partial<GameSaveData>): GameSaveData {
  const sanitizeNum = (val: unknown, fallback: number): number => {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return fallback;
    }
    return Math.max(0, val);
  };

  return {
    version: SAVE_FORMAT_VERSION,
    money: sanitizeNum(data.money, DEFAULT_SAVE_DATA.money),
    clockKhz: Math.max(740, sanitizeNum(data.clockKhz, DEFAULT_SAVE_DATA.clockKhz)),
    cores: Math.max(1, sanitizeNum(data.cores, DEFAULT_SAVE_DATA.cores)),
    clickMultiplier: Math.max(1, sanitizeNum(data.clickMultiplier, DEFAULT_SAVE_DATA.clickMultiplier)),
    architectureLevel: Math.min(6, Math.max(0, Math.floor(sanitizeNum(data.architectureLevel, 0)))),
    costs: {
      clock: Math.max(10, sanitizeNum(data.costs?.clock, DEFAULT_SAVE_DATA.costs.clock)),
      core: Math.max(50, sanitizeNum(data.costs?.core, DEFAULT_SAVE_DATA.costs.core)),
      cache: Math.max(100, sanitizeNum(data.costs?.cache, DEFAULT_SAVE_DATA.costs.cache)),
    },
    stats: {
      totalMoneyEarned: sanitizeNum(data.stats?.totalMoneyEarned, sanitizeNum(data.money, 0)),
      totalClicks: sanitizeNum(data.stats?.totalClicks, 0),
      gameStartTime: sanitizeNum(data.stats?.gameStartTime, Date.now()),
      lastSavedTimestamp: sanitizeNum(data.stats?.lastSavedTimestamp, Date.now()),
      offlineEarningsClaimedTotal: sanitizeNum(data.stats?.offlineEarningsClaimedTotal, 0),
      timesUpgraded: sanitizeNum(data.stats?.timesUpgraded, 0),
    },
    settings: {
      soundEnabled: data.settings?.soundEnabled !== false,
      autoSaveIntervalSec: sanitizeNum(data.settings?.autoSaveIntervalSec, 2),
    },
    unlockedAchievements: Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : [],
  };
}

/**
 * Load saved game data from localStorage, falling back to backup slot if primary is corrupt.
 */
export function loadGameData(): { data: GameSaveData; isRestoredFromBackup: boolean; isNewGame: boolean } {
  try {
    const raw = localStorage.getItem(PRIMARY_SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const sanitized = sanitizeSaveData(parsed);
        return { data: sanitized, isRestoredFromBackup: false, isNewGame: false };
      }
    }
  } catch (err) {
    console.warn('[Storage] Primary save slot read error, checking backup slot:', err);
  }

  // Attempt backup slot recovery
  try {
    const backupRaw = localStorage.getItem(BACKUP_SAVE_KEY);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      if (parsed && typeof parsed === 'object') {
        const sanitized = sanitizeSaveData(parsed);
        console.info('[Storage] Successfully recovered game data from backup slot.');
        // Resave into primary
        localStorage.setItem(PRIMARY_SAVE_KEY, JSON.stringify(sanitized));
        return { data: sanitized, isRestoredFromBackup: true, isNewGame: false };
      }
    }
  } catch (backupErr) {
    console.error('[Storage] Backup slot also failed to load:', backupErr);
  }

  // Brand new save
  return {
    data: {
      ...DEFAULT_SAVE_DATA,
      stats: {
        ...DEFAULT_SAVE_DATA.stats,
        gameStartTime: Date.now(),
        lastSavedTimestamp: Date.now(),
      },
    },
    isRestoredFromBackup: false,
    isNewGame: true,
  };
}

/**
 * Save current game state to localStorage and periodically sync to backup slot.
 */
let saveCounter = 0;
export function saveGameData(data: GameSaveData): boolean {
  try {
    const dataToSave: GameSaveData = {
      ...data,
      stats: {
        ...data.stats,
        lastSavedTimestamp: Date.now(),
      },
    };

    const serialized = JSON.stringify(dataToSave);
    localStorage.setItem(PRIMARY_SAVE_KEY, serialized);

    // Every 5 saves, update secondary backup slot
    saveCounter++;
    if (saveCounter % 5 === 0) {
      localStorage.setItem(BACKUP_SAVE_KEY, serialized);
    }
    return true;
  } catch (err) {
    console.error('[Storage] Failed to save game data to localStorage:', err);
    return false;
  }
}

/**
 * Calculates earnings accumulated while the user was away from the game.
 */
export function calculateOfflineEarnings(
  lastSavedTimestamp: number,
  flops: number
): { elapsedSeconds: number; offlineEarned: number } | null {
  if (!lastSavedTimestamp || flops <= 0) return null;

  const now = Date.now();
  const diffMs = now - lastSavedTimestamp;
  const elapsedSeconds = Math.floor(diffMs / 1000);

  // Require at least 5 seconds offline to trigger offline bonus dialog
  if (elapsedSeconds < 5) {
    return null;
  }

  // Cap offline calculation at 7 days (604,800 seconds)
  const cappedSeconds = Math.min(elapsedSeconds, 7 * 24 * 60 * 60);
  const offlineEarned = Math.floor(cappedSeconds * flops);

  if (offlineEarned <= 0) return null;

  return {
    elapsedSeconds,
    offlineEarned,
  };
}

/**
 * Export save data into a portable string code (Base64 encoded with prefix).
 */
export function exportSaveCode(data: GameSaveData): string {
  const json = JSON.stringify({
    ...data,
    stats: { ...data.stats, lastSavedTimestamp: Date.now() },
  });
  // Use UTF-8 safe base64
  const encoded = btoa(encodeURIComponent(json));
  return `CPUEV-${encoded}`;
}

/**
 * Import save data from an exported code or raw JSON string.
 */
export function importSaveCode(code: string): { success: boolean; data?: GameSaveData; error?: string } {
  try {
    const trimmed = code.trim();
    let jsonStr = '';

    if (trimmed.startsWith('CPUEV-')) {
      const b64 = trimmed.substring(6);
      jsonStr = decodeURIComponent(atob(b64));
    } else if (trimmed.startsWith('{')) {
      jsonStr = trimmed;
    } else {
      // Try raw b64
      jsonStr = decodeURIComponent(atob(trimmed));
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'セーブデータの形式が正しくありません。' };
    }

    const sanitized = sanitizeSaveData(parsed);
    saveGameData(sanitized);
    // Also save directly to backup
    localStorage.setItem(BACKUP_SAVE_KEY, JSON.stringify(sanitized));

    return { success: true, data: sanitized };
  } catch (err) {
    return {
      success: false,
      error: `読み込みに失敗しました: ${err instanceof Error ? err.message : '無効なコードです'}`,
    };
  }
}

/**
 * Clear all saved data (reset to initial state).
 */
export function clearAllSaveData(): void {
  try {
    localStorage.removeItem(PRIMARY_SAVE_KEY);
    localStorage.removeItem(BACKUP_SAVE_KEY);
  } catch (err) {
    console.error('[Storage] Error clearing storage:', err);
  }
}
