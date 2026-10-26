import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chrome',
    headless: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/education-musicale/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});