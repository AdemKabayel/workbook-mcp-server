import { test, expect } from '@applitools/eyes-playwright/fixture';
import path from 'path';
import fs from 'fs';

/**
 * Uploads a workbook produced by the workbook-tools MCP server (generate_workbook,
 * fixed seed) into the workbook-viewer app and visually validates the rendered view.
 *
 * WORKBOOK points at the .xlsx to upload; it defaults to the seeded workbook.
 * The test name is fixed so every run with the same seed compares to one baseline.
 */
const workbookPath = path.resolve(
  __dirname,
  '../..',
  process.env.WORKBOOK ?? 'generated-workbooks/eyes-visual-test.xlsx',
);

test('viewer renders seeded workbook', async ({ page, eyes }) => {
  expect(fs.existsSync(workbookPath), `workbook not found: ${workbookPath}`).toBeTruthy();

  // 2. Open the viewer
  await page.goto('/');
  await expect(page).not.toHaveTitle(/error/i);

  // 3. Upload the workbook and click to view
  await page.locator('input[type="file"]').setInputFiles(workbookPath);
  await page.getByRole('button', { name: /view/i })
    .or(page.getByRole('link', { name: /view/i }))
    .first()
    .click();

  // Wait for the workbook contents to render (first generated header).
  await expect(page.getByText('Order ID').first()).toBeVisible();
  await page.waitForLoadState('networkidle');

  // 4. Visual validation with Applitools Eyes
  await eyes.check('Workbook view', { fully: true });
});
