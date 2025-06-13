import React from 'react';

const LastRefill = ({ value, size = 250 }) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-500 text-white shadow-2xl border-4 border-white`}
      style={{ width: size, height: size }}
    >

      <div
        className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white text-black shadow-inner"
      >
        <div className="text-4xl font-extrabold">{value} min</div>
        <div className="text-lg font-semibold uppercase tracking-wider">
          last refill
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-full animate-pulse border-4 border-gray-300 opacity-30"
        style={{ zIndex: -1 }}
      />
    </div>
  );
};

export default LastRefill;
