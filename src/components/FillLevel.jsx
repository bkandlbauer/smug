import React from 'react';

const FillLevel = ({ value, size = 250 }) => {

  const getBorderColor = (val) => {
    if (val > 75) return 'border-green-700';
    if (val > 50) return 'border-yellow-600';
    return 'border-red-700';
  };

  const borderColorClass = getBorderColor(value);

  return (
    <div
      className={`flex items-center justify-center rounded-full border-15 ${borderColorClass} select-none shadow-xl`}
      style={{ width: size, height: size }}>

      
      <div className='text-5xl font-bold '>
        {value}%<br/>
        <div className='text-2xl font-bold '>
          filled.
        </div>
      </div>
      
    </div>
  );
};

export default FillLevel;
