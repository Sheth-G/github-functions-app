import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { App } from "octokit";
import * as jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";

/**
 * Functions are reusable building blocks of automation that accept inputs,
 * perform calculations, and provide outputs. Functions can be used as steps in
 * a workflow or independently.
 * Learn more: https://api.slack.com/automation/functions/custom
 */

export const CreateIssueDefinition = DefineFunction({
  callback_id: "create_issue",
  title: "Create GitHub issue",
  description: "Create a new GitHub issue in a repository",
  source_file: "functions/create_issue.ts", // The file with the exported function handler
  input_parameters: {
    properties: {
      githubAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "github",
      },
      url: {
        type: Schema.types.string,
        description: "Repository URL",
      },
      title: {
        type: Schema.types.string,
        description: "Issue Title",
      },
      description: {
        type: Schema.types.string,
        description: "Issue Description",
      },
      assignees: {
        type: Schema.types.string,
        description: "Assignees",
      },
    },
    required: [
      "githubAccessTokenId",
      "url",
      "title",
    ],
  },
  output_parameters: {
    properties: {
      GitHubIssueNumber: {
        type: Schema.types.number,
        description: "Issue number",
      },
      GitHubIssueLink: {
        type: Schema.types.string,
        description: "Issue link",
      },
    },
    required: ["GitHubIssueNumber", "GitHubIssueLink"],
  },
});

/**
 * The default export for a custom function accepts a function definition
 * and a function handler that contains the custom logic for the function.
 */
