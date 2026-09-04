import { expect, test } from '@playwright/test'

test('кабинет /cn/ отдаёт оболочку', async ({ page }) => {
  const response = await page.goto('/cn/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('#root')).toBeVisible()
})
