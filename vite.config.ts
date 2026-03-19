import { nodePolyfills } from "vite-plugin-node-polyfills";

/** Provide a plain Vite config object with Node polyfills for browser compatibility. */
export default {
  plugins: [
    nodePolyfills({
      include: ["path", "stream", "util", "assert", "crypto", "buffer"],
      exclude: ["http"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
};
