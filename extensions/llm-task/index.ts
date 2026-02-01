import type { OpenHedgehogPluginApi } from "../../src/plugins/types.js";
import { createLlmTaskTool } from "./src/llm-task-tool.js";

export default function register(api: OpenHedgehogPluginApi) {
  api.registerTool(createLlmTaskTool(api), { optional: true });
}
