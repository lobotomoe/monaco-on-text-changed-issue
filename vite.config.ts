import { PluginOption, defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import url from "url";

import * as fs from "fs";
import pkg from "./package.json" assert { type: "json" };
import type { Plugin } from "esbuild";
import { resolve } from "import-meta-resolve";

const localDependencies = Object.entries(pkg.dependencies)
  .filter(([, version]) => version.startsWith("file:../"))
  .map(([name]) => name);

const importMetaUrlEsBuildPlugin: Plugin = {
  name: "import-meta-url",
  setup({ onLoad }) {
    onLoad({ filter: /.*\.(js|jsx)$/, namespace: "file" }, async (args) => {
      const code = fs.readFileSync(args.path, "utf8");

      const assetImportMetaUrlRE =
        /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/g;
      let i = 0;
      let newCode = "";
      for (
        let match = assetImportMetaUrlRE.exec(code);
        match != null;
        match = assetImportMetaUrlRE.exec(code)
      ) {
        newCode += code.slice(i, match.index);

        const [, result] = match;
        if (result === undefined) {
          throw new Error(
            `Could not match the URL in ${args.path} at ${match.index} with ${match[0]}`
          );
        }
        const path = result.slice(1, -1);
        const resolved = resolve!(
          path,
          url.pathToFileURL(args.path).toString()
        );

        newCode += `new URL(${JSON.stringify(
          url.fileURLToPath(resolved)
        )}, import.meta.url)`;

        i = assetImportMetaUrlRE.lastIndex;
      }
      newCode += code.slice(i);

      const loader = args.path.endsWith(".jsx") ? "jsx" : "js";

      return {
        contents: newCode,
        loader,
      };
    });
  },
};

const vitePluginTreatJsFilesAsJsx: PluginOption = {
  name: "treat-js-files-as-jsx",
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null;

    // Use the exposed transform from vite, instead of directly
    // transforming with esbuild
    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
};
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vitePluginTreatJsFilesAsJsx, react()],
  optimizeDeps: {
    force: true,
    // This is require because vite excludes local dependencies from being optimized
    // Monaco-vscode-api packages are local dependencies and the number of modules makes chrome hang
    include: [
      // add all local dependencies...
      ...localDependencies,
      // and their exports
      "vscode/extensions",
      "vscode/services",
      "vscode/monaco",
      "vscode/localExtensionHost",

      // These 2 lines prevent vite from reloading the whole page when starting a worker (so 2 times in a row after cleaning the vite cache - for the editor then the textmate workers)
      // it's mainly empirical and probably not the best way, fix me if you find a better way
      "vscode-textmate",
      "vscode-oniguruma",
      // '@vscode/vscode-languagedetection',
    ],
    exclude: [],
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
      plugins: [importMetaUrlEsBuildPlugin],
    },
  },
  define: {
    rootDirectory: JSON.stringify(__dirname),
  },
  publicDir: "public",
  server: {
    port: 3010,
  },
});
