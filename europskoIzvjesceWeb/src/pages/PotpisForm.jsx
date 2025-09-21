import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "../css/PotpisForm.css";

const initialState = { 
  potpis: null, 
  datum_potpisa: null, 
  iban_osiguranika: "", 
  banka: "" 
};

function cleanIban(str) {
  if (!str) return "";
  return str
    .replace(/[\s\-\.]/g, "")
    .replace(/[OIlZBSGTQD]/gi, (c) =>
      ({ O: "0", I: "1", l: "1", Z: "2", B: "8", S: "5", G: "6", T: "7", D: "0", Q: "0" }[c] || c)
    )
    .toUpperCase();
}

// SPECIJALIZIRANO za format HR46 2390 0011 0700 0002 9
function extractIban(text) {
  console.log('🔍 Analiziram tekst za IBAN (21 karakter):', text);
  
  // Očisti tekst - zadržaj samo HR, brojeve i razmake
  const cleanText = text.toUpperCase().replace(/[^HR0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('📝 Očišćen tekst:', cleanText);
  
  // METODA 1: Točan format "HR46 2390 0011 0700 0002 9"
  const exactPattern = /HR\s*(\d{2})\s*(\d{4})\s*(\d{4})\s*(\d{4})\s*(\d{4})\s*(\d{1})/gi;
  const exactMatch = cleanText.match(exactPattern);
  
  if (exactMatch) {
    for (const match of exactMatch) {
      const numbersOnly = match.replace(/[^HR0-9]/g, '');
      console.log('✅ Točan format match:', numbersOnly);
      
      if (numbersOnly.length === 21 && numbersOnly.startsWith('HR')) {
        return numbersOnly;
      }
    }
  }
  
  // METODA 2: Fleksibilni pristup - HR + točno 19 brojeva
  const flexPattern = /HR[\s]*(\d[\s]*){19}/gi;
  const flexMatch = cleanText.match(flexPattern);
  
  if (flexMatch) {
    for (const match of flexMatch) {
      const onlyHRNumbers = match.replace(/[^HR0-9]/g, '');
      console.log('✅ Fleksibilni match:', onlyHRNumbers);
      
      if (onlyHRNumbers.length === 21 && onlyHRNumbers.startsWith('HR')) {
        return onlyHRNumbers;
      }
    }
  }
  
  // METODA 3: Agresivno skupljanje
  const hrIndex = cleanText.indexOf('HR');
  if (hrIndex !== -1) {
    let iban = 'HR';
    let numberCount = 0;
    
    for (let i = hrIndex + 2; i < cleanText.length && numberCount < 19; i++) {
      const char = cleanText[i];
      if (/\d/.test(char)) {
        iban += char;
        numberCount++;
      }
    }
    
    console.log('✅ Agresivno skupljanje:', iban, 'duljina:', iban.length);
    if (iban.length === 21) {
      return iban;
    }
  }
  
  // METODA 4: Fallback
  const allText = cleanText.replace(/[^HR0-9]/g, '');
  const fallbackMatch = allText.match(/HR\d{19}/);
  if (fallbackMatch) {
    console.log('✅ Fallback match:', fallbackMatch[0]);
    return fallbackMatch[0];
  }
  
  console.log('❌ IBAN (21 karakter) nije pronađen');
  return "";
}

// Optimizirana predobrada za IBAN detekciju
function preprocessImageForIban(file) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        console.log('📐 Originalna slika:', img.width, 'x', img.height);
        
        let scale = 2.5;
        if (img.width > 2000 || img.height > 2000) {
          scale = 2;
        } else if (img.width < 800 || img.height < 800) {
          scale = 3;
        }
        
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        console.log('📐 Nova slika:', canvas.width, 'x', canvas.height, 'scale:', scale);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        
        let threshold = 128;
        if (avgBrightness < 100) threshold = 100;
        else if (avgBrightness > 180) threshold = 150;
        
        console.log('💡 Prosječna svjetlina:', avgBrightness, 'threshold:', threshold);
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const bw = gray > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = bw;
        }
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(resolve, 'image/png', 1.0);
        
      } catch (error) {
        console.error('❌ Greška u predobradi:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Greška pri učitavanju slike'));
    img.src = URL.createObjectURL(file);
  });
}

