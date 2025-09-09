import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaForm from "../pages/FinalnaPotvrdaForm";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

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
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://localhost:3001"; // prilagodi prema potrebi

const FinalnaPotvrdaWrapper = () => {
  const navigate = useNavigate();

  // Dohvati podatke iz sessionStorage
  const allData = JSON.parse(sessionStorage.getItem("fullData") || "{}");

  // --- Osiguranje: mapiranje na polja baze -----
  const osiguranje = canonicalOsiguranje(allData.osiguranje);
  // ---------------------------------------------

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

  // 3. Transformacija vozacOsiguranik (merge, prioritet potpis forme)
  const vozacOsiguranikSrc = allData.vozacOsiguranik || {};
  let vozacOsiguranik = flattenVozacOsiguranik(vozacOsiguranikSrc);

  if (allData.potpis) {
    if (allData.potpis.iban_osiguranika) vozacOsiguranik.iban_osiguranika = allData.potpis.iban_osiguranika;
    if (allData.potpis.potpis) vozacOsiguranik.potpis = allData.potpis.potpis;
    if (allData.potpis.datum_potpisa) vozacOsiguranik.datum_potpisa = allData.potpis.datum_potpisa;
    if (allData.potpis.banka) vozacOsiguranik.banka = allData.potpis.banka;
  }

  // Prikazni segment (za summary, nije za backend)
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

  // Zajamčeno root-level objekti, nema nested!
  let allDataMapped = {
    ...allData,
    vozacOsiguranik,
    osiguranje, // PRAVI FORMAT
  };
  if ("osiguranik" in allDataMapped.vozacOsiguranik) {
    delete allDataMapped.vozacOsiguranik.osiguranik;
  }
  if ("vozac" in allDataMapped.vozacOsiguranik) {
    delete allDataMapped.vozacOsiguranik.vozac;
  }

  // ---- STATE ZA DVOSTRUKI UNOS ----
  const [socketStatus, setSocketStatus] = useState({});
  const [role, setRole] = useState();
  const [canSend, setCanSend] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    // Socket conn only once!
    if (!sessionId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.emit("join-session", { sessionId });

    socket.on("role-assigned", ({ role }) => {
      setRole(role);
    });

    socket.on("peer-status-update", (status) => {
      setSocketStatus(status || {});
      const bothConfirmed = status?.A?.confirmed && status?.B?.confirmed;
      setCanSend(Boolean(bothConfirmed));
    });

    socket.on("pdf-sent", () => {
      alert("PDF je uspješno poslan svim sudionicima!");
      sessionStorage.removeItem("fullData");
      sessionStorage.removeItem("sessionId");
      navigate("/");
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, navigate]);

  // Potvrdi da si gotov (korisnik pritisne "Potvrdi završetak")
  const handleConfirm = () => {
    socketRef.current?.emit("form-completed", { ...allDataMapped });
    socketRef.current?.emit("confirm-send-pdf");
    // Poruka/prikaz možeš dodati po želji (npr. "čekamo drugog sudionika")
  };

  // POŠALJI (zove backend kad oba sudionika potvrde)
  const handleSend = async (mail) => {
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
    try {
      // Ovdje FE NE šalje PDF izravno, nego backend to radi nakon oba confirmed (vidi socket.io backend)
      // Ako i dalje želiš ručno poslati, ostavi ovo. Inače, makni i rely only on socket pdf-sent event.
      const responsePdf = await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify({ mail, data: allDataMapped }),
      });
      if (!responsePdf.ok) throw new Error(responsePdf.statusText);
      alert("Prijava uspješno poslana i PDF će stići na email!");
      sessionStorage.removeItem("fullData");
      sessionStorage.removeItem("sessionId");
      navigate("/");
    } catch (err) {
      alert("PDF nije kreiran: " + err.message);
      console.error("Greška pri generiranju/slanju PDF-a:", err);
    }
  };

  const handleBack = () => navigate(-1);

  const bothCompleted = socketStatus?.A?.completed && socketStatus?.B?.completed;
  const bothConfirmed = socketStatus?.A?.confirmed && socketStatus?.B?.confirmed;

  return (
    <FinalnaPotvrdaForm
      osiguranje={osiguranje}
      osiguranik={osiguranik}
      mailOsiguranika={osiguranik.mail_osiguranika}
      onSend={handleSend}
      onBack={handleBack}
      onConfirm={handleConfirm}
      canAddSecond={true}
      bothConfirmed={bothConfirmed}
      peerWaiting={!bothConfirmed && bothCompleted}
      disabledSend={!canSend}
      role={role}
      status={socketStatus}
    />
  );
};

export default FinalnaPotvrdaWrapper;
