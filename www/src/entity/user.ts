import { EntitySchema, getRepository } from "typeorm";

export interface OAuthToken {
  token: string;
  userId: string;
  clientId: string;
}

export const OAuthTokenEntity = new EntitySchema<OAuthToken>({
  name: "oauthToken",
  columns: {
    token: {
      type: String,
      unique: true,
    },
    clientId: {
      type: String,
    },
    userId: {
      type: String,
    },
  },
  indices: [{ name: "CLIENT_ID_USER_ID", columns: ["client_id", "user_id"] }],
});

export const oauthTokenEntity = () =>
  getRepository<OAuthToken>(OAuthTokenEntity);
