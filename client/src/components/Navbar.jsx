import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}></span>
          <span>TaskFlow</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          <Link
            to="/"
            style={{ ...styles.link, ...(isActive('/') ? styles.linkActive : {}) }}
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            style={{
              ...styles.link,
              ...(location.pathname.startsWith('/projects') ? styles.linkActive : {}),
            }}
          >
            Projects
          </Link>
        </div>

        {/* User info */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRole}>{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: '#355872',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(53,88,114,0.3)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#fff',
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: '-0.3px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: 20,
  },
  links: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  link: {
    color: 'rgba(255,255,255,0.75)',
    padding: '6px 14px',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 14,
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  linkActive: {
    color: '#fff',
    background: 'rgba(255,255,255,0.15)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#7aaace',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
  },
  userRole: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
};
