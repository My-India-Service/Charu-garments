import siteSettingModel from "../models/siteSettingModel.js";

export const getSiteSettings = async () => {
  let settings = await siteSettingModel.findOne({ key: "default" });
  if (!settings) {
    settings = await siteSettingModel.create({ key: "default" });
  }
  return settings;
};

const publicSettings = (settings) => ({
  phone: settings.phone,
  whatsappPhone: settings.whatsappPhone || settings.phone || "",
  email: settings.email,
  address: settings.address,
});

const getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({ success: true, settings: publicSettings(settings) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateSiteSettings = async (req, res) => {
  try {
    const phone = String(req.body.phone || "").trim();
    const whatsappPhone = String(req.body.whatsappPhone || "").trim();
    const email = String(req.body.email || "").trim();
    const address = String(req.body.address || "").trim();

    if (phone.replace(/\D/g, "").length < 10) {
      return res.json({ success: false, message: "Enter a valid contact number" });
    }
    if (whatsappPhone && whatsappPhone.replace(/\D/g, "").length < 10) {
      return res.json({
        success: false,
        message: "Enter a valid WhatsApp number for bulk orders",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }
    if (!address) {
      return res.json({ success: false, message: "Enter the store address" });
    }

    const settings = await getSiteSettings();
    settings.phone = phone;
    settings.whatsappPhone = whatsappPhone || phone;
    settings.email = email;
    settings.address = address;
    await settings.save();
    res.json({ success: true, message: "Contact details saved", settings: publicSettings(settings) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getPublicSiteSettings, updateSiteSettings };
