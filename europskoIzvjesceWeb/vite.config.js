import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync("./localhost+3-key.pem"),
      cert: fs.readFileSync("./localhost+3.pem"),
    },
    host: true,
    proxy: {
      // Proxy all /api calls to your backend over HTTPS
      "/api": {
        target: "https://localhost:3001",  // Adjust to your backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: ["socket.io-client"],
  },
});
