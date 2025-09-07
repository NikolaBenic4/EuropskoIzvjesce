import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "../css/PotpisForm.css";

const initialState = {
  potpis: null,
  datum_potpisa: null,
  iban: "",
  banka: ""
};

const PotpisForm = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {})
  }));
  const [scanActive, setScanActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [errors, setErrors] = useState({});

  const sigCanvas = useRef(null);
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  // Novi način: frontend pita backend kad ima dovoljno IBAN znakova
  useEffect(() => {
  const fetchBanka = async () => {
    // Ukloni sve razmake i spec. znakove iz IBAN-a jer backend radi isto!
    const ibanClean = (formData.iban || "").replace(/\W/g, "").toUpperCase();
    if (ibanClean.length >= 11 && ibanClean.startsWith("HR")) {
      try {
        const res = await fetch(`/api/banka/banka-za-iban?iban=${encodeURIComponent(formData.iban)}`);
        if (res.ok) {
          const { naziv_banke } = await res.json();
          setFormData(prev => ({ ...prev, banka: naziv_banke || "" }));
        } else {
          setFormData(prev => ({ ...prev, banka: "" }));
        }
      } catch {
        setFormData(prev => ({ ...prev, banka: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, banka: "" }));
    }
  };
  fetchBanka();
}, [formData.iban]);


  function extractIban(text) {
    const match = text.replace(/\s+/g, "").match(/HR\d{19}/i);
    return match ? match[0].replace(/(.{4})/g, "$1 ").trim() : "";
  }

  const handleEndSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setFormData(f => ({
        ...f,
        potpis: sigCanvas.current.toDataURL(),
        datum_potpisa: new Date().toISOString()
      }));
    }
  };

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setFormData(f => ({
        ...f,
        potpis: null,
        datum_potpisa: null
      }));
    }
  };

  // Skeniranje putem OCR ostaje kao i prije

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({
      ...f,
      [name]: value
    }));
    if (name === "iban") setScanMessage("");
  };

  const validate = () => {
    const errObj = {};
    if (!formData.potpis) errObj.potpis = "Potpis je obavezan.";
    if (!formData.iban) errObj.iban = "IBAN je obavezan.";
    if (!formData.banka) errObj.banka = "Nevažeći ili neprepoznat IBAN!";
    setErrors(errObj);
    return Object.keys(errObj).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onNext) onNext(formData);
  };

  return (
    <form className="potpis-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", color: "#002060", marginBottom: "1rem" }}>
        Potpis i podaci o banci
      </h2>

      <div className="form-group">
        <label className="form-label">Potpis:</label>
        <SignatureCanvas
          penColor="black"
          canvasProps={{
            width: 400,
            height: 150,
            className: "sigCanvas",
            style: { border: "2px solid #003366", borderRadius: "8px" }
          }}
          ref={sigCanvas}
          onEnd={handleEndSignature}
        />
        <button
          type="button"
          className="submit-button"
          onClick={handleClearSignature}
          style={{ marginTop: "12px" }}
        >
          Obriši potpis
        </button>
        {errors.potpis && <div className="error-message">{errors.potpis}</div>}
      </div>

      {/* datum_potpisa je skriveno polje, ne prikazuje se korisniku */}

      <div className="form-group scan-group">
        <label htmlFor="ibanInput" className="form-label">
          IBAN za isplatu:
        </label>
        <input
          id="ibanInput"
          name="iban"
          type="text"
          className={`form-input ${errors.iban ? "input-error" : ""}`}
          value={formData.iban}
          onChange={handleInputChange}
          placeholder="HR12 3456 7890 ..."
          autoComplete="off"
          style={{ width: "340px", fontSize: "1.15em" }}
        />
        {errors.iban && <div className="error-message">{errors.iban}</div>}
        <button
          type="button"
          className="submit-button scan-button"
          onClick={() => {
            setScanActive((prev) => !prev);
            setScanMessage("");
          }}
          style={{ width: "100%", marginTop: "15px", fontSize: "1.09em" }}
        >
          {scanActive
            ? "Zatvori skener"
            : <>
                <span role="img" aria-label="kamera" style={{ marginRight: "7px" }}>
                  📷
                </span>
                SKENIRAJ IBAN
              </>}
        </button>
        {scanMessage && (
          <p
            style={{
              color: "green",
              fontWeight: "bold",
              marginTop: "12px",
            }}
          >
            {scanMessage}
          </p>
        )}
      </div>

      {scanActive && (
        <div className="scanner-container" style={{ position: "relative" }}>
          {cameraError ? (
            <div style={{ color: "red", fontWeight: "bold" }}>
              {cameraError}
            </div>
          ) : (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "5%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#fff",
                  background: "rgba(0,32,96,0.82)",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  zIndex: 7
                }}
              >
                Postavite IBAN jasno u zeleni pravokutnik!
              </div>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  maxHeight: "360px",
                  borderRadius: "8px",
                  background: "#222"
                }}
                muted
                playsInline
                autoPlay
              />
              <div
                className="scan-area-rectangle"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "60%",
                  height: "30%",
                  transform: "translate(-50%, -50%)",
                  border: "3px solid lime",
                  borderRadius: "12px",
                  pointerEvents: "none",
                  boxShadow: "0 0 20px 2px rgba(50,255,50,0.3)"
                }}
              />
              {loadingScan && (
                <p
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "white",
                    background: "rgba(0,0,0,0.6)",
                    padding: "5px 10px",
                    borderRadius: "6px"
                  }}
                >
                  ⏳ Skeniram IBAN…
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Naziv banke:</label>
        <input
          type="text"
          className={`form-input ${errors.banka ? "input-error" : ""}`}
          readOnly
          value={formData.banka}
          placeholder="Automatski detektirana banka"
        />
        {errors.banka && <div className="error-message">{errors.banka}</div>}
      </div>

      <div className="navigation-buttons">
        {typeof onBack === "function" && (
          <button
            type="button"
            className="back-button"
            aria-label="Nazad na prethodni korak"
            onClick={onBack}
            style={{ marginRight: 12 }}
          >
            NAZAD
          </button>
        )}
        <button
          type="submit"
          className="next-button"
        >
          DALJE
        </button>
      </div>
    </form>
  );
};

export default PotpisForm;
