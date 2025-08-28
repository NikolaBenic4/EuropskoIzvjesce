import React from "react";
import CarPicture from "../assets/CarPicture.png";
import MotorbikePicture from "../assets/MotorbikePicture.png";
import TruckPicture from "../assets/TruckPicture.png";

const VEHICLE_CONFIG = {
  car: {
    points: [
      { id: "front_left", label: "Prednji lijevi" },
      { id: "front_center", label: "Prednji centar" },
      { id: "front_right", label: "Prednji desni" },
      { id: "side_left", label: "Lijeva strana" },
      { id: "side_right", label: "Desna strana" },
      { id: "back_left", label: "Stražnji lijevi" },
      { id: "back_center", label: "Stražnji centar" },
      { id: "back_right", label: "Stražnji desni" }
    ],
    arrowPositions: [
      { top: "15px", left: "55px", rotate: 90 },
      { top: "0px", left: "124px", rotate: 180 },
      { top: "15px", left: "195px", rotate: 270 },
      { top: "92px", left: "37px", rotate: 90 },
      { top: "92px", left: "211px", rotate: 270 },
      { top: "235px", left: "48px", rotate: 90 },
      { top: "255px", left: "124px", rotate: 0 },
      { top: "235px", left: "200px", rotate: 270 }
    ],
    image: CarPicture,
  },
  motorbike: {
    points: [
      { id: "front", label: "Prednji dio" },
      { id: "left", label: "Lijevi bok" },
      { id: "right", label: "Desni bok" },
      { id: "back", label: "Stražnji dio" }
    ],
    arrowPositions: [
      { top: "2px", left: "122px", rotate: 180 },    // Prednji dio
      { top: "80px", left: "70px", rotate: 90 },     // Lijevi bok
      { top: "80px", left: "175px", rotate: 270 },   // Desni bok
      { top: "225px", left: "122px", rotate: 0 },    // Stražnji dio
    ],
    image: MotorbikePicture,
  },
  truck: {
    points: [
      { id: "cab_front", label: "Kabina prednji" },
      { id: "cab_left", label: "Kabina lijevi" },
      { id: "cab_right", label: "Kabina desni" },
      { id: "side_left", label: "Lijeva strana sanduka" },
      { id: "side_right", label: "Desna strana sanduka" },
      { id: "back", label: "Stražnji dio sanduka" }
    ],
    arrowPositions: [
      { top: "2px", left: "122px", rotate: 180 },     // Kabina prednji
      { top: "55px", left: "30px", rotate: 90 },      // Kabina lijevi
      { top: "55px", left: "212px", rotate: 270 },    // Kabina desni
      { top: "200px", left: "30px", rotate: 90 },     // Lijeva strana sanduka
      { top: "200px", left: "212px", rotate: 270 },   // Desna strana sanduka
      { top: "225px", left: "122px", rotate: 0 },     // Stražnji dio sanduka
    ],
    image: TruckPicture,
  }
};

const Arrow = ({ top, left, rotate = 0 }) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 32 32"
    style={{
      position: "absolute",
      top,
      left,
      zIndex: 5,
      pointerEvents: "none",
      transform: `rotate(${rotate}deg)`
    }}
  >
    <polygon points="16,4 28,28 16,22 4,28" fill="red" stroke="red" />
  </svg>
);

const MjestoUdarcaVozilo = ({
  vehicleType = "car",
  selectedPoints,
  onChange,
  onVehicleTypeChange
}) => {
  const { points, arrowPositions, image } = VEHICLE_CONFIG[vehicleType];

  const handleCheckbox = (e) => {
    const { checked, value } = e.target;
    onChange(
      checked
        ? [...selectedPoints, value]
        : selectedPoints.filter((item) => item !== value)
    );
  };

  // Render only arrows where the matching .points.id is selected
  const visibleArrows = points.map((point, idx) =>
    selectedPoints.includes(point.id)
      ? <Arrow key={point.id} {...arrowPositions[idx]} />
      : null
  );

  return (
    <div className="form-group">
      <label className="form-label">Odaberi tip vozila</label>
      <select
        className="form-input"
        value={vehicleType}
        style={{ marginBottom: "18px", maxWidth: 220 }}
        onChange={e => onVehicleTypeChange(e.target.value)}
      >
        <option value="car">Automobil</option>
        <option value="motorbike">Motocikl</option>
        <option value="truck">Kamion</option>
      </select>
      <label className="form-label">Mjesto udarca oštećenja</label>
      <div className="car-imagebox">
        <div style={{
          position: "relative",
          width: "280px",
          height: "260px", // malo veće radi truck/motorbike
          margin: "0 auto"
        }}>
          <img
            src={image}
            alt={vehicleType}
            style={{ width: "280px", display: "block", margin: "0 auto" }}
          />
          {visibleArrows}
        </div>
        <br></br>
      </div>
      <div className="car-points-grid">
        {points.map((point) => (
          <label key={point.id} style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "6px",
            whiteSpace: "normal",
            width: "100%"
          }}>
            <input
              type="checkbox"
              value={point.id}
              checked={selectedPoints.includes(point.id)}
              onChange={handleCheckbox}
              style={{ marginRight: "7px" }}
            />
            {point.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export { VEHICLE_CONFIG };
export default MjestoUdarcaVozilo;
