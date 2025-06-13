import React from 'react';

const FillLevel = ({ percentage, ml, mlMax, size = 250 }) => {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage > 75) return '#15803d'; // green
    if (percentage > 50) return '#ca8a04'; // yellow
    return '#b91c1c';                 // red
  };

  const rotation = 90 - (percentage / 100) * 180;
  const transform = `rotate(${rotation} ${size / 2} ${size / 2})`;

  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-500 text-white shadow-2xl border-4 border-white"
      style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full animate-pulse border-4 border-gray-300 opacity-30"
        style={{ zIndex: -1 }}/>

      <svg width={size} height={size} className="absolute">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={transform}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>


      <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white text-black shadow-inner text-center">
        <div className="text-4xl font-extrabold mt-5">{percentage}%</div>
        <div className="text-lg font-semibold uppercase tracking-wider">filled</div>
         <div className="text-sm font-semibold uppercase tracking-wider mt-1 text-gray-500">[{ml}/{mlMax} ml]</div>
      </div>
    </div>
  );
};

export default FillLevel;
