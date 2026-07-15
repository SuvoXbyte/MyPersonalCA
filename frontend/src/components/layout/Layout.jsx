import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
