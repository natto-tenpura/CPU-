/**
 * CPU Evolver - Game Types, Constants and Multi-Tier Currency Engine
 */

export interface Architecture {
  id: number;
  name: string;
  node: string;
  mult: number;
  cost: number;
  costTier?: number; // 0 for $, 1 for G$, etc.
  year: string;
  description: string;
  color: string;
}

export const BASE_ARCHITECTURES: Architecture[] = [
  {
    id: 0,
    name: "4-bit Microprocessor",
    node: "10,000 nm",
    mult: 1,
    cost: 500,
    costTier: 0,
    year: "1971",
    description: "世界初の商用マイクロプロセッサ。電卓や初期組み込み機器向け。",
    color: "#eab308"
  },
  {
    id: 1,
    name: "8-bit Processor (8080系)",
    node: "6,000 nm",
    mult: 3,
    cost: 2500,
    costTier: 0,
    year: "1974",
    description: "パーソナルコンピュータ革命の幕開けとなった8ビットCISCプロセッサ。",
    color: "#38bdf8"
  },
  {
    id: 2,
    name: "16-bit CISC Processor",
    node: "3,000 nm",
    mult: 10,
    cost: 15000,
    costTier: 0,
    year: "1982",
    description: "16ビットバスとプロテクトモードを搭載。オフィスPCの標準へ。",
    color: "#a855f7"
  },
  {
    id: 3,
    name: "32-bit Pentium世代",
    node: "350 nm",
    mult: 50,
    cost: 100000,
    costTier: 0,
    year: "1995",
    description: "スーパースカラ実行とFPU内蔵。3Dグラフィックスとインターネット黎明期を支えた名機。",
    color: "#ec4899"
  },
  {
    id: 4,
    name: "64-bit Multi-Core時代",
    node: "45 nm",
    mult: 300,
    cost: 1000000,
    costTier: 0,
    year: "2008",
    description: "クロック至上主義からマルチコア並列処理への転換。64ビット大容量メモリ対応。",
    color: "#22c55e"
  },
  {
    id: 5,
    name: "Extreme EUV Processor",
    node: "3 nm",
    mult: 2000,
    cost: 10000000,
    costTier: 0,
    year: "2024",
    description: "極端紫外線リソグラフィとGAAトランジスタ技術で数十億素子を集積した現代の極致。",
    color: "#06b6d4"
  },
  {
    id: 6,
    name: "超伝導・量子プロセッサ",
    node: "0.1 nm (Sub-atomic)",
    mult: 20000,
    cost: 50000000,
    costTier: 0,
    year: "2035",
    description: "量子重ね合わせと超伝導回路による非ノイマン型超高速並列量子演算。",
    color: "#f59e0b"
  },
  // Further transcendent evolutions unlocked via Time Slip:
  {
    id: 7,
    name: "光子ニューロモルフィック",
    node: "0.01 nm (Photonic)",
    mult: 200000,
    cost: 500000000,
    costTier: 0,
    year: "2060",
    description: "超小型光導波路による光速演算とシナプス模倣型ニューロ超並列プロセッサ。",
    color: "#a78bfa"
  },
  {
    id: 8,
    name: "超弦理論・時空歪曲コア",
    node: "10^-35 m (Planck)",
    mult: 2000000,
    cost: 5000000000,
    costTier: 0,
    year: "2150",
    description: "プランク長スケールの多次元時空振動を利用した局所時間歪曲演算ユニット。",
    color: "#f43f5e"
  },
  {
    id: 9,
    name: "多元宇宙並列演算マトリクス",
    node: "Omniverse Mesh",
    mult: 25000000,
    cost: 60000000000,
    costTier: 0,
    year: "2500",
    description: "無数の分岐平行宇宙から演算結果を量子トンネル経由で即時抽出する多次元アレイ。",
    color: "#10b981"
  },
  {
    id: 10,
    name: "宇宙定数シミュレータ",
    node: "Cosmic Horizon",
    mult: 350000000,
    cost: 800000000000,
    costTier: 0,
    year: "3500",
    description: "暗黒物質と真空エネルギーを直接情報ビットとして符号化する銀河規模超構造。",
    color: "#3b82f6"
  },
  {
    id: 11,
    name: "オムニ次元オメガ特異点",
    node: "Singularity Point",
    mult: 5000000000,
    cost: 10000000000000,
    costTier: 0,
    year: "∞ (超越)",
    description: "すべての物理法則と事象の地平面を超越した無限階層演算の究極到達点。",
    color: "#fbbf24"
  }
];

export const ARCHITECTURES: Architecture[] = BASE_ARCHITECTURES;

/**
 * Returns architecture definition, dynamically generating higher iterations if beyond predefined list.
 */
