import React from 'react';

interface AmilcoLogoProps {
  className?: string;
  size?: number | string;
}

export const AmilcoLogo: React.FC<AmilcoLogoProps> = ({ className = 'w-9 h-9', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={`shrink-0 select-none shadow-sm rounded-xl overflow-hidden ${className}`}
      style={style}
      aria-label="Amilco Home Center Logo"
    >
      <defs>
        <clipPath id="amilco-squircle">
          <rect width="200" height="200" rx="38" ry="38" />
        </clipPath>
      </defs>

      {/* Red squircle background */}
      <g clipPath="url(#amilco-squircle)">
        <rect width="200" height="200" fill="#E60000" />
        
        {/* Top-left corner diagonal stripe */}
        <line x1="-15" y1="65" x2="65" y2="-15" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="square" />
        
        {/* House roof contour line */}
        <polyline
          points="-10,96 68,0 205,198"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Stylized slanted letter "A" with white outer boundary and charcoal fill */}
        <g transform="skewX(-10) translate(22, 2)">
          <path
            d="M 92,30 L 136,155 L 108,155 L 98,127 L 66,127 L 57,155 L 30,155 Z M 82,68 L 72,106 L 93,106 Z"
            fill="#222222"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          />
        </g>
      </g>
    </svg>
  );
};
