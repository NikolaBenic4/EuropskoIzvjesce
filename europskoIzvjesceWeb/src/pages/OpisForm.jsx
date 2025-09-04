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
  "Ostale okolnosti",
];

const initialState = {
  okolnosti: [],
  opisOkolnosti: "",
  vrstaVozila: "car",
  odabraniUdarci: [],
  pozicijaOstecenja: "",
  opisOstecenja: "",
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
    const { points } = VEHICLE_CONFIG[formData.vrstaVozila];
    return formData.odabraniUdarci
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
      pozicijaOstecenja: formirajPoziciju(),
    }));
    // eslint-disable-next-line
  }, [formData.vrstaVozila, formData.odabraniUdarci]);

  function promjenaVrijednosti(e) {
    const { name, value, type } = e.target;
    if (type !== "file") {
      setFormData((staro) => ({ ...staro, [name]: value }));
    }
  }

  function promjenaOkolnosti(e) {
    const opcije = e.target.options;
    const odabrane = [];
    for (let i = 0; i < opcije.length; i++) {
      if (opcije[i].selected) odabrane.push(opcije[i].value);
    }
    setFormData((staro) => ({ ...staro, okolnosti: odabrane }));
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
          ime: komprimiranaSlika.name,
          podatak: komprimiranaSlika,
          vrijeme: lokalno,
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
    if (formData.okolnosti.length === 0) {
      noviErrors.okolnosti = "Molimo odaberite tip okolnosti.";
    }
    if (!formData.opisOkolnosti.trim()) {
      noviErrors.opisOkolnosti = "Molimo unesite opis okolnosti.";
    }
    if (!formData.pozicijaOstecenja.trim()) {
      noviErrors.pozicijaOstecenja = "Pozicija oštećenja ne može biti prazna.";
    }
    if (!formData.opisOstecenja.trim()) {
      noviErrors.opisOstecenja = "Molimo unesite opis oštećenja.";
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
      pozicijaOstecenja: formirajPoziciju(),
    };
    if (onNext) onNext(zaSlanje);
  }

  const toggleTooltip = () => setTooltipVisible((v) => !v);

  function onModalContentClick(e) {
    e.stopPropagation();
  }

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleNext}>
        <h2 className="nesreca-title">Opis Nesreće</h2>

        <div className="form-group">
          <label htmlFor="okolnosti" className="form-label">
            Tip okolnosti:*
          </label>
          <select
            id="okolnosti"
            name="okolnosti"
            multiple
            size={Math.min(OKOLNOSTI_OPTIONS.length, 6)}
            value={formData.okolnosti}
            onChange={promjenaOkolnosti}
            className={`form-input ${errors.okolnosti ? "input-error" : ""}`}
          >
            {OKOLNOSTI_OPTIONS.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.okolnosti && <div className="error-message">{errors.okolnosti}</div>}
          {formData.okolnosti.length > 0 && (
            <div
              style={{
                margin: "8px 0",
                fontSize: "1.08rem",
                color: "#002060",
              }}
            >
              <strong>Odabrane okolnosti:*</strong>
              <ul style={{ paddingLeft: "18px", marginTop: 4 }}>
                {formData.okolnosti.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="opisOkolnosti" className="form-label">
            Opis okolnosti:*
          </label>
          <textarea
            id="opisOkolnosti"
            name="opisOkolnosti"
            className={`form-textarea ${errors.opisOkolnosti ? "input-error" : ""}`}
            value={formData.opisOkolnosti}
            onChange={promjenaVrijednosti}
          />
          {errors.opisOkolnosti && <div className="error-message">{errors.opisOkolnosti}</div>}
        </div>

        {/* Mjesto udarca vozila */}
        <MjestoUdarcaVozilo
          vehicleType={formData.vrstaVozila}
          selectedPoints={formData.odabraniUdarci}
          onChange={(sljedeci) =>
            setFormData((staro) => ({
              ...staro,
              odabraniUdarci: sljedeci,
            }))
          }
          onVehicleTypeChange={(vrsta) =>
            setFormData((staro) => ({
              ...staro,
              vrstaVozila: vrsta,
              odabraniUdarci: [],
            }))
          }
        />

        <div className="form-group">
          <label htmlFor="pozicijaOstecenja" className="form-label">
            Pozicija oštećenja:*
          </label>
          <input
            id="pozicijaOstecenja"
            name="pozicijaOstecenja"
            className={`form-input ${errors.pozicijaOstecenja ? "input-error" : ""}`}
            value={formData.pozicijaOstecenja}
            readOnly
          />
          {errors.pozicijaOstecenja && <div className="error-message">{errors.pozicijaOstecenja}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="opisOstecenja" className="form-label">
            Opis oštećenja:*
          </label>
          <textarea
            id="opisOstecenja"
            name="opisOstecenja"
            className={`form-textarea ${errors.opisOstecenja ? "input-error" : ""}`}
            value={formData.opisOstecenja}
            onChange={promjenaVrijednosti}
          />
          {errors.opisOstecenja && <div className="error-message">{errors.opisOstecenja}</div>}
        </div>

        {/* ISPRAVNO! Gumbi Slikaj/Učitaj izgledaju kao pravi gumbi */}
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
              title={`Naziv: ${slika.ime}\nVrijeme: ${slika.vrijeme}`}
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
    </div>
  );
}
