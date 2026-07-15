import { useState, useEffect } from 'react';
import { getCategories } from '../api/payments';
import { useToast } from '../components/common/Toast';
import './ExportPage.css';

const ExportPage = () => {
  const [preset, setPreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [loadingCats, setLoadingCats] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    // Set default dates for Custom Range based on current month
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
    const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);

    // Fetch categories
    const fetchCats = async () => {
      setLoadingCats(true);
      try {
        const cats = await getCategories();
        setAvailableCategories(cats);
      } catch (err) {
        showToast('Failed to load categories', 'error');
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, [showToast]);

  const handleCategoryChange = (cat) => {
    if (cat === 'all') {
      setSelectedCategories(['all']);
      return;
    }

    let next = selectedCategories.filter((c) => c !== 'all');
    if (next.includes(cat)) {
      next = next.filter((c) => c !== cat);
      if (next.length === 0) next = ['all'];
    } else {
      next.push(cat);
    }
    setSelectedCategories(next);
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const catsParam = selectedCategories.includes('all')
        ? 'all'
        : selectedCategories.join(',');

      let url = `/api/export/report?preset=${preset}&categories=${encodeURIComponent(catsParam)}`;

      if (preset === 'custom') {
        if (!startDate || !endDate) {
          showToast('Please select start and end dates', 'warning');
          setDownloading(false);
          return;
        }
        if (new Date(startDate) > new Date(endDate)) {
          showToast('Start date cannot be after end date', 'warning');
          setDownloading(false);
          return;
        }
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      // Trigger download using an anchor tag
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense_report_${preset}_${new Date().toISOString().split('T')[0]}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloading report...', 'success');
    } catch (err) {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page export-page">
      <h1 className="page-title gradient-text">Export Report</h1>
      <p className="page-subtitle">Generate and download a high-quality, server-rendered image of your expenses.</p>

      <div className="export-container">
        {/* Left Side: Filter Options */}
        <div className="export-filters glass-card">
          <h3 className="section-title">Report Settings</h3>

          {/* Presets */}
          <div className="filter-group">
            <label className="form-label">Time Period Preset</label>
            <div className="preset-buttons-grid">
              <button
                className={`btn ${preset === 'this_month' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset('this_month')}
              >
                This Month
              </button>
              <button
                className={`btn ${preset === 'last_month' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset('last_month')}
              >
                Last Month
              </button>
              <button
                className={`btn ${preset === 'this_week' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset('this_week')}
              >
                This Week
              </button>
              <button
                className={`btn ${preset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreset('custom')}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Date Ranges (for custom preset) */}
          {preset === 'custom' && (
            <div className="filter-group date-inputs-row">
              <div className="date-input-wrap">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-wrap">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Category selection */}
          <div className="filter-group">
            <label className="form-label">Categories to Include</label>
            {loadingCats ? (
              <p className="loading-cats-hint">Loading categories...</p>
            ) : (
              <div className="category-checkboxes-grid">
                <label className={`checkbox-label ${selectedCategories.includes('all') ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('all')}
                    onChange={() => handleCategoryChange('all')}
                  />
                  <span>All Categories</span>
                </label>
                {availableCategories.map((cat) => (
                  <label
                    key={cat}
                    className={`checkbox-label ${
                      selectedCategories.includes(cat) && !selectedCategories.includes('all') ? 'active' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat) && !selectedCategories.includes('all')}
                      disabled={selectedCategories.includes('all')}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button className="btn btn-primary btn-download" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Generating Report...' : '📥 Download Image Report'}
          </button>
        </div>

        {/* Right Side: Preview/Info Card */}
        <div className="export-info glass-card">
          <h3 className="section-title">Export Preview Info</h3>
          <div className="preview-details">
            <div className="preview-row">
              <span>Selected Preset:</span>
              <span className="preview-val capitalize">{preset.replace('_', ' ')}</span>
            </div>
            {preset === 'custom' && (
              <div className="preview-row">
                <span>Date Range:</span>
                <span className="preview-val">
                  {startDate} to {endDate}
                </span>
              </div>
            )}
            <div className="preview-row">
              <span>Categories:</span>
              <span className="preview-val">
                {selectedCategories.includes('all') ? 'All' : selectedCategories.join(', ')}
              </span>
            </div>
          </div>
          <div className="preview-mockup">
            <div className="mockup-header">
              <span className="mockup-dot"></span>
              <span className="mockup-dot"></span>
              <span className="mockup-dot"></span>
            </div>
            <div className="mockup-body">
              <p className="mockup-title">💰 Expense Report</p>
              <div className="mockup-divider"></div>
              <div className="mockup-table">
                <div className="mockup-tr header">
                  <span>Date</span>
                  <span>Category</span>
                  <span>Amount</span>
                </div>
                <div className="mockup-tr">
                  <span>15 Jul</span>
                  <span>Utility</span>
                  <span>₹999.00</span>
                </div>
                <div className="mockup-tr">
                  <span>12 Jul</span>
                  <span>Rent</span>
                  <span>₹15,000.00</span>
                </div>
                <div className="mockup-tr total">
                  <span>TOTAL</span>
                  <span></span>
                  <span>₹15,999.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
