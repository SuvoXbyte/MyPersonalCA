/**
 * StatusBadge component
 * status: 'pending' | 'paid' | 'overdue' | 'active' | 'inactive'
 * type: badge type override
 */
const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'badge-amber' },
  paid: { label: 'Paid', cls: 'badge-green' },
  overdue: { label: 'Overdue', cls: 'badge-red' },
  active: { label: 'Active', cls: 'badge-blue' },
  inactive: { label: 'Inactive', cls: 'badge-gray' },
  loan: { label: 'Loan', cls: 'badge-purple' },
  bill: { label: 'Bill', cls: 'badge-blue' },
  manual: { label: 'Manual', cls: 'badge-gray' },
  auto: { label: 'Auto', cls: 'badge-blue' },
};

const StatusBadge = ({ status, label: overrideLabel }) => {
  const normalized = (status || '').toLowerCase();
  const { label, cls } = STATUS_MAP[normalized] || { label: status || 'Unknown', cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{overrideLabel || label}</span>;
};

export default StatusBadge;
