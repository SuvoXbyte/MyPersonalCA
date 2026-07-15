import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  PieChart,
  Wallet,
  Download,
  IndianRupee,
} from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/obligations', label: 'Obligations', icon: CreditCard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/account', label: 'Account', icon: Wallet },
  { to: '/export', label: 'Export', icon: Download },
];

const Navbar = () => {
  return (
    <>
      {/* Sidebar — desktop */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <IndianRupee size={20} />
          </div>
          <span className="logo-text">MyCA</span>
        </div>

        <div className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <Icon size={20} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Personal Finance Tracker</p>
        </div>
      </nav>

      {/* Bottom nav — mobile */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
            }
          >
            <Icon size={20} />
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
