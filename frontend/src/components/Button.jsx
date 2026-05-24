export default function Button({ text }) {
  return (
    <button style={{
      padding: "12px 24px",
      background: "linear-gradient(to right, #0f766e, #0ea5e9)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px"
    }}>
      {text}
    </button>
  );
}
