import productModel from "../models/productModel.js";

const storeUrl = () =>
  String(process.env.FRONTEND_URL || "https://charu-garments-store.onrender.com").replace(/\/$/, "");

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const robots = (req, res) => {
  const origin = storeUrl();
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /cart
Disallow: /orders
Disallow: /place-order
Disallow: /login
Disallow: /profile
Disallow: /wallet
Disallow: /verify

Sitemap: ${origin}/sitemap.xml
`);
};

const sitemap = async (req, res) => {
  try {
    const origin = storeUrl();
    const pages = ["", "/collection", "/about", "/contact"];
    const products = await productModel
      .find({ active: { $ne: false } })
      .select("_id date")
      .lean();

    const urls = [
      ...pages.map((path) => ({ loc: `${origin}${path || "/"}` })),
      ...products.map((product) => ({
        loc: `${origin}/product/${product._id}`,
        lastmod: product.date ? new Date(product.date).toISOString() : "",
      })),
    ];

    const body = urls
      .map((url) => {
        const lastmod = url.lastmod
          ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>`
          : "";
        return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${lastmod}\n  </url>`;
      })
      .join("\n");

    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`);
  } catch (error) {
    console.log(error);
    res.status(500).type("text/plain").send("Could not build sitemap");
  }
};

export { robots, sitemap };
