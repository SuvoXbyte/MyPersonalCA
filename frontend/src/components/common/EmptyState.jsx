import './EmptyState.css';

const EmptyState = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={48} strokeWidth={1.2} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && (
        <div className="empty-state-action">{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
