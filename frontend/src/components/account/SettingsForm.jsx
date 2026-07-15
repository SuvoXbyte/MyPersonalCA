import { useState, useEffect } from 'react';

const SettingsForm = ({ initial = {}, onSubmit }) => {
  const [values, setValues] = useState({
    low_balance_threshold: initial.low_balance_threshold ?? '',
    telegram_chat_id: initial.telegram_chat_id ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues({
      low_balance_threshold: initial.low_balance_threshold ?? '',
      telegram_chat_id: initial.telegram_chat_id ?? '',
    });
  }, [initial]);

  const set = (field, value) => setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await onSubmit({
        ...values,
        low_balance_threshold: values.low_balance_threshold !== ''
          ? parseFloat(values.low_balance_threshold)
          : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Low Balance Threshold (₹)</label>
        <input
          type="number"
          className="form-input"
          value={values.low_balance_threshold}
          onChange={(e) => set('low_balance_threshold', e.target.value)}
          min="0"
          step="0.01"
          placeholder="e.g. 5000"
        />
        <span className="form-hint">Alert when balance drops below this amount</span>
      </div>

      <div className="form-group">
        <label className="form-label">Telegram Chat ID</label>
        <input
          className="form-input"
          value={values.telegram_chat_id}
          onChange={(e) => set('telegram_chat_id', e.target.value)}
          placeholder="Your Telegram Chat ID for notifications"
        />
        <span className="form-hint">Enable Telegram notifications for alerts</span>
      </div>

      <div className="settings-form-footer">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="settings-saved">✓ Saved!</span>}
      </div>
    </form>
  );
};

export default SettingsForm;
