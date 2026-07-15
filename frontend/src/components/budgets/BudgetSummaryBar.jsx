import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './BudgetSummaryBar.css';

const BudgetSummaryBar = ({ budget, onEdit, onDelete }) => {
  const { id, category, monthly_limit, spent = 0, projected_spend, projected_overspend, days_remaining } = budget;

  const pct = monthly_limit > 0 ? Math.min(Math.round((spent / monthly_limit) * 100), 100) : 0;
  const remaining = monthly_limit - spent;
  const colorClass = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green';

  return (
    <div className={`budget-card glass-card budget-card-${colorClass}`}>
      <div className="budget-card-header">
        <div className="budget-card-title">
          <span className={`budget-category-dot budget-dot-${colorClass}`} />
          <h3 className="budget-name">{category}</h3>
        </div>
        <div className="budget-card-actions">
          <button className="btn-icon" onClick={() => onEdit(budget)} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="btn-icon btn-icon-danger" onClick={() => onDelete(id)} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="budget-spent-row">
        <span className={`budget-spent ${colorClass === 'red' ? 'amount-negative' : colorClass === 'amber' ? 'amount-amber' : 'amount-positive'}`}>
          {formatCurrency(spent)}
        </span>
        <span className="budget-of">of</span>
        <span className="budget-limit">{formatCurrency(monthly_limit)}</span>
      </div>

      <div className="progress-bar-container">
        <div className={`progress-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="budget-meta-grid">
        <div className="budget-meta-item">
          <span className="budget-meta-label">Used</span>
          <span className={`budget-meta-value ${colorClass === 'red' ? 'amount-negative' : ''}`}>{pct}%</span>
        </div>
        <div className="budget-meta-item">
          <span className="budget-meta-label">Remaining</span>
          <span className={`budget-meta-value ${remaining < 0 ? 'amount-negative' : 'amount-positive'}`}>
            {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
          </span>
        </div>
        {projected_spend !== undefined && (
          <div className="budget-meta-item">
            <span className="budget-meta-label">Projected</span>
            <span className="budget-meta-value">{formatCurrency(projected_spend)}</span>
          </div>
        )}
        {days_remaining !== undefined && (
          <div className="budget-meta-item">
            <span className="budget-meta-label">Days Left</span>
            <span className="budget-meta-value">{days_remaining}d</span>
          </div>
        )}
      </div>

      {projected_overspend > 0 && (
        <div className="budget-overspend">
          ⚠ Projected overspend: <span className="amount-negative">{formatCurrency(projected_overspend)}</span>
        </div>
      )}
    </div>
  );
};

export default BudgetSummaryBar;
