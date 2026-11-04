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

import { GameSaveData, getMaxArchitectureLevel } from './types.ts';

export const PRIMARY_SAVE_KEY = 'cpu_evolver_save_v1';
export const BACKUP_SAVE_KEY = 'cpu_evolver_save_backup_v1';
export const SAVE_FORMAT_VERSION = 2;

export const DEFAULT_SAVE_DATA: GameSaveData = {
  version: SAVE_FORMAT_VERSION,
  money: 0,
  moneyTier: 0,
  currencyTier: 0,
  clockKhz: 740,
  cores: 1,
  clickMultiplier: 1,
  architectureLevel: 0,
  timeSlipCount: 0,
  costs: {
    clock: 10,
    core: 50,
    cache: 100,
    clockTier: 0,
    coreTier: 0,
    cacheTier: 0,
  },
  stats: {
    totalMoneyEarned: 0,
    totalMoneyTier: 0,
    totalClicks: 0,
    gameStartTime: Date.now(),
    lastSavedTimestamp: Date.now(),
    offlineEarningsClaimedTotal: 0,
    offlineEarningsClaimedTier: 0,
    timesUpgraded: 0,
    timesTimeSlipped: 0,
  },
  settings: {
    soundEnabled: true,
    autoSaveIntervalSec: 2,
    autoUpgradeEnabled: true,
  },
  unlockedAchievements: [],
  activeServerId: 'server-1',
  servers: [
    {
      id: 'server-1',
      name: 'サーバー #1 (地球原初メインフレーム)',
      createdAt: Date.now(),
      money: 0,
      moneyTier: 0,
      currencyTier: 0,
      clockKhz: 740,
      cores: 1,
      clickMultiplier: 1,
      architectureLevel: 0,
      timeSlipCount: 0,
      costs: {
        clock: 10,
        core: 50,
        cache: 100,
        clockTier: 0,
        coreTier: 0,
        cacheTier: 0,
      },
    },
  ],
  maxTimelineReached: 1,
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

  const timeSlipCount = sanitizeNum(data.timeSlipCount, 0);
  const maxAllowedArch = getMaxArchitectureLevel(timeSlipCount);

  let rawMoney = sanitizeNum(data.money, DEFAULT_SAVE_DATA.money);
  let moneyTier = sanitizeNum(data.moneyTier, 0);
  while (rawMoney >= 1e100) {
    rawMoney /= 1e100;
    moneyTier += 1;
  }

  let totalMoney = sanitizeNum(data.stats?.totalMoneyEarned, rawMoney);
  let totalMoneyTier = sanitizeNum(data.stats?.totalMoneyTier, moneyTier);
  while (totalMoney >= 1e100) {
    totalMoney /= 1e100;
    totalMoneyTier += 1;
  }

  const currencyTier = Math.max(sanitizeNum(data.currencyTier, 0), moneyTier);

  // Multi-server cluster state sanitization
  const activeServerId = typeof data.activeServerId === 'string' && data.activeServerId ? data.activeServerId : 'server-1';

  let rawServers: any[] = Array.isArray(data.servers) ? data.servers : [];
  let sanitizedServers: import('./types.ts').CpuServer[] = [];

  for (const s of rawServers) {
    if (s && typeof s === 'object' && typeof s.id === 'string') {
      const sTimeSlip = sanitizeNum(s.timeSlipCount, 0);
      let sMoney = sanitizeNum(s.money, 0);
      let sMoneyTier = sanitizeNum(s.moneyTier, 0);
      while (sMoney >= 1e100) {
        sMoney /= 1e100;
        sMoneyTier += 1;
      }
      sanitizedServers.push({
        id: s.id,
        name: typeof s.name === 'string' && s.name ? s.name : `サーバー ${s.id}`,
        createdAt: sanitizeNum(s.createdAt, Date.now()),
        money: sMoney,
        moneyTier: sMoneyTier,
        currencyTier: Math.max(sanitizeNum(s.currencyTier, 0), sMoneyTier),
        clockKhz: Math.max(740, sanitizeNum(s.clockKhz, 740)),
        cores: Math.max(1, sanitizeNum(s.cores, 1)),
        clickMultiplier: Math.max(1, sanitizeNum(s.clickMultiplier, 1)),
        architectureLevel: Math.max(0, Math.floor(sanitizeNum(s.architectureLevel, 0))),
        timeSlipCount: sTimeSlip,
        costs: {
          clock: Math.max(10, sanitizeNum(s.costs?.clock, 10)),
          core: Math.max(50, sanitizeNum(s.costs?.core, 50)),
          cache: Math.max(100, sanitizeNum(s.costs?.cache, 100)),
          clockTier: sanitizeNum(s.costs?.clockTier, 0),
          coreTier: sanitizeNum(s.costs?.coreTier, 0),
          cacheTier: sanitizeNum(s.costs?.cacheTier, 0),
        },
        stats: s.stats,
      });
    }
  }

  // If no servers existed yet or active server is missing, ensure active server is recorded
  const activeServerIdx = sanitizedServers.findIndex((s) => s.id === activeServerId);
  const activeCosts = {
    clock: Math.max(10, sanitizeNum(data.costs?.clock, DEFAULT_SAVE_DATA.costs.clock)),
    core: Math.max(50, sanitizeNum(data.costs?.core, DEFAULT_SAVE_DATA.costs.core)),
    cache: Math.max(100, sanitizeNum(data.costs?.cache, DEFAULT_SAVE_DATA.costs.cache)),
    clockTier: sanitizeNum(data.costs?.clockTier, 0),
    coreTier: sanitizeNum(data.costs?.coreTier, 0),
    cacheTier: sanitizeNum(data.costs?.cacheTier, 0),
  };
  const activeStats = {
    totalMoneyEarned: totalMoney,
    totalMoneyTier,
    totalClicks: sanitizeNum(data.stats?.totalClicks, 0),
    gameStartTime: sanitizeNum(data.stats?.gameStartTime, Date.now()),
    lastSavedTimestamp: sanitizeNum(data.stats?.lastSavedTimestamp, Date.now()),
    offlineEarningsClaimedTotal: sanitizeNum(data.stats?.offlineEarningsClaimedTotal, 0),
    offlineEarningsClaimedTier: sanitizeNum(data.stats?.offlineEarningsClaimedTier, 0),
    timesUpgraded: sanitizeNum(data.stats?.timesUpgraded, 0),
    timesTimeSlipped: sanitizeNum(data.stats?.timesTimeSlipped, 0),
  };

  if (activeServerIdx >= 0) {
    // Keep active server updated with top-level fields
    sanitizedServers[activeServerIdx] = {
      ...sanitizedServers[activeServerIdx],
      money: rawMoney,
      moneyTier,
      currencyTier,
      clockKhz: Math.max(740, sanitizeNum(data.clockKhz, DEFAULT_SAVE_DATA.clockKhz)),
      cores: Math.max(1, sanitizeNum(data.cores, DEFAULT_SAVE_DATA.cores)),
      clickMultiplier: Math.max(1, sanitizeNum(data.clickMultiplier, DEFAULT_SAVE_DATA.clickMultiplier)),
      architectureLevel: Math.max(0, Math.floor(sanitizeNum(data.architectureLevel, 0))),
      timeSlipCount,
      costs: activeCosts,
      stats: activeStats,
    };
  } else {
    // Insert initial active server
    sanitizedServers.unshift({
      id: activeServerId,
      name: 'サーバー #1 (地球原初メインフレーム)',
      createdAt: data.stats?.gameStartTime || Date.now(),
      money: rawMoney,
      moneyTier,
      currencyTier,
      clockKhz: Math.max(740, sanitizeNum(data.clockKhz, DEFAULT_SAVE_DATA.clockKhz)),
      cores: Math.max(1, sanitizeNum(data.cores, DEFAULT_SAVE_DATA.cores)),
      clickMultiplier: Math.max(1, sanitizeNum(data.clickMultiplier, DEFAULT_SAVE_DATA.clickMultiplier)),
      architectureLevel: Math.max(0, Math.floor(sanitizeNum(data.architectureLevel, 0))),
      timeSlipCount,
      costs: activeCosts,
      stats: activeStats,
    });
  }

  // Calculate highest timeline reached across all servers
  const highestTimelineInServers = sanitizedServers.reduce(
    (acc, s) => Math.max(acc, (s.timeSlipCount || 0) + 1),
    timeSlipCount + 1
  );
  const maxTimelineReached = Math.max(
    highestTimelineInServers,
    sanitizeNum(data.maxTimelineReached, timeSlipCount + 1)
  );

  return {
    version: SAVE_FORMAT_VERSION,
    money: rawMoney,
    moneyTier,
    currencyTier,
    clockKhz: Math.max(740, sanitizeNum(data.clockKhz, DEFAULT_SAVE_DATA.clockKhz)),
    cores: Math.max(1, sanitizeNum(data.cores, DEFAULT_SAVE_DATA.cores)),
    clickMultiplier: Math.max(1, sanitizeNum(data.clickMultiplier, DEFAULT_SAVE_DATA.clickMultiplier)),
    architectureLevel: Math.max(0, Math.floor(sanitizeNum(data.architectureLevel, 0))),
    timeSlipCount,
    costs: activeCosts,
    stats: activeStats,
    settings: {
      soundEnabled: data.settings?.soundEnabled !== false,
      autoSaveIntervalSec: sanitizeNum(data.settings?.autoSaveIntervalSec, 2),
      autoUpgradeEnabled: data.settings?.autoUpgradeEnabled !== false,
    },
    unlockedAchievements: Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : [],
    activeServerId,
    servers: sanitizedServers,
    maxTimelineReached,
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
  flops: number,
  flopsTier: number = 0
): { elapsedSeconds: number; offlineEarned: number; offlineTier: number } | null {
  if (!lastSavedTimestamp || (flops <= 0 && flopsTier <= 0)) return null;

  const now = Date.now();
  const diffMs = now - lastSavedTimestamp;
  const elapsedSeconds = Math.floor(diffMs / 1000);

  // Require at least 5 seconds offline to trigger offline bonus dialog
  if (elapsedSeconds < 5) {
    return null;
  }

  // Cap offline calculation at 7 days (604,800 seconds)
  const cappedSeconds = Math.min(elapsedSeconds, 7 * 24 * 60 * 60);
  let offlineEarned = cappedSeconds * flops;
  let offlineTier = flopsTier;

  while (offlineEarned >= 1e100) {
    offlineEarned /= 1e100;
    offlineTier++;
  }

  if (offlineEarned <= 0 && offlineTier <= 0) return null;

  return {
    elapsedSeconds,
    offlineEarned,
    offlineTier,
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
