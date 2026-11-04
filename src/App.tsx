/**
 * CPU Evolver - CPU強化シミュレータ
 * 
 * Bulletproof persistent incremental CPU evolution simulator.
 * Features multi-tier Time Slip prestige mechanics with escalating costs,
 * money reset, and unlocked higher-dimension architecture progression.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Cpu,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  BarChart3,
  Save,
  Check,
  ChevronRight,
  TrendingUp,
  Hourglass,
  Sparkles,
  AlertCircle,
  Lock,
  Bot,
  RotateCcw,
} from 'lucide-react';

import {
  Architecture,
  GameSaveData,
  getArchitecture,
  getMaxArchitectureLevel,
  getTimeSlipCostTiered,
  getTimeSlipMultiplier,
  AUTO_UPGRADE_UNLOCK_TIMELINE,
  SKIP_EXPLANATION_TIMELINE,
  TieredAmount,
  normalizeTieredAmount,
  compareAmounts,
  addAmounts,
  subtractCost,
  formatCurrency,
  getCurrencyUnitInfo,
  getFlopsTiered,
  getClickGainTiered,
} from './types.ts';
import {
  loadGameData,
  saveGameData,
  calculateOfflineEarnings,
  clearAllSaveData,
  DEFAULT_SAVE_DATA,
} from './storage.ts';
import { playSound } from './audio.ts';
import { CpuVisualizer } from './components/CpuVisualizer.tsx';
import { OfflineEarningsModal } from './components/OfflineEarningsModal.tsx';
import { SaveManagerModal } from './components/SaveManagerModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { TimeSlipModal } from './components/TimeSlipModal.tsx';
import { ResetConfirmModal } from './components/ResetConfirmModal.tsx';

interface FloatingGain {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function App() {
  // Game persistent state initialized from storage
  const [gameState, setGameState] = useState<GameSaveData>(() => {
    const { data } = loadGameData();
    return data;
  });

  // Offline earnings modal state
  const [offlineData, setOfflineData] = useState<{
    elapsedSeconds: number;
    offlineEarned: number;
    offlineTier: number;
    flops: number;
    flopsTier: number;
  } | null>(null);

  // Modals
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTimeSlipOpen, setIsTimeSlipOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Transient UI states
  const [isTimeSlipping, setIsTimeSlipping] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number>(Date.now());
  const [saveIndicatorActive, setSaveIndicatorActive] = useState(false);
  const [floatingGains, setFloatingGains] = useState<FloatingGain[]>([]);
  const [isClicking, setIsClicking] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Refs for loop
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Number formatting
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1e27) return (num / 1e27).toFixed(2) + ' Oc';
    if (num >= 1e24) return (num / 1e24).toFixed(2) + ' Sp';
    if (num >= 1e21) return (num / 1e21).toFixed(2) + ' Sx';
    if (num >= 1e18) return (num / 1e18).toFixed(2) + ' Qi';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + ' Qa';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return Math.floor(num).toLocaleString();
  }, []);

  const formatClock = useCallback((khz: number): string => {
    if (khz >= 1000000) return (khz / 1000000).toFixed(2) + ' GHz';
    if (khz >= 1000) return (khz / 1000).toFixed(2) + ' MHz';
    return Math.floor(khz) + ' kHz';
  }, []);

  // Time Slip & Architecture Calculations
  const timeSlipCount = gameState.timeSlipCount || 0;
  const timeSlipMult = getTimeSlipMultiplier(timeSlipCount);
  const maxAllowedArch = getMaxArchitectureLevel(timeSlipCount);
  const currentTimeline = timeSlipCount + 1;
  const isAutoUpgradeUnlocked = currentTimeline >= AUTO_UPGRADE_UNLOCK_TIMELINE;
  const isAutoUpgradeEnabled = isAutoUpgradeUnlocked && gameState.settings.autoUpgradeEnabled !== false;
  const isSkipExplanation = currentTimeline >= SKIP_EXPLANATION_TIMELINE;

  const currentArch: Architecture = getArchitecture(gameState.architectureLevel);
  const isMaxEvolution = gameState.architectureLevel >= maxAllowedArch;
  const nextArch: Architecture | undefined = !isMaxEvolution
    ? getArchitecture(gameState.architectureLevel + 1)
    : undefined;

  const timeSlipCost = getTimeSlipCostTiered(timeSlipCount);
  const playerMoney: TieredAmount = { value: gameState.money, tier: gameState.moneyTier || 0 };
  const canTimeSlip = compareAmounts(playerMoney, timeSlipCost) >= 0;
  const newlyUnlockedStart = getArchitecture(maxAllowedArch + 1);
  const newlyUnlockedEnd = getArchitecture(getMaxArchitectureLevel(timeSlipCount + 1));

  // Current generation evolution progress: 5 process evolutions per Time Slip!
  const currentGenBaseLevel = timeSlipCount === 0 ? 0 : 6 + (timeSlipCount - 1) * 5;
  const currentGenTotalSteps = timeSlipCount === 0 ? 6 : 5;
  const evolutionsInCurrentGen = Math.min(
    currentGenTotalSteps,
    Math.max(0, gameState.architectureLevel - currentGenBaseLevel)
  );

  // FLOPS (演算能力 with Time Slip permanent multiplier) as TieredAmount
  const flopsTiered = getFlopsTiered(
    gameState.clockKhz,
    gameState.cores,
    currentArch.mult,
    timeSlipCount,
    currentArch.multTier || 0
  );

  const currentCurrencyTier = Math.max(gameState.currencyTier || 0, gameState.moneyTier || 0);

  // Click gain with Time Slip permanent multiplier and currency tier scaling (10^100x per unit tier)
  const clickGainTiered = getClickGainTiered(
    gameState.clockKhz,
    gameState.clickMultiplier,
    currentArch.mult,
    timeSlipCount,
    currentCurrencyTier,
    currentArch.multTier || 0
  );

  // Check achievements
  const checkAchievements = useCallback((currentData: GameSaveData): string[] => {
    const unlocked = new Set(currentData.unlockedAchievements || []);
    if (currentData.stats.totalClicks >= 1) unlocked.add('first_click');
    if (currentData.clockKhz >= 1000) unlocked.add('mhz_barrier');
    if (currentData.clockKhz >= 1000000) unlocked.add('ghz_barrier');
    if (currentData.cores >= 8) unlocked.add('octa_core');
    if (currentData.architectureLevel >= 3) unlocked.add('pentium_era');
    if (currentData.architectureLevel >= 5) unlocked.add('euv_era');
    if (currentData.architectureLevel >= 6) unlocked.add('quantum_era');
    if (currentData.architectureLevel >= 7) unlocked.add('photonic_era');
    if ((currentData.timeSlipCount || 0) >= 1) unlocked.add('timeslip_1');
    if ((currentData.timeSlipCount || 0) >= 3) unlocked.add('timeslip_3');
    if ((currentData.timeSlipCount || 0) >= 29) unlocked.add('timeslip_30');
    if ((currentData.timeSlipCount || 0) >= 69) unlocked.add('timeslip_70');
    if ((currentData.moneyTier && currentData.moneyTier >= 1) || (currentData.stats.totalMoneyTier && currentData.stats.totalMoneyTier >= 1)) {
      unlocked.add('googol_tier');
    }
    if ((currentData.stats.totalMoneyTier && currentData.stats.totalMoneyTier >= 1) || currentData.stats.totalMoneyEarned >= 1000000) {
      unlocked.add('millionaire');
    }
    if ((currentData.stats.totalMoneyTier && currentData.stats.totalMoneyTier >= 1) || currentData.stats.totalMoneyEarned >= 1000000000) {
      unlocked.add('billionaire');
    }
    return Array.from(unlocked);
  }, []);

  // Save execution
  const executeSave = useCallback((dataToSave = gameStateRef.current) => {
    saveGameData(dataToSave);
    setLastSavedTime(Date.now());
    setSaveIndicatorActive(true);
    setTimeout(() => setSaveIndicatorActive(false), 1200);
  }, []);

  // Manual save trigger with feedback
  const handleManualSave = useCallback(() => {
    executeSave();
    playSound.save(gameState.settings.soundEnabled);
    setSaveNotice('データを二重スロットに保存しました！');
    setTimeout(() => setSaveNotice(null), 3000);
  }, [executeSave, gameState.settings.soundEnabled]);

  // Check offline earnings on initial mount
  useEffect(() => {
    const { data, isRestoredFromBackup } = loadGameData();
    if (isRestoredFromBackup) {
      setSaveNotice('バックアップスロットからデータを安全に復元しました');
      setTimeout(() => setSaveNotice(null), 5000);
    }

    const arch = getArchitecture(data.architectureLevel);
    const initialFlopsTiered = getFlopsTiered(
      data.clockKhz,
      data.cores,
      arch.mult,
      data.timeSlipCount || 0,
      arch.multTier || 0
    );
    const offlineResult = calculateOfflineEarnings(
      data.stats.lastSavedTimestamp,
      initialFlopsTiered.value,
      initialFlopsTiered.tier
    );

    if (offlineResult && (offlineResult.offlineEarned > 0 || offlineResult.offlineTier > 0)) {
      setOfflineData({
        elapsedSeconds: offlineResult.elapsedSeconds,
        offlineEarned: offlineResult.offlineEarned,
        offlineTier: offlineResult.offlineTier,
        flops: initialFlopsTiered.value,
        flopsTier: initialFlopsTiered.tier,
      });
    }
  }, []);

  // Offline earnings claim
  const handleClaimOfflineEarnings = () => {
    if (!offlineData) return;
    playSound.claim(gameState.settings.soundEnabled);

    setGameState((prev) => {
      const addedMoney = addAmounts(
        { value: prev.money, tier: prev.moneyTier || 0 },
        { value: offlineData.offlineEarned, tier: offlineData.offlineTier }
      );
      const addedTotal = addAmounts(
        { value: prev.stats.totalMoneyEarned, tier: prev.stats.totalMoneyTier || 0 },
        { value: offlineData.offlineEarned, tier: offlineData.offlineTier }
      );
      const addedOfflineClaimed = addAmounts(
        { value: prev.stats.offlineEarningsClaimedTotal, tier: prev.stats.offlineEarningsClaimedTier || 0 },
        { value: offlineData.offlineEarned, tier: offlineData.offlineTier }
      );

      const updated: GameSaveData = {
        ...prev,
        money: addedMoney.value,
        moneyTier: addedMoney.tier,
        currencyTier: Math.max(prev.currencyTier || 0, addedMoney.tier),
        stats: {
          ...prev.stats,
          totalMoneyEarned: addedTotal.value,
          totalMoneyTier: addedTotal.tier,
          offlineEarningsClaimedTotal: addedOfflineClaimed.value,
          offlineEarningsClaimedTier: addedOfflineClaimed.tier,
          lastSavedTimestamp: Date.now(),
        },
      };
      executeSave(updated);
      return updated;
    });

    setOfflineData(null);
  };

  // Automated game loop for passive calculation (100ms = 10 ticks/sec)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTimeSlipping) return;

      const current = gameStateRef.current;
      const arch = getArchitecture(current.architectureLevel);

      const currentFlops = getFlopsTiered(
        current.clockKhz,
        current.cores,
        arch.mult,
        current.timeSlipCount || 0,
        arch.multTier || 0
      );

      // Per tick is currentFlops / 10
      const perTick: TieredAmount = normalizeTieredAmount({
        value: currentFlops.value / 10,
        tier: currentFlops.tier,
      });

      if (perTick.value > 0 || perTick.tier > 0) {
        setGameState((prev) => {
          const currentMoney: TieredAmount = addAmounts(
            { value: prev.money, tier: prev.moneyTier || 0 },
            perTick
          );
          const currentTotal: TieredAmount = addAmounts(
            { value: prev.stats.totalMoneyEarned, tier: prev.stats.totalMoneyTier || 0 },
            perTick
          );

          return {
            ...prev,
            money: currentMoney.value,
            moneyTier: currentMoney.tier,
            currencyTier: Math.max(prev.currencyTier || 0, currentMoney.tier),
            stats: {
              ...prev.stats,
              totalMoneyEarned: currentTotal.value,
              totalMoneyTier: currentTotal.tier,
            },
          };
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isTimeSlipping]);

  // Dedicated Auto-Upgrade loop: strictly executes once every 0.5 seconds (500ms)
  useEffect(() => {
    const autoUpgradeInterval = setInterval(() => {
      if (isTimeSlipping) return;

      const current = gameStateRef.current;
      const currentTimeline = (current.timeSlipCount || 0) + 1;
      const isAutoUpgradeUnlocked = currentTimeline >= AUTO_UPGRADE_UNLOCK_TIMELINE;
      const isAutoUpgradeEnabled = isAutoUpgradeUnlocked && current.settings.autoUpgradeEnabled !== false;

      if (!isAutoUpgradeEnabled) return;

      setGameState((prev) => {
        const timeline = (prev.timeSlipCount || 0) + 1;
        if (
          timeline < AUTO_UPGRADE_UNLOCK_TIMELINE ||
          prev.settings.autoUpgradeEnabled === false
        ) {
          return prev;
        }

        let currentMoney: TieredAmount = { value: prev.money, tier: prev.moneyTier || 0 };
        let clockKhz = prev.clockKhz;
        let cores = prev.cores;
        let clickMultiplier = prev.clickMultiplier;
        let architectureLevel = prev.architectureLevel;
        const costs = { ...prev.costs };
        let timesUpgraded = prev.stats.timesUpgraded;
        let didUpgrade = false;

        const maxArch = getMaxArchitectureLevel(prev.timeSlipCount || 0);

        // In this 0.5s cycle, purchase affordable cheapest upgrades
        for (let i = 0; i < 15; i++) {
          const clockCost: TieredAmount = { value: costs.clock, tier: costs.clockTier || 0 };
          const coreCost: TieredAmount = { value: costs.core, tier: costs.coreTier || 0 };
          const cacheCost: TieredAmount = { value: costs.cache, tier: costs.cacheTier || 0 };

          const candidates: { type: 'clock' | 'core' | 'cache' | 'evolution'; cost: TieredAmount }[] = [
            { type: 'clock', cost: clockCost },
            { type: 'core', cost: coreCost },
            { type: 'cache', cost: cacheCost },
          ];

          if (architectureLevel < maxArch) {
            const currentArchDef = getArchitecture(architectureLevel);
            candidates.push({
              type: 'evolution',
              cost: { value: currentArchDef.cost, tier: currentArchDef.costTier || 0 },
            });
          }

          candidates.sort((a, b) => compareAmounts(a.cost, b.cost));
          const cheapest = candidates[0];

          if (!cheapest || compareAmounts(currentMoney, cheapest.cost) < 0) {
            break;
          }

          currentMoney = subtractCost(currentMoney, cheapest.cost);
          timesUpgraded++;
          didUpgrade = true;

          if (cheapest.type === 'clock') {
            clockKhz *= 1.25;
            const nextClockCost = normalizeTieredAmount({
              value: costs.clock * 1.5,
              tier: costs.clockTier || 0,
            });
            costs.clock = nextClockCost.value;
            costs.clockTier = nextClockCost.tier;
          } else if (cheapest.type === 'core') {
            cores += 1;
            const nextCoreCost = normalizeTieredAmount({
              value: costs.core * 1.8,
              tier: costs.coreTier || 0,
            });
            costs.core = nextCoreCost.value;
            costs.coreTier = nextCoreCost.tier;
          } else if (cheapest.type === 'cache') {
            clickMultiplier *= 2;
            const nextCacheCost = normalizeTieredAmount({
              value: costs.cache * 2.5,
              tier: costs.cacheTier || 0,
            });
            costs.cache = nextCacheCost.value;
            costs.cacheTier = nextCacheCost.tier;
          } else if (cheapest.type === 'evolution') {
            architectureLevel += 1;
          }
        }

        if (!didUpgrade) return prev;

        const updated: GameSaveData = {
          ...prev,
          money: currentMoney.value,
          moneyTier: currentMoney.tier,
          currencyTier: Math.max(prev.currencyTier || 0, currentMoney.tier),
          clockKhz,
          cores,
          clickMultiplier,
          architectureLevel,
          costs,
          stats: {
            ...prev.stats,
            timesUpgraded,
          },
        };

        updated.unlockedAchievements = checkAchievements(updated);
        return updated;
      });
    }, 500);

    return () => clearInterval(autoUpgradeInterval);
  }, [checkAchievements, isTimeSlipping]);

  // Periodic Auto-save timer (every 2 seconds)
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      executeSave();
    }, 2000);

    return () => clearInterval(autoSaveTimer);
  }, [executeSave]);

  // Window beforeunload & visibilitychange persistence protection
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameData(gameStateRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveGameData(gameStateRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Manual calculation click handler
  const handleManualCalculate = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTimeSlipping) return;
    playSound.click(gameState.settings.soundEnabled);

    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 80);

    // Spawn floating number particle
    const rect = e.currentTarget.getBoundingClientRect();
    const spawnX = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const spawnY = e.clientY ? e.clientY - rect.top : rect.height / 2;

    const newGain: FloatingGain = {
      id: Date.now() + Math.random(),
      text: `+${formatCurrency(clickGainTiered.value, clickGainTiered.tier, formatNumber)}`,
      x: spawnX,
      y: spawnY,
    };

    setFloatingGains((prev) => [...prev.slice(-6), newGain]);
    setTimeout(() => {
      setFloatingGains((prev) => prev.filter((g) => g.id !== newGain.id));
    }, 900);

    setGameState((prev) => {
      const activeCurrencyTier = Math.max(prev.currencyTier || 0, prev.moneyTier || 0);
      const activeClickGain = getClickGainTiered(
        prev.clockKhz,
        prev.clickMultiplier,
        currentArch.mult,
        prev.timeSlipCount || 0,
        activeCurrencyTier,
        currentArch.multTier || 0
      );
      const addedMoney = addAmounts(
        { value: prev.money, tier: prev.moneyTier || 0 },
        activeClickGain
      );
      const addedTotal = addAmounts(
        { value: prev.stats.totalMoneyEarned, tier: prev.stats.totalMoneyTier || 0 },
        activeClickGain
      );
      const nextClicks = prev.stats.totalClicks + 1;
      const nextCurrencyTier = Math.max(activeCurrencyTier, addedMoney.tier);
      const updated: GameSaveData = {
        ...prev,
        money: addedMoney.value,
        moneyTier: addedMoney.tier,
        currencyTier: nextCurrencyTier,
        stats: {
          ...prev.stats,
          totalClicks: nextClicks,
          totalMoneyEarned: addedTotal.value,
          totalMoneyTier: addedTotal.tier,
        },
      };

      updated.unlockedAchievements = checkAchievements(updated);

      if (nextClicks % 25 === 0) {
        executeSave(updated);
      }
      return updated;
    });
  };

  // Upgrades
  const handleUpgradeClock = () => {
    if (isTimeSlipping) return;
    const clockCost: TieredAmount = { value: gameState.costs.clock, tier: gameState.costs.clockTier || 0 };
    const playerMoney: TieredAmount = { value: gameState.money, tier: gameState.moneyTier || 0 };
    if (compareAmounts(playerMoney, clockCost) < 0) return;
    playSound.upgrade(gameState.settings.soundEnabled);

    setGameState((prev) => {
      const currentMoney: TieredAmount = { value: prev.money, tier: prev.moneyTier || 0 };
      const currentCost: TieredAmount = { value: prev.costs.clock, tier: prev.costs.clockTier || 0 };
      const remainingMoney = subtractCost(currentMoney, currentCost);
      const nextClockCost = normalizeTieredAmount({
        value: prev.costs.clock * 1.5,
        tier: prev.costs.clockTier || 0,
      });

      const updated: GameSaveData = {
        ...prev,
        money: remainingMoney.value,
        moneyTier: remainingMoney.tier,
        clockKhz: prev.clockKhz * 1.25,
        costs: {
          ...prev.costs,
          clock: nextClockCost.value,
          clockTier: nextClockCost.tier,
        },
        stats: {
          ...prev.stats,
          timesUpgraded: prev.stats.timesUpgraded + 1,
        },
      };
      updated.unlockedAchievements = checkAchievements(updated);
      executeSave(updated);
      return updated;
    });
  };

  const handleUpgradeCore = () => {
    if (isTimeSlipping) return;
    const coreCost: TieredAmount = { value: gameState.costs.core, tier: gameState.costs.coreTier || 0 };
    const playerMoney: TieredAmount = { value: gameState.money, tier: gameState.moneyTier || 0 };
    if (compareAmounts(playerMoney, coreCost) < 0) return;
    playSound.upgrade(gameState.settings.soundEnabled);

    setGameState((prev) => {
      const currentMoney: TieredAmount = { value: prev.money, tier: prev.moneyTier || 0 };
      const currentCost: TieredAmount = { value: prev.costs.core, tier: prev.costs.coreTier || 0 };
      const remainingMoney = subtractCost(currentMoney, currentCost);
      const nextCoreCost = normalizeTieredAmount({
        value: prev.costs.core * 1.8,
        tier: prev.costs.coreTier || 0,
      });

      const updated: GameSaveData = {
        ...prev,
        money: remainingMoney.value,
        moneyTier: remainingMoney.tier,
        cores: prev.cores + 1,
        costs: {
          ...prev.costs,
          core: nextCoreCost.value,
          coreTier: nextCoreCost.tier,
        },
        stats: {
          ...prev.stats,
          timesUpgraded: prev.stats.timesUpgraded + 1,
        },
      };
      updated.unlockedAchievements = checkAchievements(updated);
      executeSave(updated);
      return updated;
    });
  };

  const handleUpgradeCache = () => {
    if (isTimeSlipping) return;
    const cacheCost: TieredAmount = { value: gameState.costs.cache, tier: gameState.costs.cacheTier || 0 };
    const playerMoney: TieredAmount = { value: gameState.money, tier: gameState.moneyTier || 0 };
    if (compareAmounts(playerMoney, cacheCost) < 0) return;
    playSound.upgrade(gameState.settings.soundEnabled);

    setGameState((prev) => {
      const currentMoney: TieredAmount = { value: prev.money, tier: prev.moneyTier || 0 };
      const currentCost: TieredAmount = { value: prev.costs.cache, tier: prev.costs.cacheTier || 0 };
      const remainingMoney = subtractCost(currentMoney, currentCost);
      const nextCacheCost = normalizeTieredAmount({
        value: prev.costs.cache * 2.5,
        tier: prev.costs.cacheTier || 0,
      });

      const updated: GameSaveData = {
        ...prev,
        money: remainingMoney.value,
        moneyTier: remainingMoney.tier,
        clickMultiplier: prev.clickMultiplier * 2,
        costs: {
          ...prev.costs,
          cache: nextCacheCost.value,
          cacheTier: nextCacheCost.tier,
        },
        stats: {
          ...prev.stats,
          timesUpgraded: prev.stats.timesUpgraded + 1,
        },
      };
      updated.unlockedAchievements = checkAchievements(updated);
      executeSave(updated);
      return updated;
    });
  };

  // Evolve Architecture
  const handleEvolveArchitecture = () => {
    if (isTimeSlipping) return;
    const archCost: TieredAmount = { value: currentArch.cost, tier: currentArch.costTier || 0 };
    const playerMoney: TieredAmount = { value: gameState.money, tier: gameState.moneyTier || 0 };
    if (!nextArch || isMaxEvolution || compareAmounts(playerMoney, archCost) < 0) return;
    playSound.evolve(gameState.settings.soundEnabled);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [currentArch.color, '#58a6ff', '#f1e05a', '#ffffff'],
      });
    } catch {}

    setGameState((prev) => {
      const currentMoney: TieredAmount = { value: prev.money, tier: prev.moneyTier || 0 };
      const remainingMoney = subtractCost(currentMoney, archCost);
      const updated: GameSaveData = {
        ...prev,
        money: remainingMoney.value,
        moneyTier: remainingMoney.tier,
        architectureLevel: prev.architectureLevel + 1,
        stats: {
          ...prev.stats,
          timesUpgraded: prev.stats.timesUpgraded + 1,
        },
      };
      updated.unlockedAchievements = checkAchievements(updated);
      executeSave(updated);
      return updated;
    });
  };

  // Execute Time Slip Prestige (takes 1 second / 1000ms)
  const handleConfirmTimeSlip = () => {
    if (!canTimeSlip || isTimeSlipping) return;

    setIsTimeSlipOpen(false);
    setIsTimeSlipping(true);
    playSound.timeSlip(gameState.settings.soundEnabled);

    setTimeout(() => {
      // Cosmic warp confetti celebration
      try {
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#ffffff'],
        });
      } catch {}

      setGameState((prev) => {
        const nextTimeSlipCount = (prev.timeSlipCount || 0) + 1;
        const updated: GameSaveData = {
          ...prev,
          money: 0, // Reset money to $0 upon Time Slip (CPU is NOT reset!)
          moneyTier: 0,
          currencyTier: 0,
          timeSlipCount: nextTimeSlipCount,
          stats: {
            ...prev.stats,
            timesTimeSlipped: (prev.stats.timesTimeSlipped || 0) + 1,
          },
        };

        updated.unlockedAchievements = checkAchievements(updated);
        executeSave(updated);
        return updated;
      });

      setIsTimeSlipping(false);

      const nextTimelineMax = getMaxArchitectureLevel(timeSlipCount + 1);
      const newlyUnlockedStart = getArchitecture(maxAllowedArch + 1);
      const newlyUnlockedEnd = getArchitecture(nextTimelineMax);
      setSaveNotice(
        `第 ${timeSlipCount + 2} 世代世界線へタイムスリップ完了！新たに5段階のプロセス進化（「${newlyUnlockedStart.name}」〜「${newlyUnlockedEnd.name}」）が解放されました！`
      );
      setTimeout(() => setSaveNotice(null), 6000);
    }, 1000);
  };

  // Time Slip trigger: skips explanation dialog directly from 70th generation timeline
  const handleTimeSlipTrigger = () => {
    if (isTimeSlipping) return;
    if (isSkipExplanation && isMaxEvolution && canTimeSlip) {
      handleConfirmTimeSlip();
      return;
    }
    setIsTimeSlipOpen(true);
  };

  // Toggle Sound
  const toggleSound = () => {
    setGameState((prev) => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          soundEnabled: !prev.settings.soundEnabled,
        },
      };
      executeSave(updated);
      return updated;
    });
  };

  // Toggle Auto Upgrade
  const toggleAutoUpgrade = () => {
    setGameState((prev) => {
      const nextVal = prev.settings.autoUpgradeEnabled === false ? true : false;
      const updated: GameSaveData = {
        ...prev,
        settings: {
          ...prev.settings,
          autoUpgradeEnabled: nextVal,
        },
      };
      executeSave(updated);
      return updated;
    });

    const willBeEnabled = gameState.settings.autoUpgradeEnabled === false;
    setSaveNotice(
      willBeEnabled
        ? '🤖 自動アップグレード（最安順・0.5秒毎）をONにしました'
        : '自動アップグレードをOFFにしました'
    );
    setTimeout(() => setSaveNotice(null), 2500);
  };

  // Reset Game
  const handleResetGame = () => {
    clearAllSaveData();
    const freshData: GameSaveData = {
      ...DEFAULT_SAVE_DATA,
      stats: {
        ...DEFAULT_SAVE_DATA.stats,
        gameStartTime: Date.now(),
        lastSavedTimestamp: Date.now(),
      },
    };
    setGameState(freshData);
    saveGameData(freshData);
    playSound.upgrade(gameState.settings.soundEnabled);
    setIsResetModalOpen(false);
    setIsSaveManagerOpen(false);
    setSaveNotice('全データを初期化し、初期状態にリセットしました。');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  // Restore imported data
  const handleDataRestored = (restored: GameSaveData) => {
    setGameState(restored);
    setSaveNotice('セーブデータを復元しました！');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const timeSlipProgressPct = (() => {
    if (playerMoney.tier > timeSlipCost.tier) return 100;
    if (playerMoney.tier === timeSlipCost.tier) {
      return Math.min(100, Math.floor((playerMoney.value / timeSlipCost.value) * 100));
    }
    if (timeSlipCost.tier - playerMoney.tier === 1) {
      return Math.min(100, Math.floor(((playerMoney.value / 1e100) / timeSlipCost.value) * 100));
    }
    return 0;
  })();
  const remainingTimeSlip = subtractCost(timeSlipCost, playerMoney);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono selection:bg-purple-600 selection:text-white flex flex-col items-center p-3 sm:p-6">
      {/* Save Notification Toast */}
      {saveNotice && (
        <div className="fixed top-4 z-50 bg-gradient-to-r from-purple-950/95 to-slate-900/95 border border-purple-400 text-purple-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <Hourglass className="w-4 h-4 text-purple-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[660px] w-full">
        {/* Top Control Bar: Protection Badge, Timeline Info & Tool buttons */}
        <div className="flex items-center justify-between py-2 mb-2 text-xs border-b border-[#21262d] pb-3 gap-2 flex-wrap sm:flex-nowrap">
          {/* Data Protection Indicator */}
          <button
            onClick={() => setIsSaveManagerOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-emerald-500/60 transition-colors text-left cursor-pointer group"
            title="データ保護・バックアップ設定を開く"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                saveIndicatorActive ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'
              } transition-all`}
            />
            <span className="text-gray-300 group-hover:text-white font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              自動保存中
            </span>
          </button>

          {/* Time Slip Timeline Era Badge */}
          <button
            onClick={() => setIsTimeSlipOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              canTimeSlip && isMaxEvolution
                ? 'bg-purple-900/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950 animate-pulse'
                : 'bg-[#161b22] border-purple-500/30 text-purple-300 hover:border-purple-400'
            }`}
            title="タイムスリップ世界線情報"
          >
            <Hourglass className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">第 {timeSlipCount + 1} 世代世界線</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-amber-300 font-bold border border-purple-500/40">
              x{timeSlipMult.toLocaleString()}
            </span>
          </button>

          {/* Multi-Tier Currency Badge (When >= 1e100) */}
          {gameState.moneyTier && gameState.moneyTier >= 1 ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-950/80 border border-pink-500/60 text-pink-300 text-[11px] font-bold shadow-md shadow-pink-950/40"
              title="金額が10^100を超えたため、新しい通貨単位に移行しました"
            >
              <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
              <span>{getCurrencyUnitInfo(gameState.moneyTier).symbol}</span>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
            <button
              onClick={handleManualSave}
              className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-xs flex items-center gap-1 border border-[#30363d] transition-colors cursor-pointer"
              title="今すぐ手動保存"
            >
              <Save className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">即時保存</span>
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs flex items-center gap-1 border border-rose-800/60 hover:border-rose-500 transition-colors cursor-pointer"
              title="ゲームデータを完全に初期化（リセット）"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">リセット</span>
            </button>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] transition-colors cursor-pointer"
              title="統計・実績"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] transition-colors cursor-pointer"
              title={gameState.settings.soundEnabled ? '音声をミュート' : '音声を有効化'}
            >
              {gameState.settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="text-center border-b-2 border-[#58a6ff] pb-4 mb-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Cpu className="w-7 h-7 text-[#58a6ff]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white">
              CPU EVOLVER
            </h1>
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#58a6ff] mt-1 flex items-center justify-center gap-2">
            <span>{currentArch.name}</span>
            {timeSlipCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-400/40 text-purple-300 font-normal">
                世界線 #{timeSlipCount + 1}
              </span>
            )}
          </div>
          <div className="text-xs text-[#8b949e] mt-0.5">製造プロセス: {currentArch.node}</div>
        </header>

        {/* Interactive Die Visualizer Component */}
        <CpuVisualizer
          arch={currentArch}
          clockKhz={gameState.clockKhz}
          cores={gameState.cores}
          isCalculating={isClicking}
        />

        {/* Main Display Panel */}
        <div className="bg-[#161b22] rounded-xl p-4 sm:p-5 mb-5 border border-[#30363d] shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base sm:text-lg">
            <div className="flex justify-between items-center bg-[#0d1117] px-3.5 py-2.5 rounded-lg border border-[#21262d]">
              <span className="text-gray-400 text-sm">資金:</span>
              <div className="text-right">
                <span className="font-bold text-[#f1e05a] text-xl">
                  {formatCurrency(gameState.money, gameState.moneyTier || 0, formatNumber)}
                </span>
                {gameState.moneyTier && gameState.moneyTier >= 1 ? (
                  <span className="block text-[10px] text-pink-400 font-bold">
                    単位: {getCurrencyUnitInfo(gameState.moneyTier).name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#0d1117] px-3.5 py-2.5 rounded-lg border border-[#21262d]">
              <span className="text-gray-400 text-sm">演算能力:</span>
              <div className="text-right">
                <span className="font-bold text-white text-lg">
                  {formatCurrency(flopsTiered.value, flopsTiered.tier, formatNumber)} /s
                </span>
                {timeSlipCount > 0 && (
                  <span className="block text-[10px] text-amber-400">
                    (x{timeSlipMult.toLocaleString()} 時空ブースト)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#0d1117] px-3.5 py-2.5 rounded-lg border border-[#21262d]">
              <span className="text-gray-400 text-sm">クロック数:</span>
              <span className="font-bold text-white text-lg">{formatClock(gameState.clockKhz)}</span>
            </div>

            <div className="flex justify-between items-center bg-[#0d1117] px-3.5 py-2.5 rounded-lg border border-[#21262d]">
              <span className="text-gray-400 text-sm">コア数:</span>
              <span className="font-bold text-white text-lg">
                {gameState.cores} {gameState.cores > 1 ? 'Cores' : 'Core'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Click / Calculate Button */}
        <div className="text-center mb-6 relative">
          <button
            onClick={handleManualCalculate}
            className="w-full sm:w-auto relative py-5 px-8 sm:px-12 rounded-2xl font-extrabold text-lg sm:text-xl text-white shadow-xl transition-all cursor-pointer select-none active:scale-96 active:brightness-90 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #238636 100%)',
              boxShadow: '0 6px 20px rgba(31, 111, 235, 0.35)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
              演算サイクルを実行
            </span>
            <span className="flex items-center justify-center flex-wrap gap-1 text-[11px] text-emerald-100 font-normal mt-0.5 opacity-90">
              <span>1サイクル獲得: +{formatCurrency(clickGainTiered.value, clickGainTiered.tier, formatNumber)}</span>
              {currentCurrencyTier > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded text-[10px] font-semibold border border-amber-400/40">
                  単位連動: 10^{currentCurrencyTier * 100}倍
                </span>
              )}
            </span>

            {/* Floating click number indicators */}
            {floatingGains.map((g) => (
              <span
                key={g.id}
                className="absolute text-yellow-300 font-bold text-sm pointer-events-none transition-all duration-700 animate-bounce"
                style={{
                  left: g.x,
                  top: g.y - 20,
                  textShadow: '0 0 8px rgba(0,0,0,0.8)',
                }}
              >
                {g.text}
              </span>
            ))}
          </button>
        </div>

        {/* Upgrades & Evolution Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#58a6ff]" />
              強化・アップグレード
            </h2>

            {/* Auto Upgrade Toggle / Lock Indicator */}
            {isAutoUpgradeUnlocked ? (
              <button
                onClick={toggleAutoUpgrade}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isAutoUpgradeEnabled
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/40 hover:bg-emerald-900/60'
                    : 'bg-[#21262d] border-[#30363d] text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
                title="安いアップグレードから自動で購入する機能のON/OFF切り替え（0.5秒毎）"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>自動購入(最安順・0.5秒毎):</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-black tracking-wider ${
                    isAutoUpgradeEnabled
                      ? 'bg-emerald-500 text-black'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {isAutoUpgradeEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161b22] border border-gray-800 text-[11px] text-gray-400"
                title="第30世代世界線に到達すると、安いものから順に自動購入する機能が解放されます（0.5秒毎）"
              >
                <Lock className="w-3 h-3 text-gray-500" />
                <span>自動購入(0.5秒毎): 第30世代で解放</span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">
                  (現在: 第{currentTimeline}世代)
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-2.5">
            {/* Clock Upgrade */}
            <button
              onClick={handleUpgradeClock}
              disabled={compareAmounts(playerMoney, { value: gameState.costs.clock, tier: gameState.costs.clockTier || 0 }) < 0}
              className="w-full bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#30363d] disabled:opacity-40 disabled:hover:border-[#30363d] disabled:hover:bg-[#21262d] disabled:cursor-not-allowed text-[#c9d1d9] p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div>
                <strong className="text-sm sm:text-base text-white">クロックアップ (+25%)</strong>
                <p className="text-xs text-gray-400 mt-0.5">処理速度を向上させます</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">必要資金</span>
                <span className="text-[#f1e05a] font-bold text-sm sm:text-base">
                  {formatCurrency(gameState.costs.clock, gameState.costs.clockTier || 0, formatNumber)}
                </span>
              </div>
            </button>

            {/* Core Upgrade */}
            <button
              onClick={handleUpgradeCore}
              disabled={compareAmounts(playerMoney, { value: gameState.costs.core, tier: gameState.costs.coreTier || 0 }) < 0}
              className="w-full bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#30363d] disabled:opacity-40 disabled:hover:border-[#30363d] disabled:hover:bg-[#21262d] disabled:cursor-not-allowed text-[#c9d1d9] p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div>
                <strong className="text-sm sm:text-base text-white">コア増設 (+1 Core)</strong>
                <p className="text-xs text-gray-400 mt-0.5">並列処理で生産量を掛け算します</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">必要資金</span>
                <span className="text-[#f1e05a] font-bold text-sm sm:text-base">
                  {formatCurrency(gameState.costs.core, gameState.costs.coreTier || 0, formatNumber)}
                </span>
              </div>
            </button>

            {/* Cache Upgrade */}
            <button
              onClick={handleUpgradeCache}
              disabled={compareAmounts(playerMoney, { value: gameState.costs.cache, tier: gameState.costs.cacheTier || 0 }) < 0}
              className="w-full bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#30363d] disabled:opacity-40 disabled:hover:border-[#30363d] disabled:hover:bg-[#21262d] disabled:cursor-not-allowed text-[#c9d1d9] p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div>
                <strong className="text-sm sm:text-base text-white">キャッシュメモリ増設</strong>
                <p className="text-xs text-gray-400 mt-0.5">手動クリック時の獲得資金 +100%</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">必要資金</span>
                <span className="text-[#f1e05a] font-bold text-sm sm:text-base">
                  {formatCurrency(gameState.costs.cache, gameState.costs.cacheTier || 0, formatNumber)}
                </span>
              </div>
            </button>

            {/* Evolution Upgrade */}
            <button
              onClick={!isMaxEvolution ? handleEvolveArchitecture : handleTimeSlipTrigger}
              disabled={!isMaxEvolution && compareAmounts(playerMoney, { value: currentArch.cost, tier: currentArch.costTier || 0 }) < 0}
              className={`w-full bg-[#21262d] border-2 p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left shadow-lg ${
                isMaxEvolution
                  ? 'border-purple-500/80 hover:border-purple-400 bg-purple-950/20'
                  : 'border-[#f1e05a]/60 hover:border-[#f1e05a] hover:bg-[#30363d] disabled:opacity-40 disabled:hover:border-[#f1e05a]/60 disabled:hover:bg-[#21262d] disabled:cursor-not-allowed'
              } text-[#c9d1d9]`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <strong
                    className={`text-sm sm:text-base font-bold ${
                      isMaxEvolution ? 'text-purple-300' : 'text-[#f1e05a]'
                    }`}
                  >
                    {isMaxEvolution
                      ? isSkipExplanation && canTimeSlip
                        ? `現世代上限到達 (${currentGenTotalSteps}/${currentGenTotalSteps}回完了 ⚡即時跳躍可)`
                        : `現世代上限到達 (${currentGenTotalSteps}/${currentGenTotalSteps}回完了 - MAX)`
                      : `プロセス世代交代 (進化: ${evolutionsInCurrentGen}/${currentGenTotalSteps}回)`}
                  </strong>
                  <ChevronRight
                    className={`w-4 h-4 ${isMaxEvolution ? 'text-purple-400' : 'text-[#f1e05a]'}`}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {!isMaxEvolution && nextArch
                    ? `次世代「${nextArch.name}」へ微細化 (生産倍率 x${formatNumber(nextArch.mult)}${nextArch.multTier ? `·10^${nextArch.multTier * 100}` : ''}) [今世代進捗: ${evolutionsInCurrentGen}/${currentGenTotalSteps}回]`
                    : `現世代の全5回微細化が完了！タイムスリップで次の5段階（「${newlyUnlockedStart.name}」〜）が解放されます`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">
                  {isMaxEvolution ? '状態' : '進化コスト'}
                </span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    isMaxEvolution ? 'text-purple-300' : 'text-[#f1e05a]'
                  }`}
                >
                  {!isMaxEvolution ? formatCurrency(currentArch.cost, currentArch.costTier || 0, formatNumber) : 'MAX到達'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* TIME SLIP (PRESTIGE) SECTION */}
        <div
          className={`rounded-2xl p-4 sm:p-5 mb-6 border-2 transition-all ${
            isMaxEvolution
              ? canTimeSlip
                ? 'bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-pink-950/60 border-purple-400 shadow-2xl shadow-purple-950'
                : 'bg-[#14121d] border-purple-500/50 shadow-lg'
              : 'bg-[#121620] border-gray-800/80 opacity-90'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  isMaxEvolution
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                <Hourglass
                  className={`w-5 h-5 ${isMaxEvolution ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '6s' }}
                />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                  <span>タイムスリップ（時空跳躍・超越進化）</span>
                  {isMaxEvolution && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-950 border border-pink-500/50 text-pink-300 font-bold">
                      解放中
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-gray-400">
                  第 {timeSlipCount + 1} 世代 → 第 {timeSlipCount + 2} 世代世界線へ
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">跳躍必要資金</span>
              <span className="text-sm sm:text-base font-black text-amber-400">
                {formatCurrency(timeSlipCost.value, timeSlipCost.tier, formatNumber)}
              </span>
            </div>
          </div>

          {isSkipExplanation ? (
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 mb-3 text-xs text-purple-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">
                  第70世代世界線特典: タイムスリップ説明ダイアログは自動スキップされます
                </span>
              </div>
              <span className="text-[11px] text-pink-300 font-bold px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 shrink-0">
                即時跳躍モード
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              {isMaxEvolution ? (
                <>
                  現世代の進化（全{currentGenTotalSteps}回）が完了しました！タイムスリップを実行すると
                  <strong className="text-rose-400">「所持資金は $0 にリセット」</strong>
                  されますが、
                  <strong className="text-emerald-400">「CPUスペック（現行アーキテクチャ・クロック数・コア数・強化）はそのまま保持」</strong>
                  され、恒久演算倍率が <strong className="text-amber-400">x10倍</strong> 強化されて新たに5段階のプロセス進化
                  <strong className="text-pink-300">「{newlyUnlockedStart.name}」〜「{newlyUnlockedEnd.name}」</strong>
                  が一挙に解放されます。
                  <span className="text-gray-400 block text-[11px] mt-0.5">
                    ※タイムスリップにかかる資金は跳躍するたびに10,000倍（桁違いに急増）になります。
                  </span>
                </>
              ) : (
                <>
                  現タイムラインの進化が上限（{getArchitecture(maxAllowedArch).name}）に到達するとタイムスリップが実行可能になります（現在進捗: {evolutionsInCurrentGen}/{currentGenTotalSteps}回）。
                  CPUスペックを保持したまま資金のみリセットして次世代世界線へ跳躍し、さらに5段階のプロセス進化を解放できます。
                </>
              )}
            </p>
          )}

          {/* Progress to Time Slip Cost */}
          <div className="bg-[#0b0f16] rounded-xl p-3 border border-gray-800 mb-4">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-gray-400">資金蓄積率:</span>
              <span className="font-bold text-gray-200">
                {formatCurrency(gameState.money, gameState.moneyTier || 0, formatNumber)} / {formatCurrency(timeSlipCost.value, timeSlipCost.tier, formatNumber)} ({timeSlipProgressPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{
                  width: `${timeSlipProgressPct}%`,
                }}
              />
            </div>
          </div>

          {/* Time Slip Action Button */}
          <button
            onClick={handleTimeSlipTrigger}
            disabled={isTimeSlipping}
            className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
              isMaxEvolution && canTimeSlip
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white animate-pulse'
                : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d]'
            }`}
          >
            <Hourglass className={`w-4 h-4 ${isTimeSlipping ? 'animate-spin' : ''}`} />
            {isTimeSlipping
              ? '⚡ 時空跳躍中... (1.0秒)'
              : isMaxEvolution
              ? canTimeSlip
                ? isSkipExplanation
                  ? '⚡ タイムスリップを実行（説明省略・1秒跳躍）'
                  : '🌌 タイムスリップを実行（資金リセット ＆ 更なる進化解放）'
                : `タイムスリップの準備中 (あと ${formatCurrency(remainingTimeSlip.value, remainingTimeSlip.tier, formatNumber)} 必要)`
              : 'タイムスリップの詳細・ロードマップを確認'}
          </button>
        </div>

        {/* Footer info & Data persistence reminder */}
        <footer className="border-t border-[#21262d] pt-4 mt-6 text-center text-xs text-gray-500 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400">
              データは安全に自動保存されています (最終保存:{' '}
              {Math.max(0, Math.floor((Date.now() - lastSavedTime) / 1000))}秒前)
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] flex-wrap">
            <button
              onClick={() => setIsSaveManagerOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              バックアップ・引継ぎ
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTimeSlipOpen(true)}
              className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
            >
              タイムスリップ世界線
            </button>
            <span>•</span>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="text-pink-400 hover:text-pink-300 underline cursor-pointer"
            >
              プレイ統計・実績
            </button>
            <span>•</span>
            <button
              onClick={handleManualSave}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              即時保存
            </button>
            <span>•</span>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="text-rose-400 hover:text-rose-300 underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              データリセット
            </button>
          </div>
        </footer>
      </div>

      {/* Offline Earnings Dialog */}
      {offlineData && (
        <OfflineEarningsModal
          elapsedSeconds={offlineData.elapsedSeconds}
          offlineEarned={offlineData.offlineEarned}
          offlineTier={offlineData.offlineTier}
          flops={offlineData.flops}
          flopsTier={offlineData.flopsTier}
          onClaim={handleClaimOfflineEarnings}
          formatNumber={formatNumber}
        />
      )}

      {/* Time Slip Confirmation Modal */}
      <TimeSlipModal
        isOpen={isTimeSlipOpen}
        onClose={() => setIsTimeSlipOpen(false)}
        timeSlipCount={timeSlipCount}
        currentMoney={gameState.money}
        currentMoneyTier={gameState.moneyTier || 0}
        architectureLevel={gameState.architectureLevel}
        isMaxEvolution={isMaxEvolution}
        onConfirmTimeSlip={handleConfirmTimeSlip}
        formatNumber={formatNumber}
      />

      {/* Save & Backup Manager Modal */}
      <SaveManagerModal
        isOpen={isSaveManagerOpen}
        onClose={() => setIsSaveManagerOpen(false)}
        currentGameData={gameState}
        onManualSave={handleManualSave}
        onDataRestored={handleDataRestored}
        onResetGame={handleResetGame}
        lastSavedAt={lastSavedTime}
      />

      {/* Stats & Achievements Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={gameState.stats}
        currentArch={currentArch}
        timeSlipCount={timeSlipCount}
        formatNumber={formatNumber}
        unlockedAchievements={gameState.unlockedAchievements}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetGame}
        timeSlipCount={timeSlipCount}
      />

      {/* 1-Second Time Slip Cosmic Warp Overlay */}
      {isTimeSlipping && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in font-mono">
          <div className="w-full max-w-md bg-[#130f21] border-2 border-purple-500 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
            {/* Top cosmic beam */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 animate-pulse" />

            {/* Glowing icon */}
            <div className="relative my-4 inline-flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full bg-purple-600/30 blur-2xl animate-ping" />
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-400 text-purple-200 shadow-xl shadow-purple-950">
                <Hourglass className="w-10 h-10 animate-spin" style={{ animationDuration: '1s' }} />
              </div>
            </div>

            <h3 className="text-xl font-black text-white tracking-wider mb-1 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
              時空跳躍中...
            </h3>

            <p className="text-xs text-purple-300 mb-4 font-semibold">
              第 {timeSlipCount + 1} 世代世界線から第 {timeSlipCount + 2} 世代世界線へ突入しています
            </p>

            {/* 1.0 second progress bar */}
            <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-purple-800/80 mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full"
                style={{
                  animation: 'timeSlipProgress 1000ms linear forwards',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                次元トンネル通過中 (1.0秒)
              </span>
              <span className="text-pink-400 font-bold tracking-wider">WARPING...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
