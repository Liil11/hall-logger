/// <reference path="../pb_data/types.d.ts" />

// Registration requires a username. Login accepts username or email.
// Pattern allows letters, digits, dot, underscore, and hyphen, so NIP
// (18-digit government employee number) works as a username too.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("username")) {
      users.fields.add(
        new TextField({
          name: "username",
          required: false,
          min: 3,
          max: 30,
          pattern: "^[A-Za-z0-9._-]+$",
        })
      );
    }
    app.save(users);

    // Backfill any pre-existing accounts so the unique index can be created.
    for (const record of app.findAllRecords("users")) {
      if (!record.getString("username")) {
        record.set("username", "user_" + record.id.slice(0, 8));
        app.save(record);
      }
    }

    users.addIndex("idx_users_username", true, "username", "");
    users.fields.getByName("username").required = true;
    users.passwordAuth.identityFields = ["username", "email"];
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.removeIndex("idx_users_username");
    users.passwordAuth.identityFields = ["email"];
    const field = users.fields.getByName("username");
    if (field) users.fields.removeById(field.id);
    app.save(users);
  }
);
