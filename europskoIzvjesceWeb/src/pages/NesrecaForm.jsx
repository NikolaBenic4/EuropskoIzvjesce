// NesrecaForm.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/NesrecaForm.css';

const DefaultIcon = L.divIcon({
  html: '📍',
  iconSize: [25, 25],
  className: 'custom-div-icon'
});
L.Marker.prototype.options.icon = DefaultIcon;

const NesrecaForm = ({ data, onNext, onBack }) => {
  const [nesrecaData, setNesrecaData] = useState({
    datum_nesrece: data.datum_nesrece || '',
    vrijeme_nesrece: data.vrijeme_nesrece || '',
    mjesto_nesrece: data.mjesto_nesrece || '',
    geolokacija_nesrece: data.geolokacija_nesrece || '',
    ozlijedeneosobe: data.ozlijedeneosobe || null,
    stetanavozilima: data.stetanavozilima || null,
    stetanastvarima: data.stetanastvarima || null
  });
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const updateMobile = () => {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobile(
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          ua.toLowerCase()
        ) || window.innerWidth <= 768
      );
    };
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  const getPosition = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });

  const showToast = (message, type = 'info') => {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
      maxWidth: '90vw',
      boxSizing: 'border-box',
      wordBreak: 'break-word'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ISPRAVKA: Uklonite useCallback i napravite običnu async funkciju
  const getCurrentData = async () => {
    setLoading(true);
    const now = new Date();
    const datum = now.toISOString().split('T')[0];
    const vrijeme = now.toTimeString().split(' ')[0];

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolokacija nije podržana na ovom uređaju');
      }

      let lat = null, lng = null, mjesto = 'Nepoznato mjesto';
      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setMapPosition([lat, lng]);
        setShowMap(true);

        const res = await fetch(
          `https://us1.locationiq.com/v1/reverse.php?key=pk.e22baf00db7c202341076dcd0f8666c1&lat=${lat}&lon=${lng}&format=json&accept-language=hr`
        );
        const geo = await res.json();
        if (geo.display_name) mjesto = geo.display_name;
      } catch {
        mjesto = 'Lokacija nedostupna. Molim te unesi je ručno ili opiši.';
      }

      const geolokacija =
        lat && lng ? `(${lat.toFixed(4)}, ${lng.toFixed(4)})` : '';

      setNesrecaData(prev => ({
        ...prev,
        datum_nesrece: datum,
        vrijeme_nesrece: vrijeme,
        mjesto_nesrece: mjesto,
        geolokacija_nesrece: geolokacija
      }));

      setTimeout(() => {
        showToast('Podaci su automatski učitani!', 'success');
      }, 100);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!nesrecaData.datum_nesrece || !nesrecaData.vrijeme_nesrece) {
      return showToast('Molimo unesite datum i vrijeme nesreće.', 'error');
    }
    onNext(nesrecaData);
  };

  return (
    <div className={`nesreca-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <h2 className="nesreca-title">Prijava prometne nesreće</h2>
      <div className="auto-load-container">
        <button
          type="button"
          onClick={getCurrentData}
          disabled={loading}
          className={`auto-load-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="loading-spinner" /> Podaci se učitavaju...
            </>
          ) : (
            <>
              <span className="location-icon" /> AUTOMATSKI UČITAJ PODATKE
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="nesreca-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Datum nesreće: *</label>
            <input
              type="date"
              value={nesrecaData.datum_nesrece}
              onChange={e =>
                setNesrecaData(prev => ({
                  ...prev,
                  datum_nesrece: e.target.value
                }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vrijeme nesreće: *</label>
            <input
              type="time"
              value={nesrecaData.vrijeme_nesrece}
              onChange={e =>
                setNesrecaData(prev => ({
                  ...prev,
                  vrijeme_nesrece: e.target.value
                }))
              }
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mjesto nesreće: *</label>
          <textarea
            value={nesrecaData.mjesto_nesrece}
            onChange={e =>
              setNesrecaData(prev => ({
                ...prev,
                mjesto_nesrece: e.target.value
              }))
            }
            className="form-textarea"
            placeholder="Unesi adresu ili opis mjesta nesreće..."
            rows={isMobile ? 3 : 4}
          />
        </div>

        <div className="form-group fullwidth-group">
        <label className="form-label">Geolokacija:</label>
        <input
            type="text"
            value={nesrecaData.geolokacija_nesrece}
            readOnly
            className="form-input readonly"
            placeholder="Geolokacija će se učitati automatski..."
        />
        </div>


        {showMap && mapPosition && (
          <div className="map-section">
            <h3>Lokacija nesreće na mapi:</h3>
            <MapContainer
              center={mapPosition}
              zoom={isMobile ? 14 : 15}
              scrollWheelZoom={!isMobile}
              dragging
              tap={isMobile}
              touchZoom={isMobile}
              style={{
                height: isMobile ? '250px' : '300px',
                width: '100%',
                borderRadius: '8px'
              }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapPosition}>
                <Popup>
                  <strong>Lokacija nesreće</strong>
                  <br />
                  {nesrecaData.mjesto_nesrece}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        <div className="navigation-buttons">
          {onBack && (
            <button type="button" className="back-button" onClick={onBack}>
              NAZAD
            </button>
          )}
          <button type="submit" className="submit-button">
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};

export default NesrecaForm;
