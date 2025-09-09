import React, { useEffect, useState, useRef } from "react";
import NesrecaForm from "./NesrecaForm";
import SvjedociForm from "./SvjedociForm";
import VozacOsiguranikForm from "./VozacOsiguranikForm";
import OpisForm from "./OpisForm";
import VoziloForm from "./VoziloForm";
import OsiguravajuceDrustvo from "./OsiguravajuceDrustvoForm";
import PolicaForm from "./PolicaForm";
import PotpisForm from "./PotpisForm";
import ProgressBar from "../components/ProgressBar";
import FinalnaPotvrda from "./FinalnaPotvrdaForm";
import { io } from "socket.io-client";

const SOCKET_URL = "https://192.168.1.246:3001"; // LAN IP
const stepKeys = [
  "nesreca", "svjedoci", "vozacOsiguranik", "opis", "vozilo",
  "osiguranje", "polica", "potpis"
];
const stepNames = [
  "Opće informacije", "Svjedoci", "Osiguranik i vozač", "Opis nesreće",
  "Podaci vozila", "Osiguravajuće društvo", "Polica osiguranje", "Potpis"
];

export default function DoubleEntryForm({ sessionId }) {
  const [role, setRole] = useState(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [peerProgress, setPeerProgress] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [pdfConfirm, setPdfConfirm] = useState(false);
  const [sent, setSent] = useState(false);
  const [peerStep, setPeerStep] = useState(0);
  const socketRef = useRef(null);

  // Auto-fill registracijska oznaka
  useEffect(() => {
    if (
      step === stepKeys.indexOf("vozilo") &&
      !formData.vozilo?.registarskaoznaka_vozila &&
      formData.nesreca?.registarskaOznaka
    ) {
      setFormData(prev => ({
        ...prev,
        vozilo: {
          ...prev.vozilo,
          registarskaoznaka_vozila: prev.nesreca.registarskaOznaka
        }
      }));
    }
  }, [step, formData.nesreca, formData.vozilo]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current.emit("join-session", { sessionId });
    socketRef.current.on("role-assigned", ({ role }) => setRole(role));
    socketRef.current.on("peer-progress", ({ role: peerRole, data }) => {
      setPeerProgress({ peerRole, data });
      let pStep = 0;
      for (let i = stepKeys.length - 1; i >= 0; i--) {
        if (data[stepKeys[i]]) { pStep = i; break; }
      }
      setPeerStep(pStep);
    });
    socketRef.current.on("pdf-confirmation-ready", () => setPdfConfirm(true));
    socketRef.current.on("pdf-sent", () => setSent(true));
    return () => { socketRef.current.disconnect(); socketRef.current = null; };
  }, [sessionId]);

  function onStepChange(fields) {
    const updatedData = { ...formData, [stepKeys[step]]: { ...fields } };
    setFormData(updatedData);
    socketRef.current.emit("form-progress", updatedData);
  }

  function handleNext(fields) {
    const updatedData = { ...formData, [stepKeys[step]]: { ...fields } };
    setFormData(updatedData);
    if (step === stepKeys.length - 1) {
      setCompleted(true);
      socketRef.current.emit("form-completed", updatedData);
    } else {
      setStep(s => s + 1);
      socketRef.current.emit("form-progress", updatedData);
    }
  }
  function handleBack() { setStep(s => Math.max(s - 1, 0)); }
  function confirmSendPDF() { socketRef.current.emit("confirm-send-pdf"); }
  function getOsiguraniciEmails() {
    const osig = formData.vozacOsiguranik?.osiguranik || {};
    return [osig.mail_osiguranika?.trim() || osig.mail?.trim()].filter(Boolean);
  }

  // --- UI cases ---
  if (sent)
    return <div className="finalna-poruka">PDF je uspješno poslan! Hvala.</div>;

  if (pdfConfirm)
    return (
      <FinalnaPotvrda
        osiguranje={formData.osiguranje || {}}
        osiguranik={formData.vozacOsiguranik?.osiguranik || {}}
        osiguraniciEmails={getOsiguraniciEmails()}
        onSend={confirmSendPDF}
        onBack={() => setStep(stepKeys.length - 1)}
        canAddSecond={false}
        onAddSecond={null}
      />
    );

  if (completed)
    return <div className="pdf-finalna-cekaj">Čeka se drugi sudionik da dovrši unos...</div>;

  const forms = [
    <NesrecaForm key="nesreca" data={formData.nesreca || {}} onNext={handleNext} onBack={step > 0 ? handleBack : null}
      onChange={fields => onStepChange(fields)} />,
    <SvjedociForm key="svjedoci" data={formData.svjedoci || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <VozacOsiguranikForm key="vozacOsiguranik" data={formData.vozacOsiguranik || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <OpisForm key="opis" data={formData.opis || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <VoziloForm key="vozilo" data={formData.vozilo || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <OsiguravajuceDrustvo key="osiguranje" data={formData.osiguranje || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <PolicaForm key="polica" data={formData.polica || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
    <PotpisForm key="potpis" data={formData.potpis || {}} onNext={handleNext} onBack={handleBack}
      onChange={fields => onStepChange(fields)} />,
  ];

  return (
    <div>
      <h3>Sudionik {role || "..."}</h3>
      <ProgressBar
        currentStep={step}
        steps={stepNames}
        completedSteps={[...Array(step + 1).keys()]}
        currentEntryIndex={role === "A" ? 0 : 1}
        totalEntries={2}
      />
      <div style={{ margin: "8px 0", fontSize: "1.05rem", color: "#036" }}>
        {peerProgress &&
          <p>
            Drugi sudionik ({peerProgress.peerRole}) je na koraku {peerStep + 1}: <b>{stepNames[peerStep]}</b>
          </p>
        }
      </div>
      <p>Korak {step + 1} od {stepNames.length} - {stepNames[step]}</p>
      {forms[step]}
    </div>
  );
}
