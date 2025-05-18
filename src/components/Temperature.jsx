import React from 'react';

const Temperature = ({ value }) => {

  const getColor = (val) => {
    if (val > 90) return 'bg-red-700';
    if (val > 50) return 'bg-orange-600';
    return 'border-blue-700';
  };

  const bgColor = getColor(value);

  return (
    <div
      className={`flex items-center rounded-2xl justify-center ${bgColor} select-none shadow-xl`}
      style={{ width: 500, height: 100 }}>

      
      <div className='text-5xl font-bold text-white'>
        {value}° C
      </div>
      
    </div>
  );
};

export default Temperature;
