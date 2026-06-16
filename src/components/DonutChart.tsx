interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
  size?: number;
  thickness?: number;
}

export default function DonutChart({ segments, total, centerLabel, size = 200, thickness = 40 }: DonutChartProps) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativePercent = 0;
  const paths = segments.map(seg => {
    const percent = total > 0 ? seg.value / total : 0;
    const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    if (percent === 0) return null;
    if (percent >= 1) {
      return (
        <circle
          key={seg.label}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
        />
      );
    }

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    ].join(' ');

    return (
      <path
        key={seg.label}
        d={d}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1a1a2e" strokeWidth={thickness} />
      {paths}
      {centerLabel && (
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">
          {centerLabel}
        </text>
      )}
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="Inter, sans-serif">
        Total
      </text>
    </svg>
  );
}
