import User from '../models/User.js';
import Report from '../models/Report.js';
import RiskHistory from '../models/RiskHistory.js';
import DoctorInteraction from '../models/DoctorInteraction.js';
import ActionHistory from '../models/ActionHistory.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/* ------------------ helpers ------------------ */
const normalizeLang = (lang) => {
  if (!lang) return 'en';
  if (['en', 'ta', 'tanglish'].includes(lang)) return lang;
  return 'en';
};

const extractLabsFromText = (text = '') => {
  const out = {};
  const hb = text.match(/(?:Hb|Hemoglobin)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  const sugar = text.match(/(?:Blood\s*Sugar|Sugar|Glucose)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  const bp = text.match(/(?:B\.?\s*P\.?|Blood\s*Pressure)\s*[:=\-]?\s*([0-9]{2,3})\s*(?:\/\s*([0-9]{2,3}))?/i);
  const crp = text.match(/(?:CRP|C-?reactive protein)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  const chol = text.match(/(?:Cholesterol|Chol)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  const wbc = text.match(/(?:WBC|White\s*Blood\s*Cell(?:\s*Count)?)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);

  if (hb) out.hb = Number(hb[1]);
  if (sugar) out.sugar = Number(sugar[1]);
  if (bp) out.bp = `${bp[1]}/${bp[2] || ''}`;
  if (crp) out.crp = Number(crp[1]);
  if (chol) out.cholesterol = Number(chol[1]);
  if (wbc) out.wbc = Number(wbc[1]);

  return out;
};

/* ------------------ RAG context ------------------ */
const buildPatientSummary = async (patientId) => {
  const user = await User.findById(patientId).select('-password');
  const reports = await Report.find({ user: patientId }).sort({ createdAt: 1 });
  const riskFlags = await RiskHistory.find({ user: patientId }).sort({ createdAt: 1 });

  const trends = reports.map((r) => ({
    date: r.createdAt.toISOString().split('T')[0],
    ...extractLabsFromText(r.text || '')
  }));

  const abnormalities = [];
  reports.forEach((r) => {
    const labs = extractLabsFromText(r.text || '');
    if (labs.hb && (labs.hb < 10 || labs.hb > 18)) abnormalities.push(`Hb=${labs.hb}`);
    if (labs.sugar && labs.sugar > 140) abnormalities.push(`Sugar=${labs.sugar}`);
    if (labs.bp && Number(labs.bp.split('/')[0]) >= 140) abnormalities.push(`BP=${labs.bp}`);
    if (labs.crp && labs.crp > 10) abnormalities.push(`CRP=${labs.crp}`);
    if (labs.cholesterol && labs.cholesterol > 240) abnormalities.push(`Chol=${labs.cholesterol}`);
    if (labs.wbc && (labs.wbc < 4 || labs.wbc > 11)) abnormalities.push(`WBC=${labs.wbc}`);
  });

  return {
    demographics: {
      name: user?.name || 'Unknown',
      age: user?.age || 'N/A',
      gender: user?.gender || 'N/A'
    },
    reports,
    trends,
    abnormalities: [...new Set(abnormalities)],
    riskFlags
  };
};

const buildLLMContext = (context) => {
  const reports = (context?.reports || []).slice(-5).map((r) => ({
    date: r?.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : null,
    risk: r?.risk ?? null,
    status: r?.status ?? null,
    summary: r?.summary || '',
    reasons: r?.reasons || []
  }));

  const trends = (context?.trends || []).slice(-10);
  const abnormalities = (context?.abnormalities || []).slice(-12);
  const riskFlags = (context?.riskFlags || []).slice(-10).map((r) => ({
    date: r?.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : null,
    riskScore: r?.riskScore ?? null,
    trendScore: r?.trendScore ?? null,
    recoveryScore: r?.recoveryScore ?? null,
    criticalFlag: r?.criticalFlag ?? null
  }));

  return {
    demographics: context?.demographics || {},
    reports,
    trends,
    abnormalities,
    riskFlags
  };
};

/* ------------------ prompt ------------------ */
const buildPrompt = (question, context, lang) => {
  const langLine =
    lang === 'ta'
      ? 'Answer in Tamil.'
      : lang === 'tanglish'
      ? 'Answer in Tanglish (Tamil written using English letters).'
      : 'Answer in English.';

  return `
You are a clinical decision-support AI for doctors.
Use patient context first; when context is insufficient for the exact question, provide clearly-labeled general medical guidance.
Do not provide definitive diagnosis or patient-specific drug dosages.

${langLine}

Patient Context:
${JSON.stringify(buildLLMContext(context), null, 2)}

Doctor Question:
${question}

Rules:
- Insight first (risk, trends, correlations)
- Mention missing info if relevant
- If context empty, reply exactly: "Insufficient data available"
- Do not invent patient facts. If a requested metric is missing, explicitly say it is unavailable and continue with what IS present in context.
- For medicine/diet/lifestyle questions, provide practical, evidence-aligned general guidance and clearly mark it as non-prescription guidance.
- You may explain medication classes and common clinical approaches, but avoid exact personalized prescriptions/dosages for this patient.
- Prefer detailed but readable answers with short sections:
  1) What the latest data shows
  2) Trend interpretation
  3) Clinical significance (non-diagnostic)
  4) Practical next-step monitoring suggestions
- If the doctor asks for detailed explanation, provide a deeper but still clear response.
`;
};

const QUESTION_LAB_TERMS = /(?:hb|hemoglobin|sugar|glucose|bp|b\.?\s*p\.?|blood pressure|crp|chol|cholesterol|wbc|white blood cell)/i;

const synonymGroups = [
  ['hb', 'hemoglobin'],
  ['sugar', 'glucose', 'blood sugar'],
  ['bp', 'b.p', 'blood pressure'],
  ['chol', 'cholesterol'],
  ['crp', 'c-reactive protein'],
  ['wbc', 'white blood cell', 'white blood cell count']
];

const contextHasAnySynonym = (ctxText, group = []) => {
  return group.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(ctxText);
  });
};

const parseSystolic = (bp) => {
  if (!bp || typeof bp !== 'string') return null;
  const n = Number(bp.split('/')[0]);
  return Number.isFinite(n) ? n : null;
};

const getLatestAndPrev = (arr = []) => {
  const vals = arr.filter((v) => v !== null && v !== undefined);
  if (!vals.length) return { latest: null, prev: null };
  return { latest: vals[vals.length - 1], prev: vals.length > 1 ? vals[vals.length - 2] : null };
};

const trendWord = (latest, prev) => {
  if (latest === null || prev === null) return 'insufficient trend data';
  if (latest > prev) return 'increasing';
  if (latest < prev) return 'decreasing';
  return 'stable';
};

const buildRuleBasedAssistantAnswer = (question, context) => {
  const q = String(question || '').toLowerCase();
  const latestReport = context?.reports?.[context.reports.length - 1] || null;
  const abnormalities = (context?.abnormalities || []).slice(0, 4);
  const trendCount = context?.trends?.length || 0;
  const latestRisk = latestReport?.risk ?? null;
  const latestStatus = latestReport?.status || null;
  const latestReasons = (latestReport?.reasons || []).slice(0, 3);
  const trends = context?.trends || [];
  const bpSeries = trends.map(t => t.bp).filter(Boolean);
  const sugarSeries = trends.map(t => t.sugar).filter(v => typeof v === 'number');
  const hbSeries = trends.map(t => t.hb).filter(v => typeof v === 'number');
  const cholSeries = trends.map(t => t.cholesterol).filter(v => typeof v === 'number');
  const crpSeries = trends.map(t => t.crp).filter(v => typeof v === 'number');
  const wbcSeries = trends.map(t => t.wbc).filter(v => typeof v === 'number');

  const { latest: latestBp, prev: prevBp } = getLatestAndPrev(bpSeries);
  const { latest: latestSugar, prev: prevSugar } = getLatestAndPrev(sugarSeries);
  const { latest: latestHb, prev: prevHb } = getLatestAndPrev(hbSeries);
  const { latest: latestChol, prev: prevChol } = getLatestAndPrev(cholSeries);
  const { latest: latestCrp, prev: prevCrp } = getLatestAndPrev(crpSeries);
  const { latest: latestWbc, prev: prevWbc } = getLatestAndPrev(wbcSeries);

  const bpTrend = trendWord(parseSystolic(latestBp), parseSystolic(prevBp));
  const sugarTrend = trendWord(latestSugar, prevSugar);
  const hbTrend = trendWord(latestHb, prevHb);
  const cholTrend = trendWord(latestChol, prevChol);
  const crpTrend = trendWord(latestCrp, prevCrp);
  const wbcTrend = trendWord(latestWbc, prevWbc);

  const lines = ['Summary:'];
  const wantsBP = /(bp|b\.?\s*p\.?|blood pressure)/i.test(q);
  const wantsSugar = /(sugar|glucose)/i.test(q);
  const wantsHb = /(hb|hemoglobin)/i.test(q);
  const wantsChol = /(chol|cholesterol|lipid)/i.test(q);
  const wantsCrp = /(crp|c-?reactive)/i.test(q);
  const wantsWbc = /(wbc|white blood cell)/i.test(q);
  const wantsRisk = /(risk|status|score|high risk|moderate risk)/i.test(q);
  const asksHowToReduce = /(how to|reduce|lower|control|manage|improve)/i.test(q);
  const asksTrend = /(trend|change|over time|progress|improv|worsen|increasing|decreasing)/i.test(q);
  const asksDetailed = /(detail|detailed|summary|explain|meaning|interpret)/i.test(q);

  if (wantsBP) {
    if (latestBp) {
      lines.push(`- Latest BP in reports: ${latestBp}.`);
      lines.push(`- BP trend vs previous: ${bpTrend}.`);
      const sys = parseSystolic(latestBp);
      if (sys !== null) {
        lines.push(`- Interpretation: systolic ${sys >= 140 ? 'is above' : 'is below'} the 140 threshold used for hypertension screening context.`);
      }
    } else {
      lines.push('- BP value is not available in the parsed report text.');
    }
  }

  if (wantsSugar) {
    if (latestSugar !== null) {
      lines.push(`- Latest glucose/sugar: ${latestSugar}.`);
      lines.push(`- Sugar trend vs previous: ${sugarTrend}.`);
      lines.push(`- Interpretation: value appears ${latestSugar > 140 ? 'elevated relative to common fasting targets' : 'within common reference targets'} (context-dependent).`);
    } else {
      lines.push('- Sugar value is not available in the parsed report text.');
    }
  }

  if (wantsHb) {
    if (latestHb !== null) {
      lines.push(`- Latest hemoglobin (Hb): ${latestHb}.`);
      lines.push(`- Hb trend vs previous: ${hbTrend}.`);
      lines.push(`- Interpretation: ${latestHb < 10 ? 'low range concern' : latestHb > 18 ? 'high range concern' : 'not in severe outlier range by simple screen'}.`);
    } else {
      lines.push('- Hb value is not available in the parsed report text.');
    }
  }

  if (wantsChol) {
    if (latestChol !== null) {
      lines.push(`- Latest cholesterol: ${latestChol}.`);
      lines.push(`- Cholesterol trend vs previous: ${cholTrend}.`);
      lines.push(`- Interpretation: ${latestChol > 240 ? 'high by common total cholesterol thresholds' : 'not above the 240 high-risk threshold used in this app'}.`);
    } else {
      lines.push('- Cholesterol value is not available in the parsed report text.');
    }
  }

  if (wantsCrp) {
    if (latestCrp !== null) {
      lines.push(`- Latest CRP: ${latestCrp}.`);
      lines.push(`- CRP trend vs previous: ${crpTrend}.`);
      lines.push(`- Interpretation: ${latestCrp > 10 ? 'suggests elevated inflammatory signal' : 'not above elevated CRP threshold used here'}.`);
    } else {
      lines.push('- CRP value is not available in the parsed report text.');
    }
  }

  if (wantsWbc) {
    if (latestWbc !== null) {
      lines.push(`- Latest WBC: ${latestWbc}.`);
      lines.push(`- WBC trend vs previous: ${wbcTrend}.`);
      lines.push(`- Interpretation: ${latestWbc < 4 ? 'below common reference range' : latestWbc > 11 ? 'above common reference range' : 'within common reference range (approx. 4-11)'}.`);
    } else {
      lines.push('- WBC value is not available in the parsed report text.');
    }
  }

  if (wantsRisk || lines.length === 0) {
    lines.push(`- Latest risk score: ${latestRisk ?? 'N/A'}${latestStatus ? ` (${latestStatus})` : ''}.`);
    if (latestReasons.length) lines.push(`- Primary flagged factors: ${latestReasons.join(', ')}.`);
  }

  if (asksTrend && !wantsBP && !wantsSugar && !wantsHb && !wantsChol && !wantsCrp && !wantsWbc) {
    lines.push(`- Trend coverage: ${trendCount} report time points available.`);
    if (abnormalities.length) lines.push(`- Noted abnormalities: ${abnormalities.join(', ')}.`);
  }

  lines.push('');
  lines.push('Next-step Monitoring (non-prescriptive):');
  if (asksHowToReduce) {
    if (wantsBP) {
      lines.push('- Reduce sodium intake, maintain regular aerobic activity, improve sleep quality, and monitor home BP regularly.');
      lines.push('- Escalate for clinician review if repeated readings stay >= 140/90 or symptoms occur.');
    } else if (wantsSugar) {
      lines.push('- Reduce refined carbohydrate load, maintain regular exercise, improve sleep, and track fasting/post-meal values consistently.');
    } else if (wantsChol) {
      lines.push('- Increase fiber-rich foods, reduce saturated/trans fats, maintain physical activity, and trend lipid values at follow-up.');
    } else {
      lines.push('- Balanced diet, regular activity, weight management, sleep optimization, and follow-up monitoring of key lab markers.');
    }
  } else {
    lines.push('- Continue periodic follow-up labs and compare against prior values for trend direction.');
    lines.push('- Correlate findings with symptoms and clinician assessment before any treatment decisions.');
  }

  if (asksDetailed) {
    lines.push('');
    lines.push('Clinical Context:');
    lines.push(`- Report count reviewed: ${trendCount}.`);
    if (abnormalities.length) lines.push(`- Abnormality flags from reports: ${abnormalities.join(', ')}.`);
  }

  if (!lines.length) {
    lines.push('- Insufficient data available for this query from current reports.');
  }

  lines.push('');
  lines.push('Clinical note: observational support only, not diagnosis/prescription.');

  return lines.join(' ');
};

const callGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'GROQ error');
  return data.choices?.[0]?.message?.content || '';
};

