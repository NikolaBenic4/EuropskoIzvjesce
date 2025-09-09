import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import "../css/OdabirForm.css";

const SOCKET_URL = "https://192.168.1.246:3001";
const PROTOCOL = "https";
const LOCAL_DEV_IP = "192.168.1.246";
const LOCAL_DEV_PORT = 5173;

export default function OdabirForm() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const socketRef = useRef(null);
  const joinedRef = useRef(false);

  // * Novi: svaki odlazak sa stranice ubija socket
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        joinedRef.current = false;
      }
    };
  }, []);

  function handleOnePerson() {
    if (socketRef.current) socketRef.current.disconnect();
    sessionStorage.clear();
    localStorage.clear();
    const id = uuidv4();
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "single");
    sessionStorage.setItem("role", "A");
    setSessionId(id);
    navigate("/izvjesce");
  }

  function handleTwoPersons() {
    if (socketRef.current) socketRef.current.disconnect();
    sessionStorage.clear();
    localStorage.clear();
    const id = uuidv4();
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "double");
    setSessionId(id);
    setShowQR(true);
    setWaiting(true);
    joinedRef.current = false;
  }

  // Core: socket veza -- desktop A i mobitel B logika
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get("session");

    // B (mobitel) - automatski je na formi, upisuje u sessionStorage
    if (
      sessionParam &&
      window.location.pathname === "/izvjesce" &&
      !joinedRef.current
    ) {
      joinedRef.current = true;
      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.emit("join-session", { sessionId: sessionParam });

      socket.on("role-assigned", ({ role }) => {
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("session_id", sessionParam);
        sessionStorage.setItem("mode", "double");
        // Prevent redundant changes
        if (window.location.pathname + window.location.search !== `/izvjesce?session=${sessionParam}`) {
          navigate(`/izvjesce?session=${sessionParam}`);
        }
      });

      return () => socket.disconnect();
    }

    // A (desktop) - prikazuje QR, čeka peer-joined
    if (showQR && sessionId && !joinedRef.current) {
      joinedRef.current = true;
      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.emit("join-session", { sessionId });

      socket.on("role-assigned", ({ role }) => {
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("session_id", sessionId);
        sessionStorage.setItem("mode", "double");
      });

      socket.on("peer-joined", () => {
        setWaiting(false);
        // * OVDJE JE KLJUČ: desktop automatski ulazi u istu formu kao session!
        navigate(`/izvjesce?session=${sessionId}`);
      });

      return () => socket.disconnect();
    }
  }, [showQR, sessionId, navigate]);

  const joinUrl = sessionId
    ? `${PROTOCOL}://${LOCAL_DEV_IP}:${LOCAL_DEV_PORT}/izvjesce?session=${sessionId}`
    : "";

  return (
    <div className="odabir-container">
      <h2>Odaberite način ispunjavanja prijave štete</h2>
      <br />
      <div className="entry-explanation">
        <p>
          <strong>Unos kao pojedinac:</strong> možeš prijaviti štetu za sebe ili za sebe i drugog sudionika nesreće.<br /><br />
          <strong>Dvostruki unos (dvoje sudionika):</strong> Za korištenje dvostukog unosa, jedan sudionik treba kliknuti na "dvostruki unos", 
          a drugi skenirati QR kod koji se pokaže na ekranu. Zatim oba sudionika ispunjavaju formu koju će zajedno predati na kraju.
        </p>
      </div>
      <div className="vertical-buttons">
        <button className="submit-button" onClick={handleOnePerson}>Unos kao pojedinac</button>
        <button className="submit-button" onClick={handleTwoPersons}>Dvostruki unos</button>
      </div>
      {showQR && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p>Druga osoba neka skenira ovaj QR kod:</p>
          <br></br>
          {joinUrl && <QRCodeSVG value={joinUrl} size={180} />}
          <p style={{ wordBreak: "break-all", fontSize: "0.9em", marginTop: 16 }}>
            {joinUrl}
          </p>
          {waiting && <p style={{ color: "#298" }}>Čekam da druga osoba uđe...</p>}
        </div>
      )}
    </div>
  );
}
