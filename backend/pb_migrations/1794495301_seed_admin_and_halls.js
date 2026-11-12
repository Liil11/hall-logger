/// <reference path="../pb_data/types.d.ts" />

// Seed one app admin and two halls. Change the admin password after first login.
migrate(
  (app) => {
    const admins = app.findCollectionByNameOrId("admins");
    const admin = new Record(admins);
    admin.set("email", "admin@hall.local");
    admin.set("name", "Admin");
    admin.set("verified", true);
    admin.setPassword("halllogger123");
    app.save(admin);

    const halls = app.findCollectionByNameOrId("halls");
    for (const [name, color] of [
      ["Aula A", "purple"],
      ["Aula B", "green"],
    ]) {
      const hall = new Record(halls);
      hall.set("name", name);
      hall.set("color", color);
      app.save(hall);
    }
  },
  (app) => {
    for (const name of ["admin@hall.local", "Aula A", "Aula B"]) {
      const collection = name.includes("@") ? "admins" : "halls";
      const field = name.includes("@") ? "email" : "name";
      try {
        const record = app.findFirstRecordByData(collection, field, name);
        app.delete(record);
      } catch {}
    }
  }
);
