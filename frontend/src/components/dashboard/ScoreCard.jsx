import { useEffect, useState } from 'react';
import './ScoreCard.css';

const getScoreColor = (score, max) => {
  const ratio = score / max;
  if (ratio >= 0.8) return '#10b981';   // green - excellent
  if (ratio >= 0.6) return '#6366f1';   // purple - good
  if (ratio >= 0.4) return '#f59e0b';   // amber - okay
  return '#ef4444';                      // red - poor
};

const getScoreLabel = (score, max) => {
  const ratio = score / max;
  if (ratio >= 0.9) return 'Excellent';
  if (ratio >= 0.7) return 'Good';
  if (ratio >= 0.5) return 'Okay';
  if (ratio >= 0.3) return 'Poor';
  return 'Critical';
};

const CircleProgress = ({ value, max, size = 100, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const color = getScoreColor(value, max);

  useEffect(() => {
    const progress = value / max;
    const timer = setTimeout(() => {
      setOffset(circumference * (1 - progress));
    }, 100);
    return () => clearTimeout(timer);
  }, [value, max, circumference]);

  return (
    <svg width={size} height={size} className="score-ring">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: `drop-shadow(0 0 6px ${color})`,
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
  );
};

const AnimatedNumber = ({ target }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <>{display}</>;
};

const ScoreCard = ({ score }) => {
  const daily = score?.daily ?? 8;
  const monthly = score?.monthly ?? null;
  const monthlyLabel = score?.monthly_label ?? null;
  const color = getScoreColor(daily, 10);
  const label = getScoreLabel(daily, 10);

  return (
    <div className="score-card glass-card">
      <div className="score-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
      
      <div className="score-title">Daily Score</div>

      <div className="score-ring-wrap">
        <CircleProgress value={daily} max={10} size={108} strokeWidth={9} />
        <div className="score-center">
          <span className="score-fraction" style={{ color }}>
            <span className="score-number"><AnimatedNumber target={daily} /></span>
            <span className="score-denom">/10</span>
          </span>
        </div>
      </div>

      <div className="score-label" style={{ color }}>{label}</div>

      {monthly !== null && monthlyLabel && (
        <div className="score-monthly">
          <span className="score-monthly-label">{monthlyLabel}</span>
          <span className="score-monthly-value" style={{ color: getScoreColor(monthly, 100) }}>
            {monthly}/100
          </span>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
