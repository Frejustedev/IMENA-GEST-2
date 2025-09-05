import React from 'react';

export const AtomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 1a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1 -4 10a15.3 15.3 0 0 1 -4 -10a15.3 15.3 0 0 1 4 -10"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.5 8.5a15.3 15.3 0 0 1 8.5 0a15.3 15.3 0 0 1 8.5 0a15.3 15.3 0 0 1 -8.5 7a15.3 15.3 0 0 1 -8.5 -7"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.5 15.5a15.3 15.3 0 0 1 8.5 0a15.3 15.3 0 0 1 8.5 0a15.3 15.3 0 0 1 -8.5 -7a15.3 15.3 0 0 1 -8.5 7"
    />
  </svg>
);
