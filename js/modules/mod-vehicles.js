/* MODULE mod-vehicles — giao diện và nghiệp vụ của phân hệ Travel. */

views.vehicles = () =>
  title(
    "Vehicle Management",
    "Supplier · Vehicle · Capacity · Booking → Vehicle → Confirm",
  ) +
  card(
    "Vehicle Company & Fleet",
    table(
      ["VEHICLE", "SUPPLIER", "CAPACITY", "LỊCH BOOKING"],
      state.vehicles.map(
        (v) =>
          "<tr><td>" +
          v.id +
          " · " +
          v.name +
          '<span class="sub">' +
          v.plate +
          "</span></td><td>" +
          esc(state.suppliers.find((s) => s.id === v.supplier)?.name) +
          "</td><td>" +
          v.capacity +
          " chỗ</td><td>" +
          state.bookings
            .filter((b) => b.vehicle === v.id && b.status !== "Completed")
            .map((b) => b.id + " (" + fmt(b.start) + "–" + fmt(b.end) + ")")
            .join("<br>") +
          "</td></tr>",
      ),
    ),
  ) +
  card(
    "Vehicle Bookings",
    table(
      ["BOOKING", "PAX", "VEHICLE", "STATUS", "THAO TÁC"],
      state.bookings.map(
        (b) =>
          "<tr><td>" +
          b.id +
          '<span class="sub">' +
          esc(b.tour) +
          "</span></td><td>" +
          b.pax +
          "</td><td>" +
          esc(
            state.vehicles.find((v) => v.id === b.vehicle)?.name ||
              "Chưa gán xe",
          ) +
          "</td><td>" +
          badge(
            b.vehicleConfirmed
              ? "Confirmed"
              : b.vehicle
                ? "Assigned"
                : "Pending",
            b.vehicleConfirmed ? "green" : "amber",
          ) +
          "</td><td>" +
          (b.status === "Preparing"
            ? btn("Chọn xe", "vehicleForm('" + b.id + "')", "small")
            : "—") +
          "</td></tr>",
      ),
    ),
  );

function vehicleAvailable(v, b) {
  return (
    v.capacity >= b.pax &&
    !state.bookings.some(
      (x) =>
        x.id !== b.id &&
        x.status !== "Completed" &&
        x.vehicle === v.id &&
        x.start <= b.end &&
        x.end >= b.start,
    )
  );
}

function vehicleForm(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Vehicle booking · " + id,
    `<form onsubmit="assignVehicle(event,'${id}')"><label>Vehicle<select name="vehicle" required><option value="">Chọn xe</option>${state.vehicles.map((v) => '<option value="' + v.id + '" ' + (!vehicleAvailable(v, b) ? "disabled" : "") + ">" + v.id + " · " + v.name + " · " + v.capacity + " chỗ" + (!vehicleAvailable(v, b) ? " · Không đủ chỗ / trùng lịch" : "") + "</option>").join("")}</select></label><label>Confirm<select name="confirmed"><option value="0">Chờ xác nhận</option><option value="1">Đã xác nhận</option></select></label><div class="formfooter"><button class="btn primary">Lưu xe</button></div></form>`,
    true,
  );
}

function assignVehicle(e, id) {
  e.preventDefault();
  let f = new FormData(e.target),
    b = state.bookings.find((b) => b.id === id),
    v = state.vehicles.find((v) => v.id === f.get("vehicle"));
  if (!v || !vehicleAvailable(v, b))
    return toast("Xe không đủ chỗ hoặc trùng lịch.");
  b.vehicle = v.id;
  b.vehicleConfirmed = f.get("confirmed") === "1";
  let s = b.services.find((s) => s.type === "Vehicle");
  s.supplier = v.supplier;
  s.confirmed = b.vehicleConfirmed;
  b.voucher = false;
  log(id + " gán " + v.id);
  closeModal();
  render();
}
