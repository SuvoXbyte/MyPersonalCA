import { useState, useCallback } from 'react';

/**
 * useConfirm hook — programmatic confirm dialogs
 * Returns: { confirm, ConfirmUI }
 *
 * Usage:
 *   const { confirm, ConfirmUI } = useConfirm();
 *   const ok = await confirm({ title: '...', message: '...', confirmLabel: 'Delete', danger: true });
 *   if (ok) { ... }
 *
 *   In JSX: {ConfirmUI}
 */
export const useConfirm = () => {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirm', danger = false }) => {
    return new Promise((resolve) => {
      setState({ title, message, confirmLabel, danger, resolve });
    });
  }, []);

  const handleResult = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const ConfirmUI = state ? (
    <div className="confirm-overlay" onClick={() => handleResult(false)}>
      <div className="confirm-dialog glass-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{state.title}</h3>
        {state.message && <p className="confirm-message">{state.message}</p>}
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={() => handleResult(false)}>
            Cancel
          </button>
          <button
            className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => handleResult(true)}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmUI };
};
