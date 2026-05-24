import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import Report from "./models/Report.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Serve uploads (avatars, etc.) statically
app.use('/uploads', express.static('uploads'));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/prescription", prescriptionRoutes);

// ===== Gemini AI Endpoint (using GROQ) =====
app.post("/api/ai", async (req, res) => {
  const { userQuery, reportData, patientId } = req.body;

  try {
   // RAG: Retrieve actual report history for the specific patient
    let historyContext = "";
    if (patientId) {
      const reports = await Report.find({ user: patientId }).sort({ createdAt: -1 }).limit(3);
      historyContext = reports.map(r => `Report (${r.createdAt.toDateString()}): ${r.text}`).join("\n\n");
 }

    const prompt = `You are a medical AI assistant for patients.
Use the following context to answer the user query. If the query is about their specific health, prioritize the History Context. If it is a general question, answer helpfully using your medical knowledge.

History Context (Recent Reports):
${historyContext || "No specific report history available."}

Report context:
Risk Score: ${reportData?.riskScore || "-"}
Status: ${reportData?.status || "-"}
Trend: ${reportData?.trend || "-"}
Reasons: ${reportData?.reasons?.join(", ") || "-"}

User query:
${userQuery}

Rules:
- Use simple, friendly, and supportive language.
- DO NOT provide medical prescriptions or definitive diagnoses.
- If referencing their reports, mention the specific dates or values.
- Keep the response concise.`;

    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not set in .env');
      return res.status(503).json({ answer: 'AI service is being configured. Please try again in a moment.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ GROQ API error:', data?.error?.message || data);
      return res.status(503).json({ answer: 'AI service configuration issue. Please get a valid API key from groq.com' });
    }

    let answer = data.choices?.[0]?.message?.content || 'Unable to respond.';

    // sanitize asterisks from AI output
    answer = answer.replace(/\*(.+?)\*/gs, '$1');
    answer = answer.replace(/^\s*\*\s?/gm, '- ');
    answer = answer.replace(/\*+/g, '');

    res.json({ answer }); 
  } catch (err) {
    console.error('❌ GROQ /api/ai error:', err.message || err);
    res.status(503).json({ answer: 'AI service error. Please check your API key configuration.' });
  }
});

// ===== Health Backend Test Endpoint =====
app.get("/", (req, res) => {
  res.send("AI Health Backend Running 🚀");
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
