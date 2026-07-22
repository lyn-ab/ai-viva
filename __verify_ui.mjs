import { chromium } from "playwright";

const shotDir = "C:\\Users\\Lynn\\AppData\\Local\\Temp\\claude\\c--Users-Lynn-ai-viva\\fc21f4e9-43ca-49e1-b29f-a92b67536e08\\scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto("http://localhost:3000/courses/c-001", { waitUntil: "networkidle" });

const assignmentsTabBtn = page.getByRole("button", { name: /assignments/i }).first();
if (await assignmentsTabBtn.count()) {
  await assignmentsTabBtn.click();
}

await page.getByRole("button", { name: /create assignment/i }).click();
await page.waitForSelector("text=Create assignment");
await page.screenshot({ path: `${shotDir}/01-details-tab.png` });

await page.getByRole("button", { name: /^Content$/i }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/02-content-tab.png` });

const otherLabel = page.locator("label", { hasText: "Other" });
await otherLabel.locator('input[type="checkbox"]').check();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/03-other-material.png` });
await page.fill('input[placeholder="Describe the required material"]', "Design mockups");

await page.getByRole("button", { name: /Rubric & AI focus/i }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/04-rubric-tab.png` });

await page.getByRole("button", { name: /add criterion/i }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/05-rubric-added.png` });

const weightInputs = page.locator('input[type="number"][max="100"]');
const count = await weightInputs.count();
console.log("Number of rubric weight inputs:", count);
for (let i = 0; i < count; i++) {
  console.log(`weight[${i}] =`, await weightInputs.nth(i).inputValue());
}

await weightInputs.nth(0).fill("70");
await page.keyboard.press("Tab");
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/06-rubric-commit.png` });

for (let i = 0; i < count; i++) {
  console.log(`after commit weight[${i}] =`, await weightInputs.nth(i).inputValue());
}

await page.getByRole("button", { name: /^Details$/i }).hover();
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/07-tab-hover.png` });

await browser.close();
console.log("DONE");
