/// <reference path="../pb_data/types.d.ts" />

// Admin-generated invite tokens are valid for exactly 24 hours.
onRecordCreateRequest((e) => {
  e.record.set("expiresAt", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
  e.next();
}, "invites");
