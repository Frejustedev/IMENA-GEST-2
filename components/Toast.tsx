import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

export interface ToastProps {
  id: number;
  message: string;
  type?: 'success' | 'error';
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type = 'success', onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
      const dismissTimer = setTimeout(() => onDismiss(id), 300); // Match animation duration
      return () => clearTimeout(dismissTimer);
    }, 4000); // 4 seconds visible

    return () => clearTimeout(exitTimer);
  }, [id, onDismiss]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const Icon = isSuccess ? CheckCircleIcon : ExclamationTriangleIcon;

  return (
    <div
      className={`
        flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor}
        transition-all duration-300 ease-in-out transform
        ${exiting ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'}
      `}
      role="alert"
    >
      <Icon className="h-6 w-6 mr-3" />
      <p className="font-medium">{message}</p>
      <button onClick={() => onDismiss(id)} className="ml-auto p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
