import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // A copy of the backend's document; refresh it with `pnpm api:pull`.
  input: "./openapi.json",
  output: "src/lib/api/generated",
  plugins: [
    { name: "@hey-api/client-fetch", runtimeConfigPath: "@/lib/api/runtime-config" },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
