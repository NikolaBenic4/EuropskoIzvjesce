import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import '../css/Dashboard.css';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const companyName = localStorage.getItem('companyName');

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      navigate('/');
      return;
    }
    fetch('/api/prijava-zahtjevi', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    })
      .then(res => {
        if (res.status === 401) {
          navigate('/');
          throw new Error('Niste autorizirani');
        }
        if (!res.ok) {
          throw new Error('Greška pri dohvaćanju zahtjeva');
        }
        return res.json();
      })
      .then(data => setRequests(data))
      .catch(err => setError(err.message));
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">{companyName}</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard/o-poduzecu" className="nav-item">O poduzeću</NavLink>
          <NavLink to="/dashboard/otvorene-prijave" className="nav-item">Otvorene prijave</NavLink>
          <NavLink to="/dashboard/zatvorene-prijave" className="nav-item">Zatvorene prijave</NavLink>
          <NavLink to="/dashboard/mail" className="nav-item">Mail</NavLink>
          <NavLink to="/" className="nav-item logout">Odjava</NavLink>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Dashboard – {companyName}</h1>
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        {!error && (
          <section className="dashboard-content">
            {requests.length === 0 ? (
              <p className="no-requests">Nema zaprimljenih zahtjeva.</p>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Opis</th>
                    <th>Datum podnošenja</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>{req.opis}</td>
                      <td>{new Date(req.datum).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </main>
    </div>
);
}
