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
import "../css/FullForm.css";

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
    // Redovno spremanje forme lokalno
    try {
      sessionStorage.setItem("fullFormData", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

  // SLANJE PODATAKA NA BACKEND NAKON ZAVRŠETKA FORME
  const sendAllDataToBackend = useCallback(async () => {
    try {
      const resp = await fetch("/api/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Greška pri slanju na server!");
      // ...po želji prikaži obavijest, navigiraj na status stranicu itd.
    } catch (e) {
      alert(e.message || "Dogodila se pogreška!");
    }
  }, [data]);

  // AUTOMATSKO slanje na "/slanjePotvrde"
  useEffect(() => {
    if (location.pathname === "/slanjePotvrde") {
      sendAllDataToBackend();
    }
  }, [location.pathname, sendAllDataToBackend]);

  const next = (partial) => {
    setData((prev) => ({
      ...prev,
      [stepKeys[step]]: partial,
    }));
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

  const forms = [
    <NesrecaForm
      key="nesreca"
      data={data.nesreca || {}}
      onNext={next}
      onBack={step > 0 ? prev : null}
    />,
    <SvjedociForm
      key="svjedoci"
      data={data.svjedoci || {}}
      onNext={next}
      onBack={prev}
    />,
    <VozacOsiguranikForm
      key="vozacPolica"
      data={data.vozacPolica || {}}
      onNext={next}
      onBack={prev}
    />,
    <OpisForm
      key="opis"
      data={data.opis || {}}
      onNext={next}
      onBack={prev}
    />,
    <VoziloForm
      key="vozilo"
      data={data.vozilo || {}}
      onNext={next}
      onBack={prev}
    />,
    <OsiguravajuceDrustvoForm
      key="osiguranje"
      data={data.osiguranje || {}}
      onNext={next}
      onBack={prev}
    />,
    <PolicaForm
      key="polica"
      data={data.polica || {}}
      onNext={next}
      onBack={prev}
    />,
    <PotpisForm
      key="potpis"
      data={data.potpis || {}}
      onNext={next}
      onBack={prev}
    />,
  ];

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
