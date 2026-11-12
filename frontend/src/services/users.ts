import type { RecordModel } from "pocketbase";
import type { User } from "../types/d.type";
import { pb } from "./pocketbase";

export type UserRecord = RecordModel & User & { created: string };

export const usersService = {
  list: () =>
    pb.collection("users").getFullList<UserRecord>({
      sort: "name",
      requestKey: null,
    }),
  remove: (id: string) => pb.collection("users").delete(id),
};
