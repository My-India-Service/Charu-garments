import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:4000";

function seoFiles() {
  return {
    name: "seo-files",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/robots.txt" && path !== "/sitemap.xml") return next();
        try {
          const response = await fetch(backendUrl + path);
          if (!response.ok) return next();
          res.statusCode = 200;
          res.setHeader(
            "Content-Type",
            response.headers.get("content-type") || "text/plain",
          );
          res.end(await response.text());
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [seoFiles(), react(), tailwindcss()],
});
