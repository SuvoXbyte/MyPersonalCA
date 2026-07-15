import { PieChart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './DashboardCards.css';

const BudgetProgressCard = ({ budgets = [] }) => {
  return (
    <div className="dash-card glass-card">
      <div className="dash-card-header">
        <div className="dash-card-title">
          <PieChart size={18} color="var(--accent-primary)" />
          <span>Budget Progress</span>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="dash-card-empty">
          <span>No budgets set for this month</span>
        </div>
      ) : (
        <div className="budget-progress-list">
          {budgets.map((b) => {
            const pct = b.monthly_limit > 0
              ? Math.min(Math.round((b.spent / b.monthly_limit) * 100), 100)
              : 0;
            const colorClass = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green';
            return (
              <div key={b.id || b.category} className="budget-progress-item">
                <div className="budget-progress-header">
                  <span className="budget-category">{b.category}</span>
                  <span className="budget-amounts">
                    <span className={pct >= 90 ? 'amount-negative' : pct >= 70 ? '' : 'amount-positive'}>
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="budget-sep"> / </span>
                    <span>{formatCurrency(b.monthly_limit)}</span>
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar-fill ${colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="budget-progress-footer">
                  <span className={`budget-pct ${colorClass === 'red' ? 'amount-negative' : colorClass === 'amber' ? '' : 'amount-positive'}`}>
                    {pct}% used
                  </span>
                  {b.remaining !== undefined && (
                    <span className="budget-remaining">
                      {b.remaining >= 0
                        ? `${formatCurrency(b.remaining)} left`
                        : <span className="amount-negative">{formatCurrency(Math.abs(b.remaining))} over</span>
                      }
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetProgressCard;
