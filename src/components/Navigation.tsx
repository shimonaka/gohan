import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '初期設定' },
    { path: '/refrigerator', label: '冷蔵庫' },
    { path: '/menu', label: '献立提案' },
    { path: '/shopping', label: '買い物リスト' },
  ];

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">🍚</span>
          <span className="brand-title">今日のゴハン、何にする？</span>
        </Link>
        <nav className="nav-chip-group">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-chip ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
