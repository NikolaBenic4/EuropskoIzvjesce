import React from 'react';
import '../css/ProgressBar.css';

const ProgressBar = ({ currentStep, steps, onStepClick, completedSteps }) => (
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
);

export default ProgressBar;
