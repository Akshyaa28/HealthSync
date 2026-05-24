import { useEffect, useState } from 'react';
import { getDoctorAnalytics } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function DoctorAnalytics() {
  const token = localStorage.getItem('token');
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDoctorAnalytics(token);
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [token]);

  if (!data) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-sky-100 dark:bg-slate-900">
      <div className="h-13" />

      <div className="px-16 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-teal-700 dark:text-teal-300">Doctor Analytics</h1>
            <p className="text-sm text-gray-500">Aggregated metrics for patient population</p>
          </div>
          <div>
            <button onClick={() => navigate('/doctor')} className="px-4 py-2 rounded bg-white dark:bg-slate-800 border">Back to dashboard</button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 dark:text-gray-300">Total Patients</div>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">{data.totalPatients}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 dark:text-gray-300">High-risk Patients</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{data.highRiskCount}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 dark:text-gray-300">Avg Recovery Delay</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{data.avgRecoveryDelayDays === null ? 'N/A' : data.avgRecoveryDelayDays + ' days'}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 dark:text-gray-300">Weekly High-Risk Trend</div>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{data.weekly.reduce((a,b)=>a+b.count,0)}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 dark:text-gray-300">Risk Breakdown</div>
            <div className="mt-2 flex items-center justify-center">
              <PieChart width={160} height={120}>
                <Pie data={[{name:'High', value: data.breakdown.high},{name:'Medium', value: data.breakdown.medium},{name:'Low', value: data.breakdown.low}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45}>
                  <Cell key="high" fill="#ef4444" />
                  <Cell key="medium" fill="#f59e0b" />
                  <Cell key="low" fill="#10b981" />
                </Pie>
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">H:{data.breakdown.high} • M:{data.breakdown.medium} • L:{data.breakdown.low}</div>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
          <h3 className="text-xl font-semibold mb-4 dark:text-white">High-risk patients (last 7 days)</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}