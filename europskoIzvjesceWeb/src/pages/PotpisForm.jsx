import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "../css/PotpisForm.css";

const BANKS_BY_IBAN_PREFIX = {
  "1000": "Hrvatska poštanska banka",
  "2000": "Privredna banka Zagreb",
  "2400": "Raiffeisenbank Austria - Hrvatska",
  "3000": "Zagrebačka banka",
  "3300": "OTP banka Hrvatska",
  "3600": "Erste&Steiermärkische Bank",
  "4000": "Splitska banka",
  "4100": "OTP banka Hrvatska (stara)",
  "4200": "Karlovačka banka",
  "4400": "Helena banka",
  "5000": "PBZ (Privredna banka Zagreb) - nova oznaka",
  "5200": "Zagrebačka banka - nova oznaka",
  "5600": "Erste banka",
};

const PotpisForm = () => {
  const [signatureData, setSignatureData] = useState(null);
  const [signatureDate, setSignatureDate] = useState(null);
  const [iban, setIban] = useState("");
  const [banka, setBanka] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const sigCanvas = useRef(null);
  const videoRef = useRef(null);

  // Platform detection helpers
  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = () =>
    /Android/.test(navigator.userAgent);

  // Provide a helpful message for the given environment
  const getCameraSupportMessage = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return "Kamera nije podržana u ovom browseru.";
    }
    // iOS Safari: only HTTPS allowed
    if (isIOS()) {
      if (window.location.protocol !== "https:") {
        return "Na iOS-u (iPhone/iPad) kamera radi SAMO na HTTPS adresi. Pokreni lokalni server kao HTTPS i otvori u Safariju.";
      }
      if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        return "Na iOS-u isključivo koristi Safari (ne Chrome/Firefox) za pristup kameri.";
      }
    }
    // Android/Chrome: must use proper browser, not WebView
    if (isAndroid()) {
      if (window.navigator.userAgent.includes("wv")) {
        return "Kamera nije podržana u WebView aplikacijama. Otvori web u Chrome/Firefox browseru.";
      }
    }
    return ""; // All good
  };

  const handleEndSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const data = sigCanvas.current.toDataURL();
      setSignatureData(data);
      setSignatureDate(new Date().toISOString());
    }
  };

  const detectBankaFromIban = (ibanInput) => {
    const cleaned = ibanInput.replace(/\s+/g, "").toUpperCase();
    if (cleaned.startsWith("HR") && cleaned.length >= 8) {
      const bankCode = cleaned.substring(4, 8);
      return BANKS_BY_IBAN_PREFIX[bankCode] || "Nepoznata banka";
    }
    return "";
  };

  useEffect(() => {
    if (iban.length >= 8) {
      setBanka(detectBankaFromIban(iban));
    } else {
      setBanka("");
    }
  }, [iban]);

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignatureData(null);
      setSignatureDate(null);
    }
  };

  useEffect(() => {
    setCameraError(""); // resetiraj error svaki put kad otvaraš kameru
    if (scanActive) {
      const msg = getCameraSupportMessage();
      if (msg) {
        setCameraError(msg);
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          setCameraError(
            `Greška s kamerom: ${err.name}\nPoruka: ${err.message}`
          );
        });
    } else {
      // Pauziraj kameru kad nije aktivan skener
      if (videoRef.current && videoRef.current.srcObject) {
        let tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        let tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line
  }, [scanActive]);

  return (
    <form className="potpis-form">
      <div className="form-group">
        <label className="form-label">Potpis:</label>
        <div>
          <SignatureCanvas
            penColor="black"
            canvasProps={{
              width: 400,
              height: 150,
              className: "sigCanvas",
              style: { border: "2px solid #003366", borderRadius: "8px" },
            }}
            ref={sigCanvas}
            onEnd={handleEndSignature}
          />
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={handleClearSignature}
          style={{ marginTop: "12px" }}
        >
          Obriši potpis
        </button>
      </div>

      {signatureDate && (
        <div className="form-group">
          <p>
            <strong>Datum potpisa:</strong> {new Date(signatureDate).toLocaleString()}
          </p>
        </div>
      )}

      <div className="form-group scan-group">
        <label htmlFor="ibanInput" className="form-label">
          IBAN za isplatu:
        </label>
        <input
          id="ibanInput"
          type="text"
          className="form-input"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="HR12 3456 7890 ..."
          pattern="HR\d{2}(\s?\w{4}){3,6}"
          title="Unesite ispravan IBAN format"
          autoComplete="off"
        />
        <button
          type="button"
          className="submit-button scan-button"
          onClick={() => setScanActive((prev) => !prev)}
          aria-label="Skeniraj IBAN"
        >
          Skeniraj
        </button>
      </div>

      {scanActive && (
        <div className="scanner-container">
          {cameraError ? (
            <div className="camera-error" style={{ color: "red", fontWeight: "bold" }}>{cameraError}</div>
          ) : (
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
          )}
          <button
            type="button"
            className="submit-button"
            onClick={() => setScanActive(false)}
            style={{ marginTop: "10px" }}
          >
            Zatvori skener
          </button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="bankInput" className="form-label">
          Naziv banke:
        </label>
        <input
          id="bankInput"
          type="text"
          className="form-input"
          value={banka}
          readOnly
          placeholder="Automatski detektirana banka"
        />
      </div>
    </form>
  );
};

export default PotpisForm;
