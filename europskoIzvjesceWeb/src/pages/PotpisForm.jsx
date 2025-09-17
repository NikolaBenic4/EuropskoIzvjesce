import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "../css/PotpisForm.css";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const initialState = { potpis: null, datum_potpisa: null, iban_osiguranika: "", banka: "" };

function cleanIban(str) {
  if (!str) return "";
  return str
    .replace(/[\s\-\.]/g, "")
    .replace(/[OIlZBSGTQD]/gi, c =>
      ({ O:"0", I:"1", l:"1", Z:"2", B:"8", S:"5", G:"6", T:"7", D:"0", Q:"0" }[c]||c)
    )
    .toUpperCase();
}

function extractIban(text) {
  const m = text.match(/HR\d{19}/i);
  return m ? cleanIban(m[0]) : "";
}

export default function PotpisForm({ data, onNext, onBack, onChange }) {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("PotpisFormData");
    return saved ? JSON.parse(saved) : { ...initialState, ...(data||{}) };
  });
  const [errors, setErrors] = useState({});
  const [scanStatus, setScanStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const sigRef = useRef();
  const imgRef = useRef();
  const containerRef = useRef();
  const [dims, setDims] = useState({ w:400, h:200 });

  // Persist on any change
  useEffect(() => {
    sessionStorage.setItem("PotpisFormData", JSON.stringify(formData));
  }, [formData]);

  // Sync incoming data
  useEffect(() => {
    const initial = { ...initialState, ...(data||{}) };
    setFormData(prev => ({ ...initial, ...prev }));
  }, [data]);

  // Resize signature canvas
  useEffect(() => {
    const upd = () => {
      const w = Math.min((containerRef.current?.offsetWidth||400)-20,
                         window.innerWidth<=600?380:450);
      const h = window.innerWidth<=600?200:180;
      setDims({ w, h });
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // Fetch bank name
  useEffect(() => {
  const iban = formData.iban_osiguranika.replace(/\W/g,"");
  if (/^HR\d{19}$/.test(iban) && !isScanning) {
    fetch(`/api/banka/banka-za-iban?iban=${iban}`, {
      headers:{ "Content-Type":"application/json", "x-api-key": VITE_GOOGLE_API_KEY }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => setFormData(f => ({ ...f, banka: j.naziv_banke || "" })))
      .catch(() => setFormData(f => ({ ...f, banka: "" })));
  }
}, [formData.iban_osiguranika, isScanning]);


  // OCR
  const handleOCR = async e => {
    const file = e.target.files?.[0];
    if (!file || isScanning) return;
    setIsScanning(true);
    setScanStatus("Obrada slike…");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        const body = { requests:[{ image:{ content:base64 }, features:[{ type:"DOCUMENT_TEXT_DETECTION" }] }]};
        const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`, {
          method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
        });
        const { responses } = await res.json();
        const txt = responses?.[0]?.fullTextAnnotation?.text||"";
        const iban = extractIban(txt);
        if (iban) {
          setFormData(f=>({...f, iban_osiguranika:iban}));
          setScanStatus("IBAN prepoznat: "+iban);
        } else {
          setScanStatus("Nije pronađen IBAN");
        }
      } catch {
        setScanStatus("OCR greška");
      } finally {
        setIsScanning(false);
        setTimeout(()=>setScanStatus(""),3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature handlers
  const saveSig = () => {
    if (sigRef.current.isEmpty()) return;
    const url = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    setFormData(f=>({...f, potpis:url, datum_potpisa: new Date().toISOString()}));
  };
  const clearSig = () => {
    sigRef.current.clear();
    setFormData(f=>({...f, potpis:null, datum_potpisa:null}));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = {};
    if (!formData.potpis) errs.potpis = "Potpis je obavezan.";
    if (!/^HR\d{19}$/.test(formData.iban_osiguranika)) errs.iban_osiguranika = "Neispravan IBAN";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onChange?.(formData);
    onNext?.(formData);
  };

  const handleBack = () => {
    onBack?.();
  };

  return (
    <form className="potpis-form" onSubmit={handleSubmit}>
      <h2 className="form-label" style={{textAlign:"center"}}>Potpis i podaci o banci</h2>

      <div className="form-group" ref={containerRef}>
        <label className="form-label">Potpis:</label>
        <div className="signature-box">
          <SignatureCanvas
            ref={sigRef}
            penColor="#002060"
            minWidth={1}
            maxWidth={2}
            canvasProps={{
              id:"signatureInput",
              width:dims.w,
              height:dims.h,
              className:"sigCanvas",
              style:{touchAction:"none",width:`${dims.w}px`,height:`${dims.h}px`}
            }}
            onEnd={saveSig}
          />
        </div>
        <button type="button" className="clear-button" onClick={clearSig} disabled={isScanning}>
          OBRIŠI POTPIS
        </button>
        {errors.potpis && <div className="error-message">{errors.potpis}</div>}
      </div>

      <div className="form-group scan-group">
        <label className="form-label">IBAN za isplatu:</label>
        <div className="camera-note">Molimo usmjerite kameru na IBAN na kartici</div>
        <input
          className={`form-input${errors.iban_osiguranika?" input-error":""}`}
          name="iban_osiguranika"
          value={formData.iban_osiguranika}
          onChange={e=>setFormData(f=>({...f,iban_osiguranika:e.target.value}))}
          disabled={isScanning}
        />
        {errors.iban_osiguranika && <div className="error-message">{errors.iban_osiguranika}</div>}
        <button type="button" className="scan-button" onClick={()=>imgRef.current.click()} disabled={isScanning}>
          📷 {isScanning?"Obrađujem...":"Skener IBAN"}
        </button>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{display:"none"}}
          onChange={handleOCR}
        />
        {scanStatus && <div className="status">{scanStatus}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Naziv banke:</label>
        <input readOnly className="form-input" value={formData.banka} placeholder="Automatski detektirana banka" />
      </div>

      <div className="navigation-buttons">
        {onBack && <button type="button" className="back-button" onClick={handleBack} disabled={isScanning}>NAZAD</button>}
        <button type="submit" className="next-button" disabled={isScanning}>DALJE</button>
      </div>
    </form>
  );
}
