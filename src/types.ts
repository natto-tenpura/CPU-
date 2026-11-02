/**
 * CPU Evolver - Game Types and Constants
 */

export interface Architecture {
  id: number;
  name: string;
  node: string;
  mult: number;
  cost: number;
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
  return {
    id: level,
    name: `高次元オメガ超越コア MK-${extra}`,
    node: `Trans-finite Dim ${extra}`,
    mult: last.mult * Math.pow(15, extra),
    cost: last.cost * Math.pow(25, extra),
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

/**
 * Time Slip cost increases progressively with each Time Slip performed.
 * Time Slip 0: $100,000,000 ($100M)
 * Time Slip 1: $2,000,000,000 ($2B)
 * Time Slip 2: $50,000,000,000 ($50B)
 * Time Slip 3: $1,500,000,000,000 ($1.5T)
 * etc.
 */
export function getTimeSlipCost(timeSlipCount: number): number {
  const baseCost = 100000000;
  const multipliers = [1, 20, 500, 15000, 500000, 20000000];
  if (timeSlipCount < multipliers.length) {
    return baseCost * multipliers[timeSlipCount];
  }
  return baseCost * multipliers[multipliers.length - 1] * Math.pow(25, timeSlipCount - multipliers.length + 1);
}

/**
 * Permanent prestige multiplier applied to all FLOPS and manual clicks from Time Slip.
 */
export function getTimeSlipMultiplier(timeSlipCount: number): number {
  return Math.pow(10, Math.max(0, timeSlipCount));
}

export interface Costs {
  clock: number;
  core: number;
  cache: number;
}

export interface GameStats {
  totalMoneyEarned: number;
  totalClicks: number;
  gameStartTime: number;
  lastSavedTimestamp: number;
  offlineEarningsClaimedTotal: number;
  timesUpgraded: number;
  timesTimeSlipped: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  autoSaveIntervalSec: number;
}

export interface GameSaveData {
  version: number;
  money: number;
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
