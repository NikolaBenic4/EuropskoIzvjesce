// FullForm.js
import React, { useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import NesrecaForm from './NesrecaForm';
import SvjedociForm from './SvjedociForm';
import VozacOsiguranikForm from './VozacOsiguranikForm';
import VoziloForm from './VoziloForm';
import OpisForm from './OpisForm';
import OsiguravajuceDrustvoForm from './OsiguravajuceDrustvoForm';
import PotpisForm from './PotpisForm';
import '../css/FullForm.css';

const stepTitles = [
  'Opće informacije',
  'Svjedoci',
  'Osiguranik i vozač',
  'Vozilo',
  'Opis nesreće',
  'Osiguranje i polica',
  'Potpis'
];

export default function FullForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});

  const next = partial => {
    setData(prev => ({ ...prev, ...partial }));
    setStep(s => Math.min(s + 1, stepTitles.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const forms = [
    <NesrecaForm
      key="nesreca"
      data={data}
      onNext={next}
      onBack={step > 0 ? prev : null}
    />,
    <SvjedociForm
      key="svjedoci"
      data={data}
      onNext={next}
      onBack={prev}
    />,
    <VozacOsiguranikForm
      key="vozacPolica"
      data={data}
      onNext={next}
      onBack={prev}
    />,
    <VoziloForm
      key="vozilo"
      data={data}
      onNext={next}
      onBack={prev}
    />,
    <OpisForm
      key="opis"
      data={data}
      onNext={next}
      onBack={prev}
    />,
    <OsiguravajuceDrustvoForm
      key="osiguranje"
      data={data}
      onNext={next}
      onBack={prev}
    />,
    <PotpisForm
      key="potpis"
      data={data}
      onNext={next}
      onBack={prev}
    />
  ];

  return (
    <div className="fullform-site">
      <div className="fullform-header">
        <ProgressBar currentStep={step} steps={stepTitles} />
        <h2 className="fullform-title">{stepTitles[step]}</h2>
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
