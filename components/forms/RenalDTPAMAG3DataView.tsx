import React from 'react';
import { RenalDTPAMAG3ScintigraphyData } from '../../types';

interface RenalDTPAMAG3DataViewProps {
  data: RenalDTPAMAG3ScintigraphyData;
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

export const RenalDTPAMAG3DataView: React.FC<RenalDTPAMAG3DataViewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-700">Données - Scintigraphie Rénale DTPA/MAG3</h3>
      
      <DetailSection title="Infos & Clinique">
          <DetailItem label="Date Fiche" value={data.formDate} />
          <DetailItem label="Médecin Réf." value={data.referringDoctor} />
          <hr className="my-2"/>
          <DetailItem label="Poids/Taille" value={data.clinicalExam?.weight && data.clinicalExam?.height ? `${data.clinicalExam.weight}kg / ${data.clinicalExam.height}m` : ''} />
          <DetailItem label="Fièvre" value={data.clinicalExam?.fever} />
          <DetailItem label="Signes de déshydratation" value={data.clinicalExam?.dehydrationSigns} />
      </DetailSection>

       <DetailSection title="Anamnèse">
          <DetailItem label="Antécédents Anténataux" value={data.antecedents?.antenatal} />
          <DetailItem label="Antécédents Postnataux" value={data.antecedents?.postnatal} />
          <hr className="my-2"/>
          <p className="font-medium text-slate-500 text-sm">Indication:</p>
           <div className="pl-4">
             <DetailItem label="Anomalie Congénitale - Syndrome JPU" value={data.indication?.congenitalAnomaly?.jpuSyndrome} />
             <DetailItem label="Évaluation Chirurgicale - Test au captopril" value={data.indication?.surgicalEvaluation?.captoprilTest} />
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
          <DetailItem label="Acquisition Dynamique" value={data.acquisitions?.dynamicAcquisition} />
          <hr className="my-2"/>
          <DetailItem label="Autre Observation" value={data.otherObservation} />
          <DetailItem label="Conclusion & Recommandation" value={data.conclusion} />
      </DetailSection>
    </div>
  );
};
