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
import FinalnaPotvrda from "./FinalnaPotvrdaForm";
import "../css/FullForm.css";
import { io } from "socket.io-client";

const SOCKET_URL = "https://192.168.1.246:3001"; // LAN IP!
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
  "Podaci vozila",
  "Osiguravajuće društvo",
  "Polica osiguranje",
  "Potpis",
];

export default function FullForm() {
  const [data, setData] = useState(() => {
    const stored = sessionStorage.getItem("fullData");
    return stored ? JSON.parse(stored) : {};
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
    return sessionStorage.getItem("session_id") ||
      new URLSearchParams(window.location.search).get("session") ||
      "";
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

  // Socket.IO inicijalizacija za dvostruki unos
  useEffect(() => {
    if (!sessionId || socketRef.current) return;
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
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  // State i storage sync
  useEffect(() => {
    try {
      sessionStorage.setItem("fullData", JSON.stringify(data));
    } catch {}
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

  // --- AUTO ISPUNJAVANJE REGISTARSKE ---
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

  // --- HANDLERS ---
  const onStepChange = (stepKey, newFields) => {
    setData((prev) => {
      const oldVal = prev[stepKey] || {};
      let newVal = {};
      if (stepKey === "vozacOsiguranik") {
        newVal = deepMergePolica(oldVal, newFields);
      } else {
        newVal = { ...oldVal, ...newFields };
      }
      return { ...prev, [stepKey]: newVal };
    });
  };

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

  const next = (partial) => {
    onStepChange(stepKeys[step], partial);
    if (step === stepKeys.length - 1) {
      if (mode === "single") {
        finishSingleEntry();
      } else {
        navigate("/slanjePotvrde");
      }
    } else {
      const nextStep = Math.min(step + 1, stepKeys.length - 1);
      setStep(nextStep);
      sessionStorage.setItem("fullFormStep", String(nextStep));
    }
  };
  const prev = () => {
    const prevStep = Math.max(step - 1, 0);
    setStep(prevStep);
    sessionStorage.setItem("fullFormStep", String(prevStep));
  };
  const goToStep = (idx) => {
    if (completedSteps.includes(idx)) {
      setStep(idx);
      sessionStorage.setItem("fullFormStep", String(idx));
    }
  };

  // --- FINALNA POTVRDA HANDLER ---
  const getMappedData = () => {
    const vozacOsiguranik = data.vozacOsiguranik || {};
    const osiguranikMapped = mapOsiguranik(vozacOsiguranik.osiguranik || {});
    return {
      ...data,
      vozacOsiguranik: {
        ...vozacOsiguranik,
        osiguranik: osiguranikMapped,
      },
    };
  };

  const sendAllDataToBackend = useCallback(async () => {
    const mappedData = getMappedData();
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
  }, [data]);

  useEffect(() => {
    if (location.pathname === "/slanjePotvrde") {
      sendAllDataToBackend();
    }
  }, [location.pathname, sendAllDataToBackend]);

  // --- FORME ---
  const forms = [
    <NesrecaForm key="nesreca" data={data.nesreca || {}} onNext={next} onBack={step > 0 ? prev : null}
      onChange={fields => onStepChange("nesreca", fields)} />,
    <SvjedociForm key="svjedoci" data={data.svjedoci || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("svjedoci", fields)} />,
    <VozacOsiguranikForm key="vozacOsiguranik" data={data.vozacOsiguranik || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("vozacOsiguranik", fields)} />,
    <OpisForm key="opis" data={data.opis || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("opis", fields)} />,
    <VoziloForm key="vozilo" data={data.vozilo || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("vozilo", fields)} />,
    <OsiguravajuceDrustvo key="osiguranje" data={data.osiguranje || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("osiguranje", fields)} />,
    <PolicaForm key="polica" data={data.polica || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("polica", fields)} />,
    <PotpisForm key="potpis" data={data.potpis || {}} onNext={next} onBack={prev}
      onChange={fields => onStepChange("potpis", fields)} />
  ];

  // --- FINALNA POTVRDA VIEW ---
  if (location.pathname === "/slanjePotvrde") {
    const vozacOsiguranik = data.vozacOsiguranik || {};
    const osiguranikOriginal = vozacOsiguranik.osiguranik || {};
    const osiguranje = data.osiguranje || {};

    const handleSend = async (mail) => {
      const mappedData = getMappedData();
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
        osiguranik={osiguranikOriginal}
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
          onStepClick={goToStep}
          completedSteps={completedSteps}
          currentEntryIndex={currentEntryIndex}
          totalEntries={totalEntries}
          role={role}
        />
        <h2 className="fullform-title">{stepNames[step]}</h2>
        <p className="fullform-desc">Korak {step + 1} od {stepNames.length}</p>
      </div>
      <div className="fullform-content">{forms[step]}</div>
    </div>
  );
}
