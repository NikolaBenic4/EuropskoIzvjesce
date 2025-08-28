import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!scannerRef.current) return;

    html5QrCodeRef.current = new Html5Qrcode("qr-scanner");
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        onScan(decodedText);
        html5QrCodeRef.current.stop();
      },
      (error) => {
        setCameraError(error);
      }
    ).catch((err) => {
      setCameraError("Pokretanje skenera nije uspjelo: " + err);
    });

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        Html5Qrcode.getCameras && Html5Qrcode.getCameras();
      }
    };
  }, [onScan]);

  return (
    <div>
      <div id="qr-scanner" ref={scannerRef} style={{ width: '100%', minHeight: '240px', marginBottom: '1rem' }} />
      {cameraError && (
        <div style={{ color: "red", marginBottom: 10 }}>{cameraError}</div>
      )}
      <button type="button" className="submit-button" onClick={onClose}>
        Zatvori skener
      </button>
      <div style={{fontSize:"0.95rem",color:"#666",marginTop:"8px"}}>
        ⚠️ Za korištenje kamere koristi HTTPS, dozvoli pristup kameri i koristi službeni browser!
      </div>
    </div>
  );
}
