import { EntitySchema, getRepository } from "typeorm";

export interface OAuthToken {
  token: string;
  userId: number;
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
      type: Number,
    },
  },
  indices: [{ name: "clientId_userId", columns: ["clientId", "userId"] }],
});

export const oauthTokenRepository = () =>
  getRepository<OAuthToken>(OAuthTokenEntity);
