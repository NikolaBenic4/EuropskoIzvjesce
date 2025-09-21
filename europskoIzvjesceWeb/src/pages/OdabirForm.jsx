import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import "../css/OdabirForm.css";

const SOCKET_URL = "https://192.168.1.246:3001";

// Generira privremeni session ID
function generateSessionId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `session_${id}`;
}

export default function OdabirForm() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const [sessionId, setSessionId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [role, setRole] = useState(null);

  const socketRef = useRef();
  const navigatedRef = useRef(false);

  // Pokreće socket vezu i navigira na formu
  function startSocketAndNavigate(session) {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    setWaiting(true);

    socket.emit("join-session", { sessionId: session });

    socket.on("role-assigned", ({ role }) => {
      setRole(role);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("session_id", session);
      sessionStorage.setItem("mode", "double");
    });

    socket.on("peer-joined", () => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        setWaiting(false);
        navigate(`/izvjesce?session=${encodeURIComponent(session)}`, { replace: true });
      }
    });

    // fallbacks omitted for brevity...
  }

  // Na mount i promjenu URL parametra
  useEffect(() => {
    const sessionParam = new URLSearchParams(search).get("session");
    if (sessionParam) {
        // odmah generiraj socket i navigiraj na izvjesce
        setSessionId(sessionParam);
        sessionStorage.setItem("session_id", sessionParam);
        sessionStorage.setItem("mode", "double");

        // start socket
        const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
        socketRef.current = socket;
        setWaiting(true);
        socket.emit("join-session", { sessionId: sessionParam });
        socket.on("role-assigned", ({ role }) => {
        setRole(role);
        sessionStorage.setItem("role", role);
        });

        // odmah navigiraj formu za oba
        navigate(`/izvjesce?session=${encodeURIComponent(sessionParam)}`, { replace: true });
        return () => socket.disconnect();
    } else {
        // single mode logika...
        let sid = sessionStorage.getItem("session_id");
        if (!sid) {
        sid = generateSessionId();
        sessionStorage.setItem("session_id", sid);
        sessionStorage.setItem("mode", "single");
        sessionStorage.setItem("role", "A");
        setRole("A");
        } else {
        const storedRole = sessionStorage.getItem("role");
        if (storedRole) setRole(storedRole);
        }
        setSessionId(sid);
    }
    }, [search, navigate]);


  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function handleOnePerson() {
    const sid = sessionId;
    sessionStorage.clear();
    sessionStorage.setItem("session_id", sid);
    sessionStorage.setItem("mode", "single");
    sessionStorage.setItem("role", "A");
    setRole("A");
    navigate(`/izvjesce?session=${encodeURIComponent(sid)}`);
  }

  function handleTwoPersons() {
    const id = generateSessionId();
    setSessionId(id);
    sessionStorage.clear();
    sessionStorage.setItem("session_id", id);
    setShowQR(true);
    startSocketAndNavigate(id);
  }

  function cancelWaiting() {
    socketRef.current?.disconnect();
    setShowQR(false);
    setWaiting(false);
    setRole(null);
  }

  const joinUrl = `${window.location.origin}/odabir?session=${encodeURIComponent(sessionId)}`;

  return (
    <div className="odabir-card">
      <h2 className="odabir-title">Odaberite način unosa</h2>
      <p className="odabir-desc">
        Unos kao pojedinac ili dvostruki unos pomoću QR koda.
      </p>

      {!showQR && !search.includes("session") && (
        <div className="odabir-section">
          <button className="odabir-button" onClick={handleOnePerson}>
            Unos kao pojedinac
          </button>
          <button className="odabir-button" onClick={handleTwoPersons}>
            Dvostruki unos
          </button>
        </div>
      )}

      {showQR && (
        <div className="odabir-section">
          <p>Skenirajte ovaj QR kod kao drugi sudionik:</p>
          <QRCodeSVG value={joinUrl} size={180} />
          <p className="odabir-desc" style={{ wordBreak: "break-all", marginTop: 8 }}>
            {joinUrl}
          </p>
          {waiting && (
            <p style={{ color: "#298", marginTop: 8 }}>
              Čekam da se oba uređaja spoje...
            </p>
          )}
          {role && (
            <p style={{ color: "#007bff", marginTop: 8 }}>
              Vi ste sudionik {role}.
            </p>
          )}
          <button
            className="odabir-button"
            onClick={cancelWaiting}
            style={{ backgroundColor: "#dc3545", marginTop: "10px" }}
          >
            Prekini čekanje
          </button>
        </div>
      )}
    </div>
  );
}
