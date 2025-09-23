import React, { useState } from 'react';
import '../css/ImageGallery.css';

export default function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return <div className="no-images">Nema dostupnih slika.</div>;
  }

  const openModal = (index) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="image-gallery">
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="gallery-item"
            onClick={() => openModal(index)}
          >
            <img 
              src={`data:image/jpeg;base64,${image.podatak_slike}`} 
              alt={`Slika ${index + 1}`}
            />
            <div className="image-overlay">
              <span>Slika {index + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            
            <div className="image-container">
              <button className="nav-btn prev" onClick={prevImage}>‹</button>
              <img 
                src={`data:image/jpeg;base64,${images[currentIndex].podatak_slike}`}
                alt={`Slika ${currentIndex + 1}`}
              />
              <button className="nav-btn next" onClick={nextImage}>›</button>
            </div>

            <div className="image-info">
              <p>Slika {currentIndex + 1} od {images.length}</p>
              <p>Datum: {new Date(images[currentIndex].vrijeme_slikanja).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
