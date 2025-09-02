import React, { useState, useEffect } from "react";
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

export default function OpisForm({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    okolnosti: [],
    opisOkolnosti: "",
    vrstaVozila: "car",
    odabraniUdarci: [],
    pozicijaOstecenja: "",
    opisOstecenja: "",
    slike: [],
  });

  const [modalIndeks, setModalIndeks] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

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

  function dodajSlike(e) {
    const datoteke = Array.from(e.target.files);
    const nove = datoteke.map((dat) => {
      const sad = new Date();
      const godina = sad.getFullYear();
      const mj = String(sad.getMonth() + 1).padStart(2, "0");
      const dan = String(sad.getDate()).padStart(2, "0");
      const h = String(sad.getHours()).padStart(2, "0");
      const m = String(sad.getMinutes()).padStart(2, "0");
      const lokalno = `${godina}-${mj}-${dan}T${h}:${m}`;
      return {
        ime: dat.name,
        podatak: dat,
        vrijeme: lokalno,
        pregled: URL.createObjectURL(dat),
      };
    });
    setFormData((staro) => ({ ...staro, slike: [...staro.slike, ...nove] }));
  }

  function ukloniSliku(idx) {
    URL.revokeObjectURL(formData.slike[idx].pregled);
    setModalIndeks(null);
    const azurirano = formData.slike.filter((_, i) => i !== idx);
    setFormData((staro) => ({ ...staro, slike: azurirano }));
  }

  function handleNext(e) {
    e.preventDefault();
    const zaSlanje = {
      ...formData,
      pozicijaOstecenja: formirajPoziciju(),
    };
    if (onNext) onNext(zaSlanje);
  }

  const toggleTooltip = () => setTooltipVisible((v) => !v);

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleNext}>
        <h2 className="nesreca-title">Opis Nesreće</h2>

        <div className="form-group">
          <label htmlFor="okolnosti" className="form-label">
            Tip okolnosti
          </label>
          <select
            id="okolnosti"
            name="okolnosti"
            multiple
            size={Math.min(OKOLNOSTI_OPTIONS.length, 6)}
            value={formData.okolnosti}
            onChange={promjenaOkolnosti}
            className="form-input"
          >
            {OKOLNOSTI_OPTIONS.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {formData.okolnosti.length > 0 && (
            <div
              style={{
                margin: "8px 0",
                fontSize: "1.08rem",
                color: "#002060",
              }}
            >
              <strong>Odabrane okolnosti:</strong>
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
            Opis okolnosti
          </label>
          <textarea
            id="opisOkolnosti"
            name="opisOkolnosti"
            className="form-textarea"
            value={formData.opisOkolnosti}
            onChange={promjenaVrijednosti}
          />
        </div>

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
            Pozicija oštećenja
          </label>
          <input
            id="pozicijaOstecenja"
            name="pozicijaOstecenja"
            className="form-input"
            value={formData.pozicijaOstecenja}
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="opisOstecenja" className="form-label">
            Opis oštećenja
          </label>
          <textarea
            id="opisOstecenja"
            name="opisOstecenja"
            className="form-textarea"
            value={formData.opisOstecenja}
            onChange={promjenaVrijednosti}
          />
        </div>

        <div
          className="centered-container"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
            marginBottom: 20,
            position: "relative",
          }}
        >
          <label htmlFor="file-upload" className="slikaj-ucitaj-button" style={{ margin: 0, cursor: "pointer" }}>
            Slikaj i učitaj
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept="image/*"
            multiple
            capture
            style={{ display: "none" }}
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
            Za pregled slike i uklanjanje klikni na nju!
          </div>
        </div>

        <div className="uploaded-images-list">
          {formData.slike.map((slika, idx) => (
            <div
              key={idx}
              className="uploaded-image"
              title={`Naziv: ${slika.ime}\nVrijeme: ${slika.vrijeme}`}
              onClick={() => setModalIndeks(idx)}
            >
              <img src={slika.pregled} alt={`Slika ${idx + 1}`} />
              <button type="button" onClick={() => ukloniSliku(idx)}>Ukloni</button>
            </div>
          ))}
        </div>
        {modalIndeks !== null && (
          <div className="modal" onClick={() => setModalIndeks(null)}>
            <img src={formData.slike[modalIndeks].pregled} alt={`Slika ${modalIndeks + 1}`} />
          </div>
        )}

        <div className="navigation-buttons">
          {onBack && (
            <button type="button" className="back-button" onClick={onBack}>
              NAZAD
            </button>
          )}
          <button type="submit" className="next-button">
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
}
