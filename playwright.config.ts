import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4323',
    // En CI, Chromium est installé par le workflow ; en local on garde Chrome.
    channel: process.env.CI ? undefined : 'chrome',
    headless: true,
  },
  webServer: {
    // En CI, dist/ est déjà construit par l'étape de build : on ne rebuilde pas.
    command: process.env.CI
      ? 'npx astro preview --port 4323'
      : 'npm run build && npx astro preview --port 4323',
    url: 'http://localhost:4323/education-musicale/',
    reuseExistingServer: false,
    timeout: 180000,
  },
});