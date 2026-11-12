import type { RecordModel } from "pocketbase";
import type { User } from "../types/d.type";
import { pb } from "./pocketbase";

export interface Invite {
  id: string;
  token: string;
  expiresAt: string;
  usedBy?: string;
  usedAt?: string;
  expand?: { usedBy?: User };
}

export type InviteRecord = RecordModel & Invite;

export interface InviteCheck {
  valid: boolean;
  reason?: string;
  expiresAt?: string;
}

export const invitesService = {
  list: () =>
    pb.collection("invites").getFullList<InviteRecord>({
      // invites has no autodate created field; newest expiry is close enough.
      sort: "-expiresAt",
      expand: "usedBy",
      requestKey: null,
    }),
  create: () =>
    pb.collection("invites").create<InviteRecord>({
      token: crypto.randomUUID().replace(/-/g, ""),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  remove: (id: string) => pb.collection("invites").delete(id),
  check: (token: string) =>
    pb.send<InviteCheck>(`/api/hall-logger/invite/${encodeURIComponent(token)}`, {
      method: "GET",
      requestKey: null,
    }),
};
