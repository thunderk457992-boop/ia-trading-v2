import { expect, test } from "@playwright/test"

test("register page lets the user resend a confirmation email", async ({ page }) => {
  await page.route("**/api/auth/resend-confirmation", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sent: true, accepted: true }),
    })
  })

  await page.goto("http://localhost:3000/register")
  await page.getByLabel("Email").fill("confirmation@example.com")
  await expect(page.getByTestId("resend-confirmation-button")).toBeEnabled()
  const resendResponse = page.waitForResponse("**/api/auth/resend-confirmation")
  await page.getByTestId("resend-confirmation-button").click()
  await resendResponse

  await expect(page.getByTestId("resend-confirmation-success")).toContainText(/boite mail/i)
  await expect(page.getByTestId("resend-confirmation-success")).toContainText(/spams/i)
})

test("login page shows a clear error if no email is provided for confirmation resend", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await expect(page.getByTestId("resend-confirmation-button")).toBeEnabled()
  await page.getByTestId("resend-confirmation-button").click()

  await expect(page.getByTestId("resend-confirmation-error")).toContainText(/entrez votre email/i)
})
