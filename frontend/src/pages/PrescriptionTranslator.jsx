import { useMemo, useState } from 'react';
import { translatePrescription } from '../services/api';

const samplePrescription = `Rx:
1) Tab Metformin 500 mg - 1 tablet twice daily after food for 30 days
2) Tab Telmisartan 40 mg - 1 tablet once daily in the morning for 30 days
3) Cap Atorvastatin 10 mg - 1 capsule at bedtime for 30 days
4) Tab Pantoprazole 40 mg - 1 tablet before breakfast for 14 days

Advice:
- Low salt, low sugar diet
- Brisk walk 30 minutes daily
- Review after 4 weeks`;

const sectionize = (text) => {
  const clean = String(text || '').trim();
  if (!clean) return [];

  const lines = clean.split(/\r?\n/);
  const sections = [];
  let current = { title: 'Summary', content: [] };

  const isTitle = (line) => /^\s*(\d+[\).]|[-*])\s*/.test(line) || /:\s*$/.test(line);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isTitle(line) && current.content.length) {
      sections.push(current);
      current = { title: line.replace(/^\s*\d+[\).]\s*/, ''), content: [] };
      continue;
    }

    if (!current.title && isTitle(line)) {
      current.title = line;
      continue;
    }

    current.content.push(line);
  }

  if (current.content.length) sections.push(current);
  return sections.length ? sections : [{ title: 'Explanation', content: [clean] }];
};

const parseTableFromLines = (lines = []) => {
  const firstTableLine = lines.findIndex((l) => l.includes('|'));
  if (firstTableLine === -1) return null;

  let end = firstTableLine;
  while (end < lines.length && lines[end].includes('|')) end += 1;
  const block = lines.slice(firstTableLine, end).map((l) => l.trim());
  if (block.length < 2) return null;

  const cleaned = block.filter((l) => !/^\|?\s*[-:| ]+\s*\|?$/.test(l));
  if (!cleaned.length) return null;

  const splitRow = (row) =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const header = splitRow(cleaned[0]);
  const rows = cleaned
    .slice(1)
    .map(splitRow)
    .filter((r) => r.some((cell) => cell));
  if (!header.length || !rows.length) return null;

  return {
    header,
    rows,
    before: lines.slice(0, firstTableLine),
    after: lines.slice(end)
  };
};

const dedupeMedicineTables = (sections = []) => {
  let seenMedicineTable = false;

  return sections
    .map((section) => {
      const parsed = parseTableFromLines(section.content);
      if (!parsed) return section;

      const title = String(section.title || '').toLowerCase();
      const looksLikeMedicineTable =
        title.includes('medicine') ||
        parsed.header.some((col) => /medicine name|medicine|how to take|important caution/i.test(col));

      if (!looksLikeMedicineTable) return section;
      if (!seenMedicineTable) {
        seenMedicineTable = true;
        return section;
      }

      const cleanedContent = [...parsed.before, ...parsed.after].filter(Boolean);
      if (!cleanedContent.length) return null;
      return { ...section, content: cleanedContent };
    })
    .filter(Boolean);
};

