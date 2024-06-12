import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Define the custom function for posting an issue update in a thread.
 */
export const PostIssueUpdateFunction = DefineFunction({
  callback_id: "post_issue_update_function",
  title: "Post Issue Update",
  description: "Post the GitHub issue update in the original thread",
  source_file: "functions/post_issue_update.ts",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Slack channel ID",
      },
      thread_ts: {
        type: Schema.types.string,
        description: "Slack thread timestamp",
      },
      issue_number: {
        type: Schema.types.string,
        description: "GitHub issue number",
      },
      issue_link: {
        type: Schema.types.string,
        description: "Link to the GitHub issue",
      },
    },
    required: ["channel_id", "thread_ts", "issue_number", "issue_link"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * Implement the custom function for posting an issue update in a thread.
 */
export default SlackFunction(
  PostIssueUpdateFunction,
  async ({ inputs, client }) => {
    const { channel_id, thread_ts, issue_number, issue_link } = inputs;

    // Post message in thread
    const response = await client.chat.postMessage({
      channel: channel_id,
      thread_ts: thread_ts,
      text:
        `Issue #${issue_number} has been successfully created\nLink to issue: ${issue_link}`,
      unfurl_links: false,
    });

    if (!response.ok) {
      throw new Error(`Failed to post message: ${response.error}`);
    }

    return {
      outputs: {},
    };
  },
);
