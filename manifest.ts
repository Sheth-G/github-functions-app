import { Manifest } from "deno-slack-sdk/mod.ts";
import CreateIssueDefinition from "./functions/create_issue/definition.ts";
import CreateNewIssueWorkflow from "./workflows/create_new_issue.ts";
import { FetchThreadDefinition } from "./functions/fetch_thread.ts";
export default Manifest({
  name: "Workflows for GitHub",
  description: "Bringing oft-used GitHub functionality into Slack",
  icon: "assets/icon.png",
  functions: [CreateIssueDefinition, FetchThreadDefinition],
  workflows: [CreateNewIssueWorkflow],
  // If your organizaiton uses a separate Github enterprise domain, add that domain to this list
  // so that functions can make API calls to it.
  outgoingDomains: [
    "api.github.com",
    "app.dev.enterprisegpt.com",
    "torvalds-dev-nl-ghco-nl-ghcos-projects.vercel.app",
  ],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "reactions:read",
    "channels:read",
    "channels:history",
    "team:read",
  ],
});
