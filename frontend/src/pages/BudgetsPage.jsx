import { useState, useEffect, useCallback } from 'react';
import { Plus, PieChart } from 'lucide-react';
import {
  getBudgets,
  getBudgetSummary,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../api/budgets';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../hooks/useConfirm';
import Modal from '../components/common/Modal';
import BudgetForm from '../components/budgets/BudgetForm';
import BudgetSummaryBar from '../components/budgets/BudgetSummaryBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { getCurrentMonth, formatMonth } from '../utils/formatters';
import './BudgetsPage.css';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { showToast } = useToast();
  const { confirm, ConfirmUI } = useConfirm();

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      // Try summary first, fall back to regular budgets
      let data;
      try {
        data = await getBudgetSummary(month);
      } catch {
        data = await getBudgets(month);
      }
      setBudgets(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      showToast(err.message || 'Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, showToast]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleCreate = async (data) => {
    try {
      await createBudget({ ...data, month });
      showToast('Budget created!', 'success');
      setModalOpen(false);
      fetchBudgets();
    } catch (err) {
      showToast(err.message || 'Failed to create budget', 'error');
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateBudget(editTarget.id, data);
      showToast('Budget updated!', 'success');
      setEditTarget(null);
      setModalOpen(false);
      fetchBudgets();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Budget',
      message: 'Delete this budget category? Expenses in this category will remain.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBudget(id);
      showToast('Budget deleted', 'success');
      fetchBudgets();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleEdit = (budget) => {
    setEditTarget(budget);
    setModalOpen(true);
  };

  const totalBudget = budgets.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="page">
      {ConfirmUI}

      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Budgets</h1>
          <p className="page-subtitle">Set and track monthly spending limits</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          <Plus size={16} />
          Add Budget
        </button>
      </div>

      {/* Month selector + summary */}
      <div className="budgets-toolbar glass-card">
        <div className="month-selector">
          <label className="form-label">Month</label>
          <input
            type="month"
            className="form-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="budgets-summary-stats">
          <div className="summary-stat">
            <span className="summary-stat-label">Total Budget</span>
            <span className="summary-stat-value">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(totalBudget)}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-label">Total Spent</span>
            <span className={`summary-stat-value ${totalSpent > totalBudget ? 'amount-negative' : 'amount-positive'}`}>
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(totalSpent)}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-label">Remaining</span>
            <span className={`summary-stat-value ${totalBudget - totalSpent < 0 ? 'amount-negative' : 'amount-positive'}`}>
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(totalBudget - totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <LoadingSpinner center size="lg" text="Loading budgets..." />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets for this month"
          message="Create budget limits for your spending categories to track your finances."
          action={
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Create Budget
            </button>
          }
        />
      ) : (
        <div className="budgets-grid">
          {budgets.map((b) => (
            <BudgetSummaryBar
              key={b.id || b.category}
              budget={b}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Edit Budget' : 'Add Budget'}
        size="sm"
      >
        <BudgetForm
          onSubmit={editTarget ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditTarget(null); }}
          initial={editTarget}
        />
      </Modal>
    </div>
  );
};

export default BudgetsPage;
