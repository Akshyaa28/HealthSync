import { useState } from "react";
import Aiassistant from "./AiAssistant"; // 👈 import only

export default function UploadReport({ setResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openAI, setOpenAI] = useState(false); // 👈 added

  const upload = async () => {
    if (!file) return alert("Select a PDF");
    setLoading(true);

    const formData = new FormData();
    formData.append("report", file);

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/reports/analyze", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return alert(data.message || "Error analyzing report");
    setResult(data);
  };

  return (
    <>
      {/* MAIN CARD – UNCHANGED */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-xl flex flex-col justify-between h-full">
        
        <div>
          <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">
            Upload Medical Report
          </h2>
          <p className="text-gray-500 dark:text-slate-300 mb-6">
            Upload your latest report to analyze health risks
          </p>

          <label className="border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-700 transition">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setFile(e.target.files[0])}
            />
            <span className="text-teal-600 dark:text-teal-300 font-semibold">
              Click to select PDF
            </span>
            {file && (
              <span className="text-gray-500 dark:text-slate-300 mt-2 text-sm">
                {file.name}
              </span>
            )}
          </label>
        </div>

        {/* BUTTONS (Analyze + AI Assistant) */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={upload}
            disabled={loading}
            className="flex-1 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze Report"}
          </button>

          <button
            onClick={() => setOpenAI(true)}
            className="flex-1 py-3 border-2 border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 transition font-semibold"
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* AI ASSISTANT SIDEBAR */}
      {openAI && <Aiassistant onClose={() => setOpenAI(false)} />}
    </>
  );
}