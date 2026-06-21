import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// Strips `crossorigin` from built HTML - Chrome extensions don't need it
// and it causes module/CSS loading failures in the extension context.
function stripCrossorigin() {
  return {
    name: "strip-crossorigin",
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, "");
    },
  };
}

export default defineConfig({
  plugins: [react(), crx({ manifest }), stripCrossorigin()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        popup: "popup.html",
        aquarium: "aquarium.html",
        sidepanel: "sidepanel.html",
      },
    },
  },
});
