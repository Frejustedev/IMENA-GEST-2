import React from 'react';
import { ParathyroidScintigraphyData } from '../../types';

interface ParathyroidScintigraphyDataViewProps {
  data: ParathyroidScintigraphyData;
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

export const ParathyroidScintigraphyDataView: React.FC<ParathyroidScintigraphyDataViewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-700">Données - Scintigraphie Parathyroïdienne</h3>
      
      <DetailSection title="Infos & Clinique">
          <DetailItem label="Date Fiche" value={data.formDate} />
          <DetailItem label="Médecin Réf." value={data.referringDoctor} />
          <hr className="my-2"/>
          <DetailItem label="Poids/Taille" value={data.clinicalExam?.weight && data.clinicalExam?.height ? `${data.clinicalExam.weight}kg / ${data.clinicalExam.height}m` : ''} />
          <DetailItem label="Signes d'appel" value={data.clinicalExam?.appealSigns} />
      </DetailSection>

       <DetailSection title="Anamnèse">
          <p className="font-medium text-slate-500 text-sm">Indication:</p>
          <div className="pl-4">
             <DetailItem label="HPT I" value={data.indication?.hptI} />
             <DetailItem label="HPT II" value={data.indication?.hptII} />
             <DetailItem label="HPT III" value={data.indication?.hptIII} />
             <DetailItem label="Autres" value={data.indication?.others} />
          </div>
          <hr className="my-2"/>
          <DetailItem label="Antécédents Médicaux" value={data.antecedents?.medicalThyroidReins} />
          <DetailItem label="Antécédents Chirurgie" value={data.antecedents?.surgeryThyroidReinsDigestive} />
      </DetailSection>

      <DetailSection title="Biologie & Traitement">
          <DetailItem label="PTH" value={data.laboratory?.pth} />
          <DetailItem label="Calcémie" value={data.laboratory?.calcemia} />
          <DetailItem label="Vitamine D" value={data.laboratory?.vitaminD} />
          <hr className="my-2"/>
          <DetailItem label="Traitement ATS en cours" value={data.treatment?.ongoingATS} />
      </DetailSection>

      <DetailSection title="Technique & Synthèse">
          <DetailItem label="Activité MIBI injectée" value={data.injectionDetails?.mibiInjectedActivity} />
          <DetailItem label="Protocole" value={data.acquisitions?.protocolSubtraction ? 'Soustraction' : data.acquisitions?.protocolDoublePhase ? 'Double Phase' : 'N/A'} />
          <hr className="my-2"/>
          <DetailItem label="Conclusion & Recommandation" value={data.conclusion} />
      </DetailSection>
    </div>
  );
};
