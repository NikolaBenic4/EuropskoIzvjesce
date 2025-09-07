import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import NesrecaForm from "./NesrecaForm";
import SvjedociForm from "./SvjedociForm";
import VozacOsignikForm from "./VozacOsiguranikForm";
import VoziloForm from "./VoziloForm";
import OpisForm from "./OpisForm";
import OsiguravajuceDrustvo from "./OsiguravajuceDrustvoForm";
import PolicaForm from "./PolicaForm";
import PotpisForm from "./PotpisForm";
import FinalnaPotvrda from "./FinalnaPotvrdaForm";
import "../css/FullForm.css";

const mapOsignik = (osignik) => ({
  ime_osignika: osignik.ime,
  prezime_osignika: osignik.prezime,
  adresa_osignika: osignik.adresa,
  postanskibroj_osignika: osignik.postanskiBroj,
  drzava_osignika: osignik.drzava,
  mail_osignika: osignik.mail,
  kontakt: osignik.kontakt,
});

const stepKeys = [
  "nesreca",
  "svjedoci",
  "vozacPolica",
  "opis",
  "vozilo",
  "osiguranje",
  "polica",
  "potpis",
];

const stepNames = [
  "Opće informacije",
  "Svjedoci",
  "Osiguranik i vozač",
  "Opis nesreće",
  "Podaci vozila",
  "Osiguravajuće društvo",
  "Polica osiguranje",
  "Potpis",
];

function deepMergePolica(oldVal, partial) {
  return {
    ...oldVal,
    ...partial,
    osignik: { ...(oldVal?.osignik || {}), ...(partial?.osignik || {}) },
    vozac: { ...(oldVal?.vozac || {}), ...(partial?.vozac || {}) },
  };
}

export default function FullForm() {
  const [data, setData] = useState(() => {
    const stored = sessionStorage.getItem("fullData");
    return stored ? JSON.parse(stored) : {};
  });

  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([0]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      sessionStorage.setItem("fullData", JSON.stringify(data));
    } catch {}
  }, [data]);

  useEffect(() => {
    setCompletedSteps((prev) =>
      prev.includes(step) ? prev : [...prev, step]
    );
  }, [step]);

  const onStepChange = (stepKey, newFields) => {
    setData((prev) => {
      const oldVal = prev[stepKey] || {};
      let newVal = {};
      if (stepKey === "vozacPolica") {
        newVal = deepMergePolica(oldVal, newFields);
      } else {
        newVal = { ...oldVal, ...newFields };
      }
      return { ...prev, [stepKey]: newVal };
    });
  };

  const next = (partial) => {
    onStepChange(stepKeys[step], partial);
    if (step === stepKeys.length - 1) {
      navigate("/slanjePotvrde");
    } else {
      setStep((s) => Math.min(s + 1, stepKeys.length - 1));
    }
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const goToStep = (idx) => {
    if (completedSteps.includes(idx)) setStep(idx);
  };

  const getMappedData = () => {
    const vozacPolica = data.vozacPolica || {};
    const osignikMapped = mapOsignik(vozacPolica.osignik || {});
    return {
      ...data,
      vozacPolica: {
        ...vozacPolica,
        osignik: osignikMapped,
      },
    };
  };

  const sendAllDataToBackend = useCallback(async () => {
    const mappedData = getMappedData();
    const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";
    try {
      const resp = await fetch("/api/prijava", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(mappedData),
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Greška prilikom slanja na server");
    } catch (e) {
      alert(e.message || "Desila se greška");
    }
  }, [data]);

  useEffect(() => {
    if (location.pathname === "/slanjePotvrde") {
      sendAllDataToBackend();
    }
  }, [location.pathname, sendAllDataToBackend]);

  const forms = [
    <NesrecaForm
      key="nesreca"
      data={data.nesreca || {}}
      onNext={next}
      onBack={step > 0 ? prev : null}
      onChange={(fields) => onStepChange("nesreca", fields)}
    />,
    <SvjedociForm
      key="svjedoci"
      data={data.svjedoci || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("svjedoci", fields)}
    />,
    <VozacOsignikForm
      key="vozacPolica"
      data={data.vozacPolica || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("vozacPolica", fields)}
    />,
    <OpisForm
      key="opis"
      data={data.opis || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("opis", fields)}
    />,
    <VoziloForm
      key="vozilo"
      data={data.vozilo || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("vozilo", fields)}
    />,
    <OsiguravajuceDrustvo
      key="osiguranje"
      data={data.osiguranje || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("osiguranje", fields)}
    />,
    <PolicaForm
      key="polica"
      data={data.polica || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("polica", fields)}
    />,
    <PotpisForm
      key="potpis"
      data={data.potpis || {}}
      onNext={next}
      onBack={prev}
      onChange={(fields) => onStepChange("potpis", fields)}
    />,
  ];

  if (location.pathname === "/slanjePotvrde") {
    const vozacPolica = data.vozacPolica || {};
    const osignikOriginal = vozacPolica.osignik || {};
    const osiguranje = data.osiguranje || {};
    
    const handleSend = async (mail) => {
      const mappedData = getMappedData();
      const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";
      try {
        const resp = await fetch("/api/prijava", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(mappedData),
          credentials: "include",
        });
        if (!resp.ok) throw new Error("Neuspjeh u spremanju podataka");
      } catch (err) {
        alert("Neuspjeh u spremanju podataka: " + err.message);
        return;
      }
      try {
        const respPdf = await fetch("/api/generate-pdf-and-send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({ mail, data: mappedData }),
          credentials: "include",
        });
        if (!respPdf.ok) throw new Error("Neuspjeh u slanju PDF-a");
        alert("Uspješno poslano. Provjerite email.");
        sessionStorage.removeItem("fullData");
        navigate("/");
      } catch (err) {
        alert("Neuspjeh u kreiranju/slanju PDF-a: " + err.message);
      }
    };

    return (
      <FinalnaPotvrda
        osiguranje={osiguranje}
        osignik={osignikOriginal}
        onSend={handleSend}
        onBack={() => setStep(stepKeys.length - 1)}
      />
    );
  }

  return (
    <div className="fullform-site">
      <div className="fullform-header">
        <ProgressBar
          currentStep={step}
          steps={stepNames}
          onClick={goToStep}
          completedSteps={completedSteps}
        />
        <h2 className="fullform-title">{stepNames[step]}</h2>
        <p className="fullform-desc">Korak {step + 1} od {stepNames.length}</p>
      </div>
      <div className="fullform-content">{forms[step]}</div>
    </div>
  );
}