const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest'];
  let lastErr = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const txt = response.text() || '';
      if (txt.trim()) return txt;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('No Gemini model responded');
};

const callHuggingFace = async (prompt) => {
  if (!process.env.HUGGINGFACE_API_KEY) throw new Error('HUGGINGFACE_API_KEY missing');
  const model = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
  const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.2, return_full_text: false },
      options: { wait_for_model: true }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || `HuggingFace error (${response.status})`);

  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  if (data?.generated_text) return data.generated_text;
  if (typeof data === 'string') return data;
  throw new Error('Unexpected HuggingFace response format');
};

const containsUnsafePrescription = (text = '') => {
  const t = String(text).toLowerCase();
  // Guard only explicit personalized dosing/prescription language.
  const hardPatterns = [
    /\bstart\b.*\b\d+\s?(mg|mcg|g|ml)\b/,
    /\btake\b.*\b\d+\s?(mg|mcg|g|ml)\b/,
    /\bprescribe\b.*\b\d+\s?(mg|mcg|g|ml)\b/,
    /\b(?:once|twice|thrice)\s+(?:daily|a day)\b.*\b\d+\s?(mg|mcg|g|ml)\b/,
    /\bdiagnosis is\b/
  ];
  return hardPatterns.some((p) => p.test(t));
};