export default function PrescriptionTranslator() {
  const token = localStorage.getItem('token');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [provider, setProvider] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [inputMode, setInputMode] = useState('text');

  const sections = useMemo(() => dedupeMedicineTables(sectionize(result)), [result]);

  const doTranslate = async () => {
    if (!text.trim() && !file) return alert('Please enter prescription text or upload a file');
    setLoading(true);
    try {
      const data = await translatePrescription(token, text, language, file);
      setResult(data.translation || '');
      setProvider(data.provider || '');
      setExtractedText(data.extractedText || '');
      setInputMode(data.inputMode || 'text');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setText('');
    setFile(null);
    setResult('');
    setProvider('');
    setExtractedText('');
    setInputMode('text');
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      alert('Copied to clipboard');
    } catch {
      alert('Copy failed');
    }
  };

  const prettifyHeader = (col) =>
    String(col || '')
      .replace(/\s+/g, ' ')
      .replace(/^medicine name$/i, 'Medicine')
      .replace(/^why it is used$/i, 'Purpose')
      .replace(/^how to take$/i, 'How to Take')
      .replace(/^important caution$/i, 'Caution')
      .trim();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#d8fff7_0%,#f8fffd_38%,#ecf8ff_72%,#e7f0ff_100%)] dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10 rounded-[28px] border border-teal-100/80 bg-white/90 px-7 py-7 shadow-[0_18px_55px_rgba(15,118,110,0.08)] backdrop-blur">
          <div className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Patient Tool
          </div>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-900">Prescription Translator</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            Convert difficult prescription text into a simple, clear plan you can read and follow.
          </p>
        </div>

        <div className="space-y-7">
          <section className="rounded-[26px] border border-slate-200/90 bg-white p-7 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Input Prescription</h2>
              <button
                onClick={() => setText(samplePrescription)}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
              >
                Use Sample
              </button>
            </div>
            <p className="mt-2 text-base leading-7 text-slate-500">Paste exactly what is written in the doctor note.</p>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-base font-semibold text-slate-700">Target Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-slate-800 outline-none ring-teal-300 transition focus:ring"
                >
                  <option value="en">English</option>
                  <option value="ta">Tamil</option>
                  <option value="tanglish">Tanglish</option>
                  <option value="hi">Hindi</option>
                </select>
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-700">Prescription Text</span>
                  <span className="text-sm text-slate-500">{text.length} chars</span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="Example: T. Amlodipine 5mg OD..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg leading-8 text-slate-800 outline-none ring-teal-300 transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-base font-semibold text-slate-700">Upload File</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp,.bmp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-700 outline-none ring-teal-300 transition focus:ring file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700"
                />
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Supported: PDF, image, TXT, DOCX. You can paste text, upload a file, or use both.
                </p>
                {file ? (
                  <p className="mt-2 text-sm font-medium text-teal-700">Selected: {file.name}</p>
                ) : null}
              </label>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={doTranslate}
                disabled={loading}
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Translating...' : 'Translate Prescription'}
              </button>
              <button
                onClick={clearAll}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200/90 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Easy Explanation</h2>
                <p className="mt-1 text-base text-slate-500">A clearer version of your prescription with structure, caution, and routine guidance.</p>
              </div>
              <div className="flex items-center gap-2">
                {provider ? (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
                    {provider}
                  </span>
                ) : null}
                <button
                  onClick={copyResult}
                  disabled={!result}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>

            {!result ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 px-6 py-20 text-center text-lg leading-8 text-slate-500">
                Your translated result will appear here with clear sections and checklist.
              </div>
            ) : (
              <div className="space-y-5">
                {extractedText && inputMode === 'file' ? (
                  <article className="rounded-[22px] border border-cyan-200 bg-cyan-50/80 p-5">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-800">Extracted Text From Upload</h3>
                    <div className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-800">
                      {extractedText}
                    </div>
                  </article>
                ) : null}

                {sections.map((s, idx) => (
                  <article key={`${s.title}-${idx}`} className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(241,245,249,0.85)_100%)] p-5">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">{s.title}</h3>
                    {(() => {
                      const parsed = parseTableFromLines(s.content);
                      if (!parsed) {
                        return (
                          <div className="mt-3 space-y-2 text-[17px] leading-8 text-slate-800">
                            {s.content.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div className="mt-3 space-y-4 text-[17px] leading-8 text-slate-800">
                          {parsed.before.map((line, i) => (
                            <p key={`b-${i}`}>{line}</p>
                          ))}

                          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                            <table className="min-w-full table-fixed text-base">
                              <thead className="bg-[linear-gradient(90deg,#def7f3_0%,#ecfeff_100%)]">
                                <tr>
                                  {parsed.header.map((col, i) => (
                                    <th key={i} className="border-b border-slate-200 px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.08em] text-teal-800">
                                      {prettifyHeader(col)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {parsed.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="odd:bg-white even:bg-slate-50/90">
                                    {parsed.header.map((_, cIdx) => (
                                      <td key={cIdx} className="border-b border-slate-100 px-4 py-3 align-top text-[15px] text-slate-700 whitespace-normal break-words leading-7">
                                        {row[cIdx] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {parsed.after.map((line, i) => (
                            <p key={`a-${i}`}>{line}</p>
                          ))}
                        </div>
                      );
                    })()}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
