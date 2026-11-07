import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  status: { type: String, enum: ["new", "read"], default: "new" },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative", ""],
    default: "",
  },
  sentimentScore: { type: Number, default: 0 },
  date: { type: Number, required: true },
});

const feedbackModel =
  mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);

export default feedbackModel;
