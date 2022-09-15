import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import https from "node:https";

/**
 * Send notification to mattermost if webhook env is specified
 * @param {*} date
 * @param {*} error
 */
export const notifyMattermost = (date, error) => {
  if (process.env.MATTERMOST_HOOK_URL) {
    // Send out notification
    let data;
    if (error) {
      data = JSON.stringify({
        text: `:x: Error while running archive script: ${error}`,
      });
    } else {
      data = JSON.stringify({
        text: `:white_check_mark: Successfully created archive for \`${date}\` :tada:`,
      });
    }

    const options = {
      hostname: process.env.MATTERMOST_HOOK_URL,
      port: 443,
      path: `/hooks/${process.env.MATTERMOST_HOOK_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options);
    req.write(data);
    req.end();
  }
};
