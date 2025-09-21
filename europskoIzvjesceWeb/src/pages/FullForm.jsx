import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import NesrecaForm from "./NesrecaForm";
import SvjedociForm from "./SvjedociForm";
import VozacOsiguranikForm from "./VozacOsiguranikForm";
import VoziloForm from "./VoziloForm";
import OpisForm from "./OpisForm";
import OsiguravajuceDrustvo from "./OsiguravajuceDrustvoForm";
import PolicaForm from "./PolicaForm";
import PotpisForm from "./PotpisForm";
import FinalnaPotvrdaSingleForm from "./FinalnaPotvrdaSingleForm";
import FinalnaPotvrdaDoubleForm from "./FinalnaPotvrdaDoubleForm";
import "../css/FullForm.css";
import { io } from "socket.io-client";

const SOCKET_URL = "https://192.168.1.246:3001";
const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";

function deepMergePolica(oldVal, partial) {
  return {
    ...oldVal,
    ...partial,
    osiguranik: { ...(oldVal?.osiguranik || {}), ...(partial?.osiguranik || {}) },
    vozac: { ...(oldVal?.vozac || {}), ...(partial?.vozac || {}) },
  };
}

function mapOsiguranik(osiguranik) {
  if (!osiguranik) return {};
  return {
    ime_osiguranika: osiguranik.ime,
    prezime_osiguranika: osiguranik.prezime,
    adresa_osiguranika: osiguranik.adresa,
    postanskibroj_osiguranika: osiguranik.postanskiBroj,
    drzava_osiguranika: osiguranik.drzava,
    mail_osiguranika: osiguranik.mail,
    kontaktbroj_osiguranika: osiguranik.kontakt,
    iban_osiguranika: osiguranik.iban,
  };
}

const stepKeys = [
  "nesreca",
  "svjedoci",
  "vozacOsiguranik",
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
  "Podaci o vozilu",
  "Osiguravajuće društvo",
  "Polica osiguranja",
  "Potpis",
];

