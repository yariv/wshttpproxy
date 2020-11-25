import { EntitySchema, getRepository } from "typeorm";

export interface User {
  id: number;
  name: string;
}

export const UserEntity = new EntitySchema<User>({
  name: "user",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: {
      type: String,
    },
  },
});

export const userRepository = getRepository<User>(UserEntity);
