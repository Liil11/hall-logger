/// <reference path="../pb_data/types.d.ts" />

// Hall booking schema:
// - admins: auth collection for the app admin (separate from PocketBase superusers)
// - halls: bookable places (e.g. Aula A, Aula B)
// - bookings: one hall + date + start/end slot; overlap guarded in pb_hooks/bookings.pb.js
migrate(
  (app) => {
    const admins = new Collection({
      type: "auth",
      name: "admins",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });
    app.save(admins);

    const halls = new Collection({
      type: "base",
      name: "halls",
      listRule: "",
      viewRule: "",
      createRule: '@request.auth.collectionName = "admins"',
      updateRule: '@request.auth.collectionName = "admins"',
      deleteRule: '@request.auth.collectionName = "admins"',
      fields: [
        { name: "name", type: "text", required: true, min: 1, max: 100 },
        {
          name: "color",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["purple", "orange", "blue", "green"],
        },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_halls_name ON halls (name)"],
    });
    app.save(halls);

    const bookings = new Collection({
      type: "base",
      name: "bookings",
      listRule: "",
      viewRule: "",
      createRule: '@request.auth.collectionName = "admins"',
      updateRule: '@request.auth.collectionName = "admins"',
      deleteRule: '@request.auth.collectionName = "admins"',
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        {
          name: "hall",
          type: "relation",
          required: true,
          collectionId: halls.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "dateKey",
          type: "text",
          required: true,
          min: 10,
          max: 10,
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        {
          name: "start",
          type: "text",
          required: true,
          pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
        },
        {
          name: "end",
          type: "text",
          required: true,
          pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
        },
      ],
      indexes: [
        "CREATE INDEX idx_bookings_date ON bookings (dateKey)",
        "CREATE INDEX idx_bookings_hall_date ON bookings (hall, dateKey)",
      ],
    });
    app.save(bookings);
  },
  (app) => {
    for (const name of ["bookings", "halls", "admins"]) {
      const collection = app.findCollectionByNameOrId(name);
      app.delete(collection);
    }
  }
);
