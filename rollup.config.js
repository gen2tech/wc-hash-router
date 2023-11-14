// Contents of the file /rollup.config.js
import typescript from '@rollup/plugin-typescript';
import esbuild from 'rollup-plugin-esbuild';
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
const config = [
  {
    input: "transpiled/index.js",
    output: [
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.mjs",
        format: "es",
        sourcemap: true,
      },
    ],
    external: ["@stencil/core"],
    plugins: [
      typescript({
        rootDir: "./transpiled",
        declaration: true,
        declarationMap: true,
      }),
      esbuild(),
      terser(),
    ],
  },
  {
    input: "transpiled/index.js",
    //input: "transpiled/types.js",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
export default config;