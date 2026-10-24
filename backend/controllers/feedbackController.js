import feedbackModel from "../models/feedbackModel.js";

const submitFeedback = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    const message = String(req.body.message || "").trim();
    const rating = Number(req.body.rating);

    if (name.length < 2) {
      return res.json({ success: false, message: "Please enter your name" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (phone && phone.length !== 10) {
      return res.json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Please choose a rating" });
    }
    if (message.length < 10) {
      return res.json({
        success: false,
        message: "Please write at least 10 characters",
      });
    }

    await feedbackModel.create({
      name,
      email,
      phone,
      rating,
      message,
      date: Date.now(),
    });

    res.json({
      success: true,
      message: "Thank you. Your feedback has been sent.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const listFeedback = async (req, res) => {
  try {
    const feedback = await feedbackModel.find({}).sort({ date: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const status = req.body.status === "read" ? "read" : "new";
    const feedback = await feedbackModel.findByIdAndUpdate(
      req.body.id,
      { status },
      { returnDocument: "after" },
    );
    if (!feedback) {
      return res.json({ success: false, message: "Feedback not found" });
    }
    res.json({ success: true, feedback });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { submitFeedback, listFeedback, updateFeedbackStatus };
