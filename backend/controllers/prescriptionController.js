import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const MEDICATION_HINTS = [
  { pattern: /amlodipine/i, purpose: 'Helps lower blood pressure', caution: 'May cause dizziness or ankle swelling' },
  { pattern: /metoprolol/i, purpose: 'Helps control blood pressure and heart rate', caution: 'Do not stop suddenly without medical advice' },
  { pattern: /telmisartan/i, purpose: 'Helps lower blood pressure', caution: 'Monitor blood pressure regularly' },
  { pattern: /atorvastatin/i, purpose: 'Helps lower cholesterol', caution: 'Report muscle pain if it appears' },
  { pattern: /metformin/i, purpose: 'Helps control blood sugar', caution: 'Take after food if stomach upset occurs' },
  { pattern: /pantoprazole/i, purpose: 'Reduces stomach acid', caution: 'Usually taken before meals if instructed' },
  { pattern: /ecosprin|aspirin/i, purpose: 'Helps reduce blood clot risk', caution: 'Can increase bleeding risk' },
  { pattern: /clopidogrel/i, purpose: 'Helps reduce blood clot risk', caution: 'Can increase bleeding risk' },
  { pattern: /gelusil|antacid/i, purpose: 'Relieves acidity or stomach discomfort', caution: 'Keep gap from other medicines if advised' },
  { pattern: /vitamin d/i, purpose: 'Supports vitamin D replacement', caution: 'Use only for advised duration' },
  { pattern: /thyroxine|levothyroxine/i, purpose: 'Supports thyroid hormone replacement', caution: 'Usually taken on an empty stomach' }
];

const FREQUENCY_MAP = [
  { pattern: /\bOD\b/i, value: 'Once daily' },
  { pattern: /\bBD\b/i, value: 'Twice daily' },
  { pattern: /\bTDS\b/i, value: 'Three times daily' },
  { pattern: /\bQID\b/i, value: 'Four times daily' },
  { pattern: /\bHS\b/i, value: 'At bedtime' },
  { pattern: /\bSOS\b/i, value: 'As needed' },
  { pattern: /\bSTAT\b/i, value: 'Immediately as directed' }
];

const normalizeLanguage = (lang) => {
  const v = String(lang || 'en').toLowerCase();
  if (['en', 'english'].includes(v)) return 'English';
  if (['ta', 'tamil'].includes(v)) return 'Tamil';
  if (['tanglish'].includes(v)) return 'Tanglish (Tamil in English letters)';
  if (['hi', 'hindi'].includes(v)) return 'Hindi';
  return 'English';
};

const normalizeMedicineName = (line) =>
  String(line || '')
    .replace(/^\s*\d+[\).:-]?\s*/, '')
    .replace(/^(tab|tablet|cap|capsule|syp|syrup|inj|drop|cream|ointment|t\.|cap\.)\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const inferMedicationHint = (name) => {
  const match = MEDICATION_HINTS.find((hint) => hint.pattern.test(name));
  return match || { purpose: 'General medicine support', caution: 'Follow your doctor instructions carefully' };
};

const parseHowToTake = (line) => {
  const parts = [];
  const quantity = line.match(/\b(\d+\s*(?:tablet|tab|capsule|cap|ml|tsp|teaspoon)s?)\b/i);
  if (quantity) parts.push(quantity[1]);

  const freq = FREQUENCY_MAP.find((entry) => entry.pattern.test(line));
  if (freq) parts.push(freq.value);

  if (/after food/i.test(line)) parts.push('After food');
  if (/before breakfast/i.test(line)) parts.push('Before breakfast');
  if (/before food/i.test(line)) parts.push('Before food');
  if (/morning/i.test(line) && !parts.some((p) => /morning/i.test(p))) parts.push('Morning');
  if (/night/i.test(line) && !parts.some((p) => /night|bedtime/i.test(p))) parts.push('Night');

  return parts.join(', ') || 'Take exactly as written on the prescription';
};

const parseDuration = (line, followUpHint) => {
  const explicit = line.match(/for\s+(\d+\s*(?:day|days|week|weeks|month|months))/i);
  if (explicit) return explicit[1];
  return followUpHint ? `Until review in ${followUpHint}` : 'As advised by doctor';
};

const buildMedicineRows = (text) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const followUpLine = lines.find((line) => /\b(f\/?u|follow\s*up|review)\b/i.test(line));
  const followUpHint = followUpLine?.match(/(\d+\s*(?:day|days|week|weeks|month|months))/i)?.[1] || '';

  return lines
    .filter((line) => !/\b(rx|advice|f\/?u|follow\s*up|review)\b[:]?/i.test(line))
    .filter((line) =>
      /(?:\b(?:tab|tablet|cap|capsule|syp|syrup|inj|drop|cream|ointment|t\.)\b|\b(?:od|bd|tds|qid|hs|sos|stat)\b|\d+\s*(?:mg|mcg|g|ml|tsp|iu))/i.test(line)
    )
    .map((line) => {
      const normalized = normalizeMedicineName(line);
      const nameMatch = normalized.match(/^(.+?)(?=\s+(?:\d+(?:\/\d+)?\s*(?:mg|mcg|g|ml|iu)|OD|BD|TDS|QID|HS|SOS|STAT)\b|$)/i);
      const medicineName = (nameMatch?.[1] || normalized).trim();
      const hint = inferMedicationHint(medicineName);

      return {
        medicine: medicineName,
        purpose: hint.purpose,
        howToTake: parseHowToTake(line),
        duration: parseDuration(line, followUpHint),
        caution: hint.caution
      };
    });
};

