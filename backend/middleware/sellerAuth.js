import userModel from "../models/userModel.js";

const approvedSeller = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user || user.sellerStatus !== "approved") {
      return res.json({
        success: false,
        message: "Your shop is not approved yet",
      });
    }
    req.seller = user;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default approvedSeller;
