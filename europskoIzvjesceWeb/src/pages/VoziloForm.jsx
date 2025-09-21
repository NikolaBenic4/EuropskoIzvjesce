import React, { useState, useEffect } from "react";
import "../css/VoziloForm.css";

const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";

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
  godinaproizvodnje_vozilo: "",
};

const regexRegOznaka = /^[A-ZČĆŽŠĐ]{2}-?\d{3,4}-?[A-ZČĆŽŠĐ]{1,2}$/u;
const regexBrojSasije = /^[A-HJ-NPR-Z0-9]{17}$/i;
const regexDrzava = /^[A-Za-zčćžšđ \-]{2,}$/u;

const VoziloForm = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {}),
  }));
  const [error, setError] = useState("");
  const [visibleTooltip, setVisibleTooltip] = useState({
    reg: false,
    marka: false,
    tip: false,
  });
  const [isUpdatingKm, setIsUpdatingKm] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  // API fetch s autorizacijom
  const fetchVozilo = async (oznaka) => {
    if (!oznaka || !regexRegOznaka.test(oznaka.trim())) {
      setIsLocked(false);
      return;
    }
    try {
      const response = await fetch(`/api/vozilo/${oznaka.trim().toUpperCase()}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        }
      });
      if (response.status === 401) {
        setError("Nemate pravo pristupa bazi (API ključ neispravan).");
        setIsLocked(false);
        return;
      }
      if (!response.ok) {
        setError("Vozilo nije pronađeno u bazi.");
        setIsLocked(false);
        return;
      }
      const vozilo = await response.json();
      setFormData((prev) => ({
        ...prev,
        marka_vozila: vozilo.marka_vozila ?? "",
        tip_vozila: vozilo.tip_vozila ?? "",
        drzavaregistracije_vozila: vozilo.drzavaregistracije_vozila ?? "",
        brojsasije_vozila: vozilo.brojsasije_vozila ?? "",
        godinaproizvodnje_vozilo: vozilo.godinaproizvodnje_vozilo ?? "",
      }));
      setIsLocked(true);
      setError("");
    } catch (error) {
      setError("Greška pri dohvaćanju podataka.");
      setIsLocked(false);
    }
  };

  const updateKilometraza = async () => {
    setIsUpdatingKm(true);
    try {
      const res = await fetch(
        `/api/vozilo/${formData.registarskaoznaka_vozila.trim().toUpperCase()}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          },
          body: JSON.stringify({ kilometraza_vozila: formData.kilometraza_vozila }),
        }
      );
      if (!res.ok) throw new Error();
      setError("");
    } catch {
      setError("Greška pri ažuriranju kilometraže.");
    }
    setIsUpdatingKm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "registarskaoznaka_vozila") setIsLocked(false);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value.toUpperCase(),
    }));
    setError("");
  };

  const handleRegBlur = (e) => {
    fetchVozilo(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validacije
    if (!regexRegOznaka.test(formData.registarskaoznaka_vozila.trim())) {
      setError("Registarska oznaka nije u ispravnom formatu.");
      return;
    }
    if (!regexBrojSasije.test(formData.brojsasije_vozila.trim())) {
      setError("Broj šasije mora imati 17 znakova bez O, Q, I.");
      return;
    }
    if (!/^\d+$/.test(formData.kilometraza_vozila) || Number(formData.kilometraza_vozila) < 0) {
      setError("Kilometraža mora biti cijeli broj veći ili jednak nuli.");
      return;
    }
    const godina = Number(formData.godinaproizvodnje_vozilo);
    const trenutnaGodina = new Date().getFullYear();
    if (godina < 1900 || godina > trenutnaGodina) {
      setError(`Godina proizvodnje mora biti između 1900 i ${trenutnaGodina}.`);
      return;
    }
    if (!regexDrzava.test(formData.drzavaregistracije_vozila.trim())) {
      setError("Država registracije vozila smije imati samo slova i razmake.");
      return;
    }
    if (formData.imaPrikolicu) {
      if (
        !regexRegOznaka.test(formData.registracijskaoznaka_prikolica.trim()) ||
        !regexDrzava.test(formData.drzavaregistracije_prikolica.trim())
      ) {
        setError("Podaci za prikolicu nisu ispravni.");
        return;
      }
    }
    await updateKilometraza();
    setError("");
    // Priprema za slanje: NE šalji imaPrikolicu property
    const { imaPrikolicu, ...zaSlanje } = formData;
    if (!formData.imaPrikolicu) {
      delete zaSlanje.registracijskaoznaka_prikolica;
      delete zaSlanje.drzavaregistracije_prikolica;
    }
    if (onNext) onNext(zaSlanje);
  };

  const handleInfoClick = (key, e) => {
    e.preventDefault();
    setVisibleTooltip((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInfoBlur = (key) => {
    setVisibleTooltip((prev) => ({ ...prev, [key]: false }));
  };

  return (
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <div className="form-group">
            <label htmlFor="registarskaoznaka_vozila" className="form-label">
              Registarska oznaka:*
              <button
                type="button"
                className="info-button-round"
                onClick={(e) => handleInfoClick("reg", e)}
                onBlur={() => handleInfoBlur("reg")}
                tabIndex={0}
                aria-label="Informacije o formatu registarske oznake"
                onKeyDown={(e) => e.key === "Escape" && handleInfoBlur("reg")}
              >
                i
                <span className={`info-tooltip${visibleTooltip.reg ? " info-tooltip-active" : ""}`} role="tooltip">
                  Primjer: <b>ZG1234AB</b>, <b>ST-123-A</b>, <b>RI123AA</b>
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
              onBlur={handleRegBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();             // SPRIJEČI SUBMIT!
                  fetchVozilo(e.target.value);    // Samo automatski popuni vozilo
                }
              }}
              maxLength={20}
              required
              pattern={regexRegOznaka.source}
              title="Unesite registarsku oznaku velikim slovima"
              autoComplete="off"
              placeholder="Unesi registarsku oznaku"
            />
          </div>
          
        <div className="form-group">
          <label htmlFor="marka_vozila" className="form-label">
            Marka:*
            <button
              type="button"
              className="info-button-round"
              onClick={(e) => handleInfoClick("marka", e)}
              onBlur={() => handleInfoBlur("marka")}
              tabIndex={0}
              aria-label="Informacije o marki vozila"
              onKeyDown={(e) => e.key === "Escape" && handleInfoBlur("marka")}
            >
              i
              <span className={`info-tooltip${visibleTooltip.marka ? " info-tooltip-active" : ""}`} role="tooltip">
                Primjeri: <b>Citroen</b>, <b>Volkswagen</b>, <b>Renault</b>
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
            readOnly={isLocked}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tip_vozila" className="form-label">
            Tip vozila:*
            <button
              type="button"
              className="info-button-round"
              onClick={(e) => handleInfoClick("tip", e)}
              onBlur={() => handleInfoBlur("tip")}
              tabIndex={0}
              aria-label="Informacije o tipu vozila"
              onKeyDown={(e) => e.key === "Escape" && handleInfoBlur("tip")}
            >
              i
              <span className={`info-tooltip${visibleTooltip.tip ? " info-tooltip-active" : ""}`} role="tooltip">
                Primjeri: <b>C4</b>, <b>Golf VII</b>, <b>Megane</b>
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
            readOnly={isLocked}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="drzavaregistracije_vozila" className="form-label">
            Država registracije:*
          </label>
          <input
            type="text"
            id="drzavaregistracije_vozila"
            name="drzavaregistracije_vozila"
            className="form-input"
            value={formData.drzavaregistracije_vozila}
            onChange={handleChange}
            maxLength={50}
            pattern={regexDrzava.source}
            title="Samo slova, razmaci i minus"
            readOnly={isLocked}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="brojsasije_vozila" className="form-label">
            Broj šasije:*
          </label>
          <input
            type="text"
            id="brojsasije_vozila"
            name="brojsasije_vozila"
            className="form-input"
            value={formData.brojsasije_vozila}
            onChange={handleChange}
            maxLength={17}
            minLength={17}
            pattern={regexBrojSasije.source}
            title="17 znakova, bez O, Q, I"
            style={{ textTransform: "uppercase" }}
            readOnly={isLocked}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kilometraza_vozila" className="form-label">
            Kilometraža:*
          </label>
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
            placeholder="Unesi trenutnu kilometražu vozila"
          />
          {isUpdatingKm && <div style={{ color: "#2268ed", marginTop: 6 }}>Ažuriram...</div>}
        </div>

        <div className="form-group">
          <label htmlFor="godinaproizvodnje_vozilo" className="form-label">
            Godina proizvodnje:*
          </label>
          <input
            type="number"
            id="godinaproizvodnje_vozilo"
            name="godinaproizvodnje_vozilo"
            className="form-input"
            value={formData.godinaproizvodnje_vozilo}
            onChange={handleChange}
            min={1900}
            max={new Date().getFullYear()}
            readOnly={isLocked}
            required
          />
        </div>

          <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="imaPrikolicu"
              checked={formData.imaPrikolicu}
              onChange={handleChange}
              className="checkbox-input"
            />
            Imam prikolicu
          </label>
        </div>

        {formData.imaPrikolicu && (
          <>
            <div className="form-group">
              <label htmlFor="registracijskaoznaka_prikolica" className="form-label">
                Registracijska oznaka prikolice:
              </label>
              <input
                type="text"
                id="registracijskaoznaka_prikolica"
                name="registracijskaoznaka_prikolica"
                className="form-input"
                value={formData.registracijskaoznaka_prikolica}
                onChange={handleChange}
                maxLength={20}
                pattern={regexRegOznaka.source}
                title="Format: 2 slova + 3-4 broja + 1-2 slova"
                style={{ textTransform: "uppercase" }}
                required={formData.imaPrikolicu}
              />
            </div>
            <div className="form-group">
              <label htmlFor="drzavaregistracije_prikolica" className="form-label">
                Država registracije prikolice:
              </label>
              <input
                type="text"
                id="drzavaregistracije_prikolica"
                name="drzavaregistracije_prikolica"
                className="form-input"
                value={formData.drzavaregistracije_prikolica}
                onChange={handleChange}
                maxLength={50}
                pattern={regexDrzava.source}
                title="Samo slova, razmaci i -"
                required={formData.imaPrikolicu}
              />
            </div>
          </>
        )}

        {error && <div style={{ color: "red", fontWeight: "bold", marginTop: 12 }}>{error}</div>}

        <div className="navigation-buttons" style={{ marginTop:20 }}>
          {onBack && (
            <button type="button" onClick={onBack} className="back-button" style={{ marginRight: 6 }}>
              NAZAD
            </button>
          )}
          <button type="submit" disabled={isUpdatingKm} className="next-button">
            DALJE
          </button>
        </div>
      </form>
  );
};

export default VoziloForm;
