import { google } from "googleapis";
import fs from "fs";

const config = {
  googleConfigFilePath: ".google_config.json",
};

// export const googleConfig = JSON.parse(
//   fs.readFileSync(process.cwd() + "/" + config.googleConfigFilePath, "utf8")
// ).web;
export const googleConfig = {
  client_id: "a",
  client_secret: "b",
  redirect_uris: ["c"],
};
export const oauth2Client = new google.auth.OAuth2(
  googleConfig.client_id,
  googleConfig.client_secret,
  googleConfig.redirect_uris[0]
);