export default function PotpisForm({ data, onNext, onBack, onChange }) {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("PotpisFormData");
    return saved ? JSON.parse(saved) : { ...initialState, ...(data || {}) };
  });
  const [errors, setErrors] = useState({});
  const [scanStatus, setScanStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [bankLoading, setBankLoading] = useState(false); // Dodano za debug
  const sigRef = useRef();
  const imgRef = useRef();
  const containerRef = useRef();
  const [dims, setDims] = useState({ w: 400, h: 200 });

  // Spremi podatke u sessionStorage kad se promijene
  useEffect(() => {
    try {
      sessionStorage.setItem("PotpisFormData", JSON.stringify(formData));
    } catch (error) {
      console.error('Greška pri spremanju u sessionStorage:', error);
    }
  }, [formData]);

  useEffect(() => {
    const initial = { ...initialState, ...(data || {}) };
    setFormData((prev) => ({ ...initial, ...prev }));
  }, [data]);

  useEffect(() => {
    const upd = () => {
      const w = Math.min(
        (containerRef.current?.offsetWidth || 400) - 20,
        window.innerWidth <= 600 ? 380 : 450
      );
      const h = window.innerWidth <= 600 ? 200 : 180;
      setDims({ w, h });
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // POBOLJŠANA AUTOMATSKA DETEKCIJA BANKE
  useEffect(() => {
    const fetchBankInfo = async () => {
      const iban = formData.iban_osiguranika?.replace(/\s+/g, "").replace(/-/g, "");
      
      console.log('🔍 Provjeram IBAN za banku:', iban);
      console.log('🔍 IBAN duljina:', iban?.length);
      console.log('🔍 IBAN format test:', /^HR\d{19}$/.test(iban));
      
      // Resetiraj banku ako IBAN nije valjan
      if (!iban || iban.length === 0) {
        console.log('🏦 Resetiram banku - IBAN je prazan');
        setFormData((f) => ({ ...f, banka: "" }));
        return;
      }
      
      // Provjeri da li IBAN ima točno 21 karakter (HR + 19 brojeva)
      if (/^HR\d{19}$/.test(iban) && !isScanning) {
        console.log('🏦 Dohvaćam banku za IBAN:', iban);
        setBankLoading(true);
        
        try {
          const response = await fetch(`/api/banka/banka-za-iban?iban=${iban}`, {
            headers: { 
              "Content-Type": "application/json", 
              "x-api-key": import.meta.env.VITE_API_KEY 
            }
          });
          
          console.log('🏦 API response status:', response.status, response.ok);
          
          if (response.ok) {
            const result = await response.json();
            console.log('🏦 API response data:', result);
            
            const bankName = result.naziv_banke || result.name || result.banka || "";
            console.log('🏦 Ekstraktirani naziv banke:', bankName);
            
            setFormData((f) => ({ ...f, banka: bankName }));
            
            if (bankName) {
              console.log('✅ Banka uspješno postavljena:', bankName);
            } else {
              console.log('⚠️ API je vratio prazan naziv banke');
            }
          } else {
            console.log('❌ API greška - status:', response.status);
            const errorText = await response.text();
            console.log('❌ API greška - tekst:', errorText);
            setFormData((f) => ({ ...f, banka: "Banka nije pronađena" }));
          }
        } catch (error) {
          console.error('❌ Fetch greška:', error);
          setFormData((f) => ({ ...f, banka: "Greška pri dohvaćanju banke" }));
        } finally {
          setBankLoading(false);
        }
      } else if (iban && iban.length > 0) {
        console.log('⚠️ IBAN format nije ispravan:', iban, 'duljina:', iban.length);
        setFormData((f) => ({ ...f, banka: "Neispravan IBAN format" }));
      }
    };

    // Pozovi samo ako se IBAN promijenio i nije prazan
    if (formData.iban_osiguranika) {
      fetchBankInfo();
    }
  }, [formData.iban_osiguranika, isScanning]);

  // OPTIMIZIRAN OCR specifično za HR IBAN (21 karakter)
  const handleOCR = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files?.[0];
    if (!file || isScanning) {
      return;
    }
    
    if (imgRef.current) {
      imgRef.current.value = '';
    }
    
    console.log('🚀 OCR START za HR IBAN (21 karakter):', file.name);
    setIsScanning(true);
    setScanStatus("Analiziram sliku za IBAN...");
    setOcrProgress(5);

    try {
      // Optimizirana predobrada
      setScanStatus("Prilagođavam sliku za čitanje...");
      setOcrProgress(15);
      const processedFile = await preprocessImageForIban(file);
      
      setScanStatus("Učitavam OCR engine...");
      setOcrProgress(25);
      
      // Dinamički import Tesseract-a
      const Tesseract = await import('tesseract.js');
      
      setScanStatus("Analiziram IBAN format...");
      setOcrProgress(35);
      
      // SPECIJALIZIRANE Tesseract postavke za IBAN
      const { data: { text, confidence } } = await Tesseract.recognize(processedFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = 35 + Math.round(m.progress * 55);
            setOcrProgress(progress);
            setScanStatus(`Čitam IBAN... ${progress}%`);
          }
        },
        // Optimizirano za IBAN format
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: 1,
        user_defined_dpi: 300,
        // IBAN specifične postavke
        classify_bln_numeric_mode: 1,
        textord_noise_normratio: 2,
        textord_heavy_nr: 1,
      });

      setOcrProgress(100);
      console.log('📋 OCR rezultat (confidence: ' + confidence + '):', text);

      // Pokušaj ekstraktirati IBAN
      const foundIban = extractIban(text);
      
      if (foundIban && foundIban.length === 21 && foundIban.startsWith('HR')) {
        // USPJEH!
        console.log('🎉 IBAN uspješno pronađen (21 karakter):', foundIban);
        setFormData((prev) => ({ ...prev, iban_osiguranika: foundIban }));
        
        // Formatiraj za prikaz (HR46 2390 0011 0700 0002 9)
        const formatted = foundIban.replace(/^(HR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{1})$/, '$1$2 $3 $4 $5 $6 $7');
        setScanStatus(`✅ IBAN pronađen: ${formatted}`);
        
      } else {
        // NEUSPJEH - pokušaj liniju po liniju
        console.log('⚠️ Glavna detekcija neuspješna, pokušavam liniju po liniju...');
        const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 5);
        let found = false;
        
        for (let i = 0; i < lines.length && !found; i++) {
          const line = lines[i].trim();
          console.log(`📄 Linija ${i + 1}: "${line}"`);
          
          const lineIban = extractIban(line);
          if (lineIban && lineIban.length === 21 && lineIban.startsWith('HR')) {
            console.log(`🎉 IBAN pronađen u liniji ${i + 1}:`, lineIban);
            setFormData((prev) => ({ ...prev, iban_osiguranika: lineIban }));
            
            const formatted = lineIban.replace(/^(HR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{1})$/, '$1$2 $3 $4 $5 $6 $7');
            setScanStatus(`✅ IBAN pronađen: ${formatted}`);
            found = true;
          }
        }
        
        if (!found) {
          console.log('❌ IBAN (21 karakter) nije pronađen');
          setScanStatus("❌ IBAN nije prepoznat. Molimo unesite ručno ili probajte jasniju sliku.");
          
          // Debug informacije
          if (text && text.length > 0) {
            const preview = text.substring(0, 100).replace(/\s+/g, ' ');
            console.log('🔍 Pregled OCR teksta:', preview);
          }
        }
      }
      
    } catch (error) {
      console.error('💥 OCR greška:', error);
      setScanStatus(`❌ Greška: ${error.message}`);
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
      setTimeout(() => setScanStatus(""), 12000);
    }
  };

  const saveSig = () => {
    if (sigRef.current?.isEmpty()) return;
    try {
      const canvas = sigRef.current.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(',')[1];
      
      setFormData((f) => ({ 
        ...f, 
        potpis: base64Data,
        datum_potpisa: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Greška pri spremanju potpisa:', error);
    }
  };

  const clearSig = () => {
    try {
      if (sigRef.current) {
        sigRef.current.clear();
      }
      setFormData((f) => ({ ...f, potpis: null, datum_potpisa: null }));
    } catch (error) {
      console.error('Greška pri brisanju potpisa:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    
    if (!formData.potpis) {
      errs.potpis = "Potpis je obavezan.";
    }
    
    // Provjeri IBAN format (točno HR + 19 brojeva = 21 karakter)
    if (!/^HR\d{19}$/.test(formData.iban_osiguranika)) {
      errs.iban_osiguranika = "Neispravan IBAN format (potreban HR + 19 brojeva = 21 karakter)";
    }
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    try {
      sessionStorage.setItem("PotpisFormData", JSON.stringify(formData));
      console.log('💾 Podaci uspješno spremljeni:', formData);
    } catch (error) {
      console.error('Greška pri spremanju:', error);
    }
    
    onChange?.(formData);
    onNext?.(formData);
  };

  const handleBack = () => {
    onBack?.();
  };

  // Formatiranje IBAN-a za prikaz (HR46 2390 0011 0700 0002 9)
  const formatIbanDisplay = (iban) => {
    if (!iban) return '';
    
    // Ako ima točno 21 karakter, formatiraj kao HR46 2390 0011 0700 0002 9
    if (iban.length === 21 && iban.startsWith('HR')) {
      return iban.replace(/^(HR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{1})$/, '$1$2 $3 $4 $5 $6 $7');
    }
    
    // Inače jednostavno dodaj razmake svakih 4 znakova
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleIbanInputChange = (e) => {
    const cleaned = cleanIban(e.target.value);
    console.log('💳 IBAN input promjena:', e.target.value, '->', cleaned);
    setFormData((f) => ({ ...f, iban_osiguranika: cleaned }));
  };

  const handleScanClick = (e) => {
    e.preventDefault();
    if (!isScanning && imgRef.current) {
      imgRef.current.click();
    }
  };

  return (
    <form className="potpis-form" onSubmit={handleSubmit}>
      <div className="form-group" ref={containerRef}>
        <label className="form-label">Potpis sudionika:*</label>
        <div className="signature-box" style={{ border: errors.potpis ? '2px solid #cc0000' : '1px solid #ccc' }}>
          <SignatureCanvas
            ref={sigRef}
            penColor="#002060"
            minWidth={1}
            maxWidth={2.5}
            velocityFilterWeight={0.7}
            canvasProps={{
              id: "signatureInput",
              width: dims.w,
              height: dims.h,
              className: "sigCanvas",
              style: { 
                touchAction: "none", 
                width: `${dims.w}px`, 
                height: `${dims.h}px`,
                cursor: 'crosshair'
              }
            }}
            onEnd={saveSig}
          />
        </div>
        <button 
          type="button" 
          className="clear-button" 
          onClick={clearSig} 
          disabled={isScanning}
        >
          OBRIŠI POTPIS
        </button>
        {errors.potpis && <div className="error-message">{errors.potpis}</div>}
      </div>

      <div className="form-group scan-group">
        <label className="form-label">IBAN za isplatu (21 karakter):*</label>
        
        <div 
          className="info-box"
          style={{
            backgroundColor: '#f0f8ff',
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
            📋 PRIMJER ISPRAVNOG FORMATA:
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1565c0' }}>
            HR46 2390 0011 0700 0002 9
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            (HR + 19 brojeva = ukupno 21 karakter)
          </div>
        </div>
        
        <input
          className={`form-input${errors.iban_osiguranika ? " input-error" : ""}`}
          name="iban_osiguranika"
          value={formatIbanDisplay(formData.iban_osiguranika)}
          onChange={handleIbanInputChange}
          disabled={isScanning}
          placeholder="HR46 2390 0011 0700 0002 9"
          maxLength={25} // 21 + 4 razmaka
          style={{ 
            fontSize: '16px', 
            padding: '12px',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        />
        {errors.iban_osiguranika && <div className="error-message">{errors.iban_osiguranika}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
          <button 
            type="button" 
            className="scan-button" 
            onClick={handleScanClick}
            disabled={isScanning}
            style={{
              backgroundColor: isScanning ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
              textTransform: 'uppercase'
            }}
          >
            📷 {isScanning ? `${ocrProgress}% OBRAĐUJEM...` : "FOTOGRAFIRAJ IBAN"}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
            Slika mora biti jasna i dobro osvjetljena
          </div>
        </div>
        
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleOCR}
          onClick={(e) => e.stopPropagation()}
        />
        
        {scanStatus && (
          <div 
            className={`status ${scanStatus.includes('✅') ? 'success' : scanStatus.includes('❌') ? 'error' : 'info'}`}
            style={{
              padding: '15px',
              marginTop: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              lineHeight: '1.6',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            {scanStatus}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          Naziv banke: {bankLoading && <span style={{color: '#666', fontSize: '14px'}}>(učitavam...)</span>}
        </label>
        <input 
          readOnly 
          className="form-input" 
          value={formData.banka || ""} 
          placeholder={bankLoading ? "Dohvaćam podatke banke..." : "Automatski se detektira iz IBAN-a"}
          style={{ 
            backgroundColor: '#f5f5f5', 
            cursor: 'not-allowed',
            fontSize: '16px',
            padding: '12px',
            fontWeight: formData.banka ? 'bold' : 'normal',
            color: formData.banka ? '#2e7d32' : '#666'
          }}
        />
        
        {/* DEBUG informacije - ukloni u produkciji */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            Debug - IBAN: {formData.iban_osiguranika} | 
            Duljina: {formData.iban_osiguranika?.length} | 
            Valid: {/^HR\d{19}$/.test(formData.iban_osiguranika) ? 'DA' : 'NE'} |
            Bank loading: {bankLoading ? 'DA' : 'NE'}
          </div>
        )}
      </div>

      <div className="navigation-buttons">
        {onBack && (
          <button 
            type="button" 
            className="back-button" 
            onClick={handleBack} 
            disabled={isScanning}
          >
            NAZAD
          </button>
        )}
        <button 
          type="submit" 
          className="next-button" 
          disabled={isScanning}
        >
          DALJE
        </button>
      </div>
    </form>
  );
}