export default SlackFunction(
  CreateIssueDefinition,
  async ({ inputs, client }) => {
    /**
     * Gather the stored external authentication access token using the access
     * token id passed from the workflow's input. This token can be used to
     * authorize requests made to an external service on behalf of the user.
     */
    const token = await client.apps.auth.external.get({
      external_token_id: inputs.githubAccessTokenId,
    });

    function generateJWT(privateKey: string, appId: string): string | null {
      try {
        const payload = {
          // Issued at time
          iat: Math.floor(Date.now() / 1000),
          // JWT expiration time (10 minutes maximum)
          exp: Math.floor(Date.now() / 1000) + 600,
          // GitHub App's identifier
          iss: appId,
        };

        const encodedJwt = jwt.sign(payload, privateKey, {
          algorithm: "RS256",
        });

        return encodedJwt;
      } catch (error: any) {
        console.error("Error generating JWT:", error.message);
        return null;
      }
    }

    const app = new App({
      appId: "716791",
      privateKey:
        "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAyrb1Xpo4SzdiwBFyPur9z9GxdMOxI6DyHNGB4Xqst6FU81ae\nWOzyh5nomAhHv7LXKiBmP/y3eHbtFSswnJM07k9baECFm4xA3xzH7CZ9Bsn+rmUC\nDIbD7fVOEp3DGdy5EqoMUVy2XBm+0r51gw5pPqWm9/K67bPLHR6EutdkXqPajSac\ngF/18l+zWlTR0h5J/gh77tEzaDQGhX0HPohUrO3g9extv/LwDl2RwilL2PsFyeo9\n/KsYY4csG6cgC2mTbOZwAcNa3MJXnT8GcdbRHoCD1QISlonxnEuDB/imOaDeuq4l\n0S/3hR1tGZbonTqOkmpUjOq70y2e7OtWj9Ha0QIDAQABAoIBACJOUjofWVWJWwHs\nMexp8mhAMYr0Lz87Vp3/6r4Q97ff6rN/vi6Icwb1ygIorJPJnVY4w3UivJ37amYB\nuClXVEbcUTjUaogHdVcM1NynKtOCTcKPv4gFKpVTxVGrN0BiNUPuWUVPrmDpznx1\n1QdH4hHDEP23K2Fc4wvbhVTlbMwDG6TlaiqovIhH7vAt1M67MeOyT4ymQ17s4+OS\n/pT4trJ8L65m0gTYH1jegHFq/JMKJcnIV+BQqJZzH1KrHU6Ll3Q70Ea0UZCuM4LD\n9w3X5EgK/oOLNXWoUeYLodhXpcUPz8EFxq7L2Tk/icU1lZ0F1frQMWqGbtwK1GW+\nkbhCetECgYEA7eyG/bd7dsd5pBewf2HOzWfKmJTeK/tLCWmjJKJrpehVy1nrOrxm\nVMsBnA3BNLBVl1A7MSBmFqM4xlaow13EJpNkL8D9SmkGJZhdoZ74uSl1g6CEnjKa\n0akl7PYGTS6gEN9kdU+iCphnsZlJmBn7ls3ir0TN40ykilhK6IC6URUCgYEA2h2i\nEMLHM5jxHFhYFU4gVt+u79zTzIQxj+XvTS3d3JqQmiGi+EFhzvdsdL+pHKy6AFqR\nB1oNiyeOxyIeVLMqQsaNbxLxUDQ4L7BGVanUU72SM3UOYpMGp8cSStjgjJdfg05o\nU2dvx7zYAikLcXWeCqgcub0YOHcrkOLCX1wcec0CgYBsAAMi5ogH2fKQlyRKHmbW\nfLfNXT4grthX9HjW51eAHx/ax/1sUxsMgH5BjUjXlvezUPsdiLxuqDbcaXf//u9M\nJ3nB55PSlCvzIt/VvqjevEAYuOOaQBRg+aw6jU8899426oDac4R11Mq1JoTuo1S+\nFsVAlDX1aNQD7KJMOirZJQKBgQCZ+4+dm5S8NX4Kj8fnipdEHXhH+DNCUBUZTK/r\nYbUed7QcTCDceHQPhBd6OJCwILTTaRy3/vhOxCeFJ+4Xx8DPEZNp1gqsn6EG8cBF\n27Z9Q/kCAOKd7sQlEGI2mvOz7W3Nqj32m7CLZyNsKwPcHrfrOBHHgtqlimQkTiIA\n5mtoBQKBgQCqz3MfkQ0VH5msx5hA1JPNNhRPrapbDBi00s2jd+DvzaWIHQxvgeMI\nmA3APsF7jz3h63y2IT4mF1+Y44Q4SMjuitGvvtCQdCp8z3QxnXRHpafy6Q+GpSlB\nwkNL5WkTxkSJ4NGRWuqDPzFJQxoM3exGqX0zSOgLwzdIf6ZrtlSdlA==\n-----END RSA PRIVATE KEY-----",
    });

    const check_github_bot_installation = async (
      repo_owner: string,
      repo_name: string,
    ) => {
      try {
        const appId = "716791";
        const privateKey =
          "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAyrb1Xpo4SzdiwBFyPur9z9GxdMOxI6DyHNGB4Xqst6FU81ae\nWOzyh5nomAhHv7LXKiBmP/y3eHbtFSswnJM07k9baECFm4xA3xzH7CZ9Bsn+rmUC\nDIbD7fVOEp3DGdy5EqoMUVy2XBm+0r51gw5pPqWm9/K67bPLHR6EutdkXqPajSac\ngF/18l+zWlTR0h5J/gh77tEzaDQGhX0HPohUrO3g9extv/LwDl2RwilL2PsFyeo9\n/KsYY4csG6cgC2mTbOZwAcNa3MJXnT8GcdbRHoCD1QISlonxnEuDB/imOaDeuq4l\n0S/3hR1tGZbonTqOkmpUjOq70y2e7OtWj9Ha0QIDAQABAoIBACJOUjofWVWJWwHs\nMexp8mhAMYr0Lz87Vp3/6r4Q97ff6rN/vi6Icwb1ygIorJPJnVY4w3UivJ37amYB\nuClXVEbcUTjUaogHdVcM1NynKtOCTcKPv4gFKpVTxVGrN0BiNUPuWUVPrmDpznx1\n1QdH4hHDEP23K2Fc4wvbhVTlbMwDG6TlaiqovIhH7vAt1M67MeOyT4ymQ17s4+OS\n/pT4trJ8L65m0gTYH1jegHFq/JMKJcnIV+BQqJZzH1KrHU6Ll3Q70Ea0UZCuM4LD\n9w3X5EgK/oOLNXWoUeYLodhXpcUPz8EFxq7L2Tk/icU1lZ0F1frQMWqGbtwK1GW+\nkbhCetECgYEA7eyG/bd7dsd5pBewf2HOzWfKmJTeK/tLCWmjJKJrpehVy1nrOrxm\nVMsBnA3BNLBVl1A7MSBmFqM4xlaow13EJpNkL8D9SmkGJZhdoZ74uSl1g6CEnjKa\n0akl7PYGTS6gEN9kdU+iCphnsZlJmBn7ls3ir0TN40ykilhK6IC6URUCgYEA2h2i\nEMLHM5jxHFhYFU4gVt+u79zTzIQxj+XvTS3d3JqQmiGi+EFhzvdsdL+pHKy6AFqR\nB1oNiyeOxyIeVLMqQsaNbxLxUDQ4L7BGVanUU72SM3UOYpMGp8cSStjgjJdfg05o\nU2dvx7zYAikLcXWeCqgcub0YOHcrkOLCX1wcec0CgYBsAAMi5ogH2fKQlyRKHmbW\nfLfNXT4grthX9HjW51eAHx/ax/1sUxsMgH5BjUjXlvezUPsdiLxuqDbcaXf//u9M\nJ3nB55PSlCvzIt/VvqjevEAYuOOaQBRg+aw6jU8899426oDac4R11Mq1JoTuo1S+\nFsVAlDX1aNQD7KJMOirZJQKBgQCZ+4+dm5S8NX4Kj8fnipdEHXhH+DNCUBUZTK/r\nYbUed7QcTCDceHQPhBd6OJCwILTTaRy3/vhOxCeFJ+4Xx8DPEZNp1gqsn6EG8cBF\n27Z9Q/kCAOKd7sQlEGI2mvOz7W3Nqj32m7CLZyNsKwPcHrfrOBHHgtqlimQkTiIA\n5mtoBQKBgQCqz3MfkQ0VH5msx5hA1JPNNhRPrapbDBi00s2jd+DvzaWIHQxvgeMI\nmA3APsF7jz3h63y2IT4mF1+Y44Q4SMjuitGvvtCQdCp8z3QxnXRHpafy6Q+GpSlB\nwkNL5WkTxkSJ4NGRWuqDPzFJQxoM3exGqX0zSOgLwzdIf6ZrtlSdlA==\n-----END RSA PRIVATE KEY-----";
        const encodedJwt = generateJWT(privateKey, appId);
        const octokit = new Octokit({
          auth: encodedJwt,
        });
        const response = await octokit.request(
          "GET /repos/{owner}/{repo}/installation",
          {
            owner: repo_owner,
            repo: repo_name,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );
        const installationId = response.data.id;
        return installationId;
      } catch (error: any) {
        if (error.status === 404) {
          return 0;
        }
      }
    };

    if (!token.ok) throw new Error("Failed to access auth token");

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.external_token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const { url, title, description, assignees } = inputs;

    try {
      const { hostname, pathname } = new URL(url);
      const [_, owner, repo] = pathname.split("/");

      const INSTALLATION_ID = await check_github_bot_installation(owner, repo);
      const octokit = await app.getInstallationOctokit(INSTALLATION_ID);

      // https://docs.github.com/en/enterprise-server@3.3/rest/guides/getting-started-with-the-rest-api
      // const apiURL = hostname === "github.com"
      //   ? "api.github.com"
      //   : `${hostname}/api/v3`;

      // // https://docs.github.com/en/rest/issues/issues#create-an-issue
      // const issueEndpoint = `https://${apiURL}/repos/${owner}/${repo}/issues`;

      // const body = JSON.stringify({
      //   title,
      //   body: description,
      //   assignees: assignees?.split(",").map((assignee: string) => {
      //     return assignee.trim();
      //   }),
      // });

      // const issue = await fetch(issueEndpoint, {
      //   method: "POST",
      //   headers,
      //   body,
      // }).then((res: Response) => {
      //   if (res.status === 201) return res.json();
      //   else throw new Error(`${res.status}: ${res.statusText}`);
      // });
      const issue = await octokit.request("POST /repos/{owner}/{repo}/issues", {
        owner,
        repo,
        title: title,
        body: description,

        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
        .then((response) => {
          if (response.status === 201) return response.data;
          else throw new Error(`Error occured during github auth`);
        });

      return {
        outputs: {
          GitHubIssueNumber: issue.number,
          GitHubIssueLink: issue.html_url,
        },
      };
    } catch (err) {
      console.error(err);
      return {
        error:
          `An error was encountered during issue creation: \`${err.message}\``,
      };
    }
  },
);
