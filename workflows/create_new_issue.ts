import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateIssueDefinition } from "../functions/create_issue.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import fetchThread, {
  FetchThreadDefinition,
} from "../functions/fetch_thread.ts"; // Ensure correct import

/**
 * A workflow is a set of steps that are executed in order. Each step in a
 * workflow is a function – either a built-in or custom function.
 * Learn more: https://api.slack.com/automation/workflows
 */
const CreateNewIssueWorkflow = DefineWorkflow({
  callback_id: "create_new_issue_workflow",
  title: "Create new issue",
  description: "Create a new GitHub issue",
  input_parameters: {
    properties: {
      /**
       * This workflow users interactivity to collect input from the user.
       * Learn more: https://api.slack.com/automation/forms#add-interactivity
       */
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      message_ts: { type: Schema.types.string },
    },
    required: ["interactivity", "channel", "message_ts"],
  },
});

const fetchThreadStep = CreateNewIssueWorkflow.addStep(FetchThreadDefinition, {
  channel: CreateNewIssueWorkflow.inputs.channel,
  thread_ts: CreateNewIssueWorkflow.inputs.message_ts,
  interactivity: CreateNewIssueWorkflow.inputs.interactivity,
});

/**
 * Collecting input from users can be done with the built-in OpenForm function
 * as the first step.
 * Learn more: https://api.slack.com/automation/functions#open-a-form
 */

const issueFormData = CreateNewIssueWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Create an issue",
    interactivity: fetchThreadStep.outputs.interactivity,
    submit_label: "Create",
    description: "Create a new issue inside of a GitHub repository",
    fields: {
      elements: [{
        name: "url",
        title: "Repository URL",
        description: "desv",
        type: Schema.types.string,
        format: "url",
      }, {
        name: "title",
        title: "Issue title",
        type: Schema.types.string,
        default: fetchThreadStep.outputs.iss_title,
      }, {
        name: "description",
        title: "Issue description",
        type: Schema.types.string,
        default: fetchThreadStep.outputs.iss_desc,
        long: true,
      }, {
        name: "assignees",
        title: "Issue assignees",
        description:
          "GitHub username(s) of the user(s) to assign the issue to (separated by commas)",
        type: Schema.types.string,
      }],
      required: ["url", "title", "description"],
    },
  },
);

/**
 * A custom function can be added as a workflow step to modify input data,
 * interact with an external API, and return responses from the API for use in
 * later steps.
 * Learn more: https://api.slack.com/automation/functions/custom
 */
const issue = CreateNewIssueWorkflow.addStep(CreateIssueDefinition, {
  /**
   * The credential source defines which external authentication tokens are
   * passed to the function. These are automatically injected at runtime.
   * Learn more: https://api.slack.com/automation/external-auth#workflow
   */
  githubAccessTokenId: {
    credential_source: "DEVELOPER",
  },
  url: issueFormData.outputs.fields.url,
  title: issueFormData.outputs.fields.title,
  description: issueFormData.outputs.fields.description,
  assignees: issueFormData.outputs.fields.assignees,
});

/**
 * Messages can be sent into a channel with the built-in SendMessage function.
 * Learn more: https://api.slack.com/automation/functions#catalog
 */
CreateNewIssueWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: CreateNewIssueWorkflow.inputs.channel,
  message:
    `Issue #${issue.outputs.GitHubIssueNumber} has been successfully created\n` +
    `Link to issue: ${issue.outputs.GitHubIssueLink}`,
});

export default CreateNewIssueWorkflow;
