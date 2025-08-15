import React, { useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import NesrecaForm from './NesrecaForm';
import SvjedociForm from './SvjedociForm';
import VozacPolicaForm from './VozacPolicaForm';
import VoziloForm from './VoziloForm';
import OpisForm from './OpisForm';
import OsiguravajuceDrustvoForm from './OsiguravajuceDrustvoForm';
import PotpisForm from './PotpisForm';


// Define step titles
const stepTitles = [
  'Opće informacije',
  'Svjedoci',
  'Vozač & Polica',
  'Vozilo',
  'Opis nesreće',
  'Osiguranje',
  'Potpis'
];

export default function FullForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});

  // Next/Prev step navigation
  const next = (partial) => {
    setData(prev => ({ ...prev, ...partial }));
    setStep(s => Math.min(s + 1, stepTitles.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // List your forms in order
  const forms = [
    <NesrecaForm onNext={next} onBack={step > 0 ? prev : null} data={data} key={0} />,
    <SvjedociForm onNext={next} onBack={prev} data={data} key={1} />,
    <VozacPolicaForm onNext={next} onBack={prev} data={data} key={2} />,
    <VoziloForm onNext={next} onBack={prev} data={data} key={3} />,
    <OpisForm onNext={next} onBack={prev} data={data} key={4} />,
    <OsiguravajuceDrustvoForm onNext={next} onBack={prev} data={data} key={5} />,
    <PotpisForm onNext={next} onBack={prev} data={data} key={6} />,
  ];

  return (
    <div className="fullform-site" >
      <div className="fullform-header">
        {/* Progress tracker bar and current stage */}
        <ProgressBar currentStep={step} steps={stepTitles} />
        <h2 style={{ margin: "18px 0", color: "#005A9C" }}>
          {stepTitles[step]}
        </h2>
        <p className="fullform-desc">
          Korak {step + 1} od {stepTitles.length}
        </p>
      </div>
      <div className="fullform-content">
        {forms[step]}
      </div>
    </div>
  );
}
