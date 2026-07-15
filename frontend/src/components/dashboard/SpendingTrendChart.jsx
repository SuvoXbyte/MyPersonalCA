import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import './Charts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SpendingTrendChart = ({ data }) => {
  const labels = data?.labels || [];
  const values = data?.values || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: values,
        borderColor: '#6366f1',
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(22, 27, 34, 0.95)',
        titleColor: '#8b949e',
        bodyColor: '#e6edf3',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8b949e', font: { size: 12 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#8b949e',
          font: { size: 12 },
          callback: (v) => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-header">
        <h3 className="chart-title">Spending Trend</h3>
        <span className="chart-subtitle">Last 6 months</span>
      </div>
      <div className="chart-body">
        {values.length === 0 ? (
          <div className="chart-empty">No spending data available</div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default SpendingTrendChart;
