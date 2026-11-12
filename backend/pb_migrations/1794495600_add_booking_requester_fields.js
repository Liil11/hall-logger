/// <reference path="../pb_data/types.d.ts" />

// User booking requests must record who requested: full name and username/NIP.
// Admin-created bookings leave these empty (relation `user` is also empty).
migrate(
  (app) => {
    const bookings = app.findCollectionByNameOrId("bookings");

    if (!bookings.fields.getByName("requesterName")) {
      bookings.fields.add(
        new TextField({ name: "requesterName", required: false, max: 100 })
      );
    }
    if (!bookings.fields.getByName("requesterUsername")) {
      bookings.fields.add(
        new TextField({
          name: "requesterUsername",
          required: false,
          max: 30,
          pattern: "^[A-Za-z0-9._-]*$",
        })
      );
    }

    app.save(bookings);
  },
  (app) => {
    const bookings = app.findCollectionByNameOrId("bookings");
    for (const name of ["requesterName", "requesterUsername"]) {
      const field = bookings.fields.getByName(name);
      if (field) bookings.fields.removeById(field.id);
    }
    app.save(bookings);
  }
);
