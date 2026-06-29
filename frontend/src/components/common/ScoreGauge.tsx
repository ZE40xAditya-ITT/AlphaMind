import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label, size = 'md', tooltip = '' }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // Animate counter from 0 to target score
    const duration = 1000; // 1s
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const val = Math.min(score, Math.round((score / steps) * step * 10) / 10);
      setAnimatedScore(val);
      if (step >= steps) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Circle calculations: radius = 45, circumference = 2 * PI * 45 = 282.74 (~283)
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Determine colors based on score
  const getColor = (s: number) => {
    if (s >= 85) return 'stroke-emerald-500 text-emerald-400';
    if (s >= 70) return 'stroke-blue-500 text-blue-400';
    if (s >= 55) return 'stroke-amber-500 text-amber-400';
    if (s >= 40) return 'stroke-orange-500 text-orange-400';
    return 'stroke-red-500 text-red-400';
  };

  const getBgColor = (s: number) => {
    if (s >= 85) return 'text-emerald-950/30';
    if (s >= 70) return 'text-blue-950/30';
    if (s >= 55) return 'text-amber-950/30';
    if (s >= 40) return 'text-orange-950/30';
    return 'text-red-950/30';
  };

  const sizeClasses = {
    sm: { box: 'w-24 h-24', text: 'text-lg', label: 'text-xs' },
    md: { box: 'w-36 h-36', text: 'text-2xl', label: 'text-sm' },
    lg: { box: 'w-48 h-48', text: 'text-4xl', label: 'text-base' },
  };

  const currentSize = sizeClasses[size];

  return (
    <Tooltip content={tooltip}>
      <div className="flex flex-col items-center justify-center text-center p-2 cursor-help">
        <div className={`relative ${currentSize.box}`}>
          {/* SVG gauge */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className={`fill-transparent ${getBgColor(score)} stroke-slate-800/80`}
              cx="50"
              cy="50"
              r={radius}
              strokeWidth={strokeWidth}
            />
            {/* Active progress circle */}
            <circle
              className={`fill-transparent transition-all duration-1000 ease-out ${getColor(score)}`}
              cx="50"
              cy="50"
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          {/* Score count display in the center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-bold tracking-tight ${currentSize.text} ${getColor(score).split(' ')[1]}`}>
              {animatedScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-semibold">Score</span>
          </div>
        </div>
        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300 tracking-wide border-b border-dotted border-slate-500/50">{label}</p>
      </div>
    </Tooltip>
  );
};

export default ScoreGauge;
