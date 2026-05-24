import { useState, useEffect, useMemo } from "react";
import { getPatients } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getPatients(token, "risk");
        setPatients(data || []);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const badgeFor = (level) => {
    if (level === "High") return "bg-rose-100 text-rose-700 border-rose-200";
    if (level === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const stats = useMemo(() => {
    const high = patients.filter((p) => p.riskLevel === "High").length;
    const medium = patients.filter((p) => p.riskLevel === "Medium").length;
    const normal = Math.max(0, patients.length - high - medium);
    return { total: patients.length, high, medium, normal };
  }, [patients]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Doctor Dashboard</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Risk-prioritized patient queue with quick clinical navigation.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/doctor/analytics")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Analytics
            </button>
            <button
              onClick={() => navigate("/doctor/appointments")}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700"
            >
              Manage Appointments
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <div className="text-xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Patients</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-rose-700">{stats.high}</div>
            <div className="text-xs text-rose-700/80">High Risk</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-amber-700">{stats.medium}</div>
            <div className="text-xs text-amber-700/80">Medium Risk</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{stats.normal}</div>
            <div className="text-xs text-emerald-700/80">Lower Risk</div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Patient Risk Queue</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">Sorted by risk priority</span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Loading patient list...
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              No patients available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-auto">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Risk Level</th>
                    <th className="pb-3 font-semibold">Primary Reason</th>
                    <th className="pb-3 font-semibold">Last Report</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 align-top dark:border-slate-700">
                      <td className="py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{p.email}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeFor(p.riskLevel)}`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-600 dark:text-slate-300">{p.reason || "-"}</td>
                      <td className="py-4 text-sm text-slate-600 dark:text-slate-300">
                        {p.lastReportDate ? new Date(p.lastReportDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate(`/doctor/patient/${p.id}`)}
                          className="rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-blue-700"
                        >
                          Open Patient
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
