import { Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './DashboardCards.css';

const BalanceCard = ({ data }) => {
  const balance = data?.current_balance ?? 0;
  const projected = data?.projected_balance ?? null;
  const isLow = data?.is_low_balance;

  return (
    <div className={`balance-card glass-card ${isLow ? 'balance-card-low' : ''}`}>
      <div className="balance-card-header">
        <div className="balance-card-icon">
          <Wallet size={22} />
        </div>
        <span className="balance-card-label">Current Balance</span>
        {isLow && <span className="badge badge-red">Low Balance</span>}
      </div>

      <div className="balance-amount">
        <span className={balance >= 0 ? 'amount-positive' : 'amount-negative'}>
          {formatCurrency(balance)}
        </span>
      </div>

      {projected !== null && (
        <div className="balance-projected">
          <div className="balance-projected-row">
            {projected >= balance ? (
              <TrendingUp size={14} color="var(--accent-green)" />
            ) : (
              <TrendingDown size={14} color="var(--accent-red)" />
            )}
            <span className="balance-projected-label">After upcoming dues:</span>
            <span
              className={`balance-projected-amount ${
                projected >= 0 ? 'amount-positive' : 'amount-negative'
              }`}
            >
              {formatCurrency(projected)}
            </span>
          </div>
        </div>
      )}

      {data?.total_overdue > 0 && (
        <div className="balance-alert">
          <span className="amount-negative">⚠ {formatCurrency(data.total_overdue)} overdue</span>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
