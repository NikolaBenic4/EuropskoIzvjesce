import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "../css/PotpisForm.css";

const BANKS_BY_IBAN_PREFIX = {
  "1001": "Hrvatska narodna banka",
  "2330": "Societe Generale-Splitska banka",
  "2340": "Privredna banka Zagreb",
  "2360": "Zagrebačka banka", 
  "2380": "Istarska kreditna banka Umag",
  "2386": "Podravska banka",
  "2390": "Hrvatska poštanska banka",
  "2400": "Karlovačka banka",
  "2402": "Erste&Steiermärkische Bank",
  "2403": "Samoborska banka",
  "2407": "OTP banka Hrvatska",
  "2408": "Partner banka",
  "2411": "Jadranska banka",
  "2412": "Slatinska banka",
  "2481": "Agram banka (Kreditna banka Zagreb)",
  "2483": "Štedbanka",
  "2484": "Raiffeisenbank Austria",
  "2485": "Croatia banka",
  "2488": "BKS Bank",
  "2489": "J&T banka (Vaba d.d. Banka Varaždin)",
  "2492": "Imex banka",
  "2493": "Hrvatska banka za obnovu i razvitak",
  "2495": "Nava banka", 
  "2500": "Addiko Bank (Hypo Alpe-Adria-Bank)",
  "2503": "Sberbank",
  "4109": "Banka Splitsko-dalmatinska",
  "4115": "Banco Popolare Croatia",
  "4124": "Kentbank",
  "4132": "Primorska banka",
  "4133": "Banka Kovanica"
};

const initialState = {
  signatureData: null,
  signatureDate: null,
  iban: "",
  banka: ""
};

const PotpisForm = ({ data, onNext, onBack }) => {
  // Inicijalizacija i sinkronizacija
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {})
  }));

  const [scanActive, setScanActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const sigCanvas = useRef(null);
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  // Sync from parent data change
  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  const detectBankaFromIban = (ibanInput) => {
    const cleaned = (ibanInput || "").replace(/\s+/g, "").toUpperCase();
    if (cleaned.startsWith("HR") && cleaned.length >= 8) {
      const bankCode = cleaned.substring(4, 8);
      return BANKS_BY_IBAN_PREFIX[bankCode] || "Nepoznata banka";
    }
    return "";
  };

  function extractIban(text) {
    const match = text.replace(/\s+/g, "").match(/HR\d{19}/i);
    return match ? match[0].replace(/(.{4})/g, "$1 ").trim() : "";
  }

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      banka: formData.iban.length >= 8 ? detectBankaFromIban(formData.iban) : ""
    }));
    // eslint-disable-next-line
  }, [formData.iban]);

  const handleEndSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setFormData(f => ({
        ...f,
        signatureData: sigCanvas.current.toDataURL(),
        signatureDate: new Date().toISOString()
      }));
    }
  };

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setFormData(f => ({
        ...f,
        signatureData: null,
        signatureDate: null
      }));
    }
  };

  // OCR - scanActive
  useEffect(() => {
    const startCamera = async () => {
      setCameraError("");
      setScanMessage("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setLoadingScan(true);

        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        tesseractWorkerRef.current = worker;

        scanIntervalRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.videoWidth < 2) return;

          const cropW = video.videoWidth * 0.6;
          const cropH = video.videoHeight * 0.3;
          const cropX = (video.videoWidth - cropW) / 2;
          const cropY = (video.videoHeight - cropH) / 2;

          const canvas = document.createElement("canvas");
          canvas.width = cropW;
          canvas.height = cropH;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          try {
            const { data: { text } } = await worker.recognize(canvas);
            const detectedIban = extractIban(text);
            if (detectedIban) {
              setFormData((f) => ({
                ...f,
                iban: detectedIban
              }));
              setScanMessage("✅ IBAN je uspješno prepoznat!");
              setScanActive(false);
            }
          } catch (err) {
            console.error("OCR error:", err);
          }
        }, 400);
      } catch (err) {
        setCameraError("Greška s kamerom: " + err.message);
      }
    };

    if (scanActive) {
      startCamera();
    } else {
      setLoadingScan(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
        tesseractWorkerRef.current = null;
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
        tesseractWorkerRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line
  }, [scanActive]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({
      ...f,
      [name]: value
    }));
    if (name === "iban") setScanMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
      </div>

      {formData.signatureDate && (
        <p>
          <strong>Datum potpisa:</strong>{" "}
          {new Date(formData.signatureDate).toLocaleString()}
        </p>
      )}

      <div className="form-group scan-group">
        <label htmlFor="ibanInput" className="form-label">
          IBAN za isplatu:
        </label>
        <input
          id="ibanInput"
          name="iban"
          type="text"
          className="form-input"
          value={formData.iban}
          onChange={handleInputChange}
          placeholder="HR12 3456 7890 ..."
          autoComplete="off"
          style={{ width: "340px", fontSize: "1.15em" }}
        />
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
          className="form-input"
          readOnly
          value={formData.banka}
          placeholder="Automatski detektirana banka"
        />
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
