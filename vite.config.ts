import { defineConfig } from "vite";
import babel from "@rollup/plugin-babel";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CloudreveUploader",
      fileName: "uploader",
    },
  },
  plugins: [
    babel({
      babelHelpers: "bundled",
    }),
    dts(),
  ],
});
