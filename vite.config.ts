import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon-180x180.png",
      ],
      manifest: {
        background_color: "#000000",
        description: "Timers et trame pour impro longue",
        display: "fullscreen",
        icons: [
          { sizes: "192x192", src: "pwa-192x192.png", type: "image/png" },
          { sizes: "512x512", src: "pwa-512x512.png", type: "image/png" },
          {
            purpose: "maskable",
            sizes: "512x512",
            src: "maskable-icon-512x512.png",
            type: "image/png",
          },
        ],
        lang: "fr",
        name: "ImproLong",
        orientation: "landscape",
        short_name: "ImproLong",
        theme_color: "#000000",
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
