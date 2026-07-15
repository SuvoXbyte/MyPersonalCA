import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import './AccountComponents.css';

const TYPE_BADGE_MAP = {
  credit: 'green',
  debit: 'red',
  payment: 'red',
  deposit: 'green',
  adjustment: 'blue',
};

const BalanceHistoryTable = ({ history = [], loading, page, totalPages, onPageChange }) => {
  if (loading) return <LoadingSpinner center size="lg" text="Loading history..." />;

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <p>No balance history yet.</p>
      </div>
    );
  }

  return (
    <div className="history-table-wrap">
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th className="text-right">Change</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => {
              const isPositive = (h.amount_change || h.change || 0) >= 0;
              const change = h.amount_change ?? h.change ?? 0;
              const type = (h.type || '').toLowerCase();
              const badgeCls = TYPE_BADGE_MAP[type] || 'gray';
              return (
                <tr key={h.id || i} className="history-row">
                  <td className="history-date">{formatDate(h.created_at || h.date)}</td>
                  <td className="history-desc">{h.description || '—'}</td>
                  <td>
                    <span className={`badge badge-${badgeCls}`}>{h.type || 'update'}</span>
                  </td>
                  <td className={`history-change text-right ${isPositive ? 'amount-positive' : 'amount-negative'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(change)}
                  </td>
                  <td className="history-balance text-right">
                    {formatCurrency(h.balance || h.resulting_balance || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="history-pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </button>
          <span className="history-page-info">Page {page} of {totalPages}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BalanceHistoryTable;
