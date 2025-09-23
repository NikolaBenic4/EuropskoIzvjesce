import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/ZahtjeviLista.css';

export default function ZahtjeviLista({ status }) {
  const [zahtjevi, setZahtjevi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZahtjevi();
  }, [status]);

  const fetchZahtjevi = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch(`/api/zahtjevi?status=${status}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      setZahtjevi(data);
    } catch (error) {
      console.error('Greška pri dohvaćanju zahtjeva:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Učitava zahtjevi...</div>;

  return (
    <div className="zahtjevi-lista">
      <h1>{status === 'open' ? 'Otvoreni zahtjevi' : 'Zatvoreni zahtjevi'}</h1>
      
      <div className="zahtjevi-grid">
        {zahtjevi.map(zahtjev => (
          <div key={zahtjev.id} className="zahtjev-card">
            <div className="zahtjev-header">
              <span className="zahtjev-broj">#{zahtjev.id}</span>
              <span className={`status ${zahtjev.status}`}>
                {zahtjev.status === 'open' ? 'Otvoren' : 'Zatvoren'}
              </span>
            </div>
            
            <div className="zahtjev-info">
              <p><strong>Datum:</strong> {new Date(zahtjev.datum_nesrece).toLocaleDateString()}</p>
              <p><strong>Mjesto:</strong> {zahtjev.mjesto_nesrece}</p>
              <p><strong>Osiguranik:</strong> {zahtjev.ime_osiguranika} {zahtjev.prezime_osiguranika}</p>
            </div>

            <Link 
              to={`/dashboard/zahtjev/${zahtjev.id}`}
              className="view-btn"
            >
              Pogledaj detalje
            </Link>
          </div>
        ))}
      </div>

      {zahtjevi.length === 0 && (
        <div className="no-data">
          Nema {status === 'open' ? 'otvorenih' : 'zatvorenih'} zahtjeva.
        </div>
      )}
    </div>
  );
}
