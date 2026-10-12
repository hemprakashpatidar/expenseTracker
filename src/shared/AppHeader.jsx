const AppHeader = ({ userName, onLogout }) => (
  <div className="et-header">
    <div className="et-header-left">
      <h1>💰 Expense Tracker</h1>
      <p>Hi, {userName || 'there'} 👋</p>
    </div>
    <div className="et-header-right">
      <div className="et-avatar">
        {(userName?.[0] || '?').toUpperCase()}
      </div>
      <button className="et-logout" onClick={onLogout}>Logout</button>
    </div>
  </div>
);

export default AppHeader;
