import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Raw extracted text from PDF
    text: {
      type: String,
      required: true,
    },

    // AI generated summary or final simplified data
    summary: {
      type: String,
      required: true,
    },

    // Health Risk Score
    risk: {
      type: Number,
      required: true,
    },

    // Health Status
    status: {
      type: String,
      enum: ["High", "Moderate", "Stable"],
      required: true,
    },

    // Specific reasons / flags extracted from the report
    reasons: {
      type: [String],
      default: [],
    },
    pdfUrl: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
