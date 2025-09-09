// NesrecaForm.jsx

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/NesrecaForm.css";

const GOOGLE_API_KEY_MAP = "AIzaSyCWIaJB-eynUWVVq63fNioRuDGEIr-puRM";
const DefaultIcon = L.divIcon({
  html: "<span class='big-pin'>📍</span>",
  iconSize: [30, 30],
  className: "custom-div-icon",
});
L.Marker.prototype.options.icon = DefaultIcon;

function parseCoords(geo) {
  if (!geo) return null;
  const match = geo.match(/\(?\s*([-\d.]+),\s*([-\d.]+)\s*\)?/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])];
}

async function reverseGeocode([lat, lng], setAddress, setManualAddressMsg) {
  if (lat == null || lng == null) {
    setAddress("");
    setManualAddressMsg("");
    return;
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY_MAP}&language=hr`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      setManualAddressMsg("");
      setAddress(data.results[0].formatted_address);
    } else {
      setManualAddressMsg("Adresa nije pronađena. Upišite ručno.");
      setAddress("");
    }
  } catch {
    setManualAddressMsg("Adresa nije pronađena. Upišite ručno.");
    setAddress("");
  }
}

function useAutoAddress(geolokacija_nesrece, setMjestoNesrece, setManualAddressMsg) {
  useEffect(() => {
    const coords = parseCoords(geolokacija_nesrece);
    if (coords) reverseGeocode(coords, setMjestoNesrece, setManualAddressMsg);
    else setManualAddressMsg("");
  }, [geolokacija_nesrece, setMjestoNesrece, setManualAddressMsg]);
}

const DEFAULT_CENTER = [45.815, 15.9819];

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

const NesrecaForm = ({ data, onNext, onBack }) => {
  const navigate = useNavigate();
  const [nesrecaData, setNesrecaData] = useState(() => ({
    datum_nesrece: data?.datum_nesrece || "",
    vrijeme_nesrece: data?.vrijeme_nesrece || "",
    mjesto_nesrece: data?.mjesto_nesrece || "",
    geolokacija_nesrece: data?.geolokacija_nesrece || "",
    mapPosition: data?.mapPosition || null,
    showMap: data?.showMap ?? true,
  }));
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [manualAddressMsg, setManualAddressMsg] = useState("");

  useAutoAddress(
    nesrecaData.geolokacija_nesrece,
    (adresa) =>
      setNesrecaData((prev) =>
        prev.mjesto_nesrece !== adresa && !!adresa
          ? { ...prev, mjesto_nesrece: adresa }
          : prev
      ),
    setManualAddressMsg
  );

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
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10000,
      padding: "10px 18px",
      borderRadius: "8px",
      backgroundColor:
        type === "success"
          ? "#4caf50"
          : type === "error"
          ? "#f44336"
          : "#2196f3",
      color: "#fff",
      fontWeight: "600",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  async function getCurrentLocation() {
    setLoading(true);
    const now = new Date();
    const datum = now.toISOString().split("T")[0];
    const vrijeme = now.toTimeString().split(" ")[0];
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolokacija nije podržana na ovom uređaju");
      }
      let lat = null,
        lng = null;
      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setNesrecaData((prev) => ({
          ...prev,
          datum_nesrece: datum,
          vrijeme_nesrece: vrijeme,
          mapPosition: [lat, lng],
          showMap: true,
          // Sprema kao string!
          geolokacija_nesrece: `(${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        }));
      } catch {
        setNesrecaData((prev) => ({
          ...prev,
          datum_nesrece: datum,
          vrijeme_nesrece: vrijeme,
        }));
      }
      showToast("Podaci su automatski učitani!", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nesrecaData.datum_nesrece || nesrecaData.datum_nesrece.trim() === "") {
      showToast("Molimo unesite datum nesreće.", "error");
      return;
    }
    if (!nesrecaData.vrijeme_nesrece || nesrecaData.vrijeme_nesrece.trim() === "") {
      showToast("Molimo unesite vrijeme nesreće.", "error");
      return;
    }
    if (
      !nesrecaData.mjesto_nesrece ||
      nesrecaData.mjesto_nesrece.trim() === "" ||
      nesrecaData.mjesto_nesrece === "Adresa nije pronađena. Upišite ručno."
    ) {
      showToast("Molimo upišite mjesto nesreće.", "error");
      return;
    }

    // OVDJE šalji kao string bez objektne konverzije!
    const sendData = {
      ...nesrecaData,
      geolokacija_nesrece: nesrecaData.geolokacija_nesrece,
    };

    onNext(sendData);
  };

  const mapCenter = nesrecaData.mapPosition || DEFAULT_CENTER;

  return (
    <div className={`nesreca-container ${isMobile ? "mobile" : "desktop"}`}>
      <h2 className="nesreca-title">Prijava prometne nesreće</h2>
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
      <br />
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="datum_nesrece">
              Datum nesreće: *
            </label>
            <input
              id="datum_nesrece"
              type="date"
              value={nesrecaData.datum_nesrece}
              onChange={(e) =>
                setNesrecaData((prev) => ({ ...prev, datum_nesrece: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vrijeme_nesrece">
              Vrijeme nesreće: *
            </label>
            <input
              id="vrijeme_nesrece"
              type="time"
              value={nesrecaData.vrijeme_nesrece}
              onChange={(e) =>
                setNesrecaData((prev) => ({ ...prev, vrijeme_nesrece: e.target.value }))
              }
              className="form-input"
              required
            />
          </div>
        </div>
        <br />
        <div className="form-group">
          <label className="form-label" htmlFor="mjesto_nesrece">
            Mjesto nesreće: *
          </label>
          {manualAddressMsg && <div className="manual-address-msg">{manualAddressMsg}</div>}
          <textarea
            id="mjesto_nesrece"
            value={nesrecaData.mjesto_nesrece}
            onChange={(e) =>
              setNesrecaData((prev) => ({ ...prev, mjesto_nesrece: e.target.value }))
            }
            className="form-textarea"
            placeholder="Unesi adresu ili opis mjesta nesreće..."
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="geolokacija_nesrece">
            Geolokacija:
          </label>
          <input
            id="geolokacija_nesrece"
            type="text"
            value={nesrecaData.geolokacija_nesrece}
            readOnly
            className="form-input"
            placeholder="Geolokacija će biti prikazana ovdje"
          />
        </div>
        {nesrecaData.showMap && (
          <div className="map-section">
            <h3>Lokacija nesreće na karti:</h3>
            <MapContainer
              center={mapCenter}
              zoom={isMobile ? 13 : 16}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              tap={false}
              touchZoom={false}
              boxZoom={false}
              keyboard={false}
              style={{ height: isMobile ? 250 : 350, width: "100%", borderRadius: 12 }}
            >
              <MapRecenter center={mapCenter} />
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {nesrecaData.mapPosition && (
                <Marker position={nesrecaData.mapPosition}>
                  <Popup>{nesrecaData.mjesto_nesrece}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        )}
        <div className="navigation-buttons">
          {onBack ? (
            <button type="button" className="back-button" onClick={onBack}>
              POVRATAK
            </button>
          ) : (
            <button type="button" className="back-button" onClick={() => navigate("/")}>
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