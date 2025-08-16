import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/NesrecaForm.css';

// Postavljanje za ispravljanje Leaflet ikona u webpacku
let DefaultIcon = L.divIcon({
    html: '📍',
    iconSize: [25, 25],
    className: 'custom-div-icon'
});

L.Marker.prototype.options.icon = DefaultIcon;

const NesrecaForm = ({ onNext }) => {
    const [nesrecaData, setNesrecaData] = useState({
        datum_nesrece: '',
        vrijeme_nesrece: '',
        mjesto_nesrece: '',
        geolokacija_nesrece: '',
        ozlijedeneosobe: null,
        stetanavozilima: null,
        stetanastvarima: null
    });

    const [loading, setLoading] = useState(false);
    const [mapPosition, setMapPosition] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const mapRef = useRef(null);

    // Detektiraj je li mobilni uređaj
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
                                   window.innerWidth <= 768;
            setIsMobile(isMobileDevice);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getCurrentData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const datum = now.toISOString().split('T')[0];
            const vrijeme = now.toTimeString().split(' ')[0];

            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                };

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;

                        const lat4 = lat.toFixed(4);
                        const lng4 = lng.toFixed(4);
                        const geolokacija = `(${lat4}, ${lng4})`;

                        // Postavke za mapu
                        setMapPosition([lat, lng]);
                        setShowMap(true);

                        let mjesto = 'Nepoznato mjesto';
                        try {
                            const response = await fetch(
                                `https://us1.locationiq.com/v1/reverse.php?key=pk.e22baf00db7c202341076dcd0f8666c1&lat=${lat}&lon=${lng}&format=json&accept-language=hr`
                            );
                            const data = await response.json();
                            if (data.display_name) {
                                mjesto = data.display_name;
                            }
                        } catch (geocodeError) {
                            console.warn('Greška u dohvaćanju adrese: ', geocodeError);
                        }

                        setNesrecaData(prev => ({
                            ...prev,
                            datum_nesrece: datum,
                            vrijeme_nesrece: vrijeme,
                            mjesto_nesrece: mjesto,
                            geolokacija_nesrece: geolokacija
                        }));

                        setLoading(false);
                        
                        // Koristi toast umjesto alert za bolje korisničko iskustvo
                        if (isMobile) {
                            // Toast notifikacija za mobile
                            showToast('Podaci su automatski učitani!', 'success');
                        } else {
                            alert('Podaci su automatski učitani!');
                        }
                    },
                    (error) => {
                        console.error('Greška u dobivanju lokacije: ', error);
                        setNesrecaData(prev => ({
                            ...prev,
                            datum_nesrece: datum,
                            vrijeme_nesrece: vrijeme,
                            mjesto_nesrece: 'Lokacija nedostupna. Molim te unesi lokaciju na kojoj se nalaziš ili ju opiši.',
                            geolokacija_nesrece: ''
                        }));
                        setLoading(false);
                        
                        if (isMobile) {
                            showToast('Datum i vrijeme su učitani. Lokacija nije dostupna.', 'warning');
                        } else {
                            alert('Datum i vrijeme su učitani. Lokacija nije dostupna.');
                        }
                    },
                    options
                );
            } else {
                throw new Error('Geolokacija nije podržana na ovom uređaju');
            }
        } catch (error) {
            console.error('Greška u dobivanju podataka:', error);
            setLoading(false);
            
            if (isMobile) {
                showToast(error.message, 'error');
            } else {
                alert(error.message);
            }
        }
    };

    // Toast funkcija za mobilne uređaje
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Osnovnu validaciju
        if (!nesrecaData.datum_nesrece || !nesrecaData.vrijeme_nesrece) {
            const message = 'Molimo unesite datum i vrijeme nesreće.';
            if (isMobile) {
                showToast(message, 'error');
            } else {
                alert(message);
            }
            return;
        }
        
        if (onNext) onNext(nesrecaData);
    };

    return (
        <div className={`nesreca-container ${isMobile ? 'mobile' : 'desktop'}`}>
            <h2 className="nesreca-title">Prijava prometne nesreće</h2>

            <div className="auto-load-container">
  <button
    onClick={getCurrentData}
    disabled={loading}
    className={`auto-load-button ${loading ? 'loading' : ''}`}
  >
    {loading ? (
      <>
        <span className="loading-spinner"></span>
        Podaci se učitavaju...
      </>
    ) : (
      <>
        <span className="location-icon"></span>
        AUTOMATSKI UČITAJ PODATKE
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
                            onChange={e => setNesrecaData(prev => ({
                                ...prev,
                                datum_nesrece: e.target.value
                            }))}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Vrijeme nesreće: *</label>
                        <input
                            type="time"
                            value={nesrecaData.vrijeme_nesrece}
                            onChange={e => setNesrecaData(prev => ({
                                ...prev,
                                vrijeme_nesrece: e.target.value
                            }))}
                            className="form-input"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Mjesto nesreće: *</label>
                    <textarea
                        value={nesrecaData.mjesto_nesrece}
                        onChange={e => setNesrecaData(prev => ({
                            ...prev,
                            mjesto_nesrece: e.target.value
                        }))}
                        className="form-textarea"
                        placeholder="Unesi adresu ili opis mjesta nesreće..."
                        rows={isMobile ? 3 : 4}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Geolokacija:</label>
                    <input
                        type="text"
                        value={nesrecaData.geolokacija_nesrece}
                        readOnly
                        className="form-input readonly"
                        placeholder="Geolokacija će se učitati automatski..."
                    />
                </div>

                {/* Mapa se prikazuje kada je lokacija dobivena */}
            {showMap && mapPosition && (
                <div className="map-section">
                    <h3>Lokacija nesreće na mapi:</h3>
                    <div className="map-container">
                        <MapContainer
                            center={mapPosition}
                            zoom={isMobile ? 14 : 15}
                            scrollWheelZoom={!isMobile}
                            dragging={true}
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
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={mapPosition}>
                                <Popup>
                                    <div>
                                        <strong>Lokacija nesreće</strong><br/>
                                        {nesrecaData.mjesto_nesrece}
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </div>
            )}

                <button type="submit" className="submit-button">
                    <span className="submit-icon"></span>
                    Dalje
                </button>
            </form>
        </div>
    );
};

export default NesrecaForm;
