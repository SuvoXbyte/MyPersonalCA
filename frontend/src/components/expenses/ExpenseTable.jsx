import { Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { Receipt } from 'lucide-react';
import './ExpenseTable.css';

const ExpenseTable = ({ expenses = [], onDelete, totalAmount, totalCount }) => {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses found"
        message="Add your first expense or adjust the filters."
      />
    );
  }

  return (
    <div className="expense-table-wrap">
      <div className="expense-table-container">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Note</th>
              <th>Source</th>
              <th className="text-right">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="expense-row">
                <td className="expense-date">{formatDate(exp.date || exp.created_at)}</td>
                <td>
                  {exp.category ? (
                    <span className="expense-category">{exp.category}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="expense-note">{exp.note || exp.description || '—'}</td>
                <td>
                  <StatusBadge status={exp.source || 'manual'} />
                </td>
                <td className="expense-amount amount-negative">
                  -{formatCurrency(exp.amount)}
                </td>
                <td>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => onDelete(exp.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalCount !== undefined && totalAmount !== undefined && (
        <div className="expense-total">
          <span className="expense-total-label">
            Total ({totalCount} {totalCount === 1 ? 'expense' : 'expenses'})
          </span>
          <span className="expense-total-amount amount-negative">
            -{formatCurrency(totalAmount)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;
