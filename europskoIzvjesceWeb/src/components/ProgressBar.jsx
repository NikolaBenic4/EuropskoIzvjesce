import React from 'react';
import '../css/ProgressBar.css';

const ProgressBar = ({
  currentStep,
  steps,
  onStepClick,
  completedSteps,
  role = "A"  // PRO-TIP: u FullForm proslijediti role={role}
}) => {
  // Sudionik label preuzet iz direktne role (A ili B), ne prema indexu/totalu
  const sudionikLabel = `Sudionik ${role}`;

  return (
    <div>
      <div className="progressbar-container">
        {steps.map((_, idx) => {
          const isClickable = completedSteps.includes(idx) || idx === currentStep;
          return (
            <div
              key={idx}
              className={`progress-step${idx === currentStep ? ' active' : ''}${idx < currentStep ? ' complete' : ''}`}
              onClick={() => isClickable && onStepClick && onStepClick(idx)}
              style={{ cursor: isClickable ? 'pointer' : 'default', opacity: isClickable ? 1 : 0.6 }}
            >
              <span className="step-number">{idx + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="participant-indicator">
        {sudionikLabel}
      </div>
    </div>
  );
};

export default ProgressBar;