/* ------------------ controller ------------------ */

// Very conservative verifier to reduce hallucinations: if the AI mentions lab names (Hb, Sugar, BP, CRP, Cholesterol, etc.)
// but those lab names do not appear in the patient context, we consider the answer to be hallucinated.
const verifyAnswerAgainstContext = (answer, context) => {
  try {
    if (!answer || typeof answer !== 'string') return false;
    const a = answer.toLowerCase();
    const ctx = JSON.stringify(context || {}).toLowerCase();
    
    for (const group of synonymGroups) {
      const answerMentionsGroup = contextHasAnySynonym(a, group);
      if (!answerMentionsGroup) continue;
      if (!contextHasAnySynonym(ctx, group)) return false;
    }

    // If answer claims a specific numeric value for a lab, but that lab isn't found in context, it's suspicious
    const numericLabMatch = a.match(/(?:hb|hemoglobin|sugar|glucose|bp|b\.?\s*p\.?|blood pressure|crp|chol|cholesterol|wbc|white blood cell)[^\d\n]*([0-9]+(?:\.[0-9]+)?)/i);
    if (numericLabMatch) {
      const lab = numericLabMatch[0].toLowerCase();
      if (!synonymGroups.some((group) => contextHasAnySynonym(lab, group) && contextHasAnySynonym(ctx, group))) return false;
    }

    return true;
  } catch (e) {
    // If verifier errors, be conservative and mark as invalid
    return false;
  }
};

