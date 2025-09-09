import React, { useState, useRef, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import Tesseract from "tesseract.js";
import "../css/PotpisForm.css";

const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";

const initialState = {
  potpis: null,
  datum_potpisa: null,
  iban_osiguranika: "",
  banka: ""
};

function cleanIban(str) {
  return str
    .replace(/\s|-/g, "")
    .replace(/O/gi, "0")
    .replace(/I/g, "1")
    .replace(/Z/g, "2")
    .replace(/B/g, "8")
    .replace(/S/g, "5")
    .toUpperCase();
}
const ibanRegex = /HR[\s\-]?\d{2}(?:[\s\-]?\d{4}){4}[\s\-]?\d{3}/i;

function preprocessCanvasSmart(canvas, srcVideo) {
  const cropHeight = Math.round(srcVideo.videoHeight * 0.26);
  const cropY = Math.round(srcVideo.videoHeight * 0.37);
  const scale = 3;
  canvas.width = srcVideo.videoWidth * scale;
  canvas.height = cropHeight * scale;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    srcVideo,
    0, cropY, srcVideo.videoWidth, cropHeight,
    0, 0, canvas.width, canvas.height
  );
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imgData;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let v = avg > 170 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imgData, 0, 0);
}

const PotpisForm = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState({ ...initialState, ...(data || {}) });
  const [scanActive, setScanActive] = useState(false);
  const [errors, setErrors] = useState({});
  const sigCanvas = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const ocrCanvasRef = useRef(null);
  const scanTimer = useRef(null);
  const [canvasDims, setCanvasDims] = useState({ width: 400, height: 150 });
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const parentWidth = containerRef.current.offsetWidth;
      let width = Math.max(260, Math.min(parentWidth - 4, 450));
      let height = Math.round(width * 0.375);
      setCanvasDims({ width, height });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...data }));
  }, [data]);

  useEffect(() => {
    let stream = null;
    async function initCamera() {
      if (scanActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { exact: "environment" },
              width: { min: 800, ideal: 1920, max: 2560 },
              height: { min: 480, ideal: 1080, max: 1440 }
            }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 400, ideal: 720, max: 1080 }
            }
          });
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
      }
    }
    if (scanActive) initCamera();
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanActive]);

  useEffect(() => {
    if (!scanActive) return;
    let running = true;
    const scan = async () => {
      if (!scanActive || !videoRef.current || !running) return;
      const v = videoRef.current;
      setVideoDims({ w: v.videoWidth, h: v.videoHeight });

      if (!v.videoWidth || !v.videoHeight || v.videoWidth < 120 || v.videoHeight < 40) {
        scanTimer.current = setTimeout(scan, 700);
        return;
      }
      if (!ocrCanvasRef.current) ocrCanvasRef.current = document.createElement("canvas");
      preprocessCanvasSmart(ocrCanvasRef.current, v);
      try {
        const { data: { text } } = await Tesseract.recognize(
          ocrCanvasRef.current,
          { lang: 'eng', tessedit_char_whitelist: "HR0123456789" },
          {
            tessedit_char_whitelist: "HR0123456789",
            preserve_interword_spaces: 1,
            oem: 3,
            psm: 6
          }
        );
        const match = text.replace(/\n/g, ' ').match(ibanRegex);
        if (match) {
          const iban = cleanIban(match[0]);
          if (/^HR\d{19}$/.test(iban)) {
            setFormData(f => ({ ...f, iban_osiguranika: iban }));
            setScanActive(false);
            return;
          }
        }
      } catch (e) {}
      scanTimer.current = setTimeout(scan, 1300);
    };
    scanTimer.current = setTimeout(scan, 400);
    return () => { running = false; clearTimeout(scanTimer.current); };
  }, [scanActive]);

  useEffect(() => {
    const fetchBanka = async () => {
      const ibanClean = (formData.iban_osiguranika || "").replace(/\W/g, "").toUpperCase();
      if (ibanClean.length >= 11 && ibanClean.startsWith("HR")) {
        try {
          const res = await fetch(`/api/banka/banka-za-iban?iban=${encodeURIComponent(formData.iban_osiguranika)}`, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY
            }
          });
          if (res.status === 401) {
            setFormData(prev => ({ ...prev, banka: "" }));
            setErrors(prev => ({ ...prev, banka: "Nemate pravo pristupa bazi (API ključ neispravan)." }));
            return;
          }
          if (res.ok) {
            const { naziv_banke } = await res.json();
            setFormData(prev => ({ ...prev, banka: naziv_banke || "" }));
            setErrors(prev => ({ ...prev, banka: "" }));
          } else {
            setFormData(prev => ({ ...prev, banka: "" }));
            setErrors(prev => ({ ...prev, banka: "IBAN nije povezan s bankom." }));
          }
        } catch {
          setFormData(prev => ({ ...prev, banka: "" }));
          setErrors(prev => ({ ...prev, banka: "Greška dohvata banke." }));
        }
      } else {
        setFormData(prev => ({ ...prev, banka: "" }));
        setErrors(prev => ({ ...prev, banka: "" }));
      }
    };
    fetchBanka();
  }, [formData.iban_osiguranika]);

  const handleEndSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      let potpisUrl;
      try {
        potpisUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      } catch {
        potpisUrl = sigCanvas.current.toDataURL("image/png");
      }
      setFormData(f => ({
        ...f,
        potpis: potpisUrl,
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({
      ...f,
      [name]: value
    }));
  };
  const validate = () => {
    const errObj = {};
    if (!formData.potpis) errObj.potpis = "Potpis je obavezan.";
    if (!formData.iban_osiguranika) errObj.iban_osiguranika = "IBAN je obavezan.";
    if (!formData.banka) errObj.banka = "Nevažeći ili neprepoznat IBAN!";
    setErrors(errObj);
    return Object.keys(errObj).length === 0;
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    if (onNext) {
      const dataForBackend = {
        ...formData,
        iban_osiguranika: cleanIban(formData.iban_osiguranika),
      };
      onNext(dataForBackend);
    }
  };

  return (
    <form className="potpis-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", color: "#002060", marginBottom: "1rem" }}>Potpis i podaci o banci</h2>
      <div className="form-group" ref={containerRef}>
        <label htmlFor="signatureInput" className="form-label">Potpis:</label>
        <div className="signature-box">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="#002060"
            minWidth={1}
            maxWidth={1.5}
            backgroundColor="#fff"
            canvasProps={{
              id: "signatureInput",
              width: canvasDims.width,
              height: canvasDims.height,
              className: "sigCanvas"
            }}
            onEnd={handleEndSignature}
          />
        </div>
        <button type="button" className="clear-button" onClick={handleClearSignature}>OBRIŠI POTPIS</button>
        {errors.potpis && <div className="error-message">{errors.potpis}</div>}
      </div>
      <div className="form-group scan-group">
        <label htmlFor="iban_osiguranika" className="form-label">IBAN za isplatu:</label>
        <input id="iban_osiguranika" name="iban_osiguranika" type="text"
          className={`form-input${errors.iban_osiguranika ? " input-error" : ""}`}
          value={formData.iban_osiguranika}
          onChange={handleInputChange}
          placeholder="HR12 3456 7890 ..."
          autoComplete="off"
        />
        {errors.iban_osiguranika && <div className="error-message">{errors.iban_osiguranika}</div>}
        {!formData.iban_osiguranika && (
          <button
            type="button"
            className="scan-button"
            onClick={() => setScanActive(true)}
          >
            📷 OČITAJ IBAN KAMEROM
          </button>
        )}
      </div>
      {scanActive && (
        <div className="scanner-container" style={{ position: "relative" }}>
          <div style={{
            color: "#002060",
            fontWeight: 600,
            fontSize: "1.09em",
            background: "#F2F5FB",
            borderRadius: "7px",
            padding: "10px",
            textAlign: "center",
            marginBottom: "6px"
          }}>
            Smjestite <b>IBAN</b> unutar ZELENOG okvira u sredini slike!<br />
            <span style={{ color: "#069a01", fontWeight: 700 }}>
              Skeniranje se odvija automatski.
            </span>
            {videoRef.current && (videoRef.current.videoWidth < 120 || videoRef.current.videoHeight < 40) &&
              <div style={{ color: "#c00", fontWeight: 700, fontSize: "1em", marginTop: "8px" }}>
                Pokrećem kameru...<br />
                Trenutna dimenzija: {videoDims.w}x{videoDims.h}
              </div>}
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <video
              ref={videoRef}
              className="scan-video"
              muted
              playsInline
              autoPlay
            />
            <div className="scan-area-overlay">
              <div className="scan-area-rectangle"></div>
            </div>
          </div>
          <button
            type="button"
            className="submit-button"
            onClick={() => setScanActive(false)}
          >
            Odustani
          </button>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="bankaInput" className="form-label">Naziv banke:</label>
        <input id="bankaInput" type="text"
          className={`form-input${errors.banka ? " input-error" : ""}`}
          readOnly
          value={formData.banka}
          placeholder="Automatski detektirana banka"
        />
        {errors.banka && <div className="error-message">{errors.banka}</div>}
      </div>
      <div className="navigation-buttons">
        {typeof onBack === "function" && (
          <button type="button" className="back-button" aria-label="Nazad na prethodni korak" onClick={onBack}>
            NAZAD
          </button>
        )}
        <button type="submit" className="next-button">
          DALJE
        </button>
      </div>
    </form>
  );
};

export default PotpisForm;
