import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import "../css/OdabirForm.css";

const SOCKET_URL = "https://192.168.1.246:3001";

export default function OdabirForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [sessionId, setSessionId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [role, setRole] = useState(null);  // Stanje uloge korisnika
  const socketRef = useRef();
  const joinedRef = useRef(false);

  // Postavljanje sessionId iz URL parametra pri mountu
  useEffect(() => {
    const urlParam = new URLSearchParams(search).get("session");
    if (urlParam) {
      setSessionId(urlParam);
    }
  }, [search]);

  // UseEffect za socket i automatski refresh nakon dolaska s QR koda
  useEffect(() => {
    if (!sessionId || joinedRef.current) return;

    const urlParam = new URLSearchParams(search).get("session");

    // Automatski refresh jednom, da se uspostavi ispravno stanje
    if (urlParam && !sessionStorage.getItem("hasRefreshed")) {
      sessionStorage.setItem("hasRefreshed", "true");
      window.location.reload();
      return;
    }

    joinedRef.current = true;
    setShowQR(!urlParam); // QR kod prikazuj samo ako nema session parametra
    setWaiting(true);

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join-session", { sessionId });

    socket.on("role-assigned", ({ role }) => {
      setRole(role);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("session_id", sessionId);
      sessionStorage.setItem("mode", "double");
      console.log(`Dodijeljena uloga: ${role}`);
    });

    socket.on("peer-joined", () => {
      console.log("peer-joined primljen za sessionId:", sessionId);
      setWaiting(false);
      // Navigacija oba klijenta na formu
      navigate(`/izvjesce?session=${sessionId}`, { replace: true });
    });

    socket.on("session-full", () => {
      alert("Sesija je puna, može biti najviše 2 sudionika.");
      // Opcionalno: reset ili redirect
    });

    return () => {
      socket.disconnect();
      joinedRef.current = false;
      setRole(null);
    };
  }, [sessionId, navigate, search]);

  // Cleanup prilikom unmounta
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      joinedRef.current = false;
      setRole(null);
    };
  }, []);

  // Single korisnik bez socket konekcije
  function handleOnePerson() {
    socketRef.current?.disconnect();
    sessionStorage.clear();
    const id = uuidv4();
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "single");
    sessionStorage.setItem("role", "A");
    navigate("/izvjesce");
  }

  // Pokretanje dvostruke sesije: generiranje sessionId i prikaz QR koda
  function handleTwoPersons() {
    sessionStorage.clear();
    const id = uuidv4();
    setSessionId(id);
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "double");
    // Uloga se dodjeljuje preko role-assigned eventa
    setShowQR(true);
    setWaiting(true);
  }

  const joinUrl = `${window.location.origin}/izvjesce?session=${sessionId}`;

  return (
    <div className="odabir-container">
      <div className="odabir-card">
        <h2 className="odabir-title">Odaberite način unosa</h2>
        <p className="odabir-desc">
          Unos kao pojedinac ili dvostruki unos pomoću QR koda.
        </p>
        <div className="odabir-section">
          <button className="odabir-button" onClick={handleOnePerson}>
            Unos kao pojedinac
          </button>
          <button className="odabir-button" onClick={handleTwoPersons}>
            Dvostruki unos
          </button>
        </div>
        {showQR && sessionId && (
          <div className="odabir-section">
            <p>Skenirajte ovaj QR kod kao drugi sudionik:</p>
            <QRCodeSVG value={joinUrl} size={180} />
            <p className="odabir-desc" style={{ wordBreak: "break-all", marginTop: 8 }}>
              {joinUrl}
            </p>
            {waiting && <p style={{ color: "#298", marginTop: 8 }}>Čekam drugog sudionika…</p>}
            {role && <p>Vaša uloga je: {role}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
