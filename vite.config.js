import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getTitulos, getDetalhe, getCurva, getMacro } from "./server/datalayer.js";

// API só de desenvolvimento: serve /api/* a partir da MESMA camada de dados que
// roda em produção como funções serverless da Vercel (api/*.js). Assim
// `npm run dev` já mostra as taxas reais de verdade.
function devApi() {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next();
        const url = new URL(req.url, "http://localhost");
        const send = (code, body) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(body));
        };
        try {
          if (url.pathname === "/api/titulos") return send(200, await getTitulos());
          if (url.pathname === "/api/curva") return send(200, await getCurva());
          if (url.pathname === "/api/macro") return send(200, await getMacro());
          if (url.pathname === "/api/detalhe") {
            const slug = url.searchParams.get("slug");
            if (!slug) return send(400, { error: "Faltou o parâmetro slug" });
            return send(200, await getDetalhe(slug, url.searchParams.get("tf") || "1A"));
          }
          return next();
        } catch (e) {
          // Honra o status do erro (404 para slug desconhecido) igual às
          // funções da Vercel — senão dev e produção discordam.
          return send(e.status || 502, { error: e.message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
  server: {
    host: true, // permite abrir no celular pela rede local (LAN)
  },
});
