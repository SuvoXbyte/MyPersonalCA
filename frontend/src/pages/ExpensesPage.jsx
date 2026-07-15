import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { getPayments, createPayment, deletePayment, getCategories } from '../api/payments';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../hooks/useConfirm';
import Modal from '../components/common/Modal';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseTable from '../components/expenses/ExpenseTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import './ExpensesPage.css';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    start_date: monthStart(),
    end_date: today(),
    category: '',
  });
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();
  const { confirm, ConfirmUI } = useConfirm();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.category) params.category = filters.category;
      const data = await getPayments(params);
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setExpenses(items);
      const t = items.reduce((s, e) => s + (e.amount || 0), 0);
      setTotal(data?.total ?? t);
    } catch (err) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
  }, []);

  const handleCreate = async (data) => {
    try {
      await createPayment(data);
      showToast('Expense added!', 'success');
      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to add expense', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deletePayment(id);
      showToast('Expense deleted', 'success');
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const setFilter = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className="page">
      {ConfirmUI}

      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Expenses</h1>
          <p className="page-subtitle">Track your spending and payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Filter bar */}
      <div className="expenses-filters glass-card">
        <div className="form-group">
          <label className="form-label">From</label>
          <input
            type="date"
            className="form-input"
            value={filters.start_date}
            onChange={(e) => setFilter('start_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">To</label>
          <input
            type="date"
            className="form-input"
            value={filters.end_date}
            onChange={(e) => setFilter('end_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary filter-apply-btn" onClick={fetchExpenses}>
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="glass-card expenses-table-card">
        {loading ? (
          <LoadingSpinner center size="lg" text="Loading expenses..." />
        ) : (
          <ExpenseTable
            expenses={expenses}
            onDelete={handleDelete}
            total={total}
          />
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense" size="sm">
        <ExpenseForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          categories={categories}
        />
      </Modal>
    </div>
  );
};

export default ExpensesPage;
