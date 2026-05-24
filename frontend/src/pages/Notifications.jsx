import { useEffect, useMemo, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function Notifications() {
  const token = localStorage.getItem('token');
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(token);
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const doMarkRead = async (id) => {
    try {
      await markNotificationRead(token, id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const doMarkAll = async () => {
    try {
      await markAllNotificationsRead(token);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const counts = useMemo(() => {
    const read = items.length - unreadCount;
    return { total: items.length, unread: unreadCount, read: Math.max(0, read) };
  }, [items, unreadCount]);

  const pillClass = (type) => {
    if (type === 'highRisk' || type === 'riskAlert') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (type === 'appointmentRequest') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (type === 'appointmentApproved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (type === 'reportReviewed') return 'bg-sky-100 text-sky-700 border-sky-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const typeLabel = (type) => {
    if (!type) return 'Update';
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Notifications Center</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Stay updated on risk alerts, report reviews, and appointments.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm w-full md:w-auto">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
              <div className="font-bold text-slate-800">{counts.total}</div>
              <div className="text-slate-500">Total</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
              <div className="font-bold text-rose-700">{counts.unread}</div>
              <div className="text-rose-700/80">Unread</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <div className="font-bold text-emerald-700">{counts.read}</div>
              <div className="text-emerald-700/80">Read</div>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <button
              onClick={doMarkAll}
              disabled={counts.unread === 0}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              You are all caught up. No notifications yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((n) => (
                <li
                  key={n._id}
                  className={`rounded-xl border p-4 transition ${n.read
                    ? 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50'
                    : 'border-teal-200 bg-teal-50/70 shadow-sm dark:border-teal-700 dark:bg-teal-950/20'}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${pillClass(n.type)}`}>
                          {typeLabel(n.type)}
                        </span>
                        {!n.read && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
                      </div>
                      <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{n.message}</div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => doMarkRead(n._id)}
                        className="shrink-0 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
