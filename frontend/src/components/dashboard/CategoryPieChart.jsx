import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import './Charts.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#6366f1', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

// Center text plugin
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea: { top, bottom, left, right } } = chart;
    if (!chart.config._config?.options?.plugins?.centerText?.text) return;
    const text = chart.config._config.options.plugins.centerText.text;
    const label = chart.config._config.options.plugins.centerText.label || '';
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 14px Inter, sans-serif';
    ctx.fillStyle = '#e6edf3';
    ctx.fillText(text, x, y - 8);
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(label, x, y + 10);
    ctx.restore();
  },
};

ChartJS.register(centerTextPlugin);

const CategoryPieChart = ({ data }) => {
  const categories = data?.categories || [];
  const amounts = data?.amounts || [];
  const total = amounts.reduce((s, v) => s + v, 0);

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: amounts,
        backgroundColor: COLORS.slice(0, categories.length),
        borderColor: '#0d1117',
        borderWidth: 3,
        hoverBorderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#8b949e',
          font: { size: 12 },
          padding: 14,
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 4,
          useBorderRadius: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(22, 27, 34, 0.95)',
        titleColor: '#8b949e',
        bodyColor: '#e6edf3',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.parsed)} (${Math.round((ctx.parsed / total) * 100)}%)`,
        },
      },
      centerText: {
        text: total > 0 ? `₹${(total / 1000).toFixed(1)}k` : '₹0',
        label: 'This Month',
      },
    },
  };

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-header">
        <h3 className="chart-title">Category Breakdown</h3>
        <span className="chart-subtitle">Current month</span>
      </div>
      <div className="chart-body">
        {categories.length === 0 ? (
          <div className="chart-empty">No expense data for this month</div>
        ) : (
          <Doughnut data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default CategoryPieChart;
