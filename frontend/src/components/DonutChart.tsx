interface Slice {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  total: number;
  classified: number;
  needsReview: number;
}

export default function DonutChart({ total, classified, needsReview }: DonutChartProps) {
  const other = Math.max(0, total - classified - needsReview);
  const pct = total > 0 ? Math.round((classified / total) * 100) : 0;

  const slices: Slice[] = [
    { label: "Classified", count: classified, color: "#f59e0b" },
    { label: "Needs Review", count: needsReview, color: "#ef4444" },
    { label: "Other", count: other, color: "#57534e" },
  ].filter(s => s.count > 0);

  let cumAngle = 0;
  const paths = total > 0 ? slices.map(s => {
    const angle = (s.count / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(rad(startAngle));
    const y1 = 50 + 40 * Math.sin(rad(startAngle));
    const x2 = 50 + 40 * Math.cos(rad(startAngle + angle));
    const y2 = 50 + 40 * Math.sin(rad(startAngle + angle));
    const large = angle > 180 ? 1 : 0;
    const d = angle >= 359.9
      ? "M50,10 A40,40 0 1,1 49.99,10 Z"
      : `M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A40,40 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    return { d, color: s.color };
  }) : [];

  return (
    <div className="flex-shrink-0">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" className="stroke-stone-200 dark:stroke-stone-700" strokeWidth="2" />
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} opacity="0.9" />
          ))}
          <circle cx="50" cy="50" r="22" className="fill-white dark:fill-stone-800" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-stone-800">{pct}%</span>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-stone-500">{s.label}</span>
            <span className="ml-auto font-mono text-stone-600">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
