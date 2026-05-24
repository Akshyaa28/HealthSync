import { GoogleGenerativeAI } from '@google/generative-ai';

export const analyzeReport = async (text, previousReport = null) => {
  const prompt = `
You are an expert medical AI assistant.

Analyze the medical report and provide:
1. Overall Health Risk Score (0–100)
2. Key Findings
3. Health Summary (simple words)
4. Trend Analysis (compare with previous report if exists)

CURRENT REPORT:
${text}

PREVIOUS REPORT:
${previousReport || "No previous report"}
`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let answer = response.text() || 'Unable to respond.';

    // sanitize asterisks
    answer = answer.replace(/\*(.+?)\*/gs, '$1');
    answer = answer.replace(/^\s*\*\s?/gm, '- ');
    answer = answer.replace(/\*+/g, '');

    return answer;
  } catch (err) {
    console.error('Gemini /aiAnalysis error:', err);
    return 'AI service unavailable. Please check API key.';
  }
};