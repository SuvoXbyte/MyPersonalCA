import { useState } from 'react';

const INITIAL = {
  amount: '',
  category: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
};

const validate = (v) => {
  const e = {};
  if (!v.amount || parseFloat(v.amount) <= 0) e.amount = 'Amount must be > 0';
  if (!v.date) e.date = 'Date is required';
  return e;
};

const ExpenseForm = ({ onSubmit, onCancel, categories = [] }) => {
  const [values, setValues] = useState(INITIAL);
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
      await onSubmit({ ...values, amount: parseFloat(values.amount) });
      setValues(INITIAL);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
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

      <div className="form-group">
        <label className="form-label">Category</label>
        <input
          className="form-input"
          list="exp-cat-list"
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="Select or type..."
        />
        <datalist id="exp-cat-list">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div className="form-group">
        <label className="form-label">Note</label>
        <input
          className="form-input"
          value={values.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="What was this for?"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Date *</label>
        <input
          type="date"
          className={`form-input ${errors.date ? 'error' : ''}`}
          value={values.date}
          onChange={(e) => set('date', e.target.value)}
        />
        {errors.date && <span className="form-error">{errors.date}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
