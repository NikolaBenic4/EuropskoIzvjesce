import React from 'react';
import '../css/ProgressBar.css';

export default function ProgressBar({ currentStep, steps }) {
  return (
    <div className="progressbar-container">
      {steps.map((_, index) => (
        <div
          key={index}
          className={`progress-step ${index <= currentStep ? 'active' : ''}`}
        >
          <div className="step-number">{index + 1}</div>
        </div>
      ))}
    </div>
  );
}
