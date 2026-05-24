import { useMemo, useState, useEffect } from "react";
import { getDoctorAppointments, approveOrRescheduleAppointment, setAvailability } from "../services/api";

export default function DoctorAppointments() {
  const token = localStorage.getItem("token");
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState("");
  const [slotsText, setSlotsText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await getDoctorAppointments(token);
      setAppointments(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveOrRescheduleAppointment(token, id);
      await fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async (id, d, t) => {
    try {
      await approveOrRescheduleAppointment(token, id, d, t);
      await fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetAvailability = async (e) => {
    e.preventDefault();
    if (!date || !slotsText) return;

    const slots = slotsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setLoading(true);
      await setAvailability(token, date, slots);
      setDate("");
      setSlotsText("");
      alert("Availability saved");
    } catch (err) {
      console.error(err);
      alert("Failed to set availability");
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const pending = appointments.filter((a) => a.status === "pending").length;
    const approved = appointments.filter((a) => a.status === "approved").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total: appointments.length, pending, approved, cancelled };
  }, [appointments]);

  const statusClass = (status) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Doctor Appointments</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Approve, reschedule, and manage your available consultation slots.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <div className="text-xl font-bold text-slate-900">{counts.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-amber-700">{counts.pending}</div>
            <div className="text-xs text-amber-700/80">Pending</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{counts.approved}</div>
            <div className="text-xs text-emerald-700/80">Approved</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
            <div className="text-xl font-bold text-rose-700">{counts.cancelled}</div>
            <div className="text-xs text-rose-700/80">Cancelled</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appointment Queue</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Review patient requests and take actions quickly.</p>

            <div className="mt-5 space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  No appointment requests available.
                </div>
              ) : (
                appointments.map((a) => (
                  <article key={a._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.patient?.name || a.patient}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{a.patient?.email || ""}</div>
                        <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{a.date} at {a.time}</div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Reason: {a.reason || "-"}</div>
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(a.status)}`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.status === "pending" && (
                        <button
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                          onClick={() => handleApprove(a._id)}
                        >
                          Approve
                        </button>
                      )}

                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          const newDate = prompt("New date (YYYY-MM-DD)", a.date);
                          const newTime = prompt("New time (HH:MM)", a.time);
                          if (newDate && newTime) handleReschedule(a._id, newDate, newTime);
                        }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set Availability</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Enter date and comma-separated time slots, e.g. 09:00, 09:30, 10:00.</p>

            <form onSubmit={handleSetAvailability} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Date</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Slots</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={slotsText}
                  onChange={(e) => setSlotsText(e.target.value)}
                  placeholder="09:00, 09:30, 10:00"
                />
              </label>

              <button
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Availability"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
