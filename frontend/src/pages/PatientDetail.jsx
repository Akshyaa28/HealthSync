import { useState, useEffect, useMemo } from "react";
import { getPatientDetails, generateAI } from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import DoctorAssistant from "../components/DoctorAssistant";

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await getPatientDetails(token, id);
        setData(res);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to load patient");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // Parse labs from report text
  const { labSeries, maxLeft, maxRight } = useMemo(() => {
    if (!data?.reports) return { labSeries: [], maxLeft: 0, maxRight: 0 };

    const parseHb = (text) => {
      if (!text) return null;
      const m = text.match(/(?:Hb|Hemoglobin)[:\s]*([0-9]+(?:\.[0-9]+)?)/i);
      return m ? parseFloat(m[1]) : null;
    };
    const parseSugar = (text) => {
      if (!text) return null;
      const m = text.match(/(?:Sugar|Glucose)[:\s]*([0-9]+(?:\.[0-9]+)?)/i);
      return m ? parseFloat(m[1]) : null;
    };
    const parseBPSystolic = (text) => {
      if (!text) return null;
      const m = text.match(/(?:Blood Pressure|BP)[:\s]*([0-9]{2,3})\/?([0-9]{2,3})?/i);
      return m ? parseInt(m[1], 10) : null;
    };

    const arr = data.reports.map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString(),
      hb: parseHb(r.text),
      sugar: parseSugar(r.text),
      bp: parseBPSystolic(r.text),
    }));

    const series = arr.reverse();

    // compute maxes for domains
    const leftVals = series.flatMap((s) => [s.hb, s.sugar].filter((v) => typeof v === 'number'));
    const rightVals = series.map((s) => s.bp).filter((v) => typeof v === 'number');

    const maxLeft = leftVals.length ? Math.ceil(Math.max(...leftVals) * 1.2) : null;
    const maxRight = rightVals.length ? Math.ceil(Math.max(...rightVals) * 1.2) : null;

    return { labSeries: series, maxLeft, maxRight };
  }, [data]);

  // Construct simple heuristic summary (fallback) and also try AI
  useEffect(() => {
    const gen = async () => {
      if (!data) return;
      // heuristic
      const latest = data.reports[0];
      const reasons = (latest?.reasons || []).slice(0, 5).join(', ') || latest?.summary || 'No notable findings';
      const heuristic = `Recent risk: ${latest?.risk ?? 'N/A'} pts. Key factors: ${reasons}. Trends: ${data.reports.length} reports available.`;
      setAiSummary(heuristic);

      // Call AI endpoint for richer explanation (best-effort)
      setLoadingAi(true);
      try {
        const prompt = `Provide a concise clinical-style explanation of patient's risk based on these reports. Reports (latest first): ${data.reports
          .slice(0, 6)
          .map((r) => `${new Date(r.createdAt).toLocaleDateString()}: risk ${r.risk} pts; reasons: ${r.reasons?.join(', ') || r.summary}`)
          .join(' || ')}.`;

        const latest = data.reports?.[0];
        const ai = await generateAI(
          prompt,
          {
            riskScore: latest?.risk ?? null,
            status: latest?.status ?? null,
            reasons: latest?.reasons ?? []
          },
          id
        );
        if (ai?.answer) setAiSummary(ai.answer);
      } catch (e) {
        console.warn('AI explanation unavailable', e?.message || e);
      } finally {
        setLoadingAi(false);
      }
    };
    gen();
  }, [data, id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-sky-100 dark:bg-slate-900">
      <div className="h-13" />

      <div className="px-16 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-teal-700">Patient Details</h1>
            <p className="text-sm text-gray-500">Read-only view for doctors</p>
          </div>
          <div>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-full border">Back</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="text-xl font-semibold">{data?.user?.name || '—'}</div>
            <div className="text-sm text-gray-500 mb-3">{data?.user?.email || '—'}</div>
            <div className="text-sm text-gray-600">Joined: {data?.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : '—'}</div>
            <div className="mt-4 text-sm text-gray-700">Role: Patient</div>
          </div>

          <div className="col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-2xl font-semibold mb-3">AI Risk Explanation</h3>
            <div className="text-sm text-gray-700 mb-2">{loadingAi ? 'Generating explanation...' : aiSummary}</div>
          </div>

          {/* Doctor AI Assistant (visible to doctors) */}
          {JSON.parse(localStorage.getItem('user') || 'null')?.role === 'doctor' && (
            <div className="col-span-3">
              <DoctorAssistant patientId={id} />
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="mt-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-semibold mb-4">Lab Value Timeline</h3>
          {labSeries.length === 0 ? (
            <div className="text-gray-500">No lab values found in reports.</div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={labSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={[0, maxLeft || 'auto']} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, maxRight || 'auto']} />
                  <Tooltip />
                  <Legend />

                  <Line yAxisId="left" type="monotone" dataKey="hb" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Hb (g/dL)" />
                  <Line yAxisId="left" type="monotone" dataKey="sugar" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Sugar (mg/dL)" />
                  <Line yAxisId="right" type="monotone" dataKey="bp" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="BP Systolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Reports list with PDF preview (if available) */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Uploaded Reports</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : data?.reports?.length === 0 ? (
              <div className="text-gray-500">No reports available</div>
            ) : (
              data.reports.map((r) => (
                <div key={r._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{r.status} — {r.risk} pts</div>
                      <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="text-sm text-gray-700 mt-2">{r.summary}</div>
                      <div className="text-xs text-gray-500 mt-1">Reasons: {(r.reasons || []).join(', ')}</div>
                    </div>

                    <div className="w-64">
                      {r.pdfUrl ? (
                        <iframe title={`report-${r._id}`} src={r.pdfUrl} className="w-full h-48" />
                      ) : (
                        <div className="w-full h-48 bg-gray-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm text-gray-500">PDF preview not available</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
