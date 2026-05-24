export default function RiskCards({ riskScore, status, trend, reasons = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
      
      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl">
        <h4 className="text-xl text-gray-500 dark:text-slate-300">Risk Score</h4>
        <p className="text-5xl font-bold text-teal-700 dark:text-teal-300">{riskScore ?? "--"}%</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl">
        <h4 className="text-xl text-gray-500 dark:text-slate-300">Status</h4>
        <p className="text-5xl font-bold text-green-600 dark:text-green-400">{status ?? "--"}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl">
        <h4 className="text-xl text-gray-500 dark:text-slate-300">Trend</h4>
        <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{trend ?? "--"}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl">
        <h4 className="text-xl text-gray-500 dark:text-slate-300">Main Reasons</h4>
        {reasons.length === 0 ? (
          <p className="text-gray-400 dark:text-slate-400 text-lg">No issues detected</p>
        ) : (
          <ul className="mt-2 space-y-1 text-red-600 dark:text-red-400 text-lg font-semibold">
            {reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
