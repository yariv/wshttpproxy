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
      primary: true,
    },
    clientId: {
      type: String,
      primary: true,
    },
    userId: {
      type: String,
    },
  },
  indices: [{ name: "clientId_userId", columns: ["clientId", "userId"] }],
});

export const oauthTokenRepository = () =>
  getRepository<OAuthToken>(OAuthTokenEntity);
