import { useEffect, useState, useRef } from "react";

export default function Aiassistant({ reportData, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------------- WELCOME MESSAGE ---------------- */
  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text:
          "Hello 👋 I’m your AI Medical Assistant.\n\n" +
          "• Ask any health-related question\n" +
          "• Medicines, diseases, diet, lifestyle\n" +
          "• Simple & brief answers\n\n" +
          "How can I help you?"
      }
    ]);
  }, []);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuery: userText,
          reportData: reportData || null
        })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.answer || "I couldn’t respond properly. Please try again."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Server error. Please try again later." }
      ]);
    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */
  return (
  <div className="fixed bottom-6 right-6 z-50">
    <div className="w-[650px] h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-teal-200">

      {/* Header */}
      <div className="p-4 bg-teal-600 flex justify-between items-center">
        <h2 className="font-semibold text-white text-sm">
          💚 AI Medical Assistant
        </h2>
        <button
          onClick={onClose}
          className="text-white text-lg hover:text-red-200"
        >
          ✕
        </button>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-teal-50 dark:bg-slate-800">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2 rounded-xl text-sm whitespace-pre-line shadow ${
              m.role === "ai"
                ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
                : "bg-teal-600 text-white ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="text-xs text-gray-500">
            AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 bg-white dark:bg-slate-900">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a health question..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 dark:bg-slate-800"
        />
        <button
          onClick={sendMessage}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded-lg text-sm"
        >
          Send
        </button>
      </div>

    </div>
  </div>
);

}