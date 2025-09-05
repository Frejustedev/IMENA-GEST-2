import React from 'react';

export const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5a2.25 2.25 0 0 0-.659 1.591V19.5a2.25 2.25 0 0 0 2.25 2.25h10.818a2.25 2.25 0 0 0 2.25-2.25v-3.409a2.25 2.25 0 0 0-.659-1.591L15 10.409a2.25 2.25 0 0 1-.659-1.591V3.104a48.554 48.554 0 0 0-4.682 0Z"
    />
  </svg>
);