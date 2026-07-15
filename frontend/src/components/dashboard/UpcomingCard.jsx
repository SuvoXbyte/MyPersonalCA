import { Clock } from 'lucide-react';
import { formatCurrency, formatDate, getDaysFromToday } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import './DashboardCards.css';

const UpcomingCard = ({ items = [], onMarkPaid }) => {
  return (
    <div className="dash-card glass-card">
      <div className="dash-card-header">
        <div className="dash-card-title">
          <Clock size={18} color="var(--accent-amber)" />
          <span>Upcoming (14 days)</span>
          {items.length > 0 && (
            <span className="badge badge-amber">{items.length}</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dash-card-empty">
          <span>✓ No upcoming obligations</span>
        </div>
      ) : (
        <div className="obligation-list">
          {items.map((item) => {
            const days = getDaysFromToday(item.due_date);
            const daysLabel =
              days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`;
            const urgent = days !== null && days <= 3;
            return (
              <div key={item.id} className="obligation-list-item">
                <div className="obligation-list-info">
                  <span className="obligation-list-name">{item.name}</span>
                  <span className="obligation-list-meta">
                    <StatusBadge status={item.type} />
                    <span className={urgent ? 'amount-negative' : 'upcoming-days'}>
                      {daysLabel}
                    </span>
                  </span>
                </div>
                <div className="obligation-list-right">
                  <span className="obligation-list-amount">{formatCurrency(item.amount)}</span>
                  <span className="obligation-list-date">{formatDate(item.due_date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingCard;
