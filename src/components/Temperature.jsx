import React from 'react';

const Temperature = ({ value }) => {
  const getGradient = (val) => {
    if (val > 90) return 'from-red-600 to-red-800';
    if (val > 50) return 'from-orange-500 to-orange-700';
    return 'from-blue-600 to-blue-800';
  };

  const gradient = getGradient(value);

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} select-none shadow-xl`}
      style={{ width: 500, height: 100 }}
    >
      <div className="text-5xl font-bold text-white">
        {value}° C
      </div>
    </div>
  );
};

export default Temperature;
