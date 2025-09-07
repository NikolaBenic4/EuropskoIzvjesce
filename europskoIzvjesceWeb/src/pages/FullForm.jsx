import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import NesrecaForm from "./NesrecaForm";
import SvjedociForm from "./SvjedociForm";
import VozacOsiguranikForm from "./VozacOsiguranikForm";
import VoziloForm from "./VoziloForm";
import OpisForm from "./OpisForm";
import OsiguravajuceDrustvoForm from "./OsiguravajuceDrustvoForm";
import PolicaForm from "./PolicaForm";
import PotpisForm from "./PotpisForm";
import FinalnaPotvrdaForm from "./FinalnaPotvrdaForm";
import "../css/FullForm.css";

const mapOsiguranikToDb = (osiguranik) => ({
  ime_osiguranika: osiguranik.ime,
  prezime_osiguranika: osiguranik.prezime,
  adresa_osiguranika: osiguranik.adresa,
  postanskibroj_osiguranika: osiguranik.postanskiBroj,
  drzava_osiguranika: osiguranik.drzava,
  mail_osiguranika: osiguranik.mail,
  kontaktbroj_osiguranika: osiguranik.kontakt,
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

const stepTitles = [
  "Opće informacije",
  "Svjedoci",
  "Osiguranik i vozač",
  "Opis nesreće",
  "Podaci o vozilu",
  "Osiguravajuće društvo",
  "Polica osiguranja",
  "Potpis",
];

function deepMergeVozacPolica(oldVal, partial) {
  return {
    ...oldVal,
    ...partial,
    osiguranik: { ...(oldVal?.osiguranik || {}), ...(partial?.osiguranik || {}) },
    vozac: { ...(oldVal?.vozac || {}), ...(partial?.vozac || {}) },
  };
}

export default function FullForm() {
  const [data, setData] = useState(() => {
    const stored = sessionStorage.getItem("fullFormData");
    return stored ? JSON.parse(stored) : {};
  });

  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([0]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      sessionStorage.setItem("fullFormData", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

  // Dublji merge i za ručne promjene u step formama
  const onStepChange = (stepKey, newFields) => {
    setData(prev => {
      const oldVal = prev[stepKey] || {};
      let newVal = {};
      if (stepKey === "vozacPolica") {
        newVal = deepMergeVozacPolica(oldVal, newFields);
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
    const osiguranikMapped = mapOsiguranikToDb(vozacPolica.osiguranik || {});
    return {
      ...data,
      vozacPolica: {
        ...vozacPolica,
        osiguranik: osiguranikMapped,
      },
    };
  };

  const sendAllDataToBackend = useCallback(async () => {
    const mappedData = getMappedData();
    try {
      const resp = await fetch("/api/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappedData),
      });
      if (!resp.ok) throw new Error("Greška pri slanju na server!");
    } catch (e) {
      alert(e.message || "Dogodila se pogreška!");
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
    <VozacOsiguranikForm
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
    <OsiguravajuceDrustvoForm
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
    const osiguranikOriginal = vozacPolica.osiguranik || {};
    const osiguranje = data.osiguranje || {};

    const handleSend = async (mail) => {
      const mappedData = getMappedData();
      try {
        await fetch("/api/prijava", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedData),
        });
      } catch (err) {
        alert("Neuspjelo spremanje u bazu: " + err.message);
        return;
      }
      try {
        await fetch("/api/generate-pdf-and-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mail, data: mappedData }),
        });
        sessionStorage.removeItem("fullFormData");
        alert("Prijava uspješno poslana i PDF će stići na e-mail!");
        navigate("/");
      } catch (err) {
        alert("PDF nije kreiran: " + err.message);
      }
    };

    return (
      <FinalnaPotvrdaForm
        osiguranik={osiguranikOriginal}
        osiguranje={osiguranje}
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
          steps={stepTitles}
          onStepClick={goToStep}
          completedSteps={completedSteps}
        />
        <h2 className="fullform-title">{stepTitles[step]}</h2>
        <p className="fullform-desc">
          Korak {step + 1} od {stepTitles.length}
        </p>
      </div>
      <div className="fullform-content">
        {forms[step]}
      </div>
    </div>
  );
}
