import React from 'react';

const steps = [
    'Opće informacije',
    'Svjedoci',
    'Vozač i osiguravatelj police',
    'Vozilo',
    'Opis nesreće',
    'Osiguravajuće društvo',
    'Potpis'
];

export default function ProgressBar({ currentStep }) {
    const percent = ((currentStep) / (steps.length - 1)) * 100;
    return (
        <div className="progress-container">
            <div className="progress-labels">
                {steps.map((label, i) => (
                    <span
                    key={i}
                    className={`progress-label ${i <= currentStep ? 'done': ''}`}
                    >{label}</span>
                ))}
            </div>
            <div className="progress-bar-background">
                <div
                className="progress-bar-foreground"ž
                style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
}