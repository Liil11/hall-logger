/// <reference path="../pb_data/types.d.ts" />

// Invitation-only registration. The users collection has createRule = null,
// so records can only be created through this token-gated route.
// Helpers must be inlined: PocketBase runs each handler in its own runtime.
// shortcut: the token check and user creation share a transaction, but two
// simultaneous requests can still both read the invite before either commits.
// Acceptable for a single-admin app.

routerAdd("GET", "/api/hall-logger/invite/{token}", (c) => {
  const token = c.request.pathValue("token") || "";
  const list = $app.findRecordsByFilter(
    "invites",
    "token = {:token}",
    "",
    1,
    0,
    { token: token }
  );

  if (!list.length) {
    return c.json(200, { valid: false, reason: "Token undangan tidak ditemukan." });
  }

  const invite = list[0];
  if (invite.getString("usedBy")) {
    return c.json(200, { valid: false, reason: "Token undangan sudah digunakan." });
  }

  const expiresAt = new Date(invite.getString("expiresAt")).getTime();
  if (!(expiresAt > Date.now())) {
    return c.json(200, { valid: false, reason: "Token undangan sudah kedaluwarsa." });
  }

  return c.json(200, { valid: true, expiresAt: invite.getString("expiresAt") });
});

routerAdd("POST", "/api/hall-logger/register", (c) => {
  const body = c.requestInfo().body;
  const token = String(body.token || "").trim();
  const username = String(body.username || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!token || !username || !name || !email || !password) {
    throw new BadRequestError(
      "Username, nama, email, password, dan token undangan wajib diisi."
    );
  }
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    throw new BadRequestError(
      "Username 3-30 karakter, hanya huruf, angka, titik, garis bawah, atau tanda hubung. NIP juga diperbolehkan."
    );
  }
  if (password.length < 8) {
    throw new BadRequestError("Password minimal 8 karakter.");
  }

  const list = $app.findRecordsByFilter(
    "invites",
    "token = {:token}",
    "",
    1,
    0,
    { token: token }
  );
  if (!list.length) {
    throw new BadRequestError("Token undangan tidak ditemukan.");
  }

  const invite = list[0];
  if (invite.getString("usedBy")) {
    throw new BadRequestError("Token undangan sudah digunakan.");
  }
  const expiresAt = new Date(invite.getString("expiresAt")).getTime();
  if (!(expiresAt > Date.now())) {
    throw new BadRequestError("Token undangan sudah kedaluwarsa.");
  }

  const usernameTaken = $app.findRecordsByFilter(
    "users",
    "username = {:username}",
    "",
    1,
    0,
    { username: username }
  );
  if (usernameTaken.length) {
    throw new BadRequestError("Username sudah dipakai.");
  }
  const emailTaken = $app.findRecordsByFilter(
    "users",
    "email = {:email}",
    "",
    1,
    0,
    { email: email }
  );
  if (emailTaken.length) {
    throw new BadRequestError("Email sudah terdaftar.");
  }

  const users = $app.findCollectionByNameOrId("users");
  const user = new Record(users);
  user.set("username", username);
  user.set("name", name);
  user.set("email", email);
  user.set("emailVisibility", true);
  user.set("verified", true);
  user.setPassword(password);

  try {
    $app.runInTransaction((txApp) => {
      txApp.save(user);
      invite.set("usedBy", user.id);
      invite.set("usedAt", new Date().toISOString());
      txApp.save(invite);
    });
  } catch (err) {
    throw new BadRequestError("Email sudah terdaftar atau data tidak valid.");
  }

  return c.json(200, { id: user.id, email: user.email() });
});
