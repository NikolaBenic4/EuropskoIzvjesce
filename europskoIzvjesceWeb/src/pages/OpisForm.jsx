import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import MjestoUdarcaVozilo, { VEHICLE_CONFIG } from "../components/MjestoUdarcaVozila";
import "../css/OpisForm.css";

const OKOLNOSTI_OPTIONS = [
  "Sudar s vozilom koje je uključilo skretanje",
  "Sudar sa stražnjim dijelom vozila",
  "Sudar u bočni dio (bočni udar)",
  "Izlijetanje s kolnika",
  "Sudar s pješakom ili biciklistom",
  "Sudar s pokretnim objektom (tramvaj, vlak)",
  "Sudar s nepokretnim objektom (stablo, stup, zid)",
  "Prevrtanje vozila",
  "Sukob na parkiralištu",
  "Sudar tijekom pretjecanja",
  "Sudar uslijed kvara na vozilu",
  "Ostale okolnosti"
];

const initialState = {
  tip_okolnost: [],
  opis_okolnost: "",
  tip_vozila: "car",
  odabrani_udarci: [],
  polozaj_ostecenja: "",
  opis_ostecenja: "",
  slike: [],
};

export default function OpisForm({ data, onNext, onBack }) {
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {}),
  }));
  const [modalIndeks, setModalIndeks] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData((prev) => ({
      ...initialState,
      ...data,
    }));
  }, [data]);

  function formirajPoziciju() {
    const { points } = VEHICLE_CONFIG[formData.tip_vozila];
    return formData.odabrani_udarci
      .map((id) => {
        const t = points.find((p) => p.id === id);
        return t ? t.label : "";
      })
      .filter(Boolean)
      .join("; ");
  }

  useEffect(() => {
    setFormData((staro) => ({
      ...staro,
      polozaj_ostecenja: formirajPoziciju(),
    }));
    // eslint-disable-next-line
  }, [formData.tip_vozila, formData.odabrani_udarci]);

  function promjenaVrijednosti(e) {
    const { name, value, type } = e.target;
    if (type !== "file") {
      setFormData((staro) => ({ ...staro, [name]: value }));
    }
  }

  async function dodajSlike(e) {
    e.preventDefault();
    const datoteke = Array.from(e.target.files);
    const komprimirane = [];
    for (let dat of datoteke) {
      try {
        const komprimiranaSlika = await imageCompression(dat, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        const sad = new Date();
        const lokalno = sad.toISOString().slice(0, 16);
        komprimirane.push({
          naziv_slike: komprimiranaSlika.name,
          podatak_slike: komprimiranaSlika,
          vrijeme_slikanja: lokalno,
          pregled: URL.createObjectURL(komprimiranaSlika),
        });
      } catch (error) {
        console.error("Greška kod kompresije slike:", error);
      }
    }
    setFormData((staro) => ({ ...staro, slike: [...staro.slike, ...komprimirane] }));
    e.target.value = null;
  }

  function ukloniSliku(idx) {
    URL.revokeObjectURL(formData.slike[idx].pregled);
    setModalIndeks(null);
    const azurirano = formData.slike.filter((_, i) => i !== idx);
    setFormData((staro) => ({ ...staro, slike: azurirano }));
  }

  function validate() {
    const noviErrors = {};
    if (formData.tip_okolnost.length === 0) {
      noviErrors.tip_okolnost = "Molimo odaberite tip okolnosti.";
    }
    if (!formData.opis_okolnost.trim()) {
      noviErrors.opis_okolnost = "Molimo unesite opis okolnosti.";
    }
    if (!formData.polozaj_ostecenja.trim()) {
      noviErrors.polozaj_ostecenja = "Pozicija oštećenja ne može biti prazna.";
    }
    if (!formData.opis_ostecenja.trim()) {
      noviErrors.opis_ostecenja = "Molimo unesite opis oštećenja.";
    }
    if (formData.slike.length < 6) {
      noviErrors.slike = "Molimo učitajte minimalno 6 slika.";
    }
    setErrors(noviErrors);
    return Object.keys(noviErrors).length === 0;
  }

  function handleNext(e) {
    e.preventDefault();
    if (!validate()) return;
    const zaSlanje = {
      ...formData,
      polozaj_ostecenja: formirajPoziciju(),
    };
    if (onNext) onNext(zaSlanje);
  }

  const toggleTooltip = () => setTooltipVisible((v) => !v);
  function onModalContentClick(e) { e.stopPropagation(); }

  // MODERNI CHECKBOX UI ZA TIP OKOLNOSTI -----------------
  function handleOkolnostCheckbox(opt) {
    setFormData(staro => ({
      ...staro,
      tip_okolnost: staro.tip_okolnost.includes(opt)
        ? staro.tip_okolnost.filter(x => x !== opt)
        : [...staro.tip_okolnost, opt]
    }));
  }

  return (
    <form className="nesreca-form" onSubmit={handleNext}>
      <h2 className="nesreca-title">Opis Nesreće</h2>

      <div className="form-group">
        <label htmlFor="tip_okolnost" className="form-label">
          Tip okolnosti:*
        </label>
        <div className="okolnosti-checkbox-group">
          {OKOLNOSTI_OPTIONS.map((opt, i) => (
            <label key={i} className="okolnost-checkbox-row">
              <input
                type="checkbox"
                value={opt}
                checked={formData.tip_okolnost.includes(opt)}
                onChange={() => handleOkolnostCheckbox(opt)}
                className="okolnost-checkbox"
              />
              <span className="okolnost-label">{opt}</span>
            </label>
          ))}
        </div>
        {errors.tip_okolnost && <div className="error-message">{errors.tip_okolnost}</div>}
        {formData.tip_okolnost.length > 0 && (
          <div style={{ margin: "8px 0", fontSize: "1.08rem", color: "#002060" }}>
            <strong>Odabrane okolnosti:*</strong>
            <ul style={{ paddingLeft: "18px", marginTop: 4 }}>
              {formData.tip_okolnost.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="opis_okolnost" className="form-label">
          Opis okolnosti:*
        </label>
        <textarea
          id="opis_okolnost"
          name="opis_okolnost"
          className={`form-textarea ${errors.opis_okolnost ? "input-error" : ""}`}
          value={formData.opis_okolnost}
          onChange={promjenaVrijednosti}
        />
        {errors.opis_okolnost && <div className="error-message">{errors.opis_okolnost}</div>}
      </div>

      <MjestoUdarcaVozilo
        vehicleType={formData.tip_vozila}
        selectedPoints={formData.odabrani_udarci}
        onChange={(sljedeci) =>
          setFormData((staro) => ({
            ...staro,
            odabrani_udarci: sljedeci,
          }))
        }
        onVehicleTypeChange={(vrsta) =>
          setFormData((staro) => ({
            ...staro,
            tip_vozila: vrsta,
            odabrani_udarci: [],
          }))
        }
      />

      <div className="form-group">
        <label htmlFor="polozaj_ostecenja" className="form-label">
          Pozicija oštećenja:*
        </label>
        <input
          id="polozaj_ostecenja"
          name="polozaj_ostecenja"
          className={`form-input ${errors.polozaj_ostecenja ? "input-error" : ""}`}
          value={formData.polozaj_ostecenja}
          readOnly
        />
        {errors.polozaj_ostecenja && <div className="error-message">{errors.polozaj_ostecenja}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="opis_ostecenja" className="form-label">
          Opis oštećenja:*
        </label>
        <textarea
          id="opis_ostecenja"
          name="opis_ostecenja"
          className={`form-textarea ${errors.opis_ostecenja ? "input-error" : ""}`}
          value={formData.opis_ostecenja}
          onChange={promjenaVrijednosti}
        />
        {errors.opis_ostecenja && <div className="error-message">{errors.opis_ostecenja}</div>}
      </div>

      {/* Slikaj/Učitaj gumbi */}
      <div
        className="centered-container"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: "18px",
          marginBottom: 20
        }}
      >
        <label htmlFor="camera-upload" className="slikaj-ucitaj-button">
          Slikaj
        </label>
        <input
          id="camera-upload"
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          multiple
          onChange={dodajSlike}
        />
        <label htmlFor="file-upload" className="slikaj-ucitaj-button" style={{marginLeft: "0"}}>
          Učitaj
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          multiple
          onChange={dodajSlike}
        />
        <button
          type="button"
          className="info-button-round"
          onClick={toggleTooltip}
          aria-label="Informacije"
        >
          i
        </button>
        <div className={`info-tooltip ${tooltipVisible ? "info-tooltip-active" : ""}`}>
          Molim te slikaj vozilo iz svih kuteva i posebno slikaj štetu. Minimalno 6 fotografija.
        </div>
      </div>

      {errors.slike && (
        <div className="error-message" style={{ textAlign: "center", marginBottom: 10 }}>
          {errors.slike}
        </div>
      )}

      <div className="uploaded-images-list">
        {formData.slike.map((slika, idx) => (
          <div
            key={idx}
            className="uploaded-image"
            title={`Naziv: ${slika.naziv_slike}\nVrijeme: ${slika.vrijeme_slikanja}`}
            onClick={() => setModalIndeks(idx)}
          >
            <img src={slika.pregled} alt={`Slika ${idx + 1}`} />
          </div>
        ))}
      </div>

      {modalIndeks !== null && (
        <div
          className="modal"
          onClick={() => setModalIndeks(null)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 1000,
            padding: 20,
            cursor: "pointer",
          }}
        >
          <img
            src={formData.slike[modalIndeks].pregled}
            alt={`Slika ${modalIndeks + 1}`}
            onClick={onModalContentClick}
            style={{ maxHeight: "80vh", maxWidth: "90vw", marginBottom: 16, cursor: "auto" }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => setModalIndeks(null)}
              style={{ cursor: "pointer", backgroundColor: "#0275d8", color: "white", border: "none", padding: "8px 16px", borderRadius: 4 }}
            >
              Izlaz
            </button>
            <button
              type="button"
              onClick={() => ukloniSliku(modalIndeks)}
              style={{ cursor: "pointer", backgroundColor: "#d9534f", color: "white", border: "none", padding: "8px 16px", borderRadius: 4 }}
            >
              Ukloni
            </button>
          </div>
        </div>
      )}

      <div className="navigation-buttons">
        {onBack && (
          <button type="button" className="back-button button-standard" onClick={onBack}>
            NAZAD
          </button>
        )}
        <button type="submit" className="next-button button-standard">
          DALJE
        </button>
      </div>
    </form>
  );
}
