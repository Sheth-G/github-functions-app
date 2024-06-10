import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const FetchThreadDefinition = DefineFunction({
  callback_id: "fetch_thread",
  title: "Fetch Slack Message Thread",
  description: "Fetch all messages in a Slack thread and concatenate them",
  source_file: "functions/fetch_thread.ts", // The file with the exported function handler
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description: "ID of the channel where the thread is located",
      },
      thread_ts: {
        type: Schema.types.string,
        description: "Timestamp of the thread to fetch",
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["channel", "thread_ts", "interactivity"],
  },
  output_parameters: {
    properties: {
      thread: {
        type: Schema.types.string,
        description: "Concatenated messages from the thread",
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      iss_title: {
        type: Schema.types.string,
      },
      iss_desc: {
        type: Schema.types.string,
      },
    },
    required: ["thread", "interactivity", "iss_title", "iss_desc"],
  },
});

export default SlackFunction(
  FetchThreadDefinition,
  async ({ inputs, client }) => {
    try {
      let { channel, thread_ts, interactivity } = inputs;

      // Fetch the message details to get the thread_ts
      const messageResult = await client.conversations.history({
        channel: channel,
        latest: thread_ts,
        inclusive: true,
        limit: 1,
      });

      if (!messageResult.ok) {
        throw new Error(`Failed to fetch message: ${messageResult.error}`);
      }

      const message = messageResult.messages[0];
      // thread_ts = message.thread_ts || thread_ts; // Use thread_ts if it exists, else use message_ts

      // // Fetch all messages in the thread from the Slack API
      // const threadResult = await client.conversations.replies({
      //   channel: channel,
      //   ts: thread_ts,
      // });

      // if (!threadResult.ok) {
      //   throw new Error(`Failed to fetch thread: ${threadResult.error}`);
      // }

      // const messages = threadResult.messages || [];
      // Concatenate all messages in the thread into a single string
      // messages.pop(); // Remove the last message

      // const threadText = messages.map((msg) => msg.text).join(" . ");

      const threadText = message.text;
      const teamResult = await client.team.info();

      if (!teamResult.ok) {
        throw new Error(`Failed to fetch team info: ${teamResult.error}`);
      }

      const team_id = teamResult.team.id;

      const response = await fetch(
        "https://torvalds.dev/api/populate_github_title_and_description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel_id: "C06EEUJTNGJ",
            team_id: "T06E4RAA0M8",
            user_query: threadText,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to send data to external API: ${response.statusText}`,
        );
      }
      const apiResponse = await response.json();
      console.log(apiResponse);

      return {
        outputs: {
          thread: threadText,
          interactivity: inputs.interactivity,
          iss_title: apiResponse.title,
          iss_desc: apiResponse.description,
        },
      };
    } catch (error) {
      console.error("Error fetching thread:", error);
      return {
        outputs: {
          thread: "",
          interactivity: inputs.interactivity,
          iss_title: "",
          iss_desc: "",
        },
      };
    }
  },
);
