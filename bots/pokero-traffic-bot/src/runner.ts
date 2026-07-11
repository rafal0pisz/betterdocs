import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Scenario, RunOptions } from "./types.js";
import { runStep } from "./actions.js";
import { logInfo } from "./logger.js";

const SCENARIOS_DIR = join(new URL(".", import.meta.url).pathname, "..", "scenarios");
const RESULTS_DIR = join(new URL(".", import.meta.url).pathname, "..", "results");

function loadScenarios(filter?: string): Scenario[] {
  const files = readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith(".json"));
  const scenarios = files.map((f) => JSON.parse(readFileSync(join(SCENARIOS_DIR, f), "utf-8")) as Scenario);
  if (!filter || filter === "all") return scenarios;
  const match = scenarios.filter((s) => s.name === filter);
  if (match.length === 0) {
    throw new Error(`No scenario named "${filter}" found in ${SCENARIOS_DIR}`);
  }
  return match;
}

function pickWeightedScenario(scenarios: Scenario[]): Scenario {
  const weights = scenarios.map((s) => s.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < scenarios.length; i++) {
    r -= weights[i];
    if (r <= 0) return scenarios[i];
  }
  return scenarios[scenarios.length - 1];
}

const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";

async function launchBrowser(headless: boolean) {
  try {
    return await chromium.launch({ headless });
  } catch {
    // Fall back to a pre-installed Chromium if the Playwright-bundled
    // revision isn't available locally (e.g. offline/sandboxed environments).
    return chromium.launch({ headless, executablePath: PREINSTALLED_CHROMIUM });
  }
}

async function runSession(
  sessionId: number,
  scenarios: Scenario[],
  options: RunOptions
): Promise<void> {
  const browser = await launchBrowser(options.headless);
  try {
    for (let iteration = 1; iteration <= options.iterations; iteration++) {
      const scenario = pickWeightedScenario(scenarios);
      const context = await browser.newContext();
      const page = await context.newPage();
      logInfo(`session=${sessionId} iter=${iteration} starting scenario "${scenario.name}"`);
      try {
        for (const step of scenario.steps) {
          await runStep(page, options.baseUrl, step, { sessionId, iteration });
        }
      } catch (err) {
        mkdirSync(RESULTS_DIR, { recursive: true });
        const screenshotPath = join(RESULTS_DIR, `error-session${sessionId}-iter${iteration}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath }).catch(() => {});
        logInfo(`session=${sessionId} iter=${iteration} scenario "${scenario.name}" FAILED: ${(err as Error).message} (screenshot: ${screenshotPath})`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

export async function run(options: RunOptions): Promise<void> {
  const scenarios = loadScenarios(options.scenarioFilter);
  logInfo(`Loaded ${scenarios.length} scenario(s): ${scenarios.map((s) => s.name).join(", ")}`);
  logInfo(`Starting ${options.sessions} session(s), ${options.iterations} iteration(s) each, headless=${options.headless}`);

  const sessionPromises: Promise<void>[] = [];
  for (let i = 1; i <= options.sessions; i++) {
    sessionPromises.push(runSession(i, scenarios, options));
    if (i < options.sessions && options.delayBetweenSessionsMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayBetweenSessionsMs));
    }
  }

  await Promise.all(sessionPromises);
  logInfo("All sessions finished.");
}
