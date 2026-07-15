import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, getDaysFromToday } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import './DashboardCards.css';

const OverdueCard = ({ items = [], onMarkPaid }) => {
  return (
    <div className="dash-card glass-card">
      <div className="dash-card-header">
        <div className="dash-card-title">
          <AlertTriangle size={18} color="var(--accent-red)" />
          <span>Overdue</span>
          {items.length > 0 && (
            <span className="badge badge-red">{items.length}</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dash-card-empty">
          <span>🎉 No overdue items!</span>
        </div>
      ) : (
        <div className="obligation-list">
          {items.map((item) => {
            const days = getDaysFromToday(item.due_date);
            return (
              <div key={item.id} className="obligation-list-item overdue-item">
                <div className="obligation-list-info">
                  <span className="obligation-list-name">{item.name}</span>
                  <span className="obligation-list-meta">
                    <StatusBadge status={item.type} />
                    <span className="amount-negative">
                      {days !== null ? `${Math.abs(days)}d overdue` : ''}
                    </span>
                  </span>
                </div>
                <div className="obligation-list-right">
                  <span className="obligation-list-amount amount-negative">
                    {formatCurrency(item.amount)}
                  </span>
                  {onMarkPaid && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onMarkPaid(item.id)}
                    >
                      Mark Paid
                    </button>
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

export default OverdueCard;
