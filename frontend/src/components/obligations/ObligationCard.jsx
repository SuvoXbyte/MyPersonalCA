import { useState } from 'react';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate, getDaysFromToday } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import './ObligationCard.css';

const ObligationCard = ({ obligation, onMarkPaid, onEdit, onDelete }) => {
  const [marking, setMarking] = useState(false);

  const {
    id, name, type, category, amount, due_date, status,
    outstanding_balance, principal, notes,
  } = obligation;

  const days = getDaysFromToday(due_date);
  const isOverdue = status === 'overdue' || (days !== null && days < 0 && status !== 'paid');
  const isUrgent = !isOverdue && days !== null && days <= 7 && days >= 0;
  const isPaid = status === 'paid';

  let daysLabel = '';
  if (days === null) daysLabel = '';
  else if (days === 0) daysLabel = 'Due Today';
  else if (days < 0) daysLabel = `${Math.abs(days)}d overdue`;
  else if (days === 1) daysLabel = 'Due Tomorrow';
  else daysLabel = `Due in ${days}d`;

  const handleMarkPaid = async () => {
    setMarking(true);
    try { await onMarkPaid(id); }
    finally { setMarking(false); }
  };

  // Loan progress
  const loanPct = principal > 0 && outstanding_balance != null
    ? Math.min(Math.round(((principal - outstanding_balance) / principal) * 100), 100)
    : null;

  return (
    <div className={`obligation-card glass-card ${isOverdue ? 'obligation-overdue' : ''} ${isPaid ? 'obligation-paid' : ''}`}>
      {/* Header */}
      <div className="obcard-header">
        <div className="obcard-badges">
          <StatusBadge status={type} />
          {category && <span className="obcard-category">{category}</span>}
        </div>
        <div className="obcard-actions">
          <button className="btn-icon" onClick={() => onEdit(obligation)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn-icon btn-icon-danger" onClick={() => onDelete(id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Name + Status */}
      <div className="obcard-name">{name}</div>
      <div className="obcard-status-row">
        <StatusBadge status={status} />
        <span
          className={`obcard-days ${isOverdue ? 'amount-negative' : isUrgent ? 'amount-amber' : 'text-muted'}`}
        >
          {daysLabel}
        </span>
      </div>

      {/* Amount */}
      <div className="obcard-amount">{formatCurrency(amount)}</div>

      {/* Due date */}
      <div className="obcard-due">
        <span className="obcard-due-label">Due:</span>
        <span className="obcard-due-value">{formatDate(due_date)}</span>
      </div>

      {/* Loan progress */}
      {type === 'loan' && loanPct !== null && (
        <div className="obcard-loan-progress">
          <div className="obcard-loan-labels">
            <span>Paid</span>
            <span>{loanPct}%</span>
            <span>Outstanding: {formatCurrency(outstanding_balance)}</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill green"
              style={{ width: `${loanPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && <p className="obcard-notes">{notes}</p>}

      {/* Mark paid button */}
      {!isPaid && (
        <button
          className="btn btn-success obcard-pay-btn"
          onClick={handleMarkPaid}
          disabled={marking}
        >
          {marking ? <LoadingSpinner size="sm" /> : <CheckCircle size={16} />}
          {marking ? 'Processing...' : 'Mark Paid'}
        </button>
      )}
    </div>
  );
};

export default ObligationCard;