export const postAssistant = async (req, res) => {
  try {
    const { patientId, question, language } = req.body;
    if (!patientId || !question)
      return res.status(400).json({ message: 'patientId and question required' });

    const context = await buildPatientSummary(patientId);

    const hasData =
      context.reports.length ||
      context.trends.length ||
      context.abnormalities.length ||
      context.riskFlags.length;

    if (!hasData) {
      const msg = 'Insufficient data available';
      const interaction = await DoctorInteraction.create({
        doctorId: req.user.id,
        patientId,
        question,
        answer: msg,
        language
      });
      try { await ActionHistory.create({ actor: req.user.id, patient: patientId, type: 'doctor_ai_interaction', data: { interactionId: interaction._id } }); } catch (e) { console.warn('Failed to log AI interaction action', e?.message || e); }
      return res.json({ message: msg, interaction });
    }

    const prompt = buildPrompt(question, context, normalizeLang(language));

    const requiresLabs = QUESTION_LAB_TERMS.test(question);
    const hasLabsInContext = context.trends.some(t =>
      t.hb || t.sugar || t.bp || t.crp || t.cholesterol || t.wbc
    );

    if (requiresLabs && !hasLabsInContext) {
      const msg = buildRuleBasedAssistantAnswer(question, context);
      const interaction = await DoctorInteraction.create({
        doctorId: req.user.id,
        patientId,
        question,
        answer: msg,
        language
      });
      try { await ActionHistory.create({ actor: req.user.id, patient: patientId, type: 'doctor_ai_interaction', data: { interactionId: interaction._id, result: 'insufficient_data' } }); } catch (e) { console.warn('Failed to log AI interaction action', e?.message || e); }
      return res.json({ message: msg, interaction });
    } 

    // Call AI service (using providers)
    let answer = 'Insufficient data available';
    let usedFallback = false;
    let provider = 'none';
    try {
      try {
        answer = await callGroq(prompt);
        provider = 'groq';
      } catch (groqErr) {
        console.warn('GROQ call failed, trying Gemini:', groqErr.message || groqErr);
        try {
          answer = await callGemini(prompt);
          provider = 'gemini';
        } catch (geminiErr) {
          console.warn('Gemini call failed, trying HuggingFace:', geminiErr.message || geminiErr);
          try {
            answer = await callHuggingFace(prompt);
            provider = 'huggingface';
          } catch (hfErr) {
            // Retry with minimal prompt before falling back to rule-based answer
            const minimalPrompt = `
You are a medical assistant for doctors.
Use only this compact context and answer clearly.
Context: ${JSON.stringify(buildLLMContext(context))}
Question: ${question}
Rules: No definitive diagnosis, no personalized dosage prescriptions, but provide practical clinical guidance.
`;
            console.warn('HuggingFace call failed, retrying Groq with minimal prompt:', hfErr.message || hfErr);
            answer = await callGroq(minimalPrompt);
            provider = 'groq-minimal';
          }
        }
      }

      answer = answer || 'Insufficient data available';
      answer = answer.replace(/\*(.+?)\*/gs, '$1');
      answer = answer.replace(/^\s*\*\s?/gm, '- ');
      answer = answer.replace(/\*+/g, '');
    } catch (err) {
      console.error('All AI providers failed:', err.message || err);
      usedFallback = true;
      answer = buildRuleBasedAssistantAnswer(question, context);
    }

    // Enforce safety: block only explicit personalized prescription/diagnosis statements.
    if (containsUnsafePrescription(answer)) {
      const safePrefix = 'Safety note: avoiding patient-specific diagnosis/prescription dosing. ';
      answer = safePrefix + answer.replace(/\b(diagnosis is|start|take|prescribe)\b/gi, 'consider discussing');
      usedFallback = true;
    }

    // Verify against context to avoid hallucination: conservative check
    if (!usedFallback) {
      try {
        const verified = verifyAnswerAgainstContext(answer, context);
        if (!verified) {
          // do not immediately discard good long-form answers; keep when it has no suspicious numeric mismatch
          const looksGenericClinical = /(?:latest|trend|monitor|clinical|risk|report)/i.test(answer);
          if (!looksGenericClinical) {
            answer = buildRuleBasedAssistantAnswer(question, context);
            usedFallback = true;
          }
        }
      } catch (e) {
        // if verifier fails unexpectedly, default to safe response
        answer = buildRuleBasedAssistantAnswer(question, context);
        usedFallback = true;
      }
    }

    const interaction = await DoctorInteraction.create({
      doctorId: req.user.id,
      patientId,
      question,
      answer,
      language
    });
    try {
      await ActionHistory.create({
        actor: req.user.id,
        patient: patientId,
        type: 'doctor_ai_interaction',
        data: { interactionId: interaction._id, result: usedFallback ? 'fallback' : 'answer', provider }
      });
    } catch (e) {
      console.warn('Failed to log AI interaction action', e?.message || e);
    }

    res.json({ message: answer, interaction, fallback: usedFallback });
  } catch (err) {
    console.error('Doctor AI Error:', err);
    res.status(500).json({ message: 'AI assistant failed' });
  }
};

/* ------------------ history ------------------ */
export const getAssistantHistory = async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ message: 'patientId required' });

  const history = await DoctorInteraction.find({
    doctorId: req.user.id,
    patientId
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(history.reverse());
};
