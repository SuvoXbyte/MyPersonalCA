import { useState, useEffect, useCallback } from 'react';
import {
  getAccount,
  setBalance as apiSetBalance,
  addFunds as apiAddFunds,
  getHistory,
  getProjected,
  updateSettings,
} from '../api/account';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import BalanceHistoryTable from '../components/account/BalanceHistoryTable';
import SettingsForm from '../components/account/SettingsForm';
import Modal from '../components/common/Modal';
import './AccountPage.css';

const AccountPage = () => {
  const [account, setAccount] = useState(null);
  const [projected, setProjected] = useState(null);
  const [historyData, setHistoryData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals state
  const [isSetBalanceOpen, setIsSetBalanceOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [fundsAmountInput, setFundsAmountInput] = useState('');
  const [fundsDescInput, setFundsDescInput] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchHistory = useCallback(async (pageNum) => {
    setHistoryLoading(true);
    try {
      const data = await getHistory(pageNum, 10);
      setHistoryData(data);
    } catch (err) {
      showToast(err.message || 'Failed to load balance history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [showToast]);

  const fetchAccountData = useCallback(async () => {
    setLoading(true);
    try {
      const [acc, proj] = await Promise.all([getAccount(), getProjected()]);
      setAccount(acc);
      setProjected(proj);
      await fetchHistory(page);
    } catch (err) {
      showToast(err.message || 'Failed to load account data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, page, showToast]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchHistory(newPage);
  };

  const handleUpdateSettings = async (data) => {
    try {
      const updated = await updateSettings(data);
      setAccount(updated);
      showToast('Settings saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  };

  const handleSetBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceInput || isNaN(balanceInput)) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    setModalSubmitting(true);
    try {
      const amt = parseFloat(balanceInput);
      await apiSetBalance(amt);
      showToast(`Balance set to ${formatCurrency(amt)}`, 'success');
      setIsSetBalanceOpen(false);
      setBalanceInput('');
      fetchAccountData();
    } catch (err) {
      showToast(err.message || 'Failed to adjust balance', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleAddFundsSubmit = async (e) => {
    e.preventDefault();
    if (!fundsAmountInput || isNaN(fundsAmountInput) || parseFloat(fundsAmountInput) <= 0) {
      showToast('Please enter a valid positive amount', 'warning');
      return;
    }
    setModalSubmitting(true);
    try {
      const amt = parseFloat(fundsAmountInput);
      const desc = fundsDescInput.trim() || 'Add Funds';
      await apiAddFunds(amt, desc);
      showToast(`${formatCurrency(amt)} added successfully!`, 'success');
      setIsAddFundsOpen(false);
      setFundsAmountInput('');
      setFundsDescInput('');
      fetchAccountData();
    } catch (err) {
      showToast(err.message || 'Failed to add funds', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="account-loading-wrap">
        <span className="loader"></span>
        <p>Loading account details...</p>
      </div>
    );
  }

  const upcomingDues = projected?.upcoming_dues ?? [];
  const limit = 10;
  const totalPages = Math.ceil((historyData?.total ?? 0) / limit);

  return (
    <div className="page account-page">
      <h1 className="page-title gradient-text">Account Balance</h1>
      <p className="page-subtitle">Manage wallet funds, low balance alerts, and transaction history</p>

      {/* Main Account Balance Display */}
      <div className="account-hero glass-card">
        <div className="hero-balance-section">
          <span className="hero-label">Current Balance</span>
          <h2 className="hero-amount">{formatCurrency(account?.current_balance ?? 0)}</h2>
          <span className="hero-update">Last Updated: {formatDate(account?.last_updated)}</span>
        </div>
        <div className="hero-actions">
          <button className="btn btn-secondary" onClick={() => setIsSetBalanceOpen(true)}>
            Set Balance
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddFundsOpen(true)}>
            + Add Funds / Deposit
          </button>
        </div>
      </div>

      <div className="account-grid">
        {/* Left Column: Settings and Projection */}
        <div className="account-left-col">
          {/* Projection Widget */}
          <div className="projection-widget glass-card">
            <h3 className="widget-title">Projected Balance (Next 7 Days)</h3>
            <div className="projection-math">
              <div className="math-row">
                <span>Current Balance</span>
                <span>{formatCurrency(projected?.current_balance ?? 0)}</span>
              </div>
              <div className="math-row math-subtract">
                <span>Upcoming Dues (Next 7 Days)</span>
                <span>- {formatCurrency(upcomingDues.reduce((sum, item) => sum + item.amount, 0))}</span>
              </div>
              <div className="math-divider"></div>
              <div className="math-row math-total">
                <span>Projected Balance</span>
                <span className={(projected?.projected_balance ?? 0) < (account?.low_balance_threshold ?? 0) ? 'text-danger' : 'text-success'}>
                  {formatCurrency(projected?.projected_balance ?? 0)}
                </span>
              </div>
            </div>

            <div className="upcoming-dues-list">
              <h4>Upcoming Dues Details</h4>
              {upcomingDues.length === 0 ? (
                <p className="no-dues-hint">No dues scheduled in the next 7 days.</p>
              ) : (
                <div className="dues-items-container">
                  {upcomingDues.map((item) => (
                    <div key={item.id} className="due-item-row">
                      <div className="due-item-info">
                        <span className="due-item-name">{item.name}</span>
                        <span className="due-item-date">Due: {formatDate(item.due_date)}</span>
                      </div>
                      <div className="due-item-val">
                        <span className={`badge badge-type badge-${item.type === 'loan' ? 'pink' : 'cyan'}`}>{item.type}</span>
                        <span className="due-item-amount">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Widget */}
          <div className="settings-widget glass-card">
            <h3 className="widget-title">Alert & Telegram Settings</h3>
            <SettingsForm initial={account} onSubmit={handleUpdateSettings} />
          </div>
        </div>

        {/* Right Column: History */}
        <div className="account-right-col">
          <div className="history-widget glass-card">
            <h3 className="widget-title">Balance Adjustment Audit Log</h3>
            <BalanceHistoryTable
              history={historyData.items}
              loading={historyLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Set Balance Modal */}
      <Modal isOpen={isSetBalanceOpen} onClose={() => setIsSetBalanceOpen(false)} title="Set Current Balance">
        <form onSubmit={handleSetBalanceSubmit} className="modal-form">
          <p className="modal-form-description">
            Adjust your current balance manually. This will log an absolute adjustment rather than an expense.
          </p>
          <div className="form-group">
            <label className="form-label">New Balance (₹)</label>
            <input
              type="number"
              className="form-input"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="modal-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsSetBalanceOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
              {modalSubmitting ? 'Adjusting...' : 'Set Balance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} title="Add Funds (Salary, Income, Deposits)">
        <form onSubmit={handleAddFundsSubmit} className="modal-form">
          <p className="modal-form-description">
            Top up your account balance. This logs as an addition/income and does not count as a standard expense.
          </p>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={fundsAmountInput}
              onChange={(e) => setFundsAmountInput(e.target.value)}
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Source</label>
            <input
              type="text"
              className="form-input"
              value={fundsDescInput}
              onChange={(e) => setFundsDescInput(e.target.value)}
              required
              placeholder="e.g. Salary Credit, Cash Deposit"
            />
          </div>
          <div className="modal-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddFundsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
              {modalSubmitting ? 'Adding...' : 'Add Funds'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountPage;
