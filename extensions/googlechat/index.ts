import type { OpenHedgehogPluginApi } from "openhedgehog/plugin-sdk";
import { emptyPluginConfigSchema } from "openhedgehog/plugin-sdk";
import { googlechatDock, googlechatPlugin } from "./src/channel.js";
import { handleGoogleChatWebhookRequest } from "./src/monitor.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "OpenHedgehog Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenHedgehogPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel({ plugin: googlechatPlugin, dock: googlechatDock });
    api.registerHttpHandler(handleGoogleChatWebhookRequest);
  },
};

export default plugin;
