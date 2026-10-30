import React from 'react';
import { Architecture } from '../types.ts';
import { Cpu, Zap, Activity } from 'lucide-react';

interface CpuVisualizerProps {
  arch: Architecture;
  clockKhz: number;
  cores: number;
  isCalculating: boolean;
}

export const CpuVisualizer: React.FC<CpuVisualizerProps> = ({
  arch,
  clockKhz,
  cores,
  isCalculating,
}) => {
  // Pulse animation speed based on clock
  const pulseDuration = Math.max(0.2, 2.0 - Math.log10(clockKhz) * 0.3);

  // Compute number of visual core blocks to render (cap at 16 visual dots/cells for layout)
  const visualCoreCount = Math.min(cores, 16);

  return (
    <div className="relative w-full rounded-xl bg-gradient-to-b from-[#111620] to-[#0c1017] border border-[#212c3d] p-5 shadow-2xl overflow-hidden my-4">
      {/* Background ambient circuit glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at center, ${arch.color} 0%, transparent 70%)`,
        }}
      />

      {/* Top Header inside Chip visualizer */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-semibold">DIE INSPECTION</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{arch.node} Process</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">{arch.year} Era</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/70 border border-blue-500/30 text-blue-300">
            x{arch.mult.toLocaleString()} Multiplier
          </span>
        </div>
      </div>

      {/* Main CPU Die / Chip Presentation */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2">
        {/* Physical Chip Graphic */}
        <div className="relative flex items-center justify-center">
          {/* External Pins decoration */}
          {arch.id < 2 ? (
            /* DIP Package Pins */
            <div className="absolute -inset-x-3 flex flex-col justify-between h-28 pointer-events-none">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between w-full">
                  <div className="w-3 h-1.5 bg-amber-400/80 rounded-l shadow-sm" />
                  <div className="w-3 h-1.5 bg-amber-400/80 rounded-r shadow-sm" />
                </div>
              ))}
            </div>
          ) : (
            /* PGA / BGA substrate border */
            <div
              className="absolute -inset-2 rounded-2xl border border-dashed transition-colors duration-500 pointer-events-none"
              style={{ borderColor: `${arch.color}40` }}
            />
          )}

          {/* Central Die Body */}
          <div
            className={`relative w-40 h-40 rounded-xl flex flex-col items-center justify-center p-3 text-center transition-all duration-300 select-none shadow-xl ${
              isCalculating ? 'scale-[1.03]' : 'scale-100'
            }`}
            style={{
              backgroundColor: '#161d27',
              border: `2px solid ${arch.color}`,
              boxShadow: `0 0 25px ${arch.color}33`,
            }}
          >
            {/* Corner alignment marks for realism */}
            <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-gray-500" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-gray-500" />
            <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-gray-500" />
            <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-gray-500" />

            {/* Inner Silicon Die Core */}
            <div
              className="w-24 h-24 rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all"
              style={{
                backgroundColor: '#0a0d14',
                border: '1px solid #2a374a',
              }}
            >
              {/* Circuit lines animation */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#58a6ff 1px, transparent 1px), linear-gradient(to right, #212c3d 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />

              {/* Pulsing Core Energy */}
              <div
                className="absolute inset-2 rounded opacity-30 animate-pulse"
                style={{
                  backgroundColor: arch.color,
                  animationDuration: `${pulseDuration}s`,
                }}
              />

              <Cpu
                className={`w-10 h-10 transition-transform duration-150 relative z-10 ${
                  isCalculating ? 'scale-115 text-white' : ''
                }`}
                style={{ color: arch.color }}
              />

              <span className="text-[10px] font-mono font-bold mt-1 text-gray-300 relative z-10 tracking-wider">
                {arch.id === 6 ? 'QUANTUM' : arch.id >= 4 ? '64-BIT' : arch.id >= 3 ? '32-BIT' : 'CISC'}
              </span>
            </div>

            {/* Chip Label on substrate */}
            <span
              className="text-[11px] font-mono font-bold mt-2 truncate max-w-[130px]"
              style={{ color: arch.color }}
            >
              {arch.name}
            </span>
          </div>
        </div>

        {/* Real-time Die Telemetry Panel */}
        <div className="flex-1 w-full flex flex-col justify-center space-y-3 font-mono text-xs">
          {/* Active Cores Grid */}
          <div className="bg-[#0f141c] p-2.5 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                稼働コアマトリクス ({cores} {cores > 1 ? 'Cores' : 'Core'})
              </span>
              <span className="text-[10px] text-gray-500">
                {cores > 16 ? `(上位16コア表示)` : '全コア同期'}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: visualCoreCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-3 rounded-xs transition-colors duration-200"
                  style={{
                    backgroundColor: isCalculating
                      ? '#22c55e'
                      : idx === 0
                      ? arch.color
                      : `${arch.color}bb`,
                    boxShadow: isCalculating ? '0 0 6px #22c55e' : 'none',
                  }}
                  title={`Core #${idx + 1}: 稼働中`}
                />
              ))}
            </div>
          </div>

          {/* Clock Pulse Monitor */}
          <div className="bg-[#0f141c] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>クロック発振周期</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-bold">
                {pulseDuration < 0.5 ? '超高周波' : `${pulseDuration.toFixed(2)}s / 周期`}
              </span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: arch.color,
                  animation: `ping ${pulseDuration}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                }}
              />
            </div>
          </div>

          {/* Process Architecture Note */}
          <div className="text-[11px] text-gray-400 italic bg-[#0f141c]/50 px-2.5 py-1.5 rounded border border-gray-800/60">
            "{arch.description}"
          </div>
        </div>
      </div>
    </div>
  );
};
