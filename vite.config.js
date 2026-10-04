/** @format */
/* global process */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Portable base ("./") so the SAME dist/ works on:
// - Cloudflare Pages (served from /)
// - GitHub Pages project site (/Singlish_Translator/)
// - Any static host / file preview.
// Override with env if needed: BASE_PATH=/custom/ npm run build
const base = process.env.BASE_PATH ?? "./";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
