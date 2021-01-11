import { EntitySchema, getRepository } from "typeorm";

export interface OAuthToken {
  tokenHash: string;
  userId: number;
  clientId: string;
}

export const OAuthTokenEntity = new EntitySchema<OAuthToken>({
  name: "oauthToken",
  columns: {
    tokenHash: {
      type: String,
      primary: true,
    },
    clientId: {
      type: String,
      unique: true,
    },
    userId: {
      type: Number,
    },
  },
  indices: [{ name: "clientId_userId", columns: ["clientId", "userId"] }],
});

export const oauthTokenRepository = () =>
  getRepository<OAuthToken>(OAuthTokenEntity);
