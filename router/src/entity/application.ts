import { EntitySchema, getRepository } from "typeorm";
import Adapters from "next-auth/adapters";

export interface Application {
  id: string;
  ownerId: string;
  secret: string;
}

export const ApplicationEntity = new EntitySchema<Application>({
  name: "applications",
  columns: {
    id: {
      type: String,
      primary: true,
      // TODO use generation function
      generated: true,
    },
    ownerId: {
      type: String,
    },
    secret: {
      type: String,
      unique: true,
    },
  },
  indices: [{ columns: ["ownerId"] }],
  // TODO figure out how to relate to NextAuth models
  // relations: {
  //   ownerId: {
  //     type: "many-to-one",
  //     target: "users",
  //   },
  // },
});

export const applicationRepository = () =>
  getRepository<Application>(ApplicationEntity);
