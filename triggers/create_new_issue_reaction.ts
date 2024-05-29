// triggers/create_new_issue_shortcut.ts

import { Trigger } from "deno-slack-api/types.ts";
import CreateNewIssueWorkflow from "../workflows/create_new_issue.ts";

const createNewIssueShortcut: Trigger<
  typeof CreateNewIssueWorkflow.definition
> = {
  type: "shortcut",
  name: "Create GitHub issue",
  description: "Create a new GitHub issue in a repository",
  workflow: "#/workflows/create_new_issue_workflow",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
    channel: {
      value: "{{data.channel_id}}",
    },
    message_ts: {
      value: "{{data.message_ts}}",
    },
  },
};

export default createNewIssueShortcut;

// triggers/create_new_issue_reaction.ts

// import { Trigger } from "deno-slack-api/types.ts";
// import CreateNewIssueWorkflow from "../workflows/create_new_issue.ts";
// import { TriggerEventTypes, TriggerTypes, TriggerContextData } from "deno-slack-api/mod.ts";

// const createNewIssueReaction: Trigger<
//   typeof CreateNewIssueWorkflow.definition
// > = {
//   type: TriggerTypes.Event,
//   name: "Create GitHub issue on mango emoji",
//   description: "Create a new GitHub issue in a repository when the mango emoji is used",
//   event: {
//     event_type: TriggerEventTypes.ReactionAdded,
//     channel_ids: ["C074T0VQWG6"],
//     filter: {
//       version: 1,
//       root: {
//         and: [
//           {
//             statement: "{{data.reaction}} == mango",
//           },
//         ],
//       },
//     },
//   },
//   workflow: "#/workflows/create_new_issue_workflow",
//   inputs: {
//     // interactivity: {
//     //   value: "{{data.interactivity}}",
//     // },
//     channel: {
//       value: "{{data.channel_id}}",
//     },
//     message_ts: {
//       value: "{{data.message_ts}}",
//     },
//   },
// };

// export default createNewIssueReaction;