export default function FullForm() {
  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem("fullData");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [step, setStep] = useState(() => {
    const s = sessionStorage.getItem("fullFormStep");
    return s ? parseInt(s, 10) : 0;
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    const stored = sessionStorage.getItem("completedSteps");
    return stored ? JSON.parse(stored) : [0];
  });
  const [formStatus, setFormStatus] = useState(() => {
    return sessionStorage.getItem("fullFormStatus") || "active";
  });
  const [role, setRole] = useState(() => sessionStorage.getItem("role") || "");
  const [sessionId, setSessionId] = useState(() => {
    return (
      sessionStorage.getItem("session_id") ||
      new URLSearchParams(window.location.search).get("session") ||
      ""
    );
  });
  const [peerJoined, setPeerJoined] = useState(false);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const mode = sessionStorage.getItem("mode") || "single";
  const [singleEntries, setSingleEntries] = useState(() => {
    const arr = sessionStorage.getItem("single_entries");
    return arr ? JSON.parse(arr) : [];
  });

  const isMultiEntry = mode === "single" && singleEntries.length > 0;
  const currentEntryIndex = isMultiEntry ? singleEntries.length : 0;
  const totalEntries = isMultiEntry ? 2 : 1;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrSession = params.get("session");
    if (qrSession) {
      if (sessionStorage.getItem("session_id") !== qrSession) {
        sessionStorage.setItem("session_id", qrSession);
        sessionStorage.setItem("mode", "double");
        setSessionId(qrSession);
      }
    }
  }, []);

  useEffect(() => {
    if (mode !== "double" || !sessionId || socketRef.current) return;
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current.emit("join-session", { sessionId });
    socketRef.current.on("role-assigned", ({ role }) => {
      setRole(role);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("session_id", sessionId);
      sessionStorage.setItem("mode", "double");
    });
    socketRef.current.on("peer-joined", () => setPeerJoined(true));
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, mode]);

  // Spremanje u sessionStorage svaki put kad se data mijenjaju
  useEffect(() => {
    console.log("Spremanje u sessionStorage:", data); // DEBUG: za provjeru
    sessionStorage.setItem("fullData", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    sessionStorage.setItem("completedSteps", JSON.stringify(completedSteps));
  }, [completedSteps]);

  useEffect(() => {
    sessionStorage.setItem("fullFormStep", String(step));
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem("fullFormStatus", formStatus);
  }, [formStatus]);

  useEffect(() => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

  useEffect(() => {
    if (
      step === stepKeys.indexOf("vozilo") &&
      !data.vozilo?.registarskaoznaka_vozila &&
      data.nesreca?.registarskaOznaka
    ) {
      setData((prev) => ({
        ...prev,
        vozilo: {
          ...prev.vozilo,
          registarskaoznaka_vozila: prev.nesreca.registarskaOznaka,
        },
      }));
    }
  }, [step, data.nesreca, data.vozilo]);

  // POBOLJŠANA onStepChange funkcija
  const onStepChange = useCallback((stepKey, newFields) => {
    console.log(`Mijenjam ${stepKey}:`, newFields); // DEBUG: za praćenje promjena
    setData((prev) => {
      const oldVal = prev[stepKey] || {};
      let newVal = {};
      
      if (stepKey === "vozacOsiguranik") {
        newVal = deepMergePolica(oldVal, newFields);
      } else {
        newVal = { ...oldVal, ...newFields };
      }
      
      const updatedData = { ...prev, [stepKey]: newVal };
      console.log("Nova data struktura:", updatedData); // DEBUG
      return updatedData;
    });
  }, []);

  const finishSingleEntry = useCallback(() => {
    const arr = [...singleEntries, { ...data }];
    setSingleEntries(arr);
    sessionStorage.setItem("single_entries", JSON.stringify(arr));
    if (arr.length === 1) {
      setFormStatus("one-done");
      setData({});
      setStep(0);
      sessionStorage.setItem("fullFormStep", "0");
    } else if (arr.length >= 2) {
      setFormStatus("done");
    }
  }, [data, singleEntries]);

  const next = useCallback((partial) => {
    // Spremi podatke prije prelaska na sljedeći korak
    if (partial) {
      onStepChange(stepKeys[step], partial);
    }
    
    if (step === stepKeys.length - 1) {
      if (mode === "single") {
        navigate("/slanjePotvrde/single");
      } else if (mode === "double") {
        navigate("/slanjePotvrde/double");
      } else {
        navigate("/slanjePotvrde/single");
      }
    } else {
      const nextStep = Math.min(step + 1, stepKeys.length - 1);
      setStep(nextStep);
      sessionStorage.setItem("fullFormStep", String(nextStep));
    }
  }, [step, mode, navigate, onStepChange]);

  const prev = useCallback(() => {
    const prevStep = Math.max(step - 1, 0);
    setStep(prevStep);
    sessionStorage.setItem("fullFormStep", String(prevStep));
  }, [step]);

  const goToStep = useCallback((idx) => {
    if (completedSteps.includes(idx)) {
      setStep(idx);
      sessionStorage.setItem("fullFormStep", String(idx));
    }
  }, [completedSteps]);

  const getMappedData = useCallback(() => {
    const vozacOsiguranik = data.vozacOsiguranik || {};
    const osiguranikMapped = mapOsiguranik(vozacOsiguranik.osiguranik || {});
    return {
      ...data,
      vozacOsiguranik: {
        ...vozacOsiguranik,
        ...osiguranikMapped, // Dodaj mapiranje direktno u vozacOsiguranik
        osiguranik: osiguranikMapped, // Zadrži i originalni format
      },
    };
  }, [data]);

  const sendAllDataToBackendSingle = useCallback(async () => {
    const mappedData = getMappedData();
    console.log("Šalje se na backend:", mappedData); // DEBUG
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
      alert(e.message || "Neuspjeh u slanju na server");
    }
  }, [getMappedData]);

  const sendAllDataToBackendDouble = useCallback(async () => {
    try {
      const resp = await fetch("/api/prijava-dupli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(singleEntries),
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Greška prilikom slanja na server");
    } catch (e) {
      alert(e.message || "Neuspjeh u slanju na server");
    }
  }, [singleEntries]);

  useEffect(() => {
    if (location.pathname === "/slanjePotvrde/single" && mode === "single") {
      sendAllDataToBackendSingle();
    }
    if (location.pathname === "/slanjePotvrde/double" && mode === "double") {
      sendAllDataToBackendDouble();
    }
  }, [location.pathname, sendAllDataToBackendSingle, sendAllDataToBackendDouble, mode]);

  // POBOLJŠANE forme s boljim prosljeđivanjem podataka
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
      key="vozacOsiguranik" 
      data={data.vozacOsiguranik || {}} 
      onNext={next} 
      onBack={prev}
      onChange={(fields) => onStepChange("vozacOsiguranik", fields)} 
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
    />
  ];

  const handleGoHome = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/");
  };

  // DEBUG funkcija za provjeru spremljenih podataka
  const logSessionData = () => {
    console.log("SessionStorage podaci:", {
      fullData: JSON.parse(sessionStorage.getItem("fullData") || "{}"),
      step: sessionStorage.getItem("fullFormStep"),
      completedSteps: JSON.parse(sessionStorage.getItem("completedSteps") || "[]")
    });
  };

  useEffect(() => {
    logSessionData(); // Ispis podataka pri svakoj promjeni step-a
  }, [step]);

  if (location.pathname === "/slanjePotvrde/double" && mode === "double") {
    const handleSendDouble = async () => {
      await sendAllDataToBackendDouble();
      sessionStorage.clear();
      navigate("/");
    };
    return (
      <FinalnaPotvrdaDoubleForm
        allEntries={singleEntries}
        onSend={handleSendDouble}
        onBack={() => setStep(stepKeys.length - 1)}
        onGoHome={handleGoHome}
      />
    );
  }

  if (
    location.pathname === "/slanjePotvrde/single" ||
    (location.pathname === "/slanjePotvrde/double" && mode !== "double")
  ) {
    const vozacOsiguranik = data.vozacOsiguranik || {};
    const osiguranikOriginal = vozacOsiguranik.osiguranik || {};
    const osiguranje = data.osiguranje || {};
    const handleSend = async () => {
      await sendAllDataToBackendSingle();
      sessionStorage.clear();
      navigate("/");
    };
    return (
      <FinalnaPotvrdaSingleForm
        osiguranje={osiguranje}
        osiguranik={osiguranikOriginal}
        onSend={handleSend}
        onBack={() => setStep(stepKeys.length - 1)}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="fullform-site">
      <div className="fullform-header">
        <ProgressBar
          currentStep={step}
          steps={stepNames}
          onStepClick={goToStep}
          completedSteps={completedSteps}
          currentEntryIndex={currentEntryIndex}
          totalEntries={totalEntries}
          role={role}
        />
        <h2 className="fullform-title">{stepNames[step]}</h2>
        <p className="fullform-desc">Korak {step + 1} od {stepNames.length}</p>
      </div>
      {forms[step]}
    </div>
  );
}
