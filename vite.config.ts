import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

interface StaticSiteModule {
  createStaticPagesPlugin(rootDir: string): unknown;
  generateStaticFiles(rootDir: string): Promise<void>;
  getViteInputMap(rootDir: string): Record<string, string>;
}

export default defineConfig(async () => {
  const staticSiteModuleUrl = new URL("./scripts/static-site.mjs", import.meta.url)
    .href;
  const staticSite = (await import(staticSiteModuleUrl)) as StaticSiteModule;

  await staticSite.generateStaticFiles(__dirname);

  return {
    plugins: [react(), staticSite.createStaticPagesPlugin(__dirname)],
    test: {
      environment: "jsdom",
      globals: true,
      exclude: [...configDefaults.exclude, "tests/build-output.test.mjs"],
      setupFiles: ["./src/test/setup.ts"]
    },
    build: {
      rollupOptions: {
        input: staticSite.getViteInputMap(resolve(__dirname))
      }
    }
  };
});
