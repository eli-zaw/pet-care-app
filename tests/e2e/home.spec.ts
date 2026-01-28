import { test } from '@playwright/test';
import { HomePage } from './pages/HomePage';

test.describe.parallel('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    await home.load();
  });

  test('CTA is visible and clickable', async ({ page }) => {
    const home = new HomePage(page);
    await home.load();
    await home.captureHeroSnapshot();
    await home.clickCTA();
  });
});
