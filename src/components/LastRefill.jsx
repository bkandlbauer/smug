import React from 'react';

const LastRefill = ({ value, size = 250 }) => {

  return (
    <div
      className={`flex items-center justify-center rounded-full border-15 black select-none shadow-xl`}
      style={{ width: size, height: size }}>

      
      <div className='text-5xl font-bold '>
        {value} min<br/>
        <div className='text-2xl font-bold '>
          last refill.
        </div>
      </div>
      
    </div>
  );
};

export default LastRefill;
