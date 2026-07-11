export interface WaitStep {
  action: "wait";
  minMs: number;
  maxMs: number;
}

export interface GotoStep {
  action: "goto";
  path: string;
}

export interface ScrollStep {
  action: "scroll";
  mode: "human" | "toBottom" | "toTop" | "toSelector";
  /** total pixels to scroll for "human" mode */
  distance?: number;
  /** number of increments for "human" mode */
  steps?: number;
  /** required when mode is "toSelector" */
  selector?: string;
}

export interface ClickStep {
  action: "click";
  /** CSS selector matching one or more candidate elements */
  selector: string;
  /** how to pick among multiple matches */
  pick?: "first" | "random";
  /** if true, missing/absent element is skipped instead of failing the session */
  optional?: boolean;
  /** wait for navigation/network idle after the click */
  waitForNavigation?: boolean;
}

export type ScenarioStep = WaitStep | GotoStep | ScrollStep | ClickStep;

export interface Scenario {
  name: string;
  /** relative likelihood of this scenario being picked for a session */
  weight?: number;
  steps: ScenarioStep[];
}

export interface RunOptions {
  baseUrl: string;
  sessions: number;
  iterations: number;
  headless: boolean;
  delayBetweenSessionsMs: number;
  scenarioFilter?: string;
}

export interface ActionLogEntry {
  sessionId: number;
  iteration: number;
  action: string;
  detail: string;
  ok: boolean;
  timestampMs: number;
}
