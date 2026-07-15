import { useState, useEffect, useCallback } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import {
  getObligations,
  createObligation,
  updateObligation,
  deleteObligation,
  markPaid,
} from '../api/obligations';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../hooks/useConfirm';
import Modal from '../components/common/Modal';
import ObligationCard from '../components/obligations/ObligationCard';
import ObligationForm from '../components/obligations/ObligationForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import './ObligationsPage.css';

const TABS = ['all', 'loan', 'bill'];
const STATUSES = ['all', 'pending', 'overdue', 'paid'];

const ObligationsPage = () => {
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { showToast } = useToast();
  const { confirm, ConfirmUI } = useConfirm();

  const fetchObligations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (tab !== 'all') params.type = tab;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getObligations(params);
      setObligations(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      showToast(err.message || 'Failed to load obligations', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, showToast]);

  useEffect(() => { fetchObligations(); }, [fetchObligations]);

  const handleCreate = async (data) => {
    try {
      await createObligation(data);
      showToast('Obligation created!', 'success');
      setModalOpen(false);
      fetchObligations();
    } catch (err) {
      showToast(err.message || 'Failed to create', 'error');
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateObligation(editTarget.id, data);
      showToast('Obligation updated!', 'success');
      setEditTarget(null);
      setModalOpen(false);
      fetchObligations();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Obligation',
      message: 'Are you sure you want to delete this obligation? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteObligation(id);
      showToast('Obligation deleted', 'success');
      fetchObligations();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPaid(id);
      showToast('Marked as paid!', 'success');
      fetchObligations();
    } catch (err) {
      showToast(err.message || 'Failed to mark as paid', 'error');
    }
  };

  const handleEdit = (obligation) => {
    setEditTarget(obligation);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="page">
      {ConfirmUI}

      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Obligations</h1>
          <p className="page-subtitle">Manage your loans and recurring bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          <Plus size={16} />
          Add Obligation
        </button>
      </div>

      {/* Tabs + Filter */}
      <div className="obligations-toolbar">
        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <label className="filter-label">Status:</label>
          <select
            className="form-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner center size="lg" text="Loading obligations..." />
      ) : obligations.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No obligations found"
          message="Add your first loan or bill to start tracking your financial obligations."
          action={
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Obligation
            </button>
          }
        />
      ) : (
        <div className="obligations-grid">
          {obligations.map((ob) => (
            <ObligationCard
              key={ob.id}
              obligation={ob}
              onMarkPaid={handleMarkPaid}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editTarget ? 'Edit Obligation' : 'Add Obligation'}
        size="md"
      >
        <ObligationForm
          onSubmit={editTarget ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
          initial={editTarget}
        />
      </Modal>
    </div>
  );
};

export default ObligationsPage;
