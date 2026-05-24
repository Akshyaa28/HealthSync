import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  Label
} from "recharts";

export default function TrendChart({ result }) {
  const data = result
    ? [
        {
          name: "Current",
          risk: result.riskScore,
          status: result.status,
          reasons: result.reasons?.join(", ")
        }
      ]
    : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10">
      <h3 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-6">Risk Trend</h3>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          {/* Risk Zones */}
          <ReferenceArea y1={0} y2={39} fill="#dcfce7" />
          <ReferenceArea y1={40} y2={74} fill="#fef9c3" />
          <ReferenceArea y1={75} y2={100} fill="#fee2e2" />

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />

          <Tooltip
            contentStyle={{ borderRadius: 12 }}
            formatter={(value, name, props) => [
              `${value}%`,
              "Risk"
            ]}
            labelFormatter={() =>
              `Status: ${result.status}\nReasons: ${result.reasons?.join(", ")}`
            }
          />

          <Line
            type="monotone"
            dataKey="risk"
            stroke="#14b8a6"
            strokeWidth={4}
            dot={{ r: 10, strokeWidth: 3, fill: "#0f766e" }}
            activeDot={{ r: 14 }}
            animationDuration={1200}
          >
            <Label
              position="top"
              content={({ x, y }) => (
                <text
                  x={x}
                  y={y - 12}
                  fill="#0f766e"
                  fontSize={14}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {result.status}
                </text>
              )}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-lg text-slate-700 dark:text-slate-200">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-300 rounded-full"></span> Low Risk
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-yellow-300 rounded-full"></span> Moderate Risk
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-300 rounded-full"></span> High Risk
        </span>
      </div>
    </div>
  );
}