export function getArchitecture(level: number): Architecture {
  if (level < BASE_ARCHITECTURES.length) {
    return BASE_ARCHITECTURES[level];
  }
  const extra = level - BASE_ARCHITECTURES.length + 1;
  const last = BASE_ARCHITECTURES[BASE_ARCHITECTURES.length - 1];

  const costExp = Math.log10(last.cost) + extra * Math.log10(25);
  const costTier = Math.floor(costExp / 100);
  const costRem = costExp - costTier * 100;

  return {
    id: level,
    name: `高次元オメガ超越コア MK-${extra}`,
    node: `Trans-finite Dim ${extra}`,
    mult: last.mult * Math.pow(15, extra),
    cost: Math.pow(10, costRem),
    costTier,
    year: `ERA-Ω+${extra}`,
    description: `第${extra}重オムニ次元の時空超越演算体を統合した高次元特異点プロセッサ。`,
    color: extra % 2 === 0 ? "#ec4899" : "#8b5cf6"
  };
}

/**
 * The maximum evolution level available for a given timeSlipCount.
 * Base game (timeSlipCount=0): MAX level is 6 (超伝導・量子プロセッサ).
 * Each Time Slip raises the MAX cap by +1!
 */
export function getMaxArchitectureLevel(timeSlipCount: number): number {
  return 6 + Math.max(0, timeSlipCount);
}

// -------------------------------------------------------------
// Multi-Tier Currency Engine (e+100 Threshold -> 1 New Unit)
// -------------------------------------------------------------

export interface TieredAmount {
  value: number;
  tier: number; // 0 for $, 1 for G$, 2 for G^2$, etc.
}

/**
 * Normalizes an amount so that value < 1e100.
 * Every 1e100 is rolled over as 1 of the next unit tier.
 */
export function normalizeTieredAmount(amount: TieredAmount): TieredAmount {
  let val = Math.max(0, isFinite(amount.value) ? amount.value : 0);
  let tier = Math.max(0, isFinite(amount.tier) ? Math.floor(amount.tier) : 0);

  if (val === 0) {
    return { value: 0, tier: 0 };
  }

  while (val >= 1e100) {
    val /= 1e100;
    tier += 1;
  }

  while (val < 1 && tier > 0) {
    val *= 1e100;
    tier -= 1;
  }

  return { value: val, tier };
}

/**
 * Compares two amounts. Returns > 0 if a > b, < 0 if a < b, 0 if equal.
 */
export function compareAmounts(a: TieredAmount, b: TieredAmount): number {
  const normA = normalizeTieredAmount(a);
  const normB = normalizeTieredAmount(b);

  if (normA.tier !== normB.tier) {
    return normA.tier - normB.tier;
  }
  return normA.value - normB.value;
}

/**
 * Adds two tiered amounts together.
 */
export function addAmounts(a: TieredAmount, b: TieredAmount): TieredAmount {
  const normA = normalizeTieredAmount(a);
  const normB = normalizeTieredAmount(b);

  if (normA.value === 0) return normB;
  if (normB.value === 0) return normA;

  if (normA.tier === normB.tier) {
    return normalizeTieredAmount({
      value: normA.value + normB.value,
      tier: normA.tier,
    });
  }

  const higher = normA.tier > normB.tier ? normA : normB;
  const lower = normA.tier > normB.tier ? normB : normA;
  const tierDiff = higher.tier - lower.tier;

  if (tierDiff === 1) {
    return normalizeTieredAmount({
      value: higher.value + lower.value / 1e100,
      tier: higher.tier,
    });
  }

  return { ...higher };
}

/**
 * Subtracts cost from current amount. Returns new amount.
 */
export function subtractCost(current: TieredAmount, cost: TieredAmount): TieredAmount {
  const normCurrent = normalizeTieredAmount(current);
  const normCost = normalizeTieredAmount(cost);

  if (compareAmounts(normCurrent, normCost) < 0) {
    return normCurrent;
  }

  if (normCurrent.tier === normCost.tier) {
    const remaining = normCurrent.value - normCost.value;
    return normalizeTieredAmount({
      value: Math.max(0, remaining),
      tier: normCurrent.tier,
    });
  }

  const tierDiff = normCurrent.tier - normCost.tier;
  if (tierDiff === 1) {
    const remaining = normCurrent.value - normCost.value / 1e100;
    return normalizeTieredAmount({
      value: Math.max(0, remaining),
      tier: normCurrent.tier,
    });
  }

  return normCurrent;
}

/**
 * Returns formatted currency string with appropriate unit:
 * Tier 0: $1.50M
 * Tier 1: 1.50M G$ (1 G$ = 10^100 $)
 * Tier 2: 1.50M G²$ (1 G²$ = 10^200 $)
 */
