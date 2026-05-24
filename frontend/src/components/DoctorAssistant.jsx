import { useEffect, useState, useRef } from 'react';
import { getDoctorAssistant, postDoctorAssistant } from '../services/api';

function detectLanguage(text) {
  if (!text) return 'en';
  // Tamil unicode range detection
  if (/\u0B80-\u0BFF/.test(text) || /[\u0B80-\u0BFF]/.test(text)) return 'ta';
  const lower = text.toLowerCase();
  const tanglishHints = ['enna', 'sari', 'romba', 'nanri', 'unga', 'ungal', 'vaanga'];
  if (tanglishHints.some((w) => lower.includes(w))) return 'tanglish';
  return 'en';
}

export default function DoctorAssistant({ patientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const data = await getDoctorAssistant(token, patientId);
        setHistory(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const scrollToBottom = () => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  };

  // Parse simple markdown-style table from answer text (first table block found)
  const parseTable = (text) => {
    const lines = text.split('\n');
    let start = -1, end = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|')) {
        // find contiguous block
        let j = i;
        while (j < lines.length && lines[j].includes('|')) j++;
        if (j - i >= 2) {
          start = i; end = j; break;
        }
        i = j;
      }
    }
    if (start === -1) return null;

    const block = lines.slice(start, end);
    // remove separator lines (|---|---|)
    const filtered = block.filter(l => !/^\s*\|?\s*-+.*$/.test(l));
    if (filtered.length < 1) return null;
    const header = filtered[0].split('|').map(s => s.trim()).filter(Boolean);
    const rows = filtered.slice(1).map(r => r.split('|').map(s => s.trim()).filter(Boolean));
    const before = lines.slice(0, start).join('\n').trim();
    const after = lines.slice(end).join('\n').trim();
    return { header, rows, before, after };
  };

  const renderAnswer = (text) => {
    if (!text) return null;
    const tbl = parseTable(text);
    if (!tbl) return (<div className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{text}</div>);

    return (
      <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
        {tbl.before && <div className="mb-2 whitespace-pre-wrap">{tbl.before}</div>}
        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {tbl.header.map((h, i) => (
                  <th key={i} className="text-left border-b pb-1 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tbl.rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50' : ''}>
                  {r.map((c, ci) => (
                    <td key={ci} className="py-2 pr-3">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tbl.after && <div className="whitespace-pre-wrap">{tbl.after}</div>}
      </div>
    );
  };

  const onSend = async () => {
    if (!input.trim()) return;
    const token = localStorage.getItem('token');
    const lang = detectLanguage(input);
    setSending(true);

    try {
      const res = await postDoctorAssistant(token, patientId, input.trim(), lang);
      // API returns { message: answerText, interaction }
      const interaction = res.interaction || res;
      setHistory((h) => [...h, interaction]);
      setInput('');
      setTimeout(scrollToBottom, 120);
    } catch (err) {
      console.error('Assistant send failed', err);
      // If server returned an interaction (fallback), append it to history
      const fallbackInteraction = err.response?.data?.interaction;
      if (fallbackInteraction) {
        setHistory((h) => [...h, fallbackInteraction]);
        alert(err.response?.data?.message || 'AI assistant temporarily unavailable');
      } else {
        alert(err.response?.data?.message || 'Failed to send question');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm mt-6">
      <h3 className="text-2xl font-semibold mb-3">Doctor AI Assistant</h3>
      <p className="text-sm text-gray-500 mb-4">Ask observational questions about this patient's data. No diagnosis or treatment will be provided.</p>

      <div ref={boxRef} className="h-64 overflow-y-auto rounded-lg border p-4 bg-gray-50 dark:bg-slate-700">
        {loading ? (
          <div className="text-gray-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500">No previous interactions</div>
        ) : (
          history.map((h) => (
            <div key={h._id || `${h.createdAt}-${Math.random()}`} className="mb-4">
              <div className="text-sm text-gray-600">{new Date(h.createdAt).toLocaleString()}</div>
              <div className="mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border"> 
                <div className="text-sm font-semibold text-teal-700">Question</div>
                <div className="text-sm text-slate-800 dark:text-slate-200 mb-2">{h.question}</div>
                <div className="text-sm font-semibold text-indigo-700">Assistant</div>
                {renderAnswer(h.answer)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the patient's trends or reports"
          className="flex-1 px-4 py-3 rounded-lg border bg-white dark:bg-slate-800"
          disabled={sending}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
        />
        <button onClick={onSend} disabled={sending} className="px-5 py-3 rounded-full bg-gradient-to-r from-teal-600 to-blue-500 text-white font-semibold">
          {sending ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
