import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  images: ["public/favicon.svg"],
  preset: minimal2023Preset,
});