export function formatCurrency(
  value: number,
  tier: number = 0,
  formatNumberFn: (num: number) => string
): string {
  const norm = normalizeTieredAmount({ value, tier });
  const numStr = formatNumberFn(norm.value);

  if (norm.tier <= 0) {
    return `$${numStr}`;
  }
  if (norm.tier === 1) {
    return `${numStr} G$`;
  }
  if (norm.tier === 2) {
    return `${numStr} G²$`;
  }
  if (norm.tier === 3) {
    return `${numStr} G³$`;
  }
  return `${numStr} G^${norm.tier}$`;
}

export function getCurrencyUnitInfo(tier: number = 0): { symbol: string; name: string } {
  if (tier <= 0) {
    return { symbol: '$', name: '標準ドル ($)' };
  }
  if (tier === 1) {
    return { symbol: 'G$', name: 'グーゴルドル (1 G$ = 10¹⁰⁰ $)' };
  }
  if (tier === 2) {
    return { symbol: 'G²$', name: '第2グーゴルドル (1 G²$ = 10²⁰⁰ $)' };
  }
  if (tier === 3) {
    return { symbol: 'G³$', name: '第3グーゴルドル (1 G³$ = 10³⁰⁰ $)' };
  }
  return { symbol: `G^${tier}$`, name: `第${tier}グーゴルドル (10^${tier * 100} $)` };
}

/**
 * Time Slip cost increases by exactly 10,000x for every Time Slip performed.
 * Evaluated in tiered units (every 10^100 is 1 of next unit).
 */
export function getTimeSlipCostTiered(timeSlipCount: number): TieredAmount {
  // Base cost = $100M = 10^8
  // Every time slip cost multiplies by 10,000 = 10^4
  // Total exponent in dollars = 8 + 4 * count
  const totalExp = 8 + 4 * Math.max(0, timeSlipCount);
  const tier = Math.floor(totalExp / 100);
  const remainderExp = totalExp - tier * 100;
  const value = Math.pow(10, remainderExp);
  return { value, tier };
}

export function getTimeSlipCost(timeSlipCount: number): number {
  const tiered = getTimeSlipCostTiered(timeSlipCount);
  if (tiered.tier === 0) return tiered.value;
  return tiered.value * Math.pow(10, tiered.tier * 100);
}

/**
 * Calculates FLOPS as a TieredAmount.
 */
export function getFlopsTiered(
  clockKhz: number,
  cores: number,
  archMult: number,
  timeSlipCount: number
): TieredAmount {
  const baseFlops = (clockKhz / 10) * cores * archMult;
  if (baseFlops <= 0) return { value: 0, tier: 0 };

  const baseLog = Math.log10(baseFlops);
  const totalExp = baseLog + Math.max(0, timeSlipCount);

  const tier = Math.floor(totalExp / 100);
  const remainderExp = totalExp - tier * 100;
  const value = Math.pow(10, remainderExp);

  return { value, tier };
}

/**
 * Calculates Click Gain as a TieredAmount.
 */
export function getClickGainTiered(
  clockKhz: number,
  clickMultiplier: number,
  archMult: number,
  timeSlipCount: number
): TieredAmount {
  const baseGain = Math.max(1, (clockKhz / 100) * clickMultiplier * archMult);
  const baseLog = Math.log10(baseGain);
  const totalExp = baseLog + Math.max(0, timeSlipCount);

  const tier = Math.floor(totalExp / 100);
  const remainderExp = totalExp - tier * 100;
  const value = Math.pow(10, remainderExp);

  return { value, tier };
}

export function getTimeSlipMultiplier(timeSlipCount: number): number {
  return Math.pow(10, Math.min(300, Math.max(0, timeSlipCount)));
}

export interface Costs {
  clock: number;
  core: number;
  cache: number;
  clockTier?: number;
  coreTier?: number;
  cacheTier?: number;
}

export interface GameStats {
  totalMoneyEarned: number;
  totalMoneyTier?: number;
  totalClicks: number;
  gameStartTime: number;
  lastSavedTimestamp: number;
  offlineEarningsClaimedTotal: number;
  offlineEarningsClaimedTier?: number;
  timesUpgraded: number;
  timesTimeSlipped: number;
}

export const AUTO_UPGRADE_UNLOCK_TIMELINE = 30; // 第30世代世界線で自動アップグレード解放
export const SKIP_EXPLANATION_TIMELINE = 70; // 第70世代世界線から説明を非表示・即時タイムスリップ

export interface GameSettings {
  soundEnabled: boolean;
  autoSaveIntervalSec: number;
  autoUpgradeEnabled: boolean;
}

export interface GameSaveData {
  version: number;
  money: number;
  moneyTier?: number; // 0 for $, 1 for G$, 2 for G^2$
  clockKhz: number;
  cores: number;
  clickMultiplier: number;
  architectureLevel: number;
  timeSlipCount: number;
  costs: Costs;
  stats: GameStats;
  settings: GameSettings;
  unlockedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rewardText: string;
}
