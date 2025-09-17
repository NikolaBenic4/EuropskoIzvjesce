import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaSingleForm from "../pages/FinalnaPotvrdaSingleForm";
import FinalnaPotvrdaDoubleForm from "../pages/FinalnaPotvrdaDoubleForm";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

// Helper funkcije
const flattenVozacOsiguranik = (vozacOsiguranik) => ({
  ...(vozacOsiguranik.osiguranik || {}),
  ...(vozacOsiguranik.vozac || {}),
  isti: vozacOsiguranik.isti !== undefined ? vozacOsiguranik.isti : undefined,
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

  // Dohvat podataka i mode iz sessionStorage
  const allData = JSON.parse(sessionStorage.getItem("fullData") || "{}");
  const mode = sessionStorage.getItem("mode") || "single";
  const singleEntries = JSON.parse(sessionStorage.getItem("single_entries") || "[]");

  // Normalizacija podatka osiguranja
  const osiguranje = canonicalOsiguranje(allData.osiguranje);

  // Osiguravanje postojanja ID nesreće (UUID u single mode-u)
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

  // Normalizacija podataka o osiguraniku i vozaču
  const vozacOsiguranikSrc = allData.vozacOsiguranik || {};
  let vozacOsiguranik = flattenVozacOsiguranik(vozacOsiguranikSrc);

  // Ako postoji podatak iz potpis forme, koristi ih kao primarne
  if (allData.potpis) {
    if (allData.potpis.iban_osiguranika) vozacOsiguranik.iban_osiguranika = allData.potpis.iban_osiguranika;
    if (allData.potpis.potpis) vozacOsiguranik.potpis = allData.potpis.potpis;
    if (allData.potpis.datum_potpisa) vozacOsiguranik.datum_potpisa = allData.potpis.datum_potpisa;
    if (allData.potpis.banka) vozacOsiguranik.banka = allData.potpis.banka;
  }

  // Prikazni set podataka osiguranika za UI
  const osiguranik = {
    ime_osiguranika: vozacOsiguranik.ime_osiguranika || "",
    prezime_osiguranika: vozacOsiguranik.prezime_osiguranika || "",
    adresa_osiguranika: vozacOsiguranik.adresa_osiguranika || "",
    postanskibroj_osiguranika: vozacOsiguranik.postanskibroj_osiguranika || "",
    drzava_osiguranika: vozacOsiguranik.drzava_osiguranika || "",
    mail_osiguranika: vozacOsiguranik.mail_osiguranika || "",
    kontaktbroj_osiguranika: vozacOsiguranik.kontaktbroj_osiguranika || "",
    iban_osiguranika: vozacOsiguranik.iban_osiguranika || "",
  };

  // Finalni podatak za backend (nema nested osiguranik/vozac)
  let allDataMapped = {
    ...allData,
    vozacOsiguranik,
    osiguranje,
  };
  if ("osiguranik" in allDataMapped.vozacOsiguranik) delete allDataMapped.vozacOsiguranik.osiguranik;
  if ("vozac" in allDataMapped.vozacOsiguranik) delete allDataMapped.vozacOsiguranik.vozac;

  // Socket only for double mode
  const [socketStatus, setSocketStatus] = useState({});
  const [role, setRole] = useState(sessionStorage.getItem("role") || "");
  const [canSend, setCanSend] = useState(false);
  const socketRef = useRef();

  // Socket handling for double mode
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

  // Potvrda završetka za double unos
  const handleConfirm = () => {
    socketRef.current?.emit("form-completed", { ...allDataMapped });
    socketRef.current?.emit("confirm-send-pdf");
  };

  // Slanje podataka backendu
  const handleSend = async () => {
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
      const respData = await response.json();
      if (!response.ok) {
        let msg = response.statusText;
        if (respData?.error) msg = respData.error;
        throw new Error(msg);
      }
    } catch (err) {
      alert("Neuspjelo spremanje u bazu: " + err.message);
      console.error("Greška pri slanju podataka:", err);
      return;
    }
    // PDF šalje backend preko socket eventa nakon potvrde obje strane u double modu!
  };

  const handleBack = () => navigate(-1);

  // Za dvostruki workflow prikaži uvijek
  const canAddSecond = true;

  // Handler za novi unos u single mode-u
  const handleNewParticipant = () => {
    sessionStorage.removeItem("fullData");
    sessionStorage.removeItem("fullFormStep");
    sessionStorage.removeItem("completedSteps");
    // Ako imaš custom redirekciju na početak, koristi "/" ili početak forme
    navigate("/");
  };

  // Evaluacija statusa za double formu
  const bothCompleted = socketStatus?.A?.completed && socketStatus?.B?.completed;
  const bothConfirmed = socketStatus?.A?.confirmed && socketStatus?.B?.confirmed;

  if (mode === "double") {
    if (!role)
      return (
        <div className="nesreca-container" style={{ padding: 32, textAlign: "center" }}>
          Učitavam status sudionika...
        </div>
      );
    let sviEmailovi = [];
    if (Array.isArray(singleEntries)) {
      singleEntries.forEach((p) => {
        if (p?.vozacOsiguranik?.osiguranik?.mail_osiguranika)
          sviEmailovi.push(p.vozacOsiguranik.osiguranik.mail_osiguranika);
      });
      sviEmailovi = sviEmailovi.filter(Boolean);
    }
    return (
      <FinalnaPotvrdaDoubleForm
        allEntries={singleEntries}
        osiguranje={osiguranje}
        osiguraniciEmails={sviEmailovi}
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
        mailOsiguranika={osiguranik.mail_osiguranika}
        onSend={handleSend}
        onBack={handleBack}
        onNewParticipant={handleNewParticipant}
        onConfirm={() => {}}
        bothConfirmed={true}
        peerWaiting={false}
        disabledSend={false}
        role={role}
        status={{}}
      />
    );
  }
};

export default FinalnaPotvrdaWrapper;
