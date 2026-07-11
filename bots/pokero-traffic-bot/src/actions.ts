import type { Page } from "playwright";
import type { ActionLogEntry, ScenarioStep } from "./types.js";
import { logAction } from "./logger.js";

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

async function humanWait(page: Page, minMs: number, maxMs: number): Promise<void> {
  await page.waitForTimeout(randomBetween(minMs, maxMs));
}

async function humanScroll(page: Page, distance: number, steps: number): Promise<void> {
  const perStep = Math.max(1, Math.floor(distance / steps));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, perStep);
    await page.waitForTimeout(randomBetween(150, 500));
  }
}

async function pickElement(
  page: Page,
  selector: string,
  pick: "first" | "random"
) {
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count === 0) return null;
  const index = pick === "random" ? randomBetween(0, count) : 0;
  return locator.nth(index);
}

export async function runStep(
  page: Page,
  baseUrl: string,
  step: ScenarioStep,
  ctx: { sessionId: number; iteration: number }
): Promise<void> {
  const timestampMs = Date.now();

  switch (step.action) {
    case "goto": {
      const url = new URL(step.path, baseUrl).toString();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        logAction({ ...ctx, action: "goto", detail: url, ok: true, timestampMs });
      } catch (err) {
        logAction({ ...ctx, action: "goto", detail: `${url} (${(err as Error).message})`, ok: false, timestampMs });
        throw err;
      }
      break;
    }

    case "wait": {
      await humanWait(page, step.minMs, step.maxMs);
      logAction({ ...ctx, action: "wait", detail: `${step.minMs}-${step.maxMs}ms`, ok: true, timestampMs });
      break;
    }

    case "scroll": {
      try {
        if (step.mode === "human") {
          await humanScroll(page, step.distance ?? 600, step.steps ?? 5);
        } else if (step.mode === "toBottom") {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        } else if (step.mode === "toTop") {
          await page.evaluate(() => window.scrollTo(0, 0));
        } else if (step.mode === "toSelector" && step.selector) {
          await page.locator(step.selector).first().scrollIntoViewIfNeeded();
        }
        logAction({ ...ctx, action: "scroll", detail: step.mode, ok: true, timestampMs });
      } catch (err) {
        logAction({ ...ctx, action: "scroll", detail: `${step.mode} (${(err as Error).message})`, ok: false, timestampMs });
      }
      break;
    }

    case "click": {
      const element = await pickElement(page, step.selector, step.pick ?? "first");
      if (!element) {
        if (step.optional) {
          logAction({ ...ctx, action: "click", detail: `${step.selector} (not found, skipped)`, ok: true, timestampMs });
          break;
        }
        logAction({ ...ctx, action: "click", detail: `${step.selector} (not found)`, ok: false, timestampMs });
        throw new Error(`Element not found for selector: ${step.selector}`);
      }
      try {
        if (step.waitForNavigation) {
          await Promise.all([
            page.waitForLoadState("domcontentloaded"),
            element.click({ timeout: 5000 }),
          ]);
        } else {
          await element.click({ timeout: 5000 });
        }
        logAction({ ...ctx, action: "click", detail: step.selector, ok: true, timestampMs });
      } catch (err) {
        logAction({ ...ctx, action: "click", detail: `${step.selector} (${(err as Error).message})`, ok: !!step.optional, timestampMs });
        if (!step.optional) throw err;
      }
      break;
    }
  }
}