const buildMarkdownTable = (medicines) => {
  const rows = medicines.map((med) =>
    `| ${med.medicine} | ${med.purpose} | ${med.howToTake} | ${med.duration} | ${med.caution} |`
  );

  return [
    '| Medicine name | Why it is used | How to take | Duration | Important caution |',
    '|---|---|---|---|---|',
    ...rows
  ].join('\n');
};

const buildStructuredFallback = (text, language) => {
  const target = normalizeLanguage(language);
  const medicines = buildMedicineRows(text);
  if (!medicines.length) return fallbackTranslate(text, language);

  const checklist = medicines.map((med) => `- ${med.medicine}: ${med.howToTake}`).join('\n');
  return [
    `Plain-language summary (${target}):`,
    `This prescription contains ${medicines.length} medicine${medicines.length > 1 ? 's' : ''}. Take them only as instructed and confirm unclear handwriting with your doctor or pharmacist.`,
    '',
    'Medicines table:',
    buildMarkdownTable(medicines),
    '',
    'Daily routine checklist:',
    checklist,
    '',
    'Red-flag symptoms to contact doctor:',
    '- Severe dizziness, fainting, unusual bleeding, rash, breathing trouble, or severe stomach upset.',
    '',
    'Note: Confirm exact dosage and timing with your doctor/pharmacist.'
  ].join('\n');
};

const mergeExtractedTable = (translation, medicines) => {
  if (!medicines.length) return translation;
  const table = buildMarkdownTable(medicines);
  const pattern = /(2\)\s*Medicines table:?[\s\S]*?)(?=\n\s*3\)|$)/i;

  if (pattern.test(translation)) {
    return translation.replace(
      pattern,
      `2) Medicines table:\n${table}\n`
    );
  }

  return `${translation}\n\nMedicines table:\n${table}`;
};

const fallbackTranslate = (text, language) => {
  const target = normalizeLanguage(language);
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);

  const intro = `Simple Prescription Explanation (${target})`;
  const body = lines.length
    ? lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
    : 'No readable prescription lines detected.';

  return `${intro}\n\nDetected items:\n${body}\n\nNote: Confirm exact dosage and timing with your doctor/pharmacist.`;
};

const callGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'GROQ error');
  return data?.choices?.[0]?.message?.content || '';
};

const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
  let lastErr = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || '';
      if (text.trim()) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Gemini failed');
};

const callGeminiWithFile = async (prompt, mimeType, buffer) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
  let lastErr = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: buffer.toString('base64')
          }
        }
      ]);
      const response = await result.response;
      const text = response.text() || '';
      if (text.trim()) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Gemini file extraction failed');
};

const cleanExtractedText = (text) =>
  String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractPrescriptionTextFromUpload = async (file) => {
  const filename = String(file?.name || '');
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const ext = filename.toLowerCase().split('.').pop();
  const buffer = file?.data;

  if (!buffer) throw new Error('Uploaded file is empty');

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const parsed = await pdf(buffer);
    return cleanExtractedText(parsed.text);
  }

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
    const extracted = await callGeminiWithFile(
      'Extract only the prescription text from this image. Preserve medicine lines, dosage abbreviations, and follow-up advice. Do not explain anything.',
      file.mimetype,
      buffer
    );
    return cleanExtractedText(extracted);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanExtractedText(result.value);
  }

  if (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'md'].includes(ext)
  ) {
    return cleanExtractedText(buffer.toString('utf8'));
  }

  if (ext === 'doc') {
    throw new Error('Legacy .doc files are not supported yet. Please upload PDF, image, TXT, or DOCX.');
  }

  throw new Error('Unsupported file type. Please upload PDF, image, TXT, or DOCX.');
};

export const translatePrescription = async (req, res) => {
  try {
    const { text, language = 'en' } = req.body || {};
    const uploadedFile = req.files?.prescriptionFile || null;

    let sourceText = String(text || '').trim();
    let extractedFrom = 'text';

    if (uploadedFile) {
      sourceText = await extractPrescriptionTextFromUpload(uploadedFile);
      extractedFrom = 'file';
    }

    if (!sourceText) {
      return res.status(400).json({ message: 'Prescription text or upload is required' });
    }

    const targetLanguage = normalizeLanguage(language);
    const extractedMeds = buildMedicineRows(sourceText);
    const prompt = `
You are a medical prescription explainer for patients.
Translate and explain the following prescription in ${targetLanguage}.

Prescription text:
${sourceText}

Extracted medicine hints (use these when available and do NOT write "Not specified" for these fields):
${extractedMeds.length ? buildMarkdownTable(extractedMeds) : 'No structured medicines extracted'}

Output format:
1) Plain-language summary
2) Medicines table in valid markdown table format only:
   | Medicine name | Why it is used | How to take | Duration | Important caution |
   |---|---|---|---|---|
3) Daily routine checklist
4) Red-flag symptoms to contact doctor

Rules:
- Keep language patient-friendly and clear.
- Do not invent dosage if not present; write "Not specified".
- No diagnosis, no replacing doctor advice.
- Keep each table cell short and readable.
`;

    let translated = '';
    let provider = 'none';
    try {
      translated = await callGroq(prompt);
      provider = 'groq';
    } catch (groqErr) {
      try {
        translated = await callGemini(prompt);
        provider = 'gemini';
      } catch (geminiErr) {
        translated = buildStructuredFallback(sourceText, targetLanguage);
        provider = 'fallback';
      }
    }

    translated = translated.replace(/\*(.+?)\*/gs, '$1').replace(/\*+/g, '');
    translated = mergeExtractedTable(translated, extractedMeds);
    res.json({
      translation: translated,
      provider,
      language: targetLanguage,
      extractedText: sourceText,
      inputMode: extractedFrom
    });
  } catch (err) {
    console.error('Prescription translate error:', err);
    res.status(500).json({ message: err.message || 'Failed to translate prescription' });
  }
};
