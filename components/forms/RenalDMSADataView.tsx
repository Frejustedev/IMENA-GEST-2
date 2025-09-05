import React from 'react';
import { RenalDMSAScintigraphyData } from '../../types';

interface RenalDMSADataViewProps {
  data: RenalDMSAScintigraphyData;
}

const DetailSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 bg-slate-50 rounded-lg shadow-inner mb-4">
        <h4 className="text-md font-semibold text-sky-600 mb-2 border-b pb-1">{title}</h4>
        <div className="space-y-2 text-xs text-slate-600">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: any }> = ({ label, value }) => {
    if (value === undefined || value === null || value === '' || value === false) return null;
    const displayValue = typeof value === 'boolean' ? 'Oui' : String(value);
    return (
        <div>
            <span className="font-medium text-slate-500">{label}:</span>
            <span className="ml-2 whitespace-pre-wrap">{displayValue}</span>
        </div>
    );
};

export const RenalDMSADataView: React.FC<RenalDMSADataViewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-700">Données - Scintigraphie Rénale DMSA</h3>
      
      <DetailSection title="Infos & Clinique">
          <DetailItem label="Date Fiche" value={data.formDate} />
          <DetailItem label="Médecin Réf." value={data.referringDoctor} />
          <hr className="my-2"/>
          <DetailItem label="Poids/Taille" value={data.clinicalExam?.weight && data.clinicalExam?.height ? `${data.clinicalExam.weight}kg / ${data.clinicalExam.height}m` : ''} />
          <DetailItem label="Fièvre" value={data.clinicalExam?.appealSigns?.fever} />
          <DetailItem label="Dysurie" value={data.clinicalExam?.appealSigns?.dysuria} />
      </DetailSection>

       <DetailSection title="Anamnèse">
          <DetailItem label="Antécédents" value={data.antecedents} />
          <hr className="my-2"/>
          <p className="font-medium text-slate-500 text-sm">Indication:</p>
           <div className="pl-4">
             <DetailItem label="Anomalie Congénitale - Syndrome JPU" value={data.indication?.congenitalAnomaly?.jpuSyndrome} />
             <DetailItem label="Infection - PNA" value={data.indication?.infectionOrOther?.pna} />
             <DetailItem label="Évaluation Chirurgicale - Pré-op" value={data.indication?.surgicalEvaluation?.preOperative} />
          </div>
      </DetailSection>

      <DetailSection title="Biologie & Imagerie">
          <DetailItem label="Urée" value={data.laboratory?.urea} />
          <DetailItem label="Créatinine" value={data.laboratory?.creatinine} />
          <hr className="my-2"/>
          <DetailItem label="Echographie" value={data.imaging?.echography} />
      </DetailSection>

      <DetailSection title="Technique & Synthèse">
          <DetailItem label="Activité injectée" value={data.injectionDetails?.injectedActivity} />
          <DetailItem label="Délai Injection-Acquisition" value={data.acquisitions?.delayInjectionAcquisition} />
          <DetailItem label="SPECT" value={data.acquisitions?.spect} />
          <hr className="my-2"/>
          <DetailItem label="Conclusion & Recommandation" value={data.conclusion} />
      </DetailSection>
    </div>
  );
};
