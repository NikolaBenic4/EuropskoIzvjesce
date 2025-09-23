import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

export default function Sidebar({ onLogout, companyName }) {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>{companyName}</h2>
        <p>Dashboard</p>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/dashboard/otvoreni" 
          className={location.pathname.includes('otvoreni') ? 'active' : ''}
        >
          📋 Otvoreni zahtjevi
        </Link>
        <Link 
          to="/dashboard/zatvoreni" 
          className={location.pathname.includes('zatvoreni') ? 'active' : ''}
        >
          ✅ Zatvoreni zahtjevi
        </Link>
        <Link 
          to="/dashboard/mail" 
          className={location.pathname.includes('mail') ? 'active' : ''}
        >
          ✉️ Mail centar
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          🚪 Odjava
        </button>
      </div>
    </div>
  );
}
