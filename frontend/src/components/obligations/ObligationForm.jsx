import { useState, useEffect } from 'react';

const CATEGORY_SUGGESTIONS = ['loan', 'utility', 'subscription', 'insurance', 'rent', 'other'];

const INITIAL = {
  type: 'bill',
  name: '',
  amount: '',
  due_date: new Date().toISOString().slice(0, 10),
  recurrence: 'monthly',
  custom_interval_days: '',
  outstanding_balance: '',
  principal: '',
  category: '',
  notes: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.amount || parseFloat(values.amount) <= 0) errors.amount = 'Amount must be > 0';
  if (!values.due_date) errors.due_date = 'Due date is required';
  if (values.recurrence === 'custom' && (!values.custom_interval_days || parseInt(values.custom_interval_days) <= 0)) {
    errors.custom_interval_days = 'Enter a valid interval';
  }
  if (values.type === 'loan' && values.outstanding_balance && parseFloat(values.outstanding_balance) < 0) {
    errors.outstanding_balance = 'Must be ≥ 0';
  }
  return errors;
};

const ObligationForm = ({ onSubmit, onCancel, initial }) => {
  const [values, setValues] = useState(initial ? { ...INITIAL, ...initial } : INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) setValues({ ...INITIAL, ...initial });
  }, [initial]);

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        custom_interval_days: values.recurrence === 'custom' ? parseInt(values.custom_interval_days) : undefined,
        outstanding_balance: values.type === 'loan' && values.outstanding_balance !== '' ? parseFloat(values.outstanding_balance) : undefined,
        principal: values.type === 'loan' && values.principal !== '' ? parseFloat(values.principal) : undefined,
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="obligation-form" onSubmit={handleSubmit} noValidate>
      {/* Type */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <div className="radio-group">
          {['loan', 'bill'].map((t) => (
            <label key={t} className={`radio-option ${values.type === t ? 'radio-option-active' : ''}`}>
              <input type="radio" name="type" value={t} checked={values.type === t} onChange={() => set('type', t)} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="form-group">
        <label className="form-label">Name *</label>
        <input
          className={`form-input ${errors.name ? 'error' : ''}`}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Home Loan EMI"
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      {/* Amount */}
      <div className="form-group">
        <label className="form-label">Amount (₹) *</label>
        <input
          type="number"
          className={`form-input ${errors.amount ? 'error' : ''}`}
          value={values.amount}
          onChange={(e) => set('amount', e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        {errors.amount && <span className="form-error">{errors.amount}</span>}
      </div>

      {/* Due Date */}
      <div className="form-group">
        <label className="form-label">Due Date *</label>
        <input
          type="date"
          className={`form-input ${errors.due_date ? 'error' : ''}`}
          value={values.due_date}
          onChange={(e) => set('due_date', e.target.value)}
        />
        {errors.due_date && <span className="form-error">{errors.due_date}</span>}
      </div>

      {/* Recurrence */}
      <div className="form-group">
        <label className="form-label">Recurrence</label>
        <select
          className="form-select"
          value={values.recurrence}
          onChange={(e) => set('recurrence', e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="one-time">One-time</option>
          <option value="custom">Custom Interval</option>
        </select>
      </div>

      {/* Custom interval */}
      {values.recurrence === 'custom' && (
        <div className="form-group">
          <label className="form-label">Interval (days) *</label>
          <input
            type="number"
            className={`form-input ${errors.custom_interval_days ? 'error' : ''}`}
            value={values.custom_interval_days}
            onChange={(e) => set('custom_interval_days', e.target.value)}
            min="1"
            placeholder="e.g. 90"
          />
          {errors.custom_interval_days && <span className="form-error">{errors.custom_interval_days}</span>}
        </div>
      )}

      {/* Loan fields */}
      {values.type === 'loan' && (
        <>
          <div className="form-group">
            <label className="form-label">Principal (₹)</label>
            <input
              type="number"
              className="form-input"
              value={values.principal}
              onChange={(e) => set('principal', e.target.value)}
              min="0"
              step="0.01"
              placeholder="Original loan amount"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Outstanding Balance (₹)</label>
            <input
              type="number"
              className={`form-input ${errors.outstanding_balance ? 'error' : ''}`}
              value={values.outstanding_balance}
              onChange={(e) => set('outstanding_balance', e.target.value)}
              min="0"
              step="0.01"
              placeholder="Remaining balance"
            />
            {errors.outstanding_balance && <span className="form-error">{errors.outstanding_balance}</span>}
          </div>
        </>
      )}

      {/* Category */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <input
          className="form-input"
          list="ob-cat-list"
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="Select or type..."
        />
        <datalist id="ob-cat-list">
          {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any additional notes..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default ObligationForm;
