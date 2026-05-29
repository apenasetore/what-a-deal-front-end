import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O Gateway (Elixir/Plug) roda em http://localhost:4000 e NAO envia headers CORS.
// Para o navegador nao bloquear as requisicoes do dev server (origem :5173),
// usamos um proxy: o frontend chama "/api/...", que o Vite repassa para :4000
// removendo o prefixo "/api". Como tudo sai da mesma origem (:5173), o navegador
// nao aciona a politica de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
