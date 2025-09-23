import React, { useState } from 'react';
import '../css/Model3DViewer.css';

export default function Model3DViewer({ images }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [error, setError] = useState('');

  const generate3DModel = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch('/api/generate-3d-model', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images: images.map(img => img.podatak_slike) })
      });

      if (!response.ok) {
        throw new Error('Greška pri generiranju 3D modela');
      }

      const data = await response.json();
      setModelUrl(data.modelUrl);
    } catch (error) {
      setError('Greška pri generiranju 3D modela: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="model-3d-viewer">
      <div className="viewer-header">
        <h3>3D prikaz nesreće</h3>
        <button 
          onClick={generate3DModel}
          disabled={isGenerating || !images || images.length < 3}
          className="generate-btn"
        >
          {isGenerating ? 'Generiram...' : 'Generiraj 3D model'}
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {!images || images.length < 3 ? (
        <div className="insufficient-images">
          Potrebno je minimum 3 slike za generiranje 3D modela.
        </div>
      ) : modelUrl ? (
        <div className="model-container">
          <iframe 
            src={modelUrl}
            width="100%"
            height="500px"
            frameBorder="0"
            title="3D Model nesreće"
          />
        </div>
      ) : (
        <div className="no-model">
          Kliknite na "Generiraj 3D model" za stvaranje 3D prikaza nesreće.
        </div>
      )}
    </div>
  );
}