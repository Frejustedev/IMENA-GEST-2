
import React, { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { ReferringEntity, ReferringEntityType, Patient, ExamConfiguration, NewPatientData } from '../types';
import { calculateAge } from '../utils/dateUtils';
import { DynamicFormField } from './forms/DynamicFormField';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePatient: (
    patientData: NewPatientData,
    requestData: {
      requestedExam?: string;
      customFields?: { [key: string]: any };
    }
  ) => void;
  allPatients: Patient[];
  examConfigurations: ExamConfiguration[];
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onCreatePatient,
  allPatients,
  examConfigurations,
}) => {
  // Patient Identity State
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Referring Entity State
  const [refEntityType, setRefEntityType] = useState<ReferringEntityType>('doctor');
  const [refName, setRefName] = useState('');
  const [refContactNumber, setRefContactNumber] = useState('');
  const [refContactEmail, setRefContactEmail] = useState('');

  // Request Data State
  const [requestedExam, setRequestedExam] = useState('');
  const [customFields, setCustomFields] = useState<{ [key: string]: any }>({});
  
  // New state for optional request creation
  const [createRequestNow, setCreateRequestNow] = useState(true);
  
  // Duplicate Check State
  const [potentialDuplicates, setPotentialDuplicates] = useState<Patient[]>([]);

  const selectedExamConfig = examConfigurations.find(c => c.name === requestedExam);

  // Calculate age effect
  useEffect(() => {
    if (dateOfBirth) {
      setAge(calculateAge(dateOfBirth));
    } else {
      setAge(undefined);
    }
  }, [dateOfBirth]);
  
  // Duplicate check effect
  useEffect(() => {
    if (name.length > 2 || dateOfBirth) {
      const lowerCaseName = name.toLowerCase();
      const duplicates = allPatients.filter(p => {
        const nameMatch = lowerCaseName && p.name.toLowerCase().includes(lowerCaseName);
        const dobMatch = dateOfBirth && p.dateOfBirth === dateOfBirth;
        return (nameMatch && dobMatch) || (name.length > 3 && nameMatch) || (dateOfBirth && dobMatch);
      });
      setPotentialDuplicates(duplicates);
    } else {
      setPotentialDuplicates([]);
    }
  }, [name, dateOfBirth, allPatients]);
  
  // Reset custom fields when exam changes
  useEffect(() => {
    setCustomFields({});
  }, [requestedExam]);


  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }));
  };


  const clearForm = () => {
    setName(''); setDateOfBirth(''); setAddress(''); setPhone(''); setEmail('');
    setRefEntityType('doctor'); setRefName(''); setRefContactEmail(''); setRefContactNumber('');
    setRequestedExam('');
    setCustomFields({});
    setCreateRequestNow(true); // Reset checkbox to default
    setPotentialDuplicates([]);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !dateOfBirth) {
      alert("Le nom et la date de naissance sont obligatoires.");
      return;
    }
    if (createRequestNow && !requestedExam) {
      alert("L'examen demandé est obligatoire lorsque vous créez une demande.");
      return;
    }

    const referringEntity: ReferringEntity | undefined = refName 
      ? { type: refEntityType, name: refName, contactNumber: refContactNumber || undefined, contactEmail: refContactEmail || undefined }
      : undefined;
      
    const patientData: NewPatientData = { name, dateOfBirth, address: address || undefined, phone: phone || undefined, email: email || undefined, referringEntity };
    
    // Pass empty request data if the box is not checked
    const finalRequestData = createRequestNow ? { requestedExam, customFields } : {};
    
    onCreatePatient(patientData, finalRequestData);
    clearForm();
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
         role="dialog" aria-modal="true" aria-labelledby="create-patient-modal-title">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 id="create-patient-modal-title" className="text-xl font-semibold text-gray-800">Ajouter un patient</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow pr-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Info Column */}
            <div className="space-y-4">
              <fieldset className="border p-3 rounded-md">
                <legend className="text-md font-semibold px-1 text-slate-700">1. Identité du Patient</legend>
                <div>
                  <label htmlFor="name" className={commonLabelClass}>Nom et Prénom(s) <span className="text-red-500">*</span></label>
                  <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className={commonInputClass} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="dateOfBirth" className={commonLabelClass}>Date de Naissance <span className="text-red-500">*</span></label>
                    <input type="date" name="dateOfBirth" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={commonInputClass} required />
                  </div>
                  <div>
                    <label htmlFor="age" className={commonLabelClass}>Âge</label>
                    <input type="text" name="age" id="age" value={age !== undefined ? `${age} ans` : ''} className={`${commonInputClass} bg-gray-100`} readOnly />
                  </div>
                </div>
                {potentialDuplicates.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs">
                        <p className="font-semibold text-amber-700">Attention: Patient(s) similaire(s) trouvé(s) :</p>
                        <ul className="list-disc list-inside pl-2 text-amber-600">
                            {potentialDuplicates.map(p => <li key={p.id}>{p.name} (né le {p.dateOfBirth})</li>)}
                        </ul>
                    </div>
                )}
                <div className="mt-4">
                  <label htmlFor="address" className={commonLabelClass}>Adresse</label>
                  <input type="text" name="address" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className={commonInputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="phone" className={commonLabelClass}>Téléphone</label>
                    <input type="tel" name="phone" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={commonInputClass} />
                  </div>
                  <div>
                    <label htmlFor="email" className={commonLabelClass}>Email</label>
                    <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClass} />
                  </div>
                </div>
              </fieldset>

              <div className="flex items-center space-x-2 my-2 p-3 bg-slate-100 rounded-md border border-slate-200">
                  <input 
                      type="checkbox" 
                      id="createRequestNow" 
                      name="createRequestNow" 
                      checked={createRequestNow} 
                      onChange={(e) => setCreateRequestNow(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="createRequestNow" className="text-sm font-medium text-gray-800 select-none">
                      Créer une demande d'examen maintenant
                  </label>
              </div>
            </div>

            {/* Request Info Column */}
            <div className="space-y-4">
                {createRequestNow && (
                    <fieldset className="border p-3 rounded-md animate-fadeIn">
                        <legend className="text-md font-semibold px-1 text-slate-700">2. Détails de la Demande</legend>
                        <div>
                            <label htmlFor="requestedExam" className={commonLabelClass}>Examen demandé <span className="text-red-500">*</span></label>
                            <select name="requestedExam" id="requestedExam" value={requestedExam} onChange={e => setRequestedExam(e.target.value)} className={commonInputClass} required={createRequestNow}>
                                <option value="" disabled>Sélectionner un examen...</option>
                                {examConfigurations.map(exam => ( <option key={exam.id} value={exam.name}>{exam.name}</option>))}
                            </select>
                        </div>

                        {selectedExamConfig && (
                           <div className="space-y-3 mt-4 pt-3 border-t">
                             {/* FIX: Use selectedExamConfig.fields.request.map as fields is an object */}
                             {selectedExamConfig.fields.request.map(field => (
                                 <DynamicFormField
                                    key={field.id}
                                    field={field}
                                    value={customFields[field.id]}
                                    onChange={handleCustomFieldChange}
                                 />
                             ))}
                           </div>
                        )}
                    </fieldset>
                )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
              {createRequestNow ? "Créer Patient et Demande" : "Créer Patient"}
            </button>
          </div>
        </form>
         <style>{`
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
      </div>
    </div>
  );
};
