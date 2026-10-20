import path from "path"
import { execFileSync } from "node:child_process"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "electra-deployment-version",
      generateBundle() {
        let commit = process.env.RENDER_GIT_COMMIT || "unknown"
        if (commit === "unknown") {
          try {
            commit = execFileSync("git", ["rev-parse", "HEAD"], {
              cwd: import.meta.dirname,
              encoding: "utf8",
            }).trim()
          } catch {
            // Source archives may not include Git metadata.
          }
        }
        this.emitFile({
          type: "asset",
          fileName: "deployment.json",
          source: JSON.stringify({
            application: "Electra — The Power Observatory",
            sourceDirectory: "energy-bot-app",
            commit,
          }, null, 2),
        })
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
