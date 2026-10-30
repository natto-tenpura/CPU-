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

export const ARCHITECTURES: Architecture[] = [
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
    cost: Infinity,
    year: "FUTURE",
    description: "量子重ね合わせと超伝導回路による非ノイマン型超高速並列量子演算。",
    color: "#f59e0b"
  }
];

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
