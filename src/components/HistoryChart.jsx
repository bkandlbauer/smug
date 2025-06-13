import React from 'react';

const sampleData = [
  { date: '2025-06-08', amount: 3.5 },
  { date: '2025-06-09', amount: 9.75 },
  { date: '2025-06-10', amount: 5.05 },
  { date: '2025-06-11', amount: 2.3 },
  { date: '2025-06-12', amount: 6.5 },
  { date: '2025-06-13', amount: 4.4 },
];

const HistoryChart = ({ data = sampleData, width = 600, height = 300 }) => {
  // Padding around chart area
  const padding = 40;

  // Calculate max amount for scaling
  const maxAmount = Math.max(...data.map(d => d.amount));

  // Width per bar
  const barWidth = (width - padding * 2) / data.length;

  return (
    <div >
    <h2 className="mt-1 text-4xl font-bold text-left mb-15 ml-10">Drinking History</h2>
    <svg width={width} height={height} >

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#333"
        strokeWidth="1.5"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
      />


      {data.map((d, i) => {
        // bar height relative to maxAmount
        const barHeight = ((d.amount / maxAmount) * (height - padding * 2));
        const x = padding + i * barWidth + barWidth * 0.1;
        const y = height - padding - barHeight - 1;

        return (
          <g key={d.date}>
            {barHeight > 0 && 
              (<rect
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                fill="#3b82f6"
                rx={2}
                ry={2}
              />
            )}

            {barHeight > 0 &&
              (<text
                x={x + barWidth * 0.4}
                y={y - 10}
                fontSize="16"
                fontWeight="500"
                fill="#3b82f6"
                textAnchor="middle"
              >
                {d.amount + " l"}
              </text>
            )}

            <text
              x={x + barWidth * 0.4}
              y={height - padding + 15}
              fontSize="10"
              fill="#333"
              textAnchor="middle"
            >
              {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          </g>
        );
      })}
    </svg>
    </div>
  );
};

export default HistoryChart;
