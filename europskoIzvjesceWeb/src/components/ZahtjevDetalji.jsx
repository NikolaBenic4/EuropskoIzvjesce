import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageGallery from '../pages/ImageGallery';
import Model3DViewer from '../pages/Model3DViewer';
import '../css/ZahtjevDetalji.css';

export default function ZahtjevDetalji() {
  const { id } = useParams();
  const [zahtjev, setZahtjev] = useState(null);
  const [currentTab, setCurrentTab] = useState('osnovni');
  const [iznosStete, setIznosStete] = useState('');
  const [komentar, setKomentar] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZahtjev();
  }, [id]);

  const fetchZahtjev = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch(`/api/zahtjev/${id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      setZahtjev(data);
      setIznosStete(data.iznos_stete || '');
      setKomentar(data.komentar || '');
    } catch (error) {
      console.error('Greška pri dohvaćanju zahtjeva:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSteta = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey');
      await fetch(`/api/zahtjev/${id}/steta`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ iznos_stete: parseFloat(iznosStete), komentar })
      });
      alert('Iznos štete uspješno spremljen!');
    } catch (error) {
      alert('Greška pri spremanju iznosa štete!');
    }
  };

  const handleCloseCase = async () => {
    if (!confirm('Jeste li sigurni da želite zatvoriti ovaj zahtjev?')) return;
    
    try {
      const apiKey = localStorage.getItem('apiKey');
      await fetch(`/api/zahtjev/${id}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      window.location.href = '/dashboard/otvoreni';
    } catch (error) {
      alert('Greška pri zatvaranju zahtjeva!');
    }
  };

  if (loading) return <div className="loading">Učitava zahtjev...</div>;
  if (!zahtjev) return <div className="error">Zahtjev nije pronađen.</div>;

  return (
    <div className="zahtjev-detalji">
      <div className="header">
        <h1>Zahtjev #{zahtjev.id}</h1>
        <div className="header-actions">
          <Link to="/dashboard/otvoreni" className="back-btn">← Nazad</Link>
          {zahtjev.status === 'open' && (
            <button onClick={handleCloseCase} className="close-btn">
              Zatvori zahtjev
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={currentTab === 'osnovni' ? 'active' : ''}
          onClick={() => setCurrentTab('osnovni')}
        >
          Osnovni podaci
        </button>
        <button 
          className={currentTab === 'slike' ? 'active' : ''}
          onClick={() => setCurrentTab('slike')}
        >
          Slike nesreće
        </button>
        <button 
          className={currentTab === '3d' ? 'active' : ''}
          onClick={() => setCurrentTab('3d')}
        >
          3D prikaz
        </button>
        <button 
          className={currentTab === 'steta' ? 'active' : ''}
          onClick={() => setCurrentTab('steta')}
        >
          Iznos štete
        </button>
      </div>

      <div className="tab-content">
        {currentTab === 'osnovni' && (
          <div className="osnovni-podaci">
            <div className="section">
              <h3>Osnovne informacije</h3>
              <div className="field-grid">
                <div className="field">
                  <label>Datum nesreće:</label>
                  <input type="text" value={new Date(zahtjev.datum_nesrece).toLocaleDateString()} readOnly />
                </div>
                <div className="field">
                  <label>Vrijeme:</label>
                  <input type="text" value={zahtjev.vrijeme_nesrece} readOnly />
                </div>
                <div className="field">
                  <label>Mjesto:</label>
                  <input type="text" value={zahtjev.mjesto_nesrece} readOnly />
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Osiguranik</h3>
              <div className="field-grid">
                <div className="field">
                  <label>Ime i prezime:</label>
                  <input type="text" value={`${zahtjev.ime_osiguranika} ${zahtjev.prezime_osiguranika}`} readOnly />
                </div>
                <div className="field">
                  <label>Adresa:</label>
                  <input type="text" value={zahtjev.adresa_osiguranika} readOnly />
                </div>
                <div className="field">
                  <label>Kontakt:</label>
                  <input type="text" value={zahtjev.kontaktbroj_osiguranika} readOnly />
                </div>
                <div className="field">
                  <label>Email:</label>
                  <input type="text" value={zahtjev.mail_osiguranika} readOnly />
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Vozač</h3>
              <div className="field-grid">
                <div className="field">
                  <label>Ime i prezime:</label>
                  <input type="text" value={`${zahtjev.ime_vozaca} ${zahtjev.prezime_vozaca}`} readOnly />
                </div>
                <div className="field">
                  <label>Broj vozačke:</label>
                  <input type="text" value={zahtjev.brojvozackedozvole} readOnly />
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Opis nesreće</h3>
              <textarea value={zahtjev.opis_okolnost} readOnly rows={6} />
            </div>
          </div>
        )}

        {currentTab === 'slike' && (
          <ImageGallery images={zahtjev.slike} />
        )}

        {currentTab === '3d' && (
          <Model3DViewer images={zahtjev.slike} />
        )}

        {currentTab === 'steta' && (
          <div className="steta-section">
            <h3>Procjena štete</h3>
            <div className="steta-form">
              <div className="field">
                <label>Iznos štete (€):</label>
                <input 
                  type="number" 
                  value={iznosStete}
                  onChange={(e) => setIznosStete(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="field">
                <label>Komentar:</label>
                <textarea 
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  rows={4}
                  placeholder="Dodatne napomene o šteti..."
                />
              </div>
              <div className="actions">
                <button onClick={handleSaveSteta} className="save-btn">
                  Spremi iznos
                </button>
                <Link 
                  to={`/dashboard/mail?template=steta&iznos=${iznosStete}&zahtjev=${id}`}
                  className="mail-btn"
                >
                  Pošalji mail korisniku
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
