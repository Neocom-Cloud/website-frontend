import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.createContext();
const page = await context.newPage();

try {
  console.log("Opening http://localhost:5173/");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  console.log("✓ Page title:", title);
  
  const content = await page.content();
  if (content.includes("NeoCom")) {
    console.log("✓ NeoCom content found on page");
  }
  
  const url = page.url();
  console.log("✓ Final URL:", url);
  
  await page.screenshot({ path: "/tmp/website-screenshot.png", fullPage: true });
  console.log("✓ Screenshot saved to /tmp/website-screenshot.png");
  
} catch (error) {
  console.error("✗ Error:", error.message);
  process.exit(1);
} finally {
  await browser.close();
}
