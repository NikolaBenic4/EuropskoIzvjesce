import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/NesrecaForm.css";

const DefaultIcon = L.divIcon({
  html: "<span class='big-pin'>📍</span>",
  iconSize: [30, 30],
  className: "custom-div-icon",
});
L.Marker.prototype.options.icon = DefaultIcon;

const NesrecaForm = ({ data, onNext, onBack }) => {
  const navigate = useNavigate();

  // 1. Session-sync state
  const [nesrecaData, setNesrecaData] = useState(() => ({
    datum_nesrece: data?.datum_nesrece || "",
    vrijeme_nesrece: data?.vrijeme_nesrece || "",
    mjesto_nesrece: data?.mjesto_nesrece || "",
    geolokacija_nesrece: data?.geolokacija_nesrece || "",
    ozlijeneosobe: data?.ozlijeneosobe ?? null,
    stetanavozila: data?.stetanavozila ?? null,
    stetanastava: data?.stetanastava ?? null,
    mapPosition: data?.mapPosition || null,
    showMap: data?.showMap || false,
  }));

  // 2. Kad god dobiješ nove "data" iz parenta (povratak korak), popuni lokalni state
  useEffect(() => {
    setNesrecaData({
      datum_nesrece: data?.datum_nesrece || "",
      vrijeme_nesrece: data?.vrijeme_nesrece || "",
      mjesto_nesrece: data?.mjesto_nesrece || "",
      geolokacija_nesrece: data?.geolokacija_nesrece || "",
      ozlijeneosobe: data?.ozlijeneosobe ?? null,
      stetanavozila: data?.stetanavozila ?? null,
      stetanastava: data?.stetanastava ?? null,
      mapPosition: data?.mapPosition || null,
      showMap: data?.showMap || false,
    });
  }, [data]);

  const [loading, setLoading] = useState(false);
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
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  const getPosition = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

  const showToast = (message, type = "info") => {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
      maxWidth: "90vw",
      boxSizing: "border-box",
      wordBreak: "break-word",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const getCoordinatesString = (lat, lng) =>
    `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  async function getCurrentLocation() {
    setLoading(true);
    const now = new Date();
    const datum = now.toISOString().split("T")[0];
    const vrijeme = now.toTimeString().split(" ")[0];
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported by this device");
      }
      let lat = null,
        lng = null,
        mjesto =
          "Adresa nije pronađena! Molim unesi adresu ili opiši gdje se nalaziš.";

      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setNesrecaData((prev) => ({
          ...prev,
          mapPosition: [lat, lng],
          showMap: true,
        }));
        const response = await fetch(
          `https://us1.locationiq.com/v1/reverse.php?key=pk.e22af6b8336ffc79ccebbf47c17c1c76&lat=${lat}&lon=${lng}&format=json&accept-language=hr`
        );
        const geo = await response.json();
        if (geo.display_name) mjesto = geo.display_name;
      } catch (error) {
        mjesto = "Lokacija nedostupna. Molim te unesi je ručno ili opiši.";
      }
      const geoStr = lat && lng ? getCoordinatesString(lat, lng) : "";

      setNesrecaData((prev) => ({
        ...prev,
        datum_nesrece: datum,
        vrijeme_nesrece: vrijeme,
        mjesto_nesrece: mjesto,
        geolokacija_nesrece: geoStr,
      }));

      showToast("Podaci su automatski učitani!", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const [mapPosition, setMapPosition] = useState(nesrecaData.mapPosition);
  const [showMap, setShowMap] = useState(nesrecaData.showMap);

  useEffect(() => {
    setMapPosition(nesrecaData.mapPosition);
    setShowMap(nesrecaData.showMap);
  }, [nesrecaData.mapPosition, nesrecaData.showMap]);

  // Sync mapPosition changes to nesrecaData
  useEffect(() => {
    setNesrecaData((prev) => ({
      ...prev,
      mapPosition: mapPosition,
      showMap: showMap,
    }));
  }, [mapPosition, showMap]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nesrecaData.datum_nesrece || !nesrecaData.vrijeme_nesrece) {
      return showToast("Molimo unesite datum i vrijeme.", "error");
    }
    onNext(nesrecaData);
  };

  return (
    <div className={`nesreca-container ${isMobile ? "mobile" : "desktop"}`}>
      <h2 className="nesreca-title">Prijava prometne nesreće</h2>
      <div className="auto-load-container">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className={`auto-load-button ${loading ? "loading" : ""}`}
        >
          {loading ? (
            <>
              <span className="loading-spinner" /> Podaci se učitavaju...
            </>
          ) : (
            <>
              <span className="location-icon" /> AUTOMATSKI UČITAJ
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
              onChange={(e) =>
                setNesrecaData((prev) => ({
                  ...prev,
                  datum_nesrece: e.target.value,
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
              onChange={(e) =>
                setNesrecaData((prev) => ({
                  ...prev,
                  vrijeme_nesrece: e.target.value,
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
            onChange={(e) =>
              setNesrecaData((prev) => ({
                ...prev,
                mjesto_nesrece: e.target.value,
              }))
            }
            className="form-textarea"
            placeholder="Unesi adresu ili opis mjesta nesreće..."
          />
        </div>

        <div className="form-group fullwidth-group">
          <label className="form-label">Geolokacija:</label>
          <input
            type="text"
            value={nesrecaData.geolokacija_nesrece}
            readOnly
            className="form-input readonly"
            placeholder="Geolokacija će biti prikazana ovdje"
          />
        </div>

        {showMap && mapPosition && (
          <div className="map-section">
            <h3>Lokacija nesreće na karti:</h3>
            <MapContainer
              center={mapPosition}
              zoom={isMobile ? 13 : 16}
              scrollWheelZoom={!isMobile}
              dragging
              tap={isMobile}
              touchZoom={isMobile}
              style={{ height: isMobile ? 250 : 350, width: "100%", borderRadius: 12 }}
              ref={mapRef}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapPosition}>
                <Popup>{nesrecaData.mjesto_nesrece}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        <div className="navigation-buttons">
          {onBack ? (
            <button type="button" className="back-button" onClick={onBack}>
              POVRATAK
            </button>
          ) : (
            <button type="button" className="back-button" onClick={() => navigate('/')}>
              POVRATAK
            </button>
          )}
          <button type="submit" className="next-button">
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};

export default NesrecaForm;
