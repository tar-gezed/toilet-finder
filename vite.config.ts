import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/toilet-finder/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      mode: "development",
      base: "/toilet-finder/",
      // srcDir: "src",
      // filename: "sw.ts",
      includeAssets: ["/favicon.ico", "/toilet-finder/favicon.ico"],
      // strategies: "injectManifest",
      manifest: {
        name: "Toilet Finder",
        short_name: "TF",
        description: "An application to find toilets thanks to OpenStreetMap",
        icons: [
          {
            src: "/toilet-finder/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/toilet-finder/android-chrome-256x256.png",
            sizes: "256x256",
            type: "image/png",
          },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/toilet-finder/",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
