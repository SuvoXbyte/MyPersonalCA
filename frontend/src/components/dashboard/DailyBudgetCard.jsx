import { CalendarRange, Activity, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './DashboardCards.css';

const DailyBudgetCard = ({ dailyBudget }) => {
  const limit = dailyBudget?.limit ?? 0;
  const spentToday = dailyBudget?.spent_today ?? 0;
  const remainingDays = dailyBudget?.remaining_days ?? 0;
  const isOverspent = limit > 0 && spentToday > limit;

  return (
    <div className={`balance-card glass-card ${isOverspent ? 'balance-card-low' : ''}`}>
      <div className="balance-card-header">
        <div className="balance-card-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
          <CalendarRange size={22} />
        </div>
        <span className="balance-card-label">Daily Budget</span>
        {isOverspent && <span className="badge badge-red">Over Limit</span>}
      </div>

      <div className="balance-amount">
        <span className="amount-positive">
          {formatCurrency(limit)}
        </span>
      </div>

      <div className="balance-projected">
        <div className="balance-projected-row">
          <Activity size={14} color={isOverspent ? 'var(--accent-red)' : 'var(--accent-green)'} />
          <span className="balance-projected-label">Today's Expense:</span>
          <span className={`balance-projected-amount ${isOverspent ? 'amount-negative' : 'amount-positive'}`}>
            {formatCurrency(spentToday)}
          </span>
        </div>
        
        {limit > 0 ? (
          <div className="balance-projected-row" style={{ marginTop: '4px', opacity: 0.8 }}>
            <span className="balance-projected-label">Remaining days:</span>
            <span className="upcoming-days">{remainingDays} days</span>
          </div>
        ) : (
          <div className="balance-projected-row" style={{ marginTop: '4px', opacity: 0.6 }}>
            <HelpCircle size={12} style={{ marginRight: '4px' }} />
            <span className="balance-projected-label" style={{ fontSize: '0.75rem' }}>
              Set monthly budget to activate
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBudgetCard;
