import { Flame } from 'lucide-react';
import './StreakBadge.css';

const StreakBadge = ({ streak = 0, message }) => {
  const isEmpty = streak === 0;

  return (
    <div className={`streak-card glass-card ${isEmpty ? 'streak-empty' : ''}`}>
      <div className="streak-icon-wrap">
        <Flame size={32} color={isEmpty ? 'var(--text-muted)' : '#f97316'} />
      </div>
      <div className="streak-info">
        <div className="streak-number" style={{ color: isEmpty ? 'var(--text-muted)' : '#f97316' }}>
          {streak}
        </div>
        <div className="streak-label">Day Streak</div>
        {message && <div className="streak-message">{message}</div>}
      </div>
      {!isEmpty && (
        <div className="streak-glow" />
      )}
    </div>
  );
};

export default StreakBadge;
