import { useMemo, useState, useEffect } from 'react';
import { getMyAppointments, requestAppointment, getAvailability } from '../services/api';
import API from '../services/api';

export default function PatientAppointments() {
  const token = localStorage.getItem('token');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments(token);
      setAppointments(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/users/doctors', { headers: { Authorization: `Bearer ${token}` } });
      setDoctors(res.data);

      try {
        const me = JSON.parse(localStorage.getItem('user') || 'null');
        const preferred = me?.preferredDoctor?._id || me?.preferredDoctor || '';
        if (preferred && res.data.some((d) => d._id === preferred)) {
          setDoctorId(preferred);
        }
      } catch {
        // ignore malformed localStorage
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async (docId, d) => {
    if (!docId || !d) return setSlots([]);
    try {
      const res = await getAvailability(token, docId, d);
      setSlots(res.length ? res[0].slots : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSlots(doctorId, date);
  }, [doctorId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestAppointment(token, doctorId, date, time, reason);
      setDoctorId('');
      setDate('');
      setTime('');
      setReason('');
      setSlots([]);
      await fetchAppointments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to request appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.patch(`/appointments/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const counts = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const approved = appointments.filter((a) => a.status === 'approved').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    return { pending, approved, cancelled };
  }, [appointments]);

  const statusClass = (status) => {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Patient Appointments</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Book visits with your doctor and track request status in one place.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm w-full md:w-auto">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <div className="font-bold text-amber-700">{counts.pending}</div>
              <div className="text-amber-700/80">Pending</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <div className="font-bold text-emerald-700">{counts.approved}</div>
              <div className="text-emerald-700/80">Approved</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
              <div className="font-bold text-rose-700">{counts.cancelled}</div>
              <div className="text-rose-700/80">Cancelled</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Appointment</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Choose doctor, date, and time. Add reason to help doctor prepare.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Doctor</span>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Time</span>
                  {slots.length ? (
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    >
                      <option value="">Select slot</option>
                      {slots.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  )}
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Reason (optional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe symptoms or reason for consultation"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <button
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Requesting...' : 'Request Appointment'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming & Past</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Track approval status and manage existing bookings.</p>

            <div className="mt-5 space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  No appointments yet. Create your first request from the panel.
                </div>
              ) : (
                appointments.map((a) => (
                  <article key={a._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Dr. {a.doctor?.name || a.doctor}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.date} at {a.time}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{a.doctor?.email || ''}</div>
                        {a.reason ? <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">Reason: {a.reason}</div> : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(a.status)}`}>
                          {a.status}
                        </span>
                        {a.status !== 'cancelled' && (
                          <button className="text-xs font-semibold text-rose-600 hover:text-rose-700" onClick={() => handleCancel(a._id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
