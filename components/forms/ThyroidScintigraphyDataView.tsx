import React from 'react';
import { ThyroidScintigraphyData } from '../../types';

interface ThyroidScintigraphyDataViewProps {
  data: ThyroidScintigraphyData;
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

export const ThyroidScintigraphyDataView: React.FC<ThyroidScintigraphyDataViewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-700">Données - Scintigraphie Thyroïdienne</h3>
      
      <DetailSection title="En-tête & Examen Clinique">
          <DetailItem label="Date Fiche" value={data.formDate} />
          <DetailItem label="Paiement" value={data.paymentMethod} />
          <DetailItem label="Médecin Réf." value={data.referringDoctor} />
          <DetailItem label="Service Réf." value={data.referringService} />
          <DetailItem label="Examinateur" value={data.examiner} />
          <hr className="my-2"/>
          <DetailItem label="Poids/Taille" value={data.clinicalExam?.weight && data.clinicalExam?.height ? `${data.clinicalExam.weight}kg / ${data.clinicalExam.height}cm` : ''} />
          <DetailItem label="TA / Pouls" value={data.clinicalExam?.ta && data.clinicalExam?.pulse ? `${data.clinicalExam.ta} / ${data.clinicalExam.pulse}` : ''} />
          <DetailItem label="Ménopause" value={data.clinicalExam?.isMenopausal} />
          <DetailItem label="Allaitement" value={data.clinicalExam?.isBreastfeeding} />
          <DetailItem label="Risque Grossesse" value={data.clinicalExam?.isPregnancyRisk} />
          <DetailItem label="Exophtalmie" value={data.clinicalExam?.hasExophthalmia} />
          <DetailItem label="Tuméfaction Cervicale" value={data.clinicalExam?.hasAnteriorCervicalSwelling} />
          <DetailItem label="Autres Infos Cliniques" value={data.clinicalExam?.otherClinicalInfo} />
      </DetailSection>

      <DetailSection title="Anamnèse">
          <p className="font-medium text-slate-500 text-sm">Indication:</p>
          <div className="pl-4">
            <DetailItem label="Hyperthyroïdie" value={data.indication?.isHyperthyroidism} />
            <DetailItem label="Hyperthyroïdie + Nodule" value={data.indication?.isHyperthyroidismNodule} />
            <DetailItem label="Basedow" value={data.indication?.isBasedow} />
            {/* Add other indications as needed */}
          </div>
           <hr className="my-2"/>
          <p className="font-medium text-slate-500 text-sm">Antécédents:</p>
           <div className="pl-4">
            <DetailItem label="Chirurgie thyroïdienne" value={data.antecedents?.hasThyroidSurgery} />
            <DetailItem label="Radiothérapie cervicale" value={data.antecedents?.hasCervicalRadiotherapy} />
            <DetailItem label="Biopsie / Cytoponction" value={data.antecedents?.biopsyCytopunction} />
          </div>
      </DetailSection>

      <DetailSection title="Biologie & Traitements">
          <DetailItem label="TSHus" value={data.laboratory?.tshus} />
          <DetailItem label="T3L / T4L" value={data.laboratory?.t3l && data.laboratory?.t4l ? `${data.laboratory.t3l} / ${data.laboratory.t4l}`: ''} />
          <DetailItem label="Ac anti-TPO" value={data.laboratory?.acAntiTPO} />
           <hr className="my-2"/>
          <DetailItem label="Traitement ATS en cours" value={data.treatment?.ongoingATS} />
          <DetailItem label="Traitement Hormone en cours" value={data.treatment?.ongoingHormone} />
          <DetailItem label="Ant. Irathérapie" value={data.treatment?.previousIratherapy} />
      </DetailSection>

      <DetailSection title="Technique & Synthèse">
          <DetailItem label="Activité injectée" value={data.injectionDetails?.injectedActivity} />
          <DetailItem label="Heure injection" value={data.injectionDetails?.injectionTime} />
          <DetailItem label="Heure acquisition" value={data.acquisitions?.acquisitionTime} />
           <hr className="my-2"/>
          <DetailItem label="Analyse Contextuelle" value={data.contextualAnalysis} />
          <DetailItem label="Conclusion & Recommandation" value={data.conclusion} />
      </DetailSection>
    </div>
  );
};
