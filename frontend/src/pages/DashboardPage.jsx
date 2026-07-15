import { useState, useEffect, useCallback } from 'react';
import { getDashboard } from '../api/dashboard';
import { markPaid } from '../api/obligations';
import { useToast } from '../components/common/Toast';
import BalanceCard from '../components/dashboard/BalanceCard';
import OverdueCard from '../components/dashboard/OverdueCard';
import UpcomingCard from '../components/dashboard/UpcomingCard';
import BudgetProgressCard from '../components/dashboard/BudgetProgressCard';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import StreakBadge from '../components/dashboard/StreakBadge';
import DailyBudgetCard from '../components/dashboard/DailyBudgetCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './DashboardPage.css';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const d = await getDashboard();
      setData(d);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkPaid = async (id) => {
    try {
      await markPaid(id);
      showToast('Obligation marked as paid!', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to mark as paid', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner center size="xl" text="Loading dashboard..." />;
  }

  const fixedTotal = data?.fixed_spending?.total ?? 0;
  const variableTotal = data?.variable_spending?.total ?? 0;
  const splitTotal = fixedTotal + variableTotal;

  return (
    <div className="page dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title gradient-text">Dashboard</h1>
          <p className="page-subtitle">Your financial overview at a glance</p>
        </div>
        <div className="dashboard-refresh">
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Balance + Daily Budget + Streak */}
      <div className="dashboard-top-row">
        <BalanceCard data={data} />
        <DailyBudgetCard dailyBudget={data?.daily_budget} />
        <StreakBadge
          streak={data?.habit_streak ?? 0}
          message={data?.streak_message}
        />
      </div>

      {/* Row 2: Overdue */}
      <OverdueCard
        items={data?.overdue ?? []}
        onMarkPaid={handleMarkPaid}
      />

      {/* Row 3: Upcoming */}
      <UpcomingCard items={data?.upcoming_dues ?? []} />

      {/* Row 4: Budget progress */}
      <BudgetProgressCard budgets={data?.budget_summary ?? []} />

      {/* Row 5: Charts */}
      <div className="dashboard-charts-row">
        <SpendingTrendChart data={data?.spending_trend} />
        <CategoryPieChart data={data?.category_breakdown} />
      </div>

      {/* Fixed vs Variable split */}
      {splitTotal > 0 && (
        <div className="spending-split glass-card">
          <h3 className="spending-split-title">Spending Split</h3>
          <div className="spending-split-bars">
            <div className="split-item">
              <div className="split-label">
                <span>Fixed</span>
                <span className="split-pct">
                  {splitTotal > 0 ? Math.round((fixedTotal / splitTotal) * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: splitTotal > 0 ? `${(fixedTotal / splitTotal) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                  }}
                />
              </div>
            </div>
            <div className="split-item">
              <div className="split-label">
                <span>Variable</span>
                <span className="split-pct">
                  {splitTotal > 0 ? Math.round((variableTotal / splitTotal) * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: splitTotal > 0 ? `${(variableTotal / splitTotal) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, var(--accent-green), #059669)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
