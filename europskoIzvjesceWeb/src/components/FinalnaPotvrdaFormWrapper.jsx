import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaSingleForm from "../pages/FinalnaPotvrdaSingleForm";
import FinalnaPotvrdaDoubleForm from "../pages/FinalnaPotvrdaDoubleForm";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

// Helper functions
const flattenVozacOsiguranik = (vozacOsiguranik) => ({
  ...(vozacOsiguranik.osiguranik || {}),
  ...(vozacOsiguranik.vozac || {}),
  isti: vozacOsiguranik.isti !== undefined ? vozacOsiguranik.isti : false,
  iban_osiguranika: vozacOsiguranik.iban_osiguranika || "",
  potpis: vozacOsiguranik.potpis || "",
  datum_potpisa: vozacOsiguranik.datum_potpisa || "",
  banka: vozacOsiguranik.banka || "",
});

function canonicalOsiguranje(input) {
  if (!input) return {};
  return {
    id_osiguranje: input.id_osiguranje || "",
    naziv_osiguranja: input.naziv_osiguranja || input.naziv || "",
    adresa_osiguranja: input.adresa_osiguranja || input.adresa || "",
    drzava_osiguranja: input.drzava_osiguranja || input.drzava || "",
    mail_osiguranja: input.mail_osiguranja || input.mail || "",
    kontaktbroj_osiguranja: input.kontaktbroj_osiguranja || input.kontaktbroj || input.kontakt_broj || "",
  };
}

const API_KEY = import.meta.env.VITE_API_KEY || "tajni-api-kljuc";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://localhost:3001";

const FinalnaPotvrdaWrapper = () => {
  const navigate = useNavigate();

  // Učitaj podatke i načini rada iz sessionStorage
  const allData = JSON.parse(sessionStorage.getItem("fullData") || "{}");
  const mode = sessionStorage.getItem("mode") || "single";
  const singleEntries = JSON.parse(sessionStorage.getItem("single_entries") || "[]");

  const osiguranje = canonicalOsiguranje(allData.osiguranje);

  // Definicija osiguranika za predaju propova i email inicijalizaciju
  const osiguranik = allData.vozacOsiguranik?.osiguranik || {};

  // Osiguraj postojanje id_nesrece (UUID u single modeu)
  if (!allData.nesreca) allData.nesreca = {};
  if (!allData.nesreca.id_nesrece) {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('sessionId', sessionId);
    }
    allData.nesreca.id_nesrece = sessionId;
  }
  const sessionId = allData.nesreca.id_nesrece;

  const vozacOsiguranikSrc = allData.vozacOsiguranik || {};
  let vozacOsiguranik = flattenVozacOsiguranik(vozacOsiguranikSrc);

  if (allData.potpis) {
    if (allData.potpis.iban_osiguranika) vozacOsiguranik.iban_osiguranika = allData.potpis.iban_osiguranika;
    if (allData.potpis.potpis) vozacOsiguranik.potpis = allData.potpis.potpis;
    if (allData.potpis.datum_potpisa) vozacOsiguranik.datum_potpisa = allData.potpis.datum_potpisa;
    if (allData.potpis.banka) vozacOsiguranik.banka = allData.potpis.banka;
  }

  // Složeni podaci za backend
  const allDataMapped = {
    nesreca: allData.nesreca || {},
    vozilo: allData.vozilo || {},
    vozacOsiguranik,
    polica: allData.polica || {},
    osiguranje,
    opis: allData.opis || {},
    svjedoci: allData.svjedoci || { lista: [] },
    potpis: allData.potpis || {},
    slike: allData.slike || [],
  };

  // Upravljanje listom emailova osiguranika
  const initialEmails = singleEntries.length > 0
    ? singleEntries.map(p => p.vozacOsiguranik?.osiguranik?.mail_osiguranika).filter(Boolean)
    : (osiguranik?.mail_osiguranika ? [osiguranik.mail_osiguranika] : []);
  const [osiguraniciEmails, setOsiguraniciEmails] = useState(initialEmails);

  const handleEmailsChange = (newEmails) => {
    setOsiguraniciEmails(newEmails);
  };

  // Socket i stanje za double mode
  const [socketStatus, setSocketStatus] = useState({});
  const [role, setRole] = useState(sessionStorage.getItem("role") || "");
  const [canSend, setCanSend] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    if (mode !== "double") return;
    if (!sessionId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join-session", { sessionId });

    socket.on("role-assigned", ({ role }) => {
      setRole(role);
      sessionStorage.setItem("role", role);
    });

    socket.on("peer-status-update", (status) => {
      setSocketStatus(status || {});
      const bothConfirmed = status?.A?.confirmed && status?.B?.confirmed;
      setCanSend(Boolean(bothConfirmed));
    });

    socket.on("pdf-sent", () => {
      alert("PDF je uspješno poslan svim sudionicima!");
      sessionStorage.removeItem("fullData");
      sessionStorage.removeItem("single_entries");
      sessionStorage.removeItem("sessionId");
      navigate("/");
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, navigate, mode]);

  const handleConfirm = () => {
    socketRef.current?.emit("form-completed", { ...allDataMapped });
    socketRef.current?.emit("confirm-send-pdf");
  };

  const handleSend = async () => {
    if (osiguraniciEmails.length === 0) {
      alert("Niste unijeli barem jedan email osiguranika.");
      return;
    }
    try {
      const response = await fetch("/api/prijava", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify(allDataMapped),
      });
      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const respData = await response.json();
          let msg = response.statusText;
          if (respData?.error) msg = respData.error;
          throw new Error(msg);
        } else {
          const text = await response.text();
          throw new Error(text || response.statusText);
        }
      }
    } catch (err) {
      alert("Neuspjelo spremanje u bazu: " + err.message);
      console.error("Greška pri slanju podataka:", err);
      return;
    }
  };

  const handleBack = () => navigate(-1);

  // Za dvostruki workflow
  const canAddSecond = true;

  const handleNewParticipant = () => {
    sessionStorage.removeItem("fullData");
    sessionStorage.removeItem("fullFormStep");
    sessionStorage.removeItem("completedSteps");
    navigate("/");
  };

  const bothCompleted = socketStatus?.A?.completed && socketStatus?.B?.completed;
  const bothConfirmed = socketStatus?.A?.confirmed && socketStatus?.B?.confirmed;

  if (mode === "double") {
    if (!role)
      return (
        <div className="nesreca-container" style={{ padding: 32, textAlign: "center" }}>
          Učitavam status sudionika...
        </div>
      );
    return (
      <FinalnaPotvrdaDoubleForm
        allEntries={singleEntries}
        osiguranje={osiguranje}
        osiguraniciEmails={osiguraniciEmails}
        onEmailsChange={handleEmailsChange}
        onSend={handleSend}
        onBack={handleBack}
        onConfirm={handleConfirm}
        canAddSecond={canAddSecond}
        bothConfirmed={bothConfirmed}
        peerWaiting={!bothConfirmed && bothCompleted}
        disabledSend={!canSend}
        role={role}
        status={socketStatus}
      />
    );
  } else {
    return (
      <FinalnaPotvrdaSingleForm
        osiguranje={osiguranje}
        osiguranik={osiguranik}
        osiguraniciEmails={osiguraniciEmails}
        onEmailsChange={handleEmailsChange}
        prijavaData={allDataMapped}
        onSend={handleSend}
        onBack={handleBack}
        onNewParticipant={handleNewParticipant}
        disabledSend={false}
      />
    );
  }
};

export default FinalnaPotvrdaWrapper;
