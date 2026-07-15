import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import Layout from './components/layout/Layout';

// Pages
import DashboardPage from './pages/DashboardPage';
import ObligationsPage from './pages/ObligationsPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage from './pages/BudgetsPage';
import AccountPage from './pages/AccountPage';
import ExportPage from './pages/ExportPage';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/obligations" element={<ObligationsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/export" element={<ExportPage />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
}

export default App;
