import { run } from "./runner.js";
import { logInfo } from "./logger.js";
import type { RunOptions } from "./types.js";

const MAX_SAFE_SESSIONS = 20;

function parseArgs(argv: string[]): RunOptions {
  const args = new Map<string, string>();
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args.set(match[1], match[2]);
  }

  const sessions = Number(args.get("sessions") ?? "3");
  const iterations = Number(args.get("iterations") ?? "1");

  return {
    baseUrl: args.get("baseUrl") ?? "https://pokero.pl",
    sessions,
    iterations,
    headless: (args.get("headless") ?? "true") !== "false",
    delayBetweenSessionsMs: Number(args.get("delayBetweenSessionsMs") ?? "1500"),
    scenarioFilter: args.get("scenario"),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.sessions > MAX_SAFE_SESSIONS) {
    logInfo(
      `Refusing to start ${options.sessions} concurrent sessions (safety cap is ${MAX_SAFE_SESSIONS}). ` +
        `Lower --sessions or raise MAX_SAFE_SESSIONS in src/cli.ts if you really need more, and make sure ` +
        `you have permission to load-test the target.`
    );
    process.exit(1);
  }

  await run(options);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
