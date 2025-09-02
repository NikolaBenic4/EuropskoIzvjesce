import React, { useState } from "react";
import "../css/NesrecaForm.css";

const initialState = {
  registarskaoznaka_vozila: "",
  marka_vozila: "",
  tip_vozila: "",
  drzavaregistracije_vozila: "",
  brojsasije_vozila: "",
  kilometraza_vozila: "",
  imaPrikolicu: false,
  registracijskaoznaka_prikolica: "",
  drzavaregistracije_prikolica: "",
  godinaProizvodnje_vozilo: "",
};

const regexRegOznaka = /^[A-ZČĆŽŠĐ]{2}-?\d{3,4}-?[A-ZČĆŽŠĐ]{1,2}$/u;
const regexBrojSasije = /^[A-HJ-NPR-Z0-9]{17}$/i;
const regexDrzava = /^[A-Za-zčćžšđ \-]{2,}$/u;

const VoziloForm = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState(initialData || initialState);
  const [error, setError] = useState("");
  const [visibleTooltip, setVisibleTooltip] = useState({
    reg: false, marka: false, tip: false
  });
  const [isUpdatingKm, setIsUpdatingKm] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Dohvat vozila na onBlur (i zaključavanje polja)
  const fetchVozilo = async (oznaka) => {
    if (!oznaka || !regexRegOznaka.test(oznaka.trim())) {
      setIsLocked(false);
      return;
    }
    try {
      const res = await fetch(`/api/vozilo/${oznaka.trim().toUpperCase()}`);
      if (res.ok) {
        const vozilo = await res.json();
        setFormData(prev => ({
          ...prev,
          marka_vozila: vozilo.marka_vozila ?? "",
          tip_vozila: vozilo.tip_vozila ?? "",
          drzavaregistracije_vozila: vozilo.drzavaregistracije_vozila ?? "",
          brojsasije_vozila: vozilo.brojsasije_vozila ?? "",
          godinaProizvodnje_vozilo: vozilo.godinaProizvodnje_vozilo ?? vozilo.godinaproizvodnje_vozilo ?? "", // podržava oba naziva
        }));
        setIsLocked(true);
        setError("");
      } else {
        setIsLocked(false);
        setError("Vozilo nije pronađeno u bazi.");
      }
    } catch {
      setIsLocked(false);
      setError("Greška pri dohvaćanju vozila.");
    }
  };

  // Update kilometraže na submit
  const updateKilometraza = async () => {
    setIsUpdatingKm(true);
    try {
      const res = await fetch(`/api/vozilo/${formData.registarskaoznaka_vozila.trim().toUpperCase()}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kilometraza_vozila: formData.kilometraza_vozila })
      });
      if (!res.ok) throw new Error();
      setError("");
    } catch {
      setError("Greška pri ažuriranju kilometraže.");
    }
    setIsUpdatingKm(false);
  };

  // Ako korisnik promijeni oznaku - otključaj polja
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "registarskaoznaka_vozila") {
      setIsLocked(false);
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  // Na blur dohvaćaj podatke i zaključaj polja
  const handleRegBlur = (e) => {
    fetchVozilo(e.target.value);
  };

  // Submit: validacija i update kilometraže
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regexRegOznaka.test(formData.registarskaoznaka_vozila.trim())) {
      setError("Unesite registarsku oznaku u formatu: ZG1234AB");
      return;
    }
    if (!regexBrojSasije.test(formData.brojsasije_vozila.trim())) {
      setError("Broj šasije mora imati točno 17 znakova (bez O/Q/I).");
      return;
    }
    if (!/^\d+$/.test(String(formData.kilometraza_vozila)) || Number(formData.kilometraza_vozila) < 0) {
      setError("Kilometraža mora biti cijeli broj veći ili jednak nuli.");
      return;
    }
    const godina = Number(formData.godinaProizvodnje_vozilo);
    const curYear = new Date().getFullYear();
    if (godina < 1900 || godina > curYear) {
      setError(`Godina proizvodnje mora biti između 1900 i ${curYear}.`);
      return;
    }
    if (!regexDrzava.test(formData.drzavaregistracije_vozila.trim())) {
      setError("Država registracije vozila smije imati samo slova i razmake.");
      return;
    }
    if (formData.imaPrikolicu) {
      if (!regexRegOznaka.test(formData.registracijskaoznaka_prikolica.trim())) {
        setError("Unesite oznaku prikolice u ispravnom formatu (2 slova + 3 ili 4 broja + 1 ili 2 slova).");
        return;
      }
      if (!regexDrzava.test(formData.drzavaregistracije_prikolica.trim())) {
        setError("Država registracije prikolice smije imati samo slova i razmake.");
        return;
      }
    }
    await updateKilometraza();
    setError("");
    if (onNext) onNext(formData);
  };

  const handleInfoClick = (key, e) => {
    e.preventDefault();
    setVisibleTooltip(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const handleInfoBlur = (key) => {
    setVisibleTooltip(prev => ({
      ...prev,
      [key]: false,
    }));
  };

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Podaci o vozilu</h2>

        <div className="form-group">
          <label className="form-label" htmlFor="registarskaoznaka_vozila">
            Registarska oznaka vozila: *
            <button
              type="button"
              className="info-button-round"
              tabIndex={0}
              aria-label="Informacije o formatu registarske oznake"
              onClick={e => handleInfoClick("reg", e)}
              onBlur={() => handleInfoBlur("reg")}
              onKeyDown={e => { if (e.key === "Escape") handleInfoBlur("reg"); }}>
              i
              <span
                className={"info-tooltip" + (visibleTooltip.reg ? " info-tooltip-active" : "")}
              >
                Primjer formata: <br /><b>ZG1234AB</b>, <b>ST-123-A</b>, <b>RI123AA</b>
              </span>
            </button>
          </label>
          <input
            type="text"
            id="registarskaoznaka_vozila"
            name="registarskaoznaka_vozila"
            className="form-input"
            value={formData.registarskaoznaka_vozila}
            onChange={handleChange}
            maxLength={20}
            required
            pattern="[A-ZČĆŽŠĐ]{2}-?\d{3,4}-?[A-ZČĆŽŠĐ]{1,2}"
            title="Format: 2 slova + 3 ili 4 broja + 1 ili 2 slova. Primjer: ZG1234AB"
            style={{ textTransform: "uppercase" }}
            autoComplete="off"
            placeholder="Unesi svoju registarsku oznaku"
            onBlur={handleRegBlur}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="marka_vozila">
            Marka vozila: *
            <button type="button" className="info-button-round" tabIndex={0}
              aria-label="Primjer marke vozila"
              style={{
                position: "relative", marginLeft: 8, width: 25, height: 25,
                minWidth: 25, minHeight: 25, padding: 0, borderRadius: "50%",
                background: "#2268ed", color: "#fff", fontWeight: 600, fontSize: 16,
                border: "none", outline: "none", cursor: "pointer", display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 3px rgba(30,30,50,0.11)"
              }}
              onClick={e => handleInfoClick("marka", e)}
              onBlur={() => handleInfoBlur("marka")}
              onKeyDown={e => { if (e.key === "Escape") handleInfoBlur("marka"); }}>
              i
              <span className="info-tooltip"
                style={{
                  visibility: visibleTooltip.marka ? "visible" : "hidden",
                  opacity: visibleTooltip.marka ? 1 : 0,
                  width: 190, background: "#f5f7fd", color: "#111", textAlign: "left",
                  borderRadius: 5, padding: "10px 13px", position: "absolute", zIndex: 999,
                  bottom: "120%", left: "-90px", boxShadow: "0 2px 10px rgba(0,0,0,0.11)",
                  fontSize: 13.5, fontWeight: 400, transition: "all 0.17s",
                  pointerEvents: "none"
                }}>Primjer: <b>Citroen</b>, <b>Volkswagen</b>, <b>Renault</b>
              </span>
            </button>
          </label>
          <input
            type="text"
            id="marka_vozila"
            name="marka_vozila"
            className="form-input"
            value={formData.marka_vozila}
            onChange={handleChange}
            maxLength={50}
            required
            readOnly={isLocked}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tip_vozila">
            Tip vozila: *
            <button type="button" className="info-button-round" tabIndex={0}
              aria-label="Primjer tipa vozila"
              style={{
                position: "relative", marginLeft: 8, width: 25, height: 25,
                minWidth: 25, minHeight: 25, padding: 0, borderRadius: "50%",
                background: "#2268ed", color: "#fff", fontWeight: 600, fontSize: 16,
                border: "none", outline: "none", cursor: "pointer", display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 3px rgba(30,30,50,0.11)"
              }}
              onClick={e => handleInfoClick("tip", e)}
              onBlur={() => handleInfoBlur("tip")}
              onKeyDown={e => { if (e.key === "Escape") handleInfoBlur("tip"); }}>
              i
              <span className="info-tooltip"
                style={{
                  visibility: visibleTooltip.tip ? "visible" : "hidden",
                  opacity: visibleTooltip.tip ? 1 : 0,
                  width: 180, background: "#f5f7fd", color: "#111", textAlign: "left",
                  borderRadius: 5, padding: "10px 13px", position: "absolute", zIndex: 999,
                  bottom: "120%", left: "-80px", boxShadow: "0 2px 10px rgba(0,0,0,0.11)",
                  fontSize: 13.5, fontWeight: 400, transition: "all 0.17s",
                  pointerEvents: "none"
                }}>Primjer: <b>C4</b>, <b>Golf VII</b>, <b>Megane</b>
              </span>
            </button>
          </label>
          <input
            type="text"
            id="tip_vozila"
            name="tip_vozila"
            className="form-input"
            value={formData.tip_vozila}
            onChange={handleChange}
            maxLength={50}
            required
            readOnly={isLocked}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="drzavaregistracije_vozila">Država registracije vozila: *</label>
          <input
            type="text"
            id="drzavaregistracije_vozila"
            name="drzavaregistracije_vozila"
            className="form-input"
            value={formData.drzavaregistracije_vozila}
            onChange={handleChange}
            maxLength={50}
            pattern="[A-Za-zčćžšđ \-]{2,}"
            title="Dozvoljena: slova, razmak, minus"
            required
            readOnly={isLocked}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="brojsasije_vozila">Broj šasije vozila: *</label>
          <input
            type="text"
            id="brojsasije_vozila"
            name="brojsasije_vozila"
            className="form-input"
            value={formData.brojsasije_vozila}
            onChange={handleChange}
            maxLength={17}
            minLength={17}
            pattern="[A-HJ-NPR-Z0-9]{17}"
            title="Točno 17 znakova, bez O/Q/I"
            required
            style={{ textTransform: "uppercase" }}
            readOnly={isLocked}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="kilometraza_vozila">Kilometraža vozila: *</label>
          <input
            type="number"
            id="kilometraza_vozila"
            name="kilometraza_vozila"
            className="form-input"
            value={formData.kilometraza_vozila}
            onChange={handleChange}
            min={0}
            step={1}
            required
            placeholder="npr. 125000"
          />
          {isUpdatingKm &&
            <div style={{ color: "#2268ed", fontWeight: "bold", marginTop: 6 }}>Ažuriram...</div>
          }
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="godinaProizvodnje_vozilo">Godina proizvodnje vozila: *</label>
          <input
            type="number"
            id="godinaProizvodnje_vozilo"
            name="godinaProizvodnje_vozilo"
            className="form-input"
            value={formData.godinaProizvodnje_vozilo}
            onChange={handleChange}
            min={1900}
            max={new Date().getFullYear()}
            required
            readOnly={isLocked}
          />
        </div>
        <div className="form-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              name="imaPrikolicu"
              checked={formData.imaPrikolicu}
              onChange={handleChange}
              className="checkbox-input"
            />
            Ima prikolicu
          </label>
        </div>

        {formData.imaPrikolicu && (
          <>
            <div className="form-group">
              <label className="form-label">Registarska oznaka prikolice</label>
              <input
                type="text"
                name="registracijskaoznaka_prikolica"
                className="form-input"
                value={formData.registracijskaoznaka_prikolica}
                onChange={handleChange}
                maxLength={20}
                required={formData.imaPrikolicu}
                pattern="[A-ZČĆŽŠĐ]{2}-?\d{3,4}-?[A-ZČĆŽŠĐ]{1,2}"
                title="Format: 2 slova + 3 ili 4 broja + 1 ili 2 slova. Primjer: ZG1234AB"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Država registracije prikolice</label>
              <input
                type="text"
                name="drzavaregistracije_prikolica"
                className="form-input"
                value={formData.drzavaregistracije_prikolica}
                onChange={handleChange}
                maxLength={50}
                required={formData.imaPrikolicu}
                pattern="[A-Za-zčćžšđ \-]{2,}"
                title="Dozvoljena: slova, razmak, minus"
              />
            </div>
          </>
        )}
        {error && (
          <div style={{ color: "#cc0000", margin: "12px 0", fontWeight: "bold" }}>
            {error}
          </div>
        )}
        <div className="navigation-buttons" style={{ marginTop: 20 }}>
          {onBack && (
            <button type="button" className="back-button"
              onClick={onBack} style={{ marginRight: 12 }}>
              NAZAD
            </button>
          )}
          <button type="submit" className="next-button" disabled={isUpdatingKm}>
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};
export default VoziloForm;
