import React from 'react';
import { ConfigurableField } from '../../types';

interface DynamicFormFieldProps {
  field: ConfigurableField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ field, value, onChange }) => {
  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentValue = Array.isArray(value) ? value : [];
    const newValue = checked 
      ? [...currentValue, option] 
      : currentValue.filter(item => item !== option);
    onChange(field.id, newValue);
  };

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label htmlFor={field.id} className={commonLabelClass}>{field.label}</label>
          <input
            type="text"
            id={field.id}
            name={field.id}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={commonInputClass}
          />
        </div>
      );
    case 'textarea':
      return (
        <div>
          <label htmlFor={field.id} className={commonLabelClass}>{field.label}</label>
          <textarea
            id={field.id}
            name={field.id}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={`${commonInputClass} min-h-[80px]`}
            rows={3}
          />
        </div>
      );
    case 'select':
      return (
        <div>
          <label htmlFor={field.id} className={commonLabelClass}>{field.label}</label>
          <select
            id={field.id}
            name={field.id}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={commonInputClass}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <fieldset>
          <legend className={commonLabelClass}>{field.label}</legend>
          <div className="mt-2 space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name={`${field.id}-${index}`}
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    default:
      return null;
  }
};