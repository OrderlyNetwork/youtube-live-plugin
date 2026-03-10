import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.tsx"],
  splitting: false,
  format: ["cjs", "esm"],
  target: "es6",
  sourcemap: true,
  clean: !options.watch,
  dts: true,
  tsconfig: "tsconfig.json",
  external: [
    "react",
    "react-dom",
    "@orderly.network/plugin-core",
    "@orderly.network/hooks",
    "@orderly.network/i18n",
    "@orderly.network/ui",
    "@orderly.network/trading",
  ],
}));
