import React from 'react';
import { BoneScintigraphyData } from '../../types';

interface BoneScintigraphyDataViewProps {
  data: BoneScintigraphyData;
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

export const BoneScintigraphyDataView: React.FC<BoneScintigraphyDataViewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-700">Données - Scintigraphie Osseuse</h3>
      
      <DetailSection title="En-tête & Examen Clinique">
          <DetailItem label="Date Fiche" value={data.formDate} />
          <DetailItem label="Médecin Réf." value={data.referringDoctor} />
          <hr className="my-2"/>
          <DetailItem label="Poids/Taille" value={data.clinicalExam?.weight && data.clinicalExam?.height ? `${data.clinicalExam.weight}kg / ${data.clinicalExam.height}cm` : ''} />
          <DetailItem label="Ménopause" value={data.clinicalExam?.isMenopausal} />
          <DetailItem label="Allaitement" value={data.clinicalExam?.isBreastfeeding} />
          <DetailItem label="Signes d'appel" value={data.clinicalExam?.appealSigns} />
      </DetailSection>

       <DetailSection title="Anamnèse">
          <DetailItem label="Traumatisme" value={data.mskHistory?.trauma} />
          <DetailItem label="Chirurgie" value={data.mskHistory?.surgery} />
          <DetailItem label="HTA" value={data.otherHistoryAndLifestyle?.hta} />
          <DetailItem label="Diabète" value={data.otherHistoryAndLifestyle?.diabetes} />
      </DetailSection>

      <DetailSection title="Anatomo-Pathologie & Biologie">
          <DetailItem label="Taille Tumeur" value={data.anatomoPathology?.tumorSize} />
          <DetailItem label="Type Histologique" value={data.anatomoPathology?.histologicalType} />
          <hr className="my-2"/>
          <DetailItem label="PSA" value={data.laboratory?.psa} />
          <DetailItem label="CA15-3" value={data.laboratory?.ca15_3} />
          <DetailItem label="PAL" value={data.laboratory?.pal} />
      </DetailSection>

      <DetailSection title="Technique & Synthèse">
          <DetailItem label="Activité injectée" value={data.injectionDetails?.injectedActivity} />
          <DetailItem label="Heure injection" value={data.injectionDetails?.injectionTime} />
          <hr className="my-2"/>
          <DetailItem label="Analyse Contextuelle" value={data.contextualAnalysis} />
          <DetailItem label="Conclusion & Recommandation" value={data.conclusion} />
      </DetailSection>
    </div>
  );
};
