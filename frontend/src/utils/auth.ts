import { pb } from "../services/pocketbase";

export type Role = "admin" | "user";

export const getRole = (): Role | null => {
  if (!pb.authStore.isValid) return null;
  const collection = pb.authStore.record?.collectionName;
  if (collection === "admins") return "admin";
  if (collection === "users") return "user";
  return null;
};

export const currentUserId = (): string | undefined => pb.authStore.record?.id;

export const currentUserRecord = () => pb.authStore.record;

export const currentUserIdentity = (): { name: string; username: string } => {
  const record = pb.authStore.record;
  return {
    name: (record?.name as string | undefined) ?? "",
    username: (record?.username as string | undefined) ?? "",
  };
};

export const currentUserName = (): string => {
  const record = pb.authStore.record;
  const name = (record?.name as string | undefined) ?? "";
  const username = (record?.username as string | undefined) ?? "";
  return name || username || record?.email || "";
};
