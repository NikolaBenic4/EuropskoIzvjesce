import React, {useState} from 'react';
import NesrecaForm from './NesrecaForm';
import ProgressBar from '../components/ProgressBar';
import NesrecaForm from './NesrecaForm';
import SvjedociForm from './SvjedociForm';
import VozacPolicaForm from './VozacPolicaForm';
import VoziloForm from './VoziloForm';
import OpisForm from './OpisForm';
import DruštvoForm from './DruštvoForm';
import PotpisForm from './PotpisForm';


export default function FullForm() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({});

    const next = partial => {
        setData(prev => ({ ...prev, ...partial }));
        setStep(s => s + 1 );
    };

    const prev = () => setStep(s => s - 1);

    const forms = [
        <NesrecaForm onNext={next} onBack={prev} data={data} />,
        <SvjedociForm   onNext={next} onBack={prev} data={data} />,
        <VozacPolicaForm onNext={next} onBack={prev} data={data} />,
        <VoziloForm     onNext={next} onBack={prev} data={data} />,
        <OpisForm       onNext={next} onBack={prev} data={data} />,
        <DruštvoForm    onNext={next} onBack={prev} data={data} />,
        <PotpisForm     onNext={next} onBack={prev} data={data} />
];

return(
    <div className="fullform-container">
        <ProgressBar currentStep={step} />
        {forms[step]}
    </div>
    );
}