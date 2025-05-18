import React from 'react';

const FillLevel = ({ value, size = 250 }) => {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value > 75) return '#15803d';
    if (value > 50) return '#ca8a04';
    return '#b91c1c';
  };

  const rotation = 90 - (value / 100) * 180;
  const transform = `rotate(${rotation} ${size/2} ${size/2})`;

  return (
    <div className="relative flex items-center justify-center select-none shadow-xl rounded-full" style={{width: size, height: size}}>
      <svg width={size} height={size}>
        <circle stroke="#e5e7eb" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2}/>
        <circle stroke={getColor()} fill="transparent" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} 
          strokeDashoffset={offset} r={radius} cx={size/2} cy={size/2} transform={transform} style={{transition: 'stroke-dashoffset 0.5s ease'}}/>
      </svg>

      <div className="absolute text-center">
        <div className="text-5xl font-bold">{value}%</div>
        <div className="text-2xl font-bold">filled.</div>
      </div>
    </div>
  );
};

export default FillLevel;
