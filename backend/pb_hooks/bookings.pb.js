/// <reference path="../pb_data/types.d.ts" />

// A hall cannot host two active bookings whose [start, end) intervals intersect:
// existing.start < new.end && existing.end > new.start
// Pending requests block other requests too, so two users cannot queue the same slot.
// Rejected bookings no longer occupy a slot.
// Logic is inlined because PocketBase runs each hook handler in its own runtime.
// shortcut: check-then-insert is not transactional; two simultaneous requests could both pass. Single-admin app, upgrade if multi-admin races matter.
onRecordValidate((e) => {
  const booking = e.record;

  if (
    booking.getString("user") &&
    (!booking.getString("requesterName").trim() ||
      !booking.getString("requesterUsername").trim())
  ) {
    throw new BadRequestError("Nama dan username pemohon wajib diisi.", {
      requesterName: "Nama pemohon wajib diisi.",
      requesterUsername: "Username pemohon wajib diisi.",
    });
  }

  if (booking.getString("status") !== "rejected") {
    const start = booking.getString("start");
    const end = booking.getString("end");
    if (start >= end) {
      throw new BadRequestError("Jam selesai harus setelah jam mulai.", {
        end: "Jam selesai harus setelah jam mulai.",
      });
    }

    let filter =
      'hall = {:hall} && dateKey = {:dateKey} && start < {:end} && end > {:start} && status != "rejected"';
    const params = {
      hall: booking.getString("hall"),
      dateKey: booking.getString("dateKey"),
      start: start,
      end: end,
    };

    if (!booking.isNew()) {
      filter += " && id != {:id}";
      params.id = booking.id;
    }

    const clash = e.app.findRecordsByFilter(
      "bookings",
      filter,
      "",
      1,
      0,
      params
    )[0];
    if (clash) {
      const pending = clash.getString("status") === "pending" ? ", menunggu persetujuan admin" : "";
      throw new BadRequestError(
        "Aula sudah dipakai " +
          clash.getString("start") +
          "-" +
          clash.getString("end") +
          " (" +
          clash.getString("title") +
          pending +
          ").",
        { start: "Jadwal bentrok dengan booking lain." }
      );
    }
  }

  e.next();
}, "bookings");
