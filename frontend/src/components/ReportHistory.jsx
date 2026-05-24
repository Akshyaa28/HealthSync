import { useEffect, useState } from "react";

export default function ReportHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/reports/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        /**
         * We map backend report format
         * into the SAME structure your UI already expects
         */
        const formattedHistory = data.map((r) => ({
          date: new Date(r.createdAt).toLocaleDateString(),
          risk: r.risk ?? "--",
          status: r.status === "High" ? "High Risk" : r.status === "Moderate" ? "Moderate Risk" : r.status === "Stable" ? "Healthy" : (r.status ?? "Uploaded"),
          reasons: r.reasons ?? [],
        }));

        setHistory(formattedHistory);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report history", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10">
      <h3 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-6">
        Report History
      </h3>

      {loading ? (
        <p className="text-gray-500 dark:text-slate-300 text-xl">Loading reports...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-300 text-xl">No reports yet</p>
      ) : (
        <table className="w-full text-lg">
          <thead>
            <tr className="text-gray-500 dark:text-slate-400">
              <th>Date</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Reasons</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h, i) => (
              <tr key={i} className="text-center border-t">
                <td className="dark:text-slate-200">{h.date}</td>
                <td className="dark:text-slate-200">{h.risk}%</td>
                <td className="font-bold text-teal-700 dark:text-teal-300">
                  {h.status}
                </td>
                <td className="text-gray-600 dark:text-slate-300">
                  {h.reasons?.length
                    ? h.reasons.join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
