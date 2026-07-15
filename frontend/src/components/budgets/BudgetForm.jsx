import { useState } from 'react';

const validate = (v) => {
  const e = {};
  if (!v.category.trim()) e.category = 'Category is required';
  if (!v.monthly_limit || parseFloat(v.monthly_limit) <= 0) e.monthly_limit = 'Limit must be > 0';
  return e;
};

const BudgetForm = ({ onSubmit, onCancel, initial }) => {
  const [values, setValues] = useState(
    initial || { category: '', monthly_limit: '' }
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
      await onSubmit({ ...values, monthly_limit: parseFloat(values.monthly_limit) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="budget-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label">Category *</label>
        <input
          className={`form-input ${errors.category ? 'error' : ''}`}
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="e.g. groceries, entertainment"
        />
        {errors.category && <span className="form-error">{errors.category}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Monthly Limit (₹) *</label>
        <input
          type="number"
          className={`form-input ${errors.monthly_limit ? 'error' : ''}`}
          value={values.monthly_limit}
          onChange={(e) => set('monthly_limit', e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        {errors.monthly_limit && <span className="form-error">{errors.monthly_limit}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial ? 'Update Budget' : 'Create Budget'}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;
