import { defineConfig } from "vite";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

export default defineConfig({
  plugins: [],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: '/index.html',
  },
});
