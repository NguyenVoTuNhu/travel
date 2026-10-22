/* MODULE mod-vehicles — quản lý phương tiện và điều phối xe tour. */

views.vehicles = () => {
  const allVehicles = state.vehicles;
  const assignedCount = state.bookings.filter(
    (b) => b.vehicle && !["Completed", "Cancelled"].includes(b.status),
  ).length;
  const pendingCount = state.bookings.filter(
    (b) => !b.vehicle && b.status === "Preparing",
  ).length;
  const suppliersCount = [
    ...new Set(allVehicles.map((v) => v.supplier)),
  ].length;

  return (
    title(
      "Quản lý phương tiện & điều phối xe",
      "Theo dõi đội xe, nhà xe đối tác, sức chứa và phân công xe vận chuyển cho từng đoàn tour.",
      btn("Lịch xe", "navigate('operations',{opsTab:'schedule'})") + (can("vehicles_manage") ? btn("Thêm xe mới", "newVehicleForm()", "primary") : ""),
    ) +
    `<div class="stats">
      ${stat("TỔNG SỐ PHƯƠNG TIỆN", allVehicles.length, "Đội xe đang quản lý")}
      ${stat("ĐÃ PHÂN XE TOUR", assignedCount, "Phương tiện đang có lịch chạy đoàn")}
      ${stat("CHỜ ĐIỀU PHỐI XE", pendingCount, "Booking chuẩn bị cần gán phương tiện")}
      ${stat("ĐƠN VỊ VẬN TẢI ĐỐI TÁC", suppliersCount + " nhà xe", "Hợp đồng vận chuyển lữ hành")}
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,1fr)">
      <div>
        ${card(
          "Danh mục đội xe & đơn vị vận chuyển",
          table(
            ["MÃ & TÊN XE", "NHÀ XE ĐỐI TÁC", "SỨC CHỨA", "GIẤY TỜ & BẢO DƯỠNG", "NHIÊN LIỆU", "LỊCH CHẠY GẦN NHẤT"],
            allVehicles.map((v) => {
              const activeBookings = state.bookings
                .filter((b) => b.vehicle === v.id && !["Completed", "Cancelled"].includes(b.status));
              return (
                "<tr><td><strong>" +
                v.id +
                " · " +
                esc(v.name) +
                "</strong><span class='sub'>Biển số: <b>" +
                esc(v.plate) +
                "</b></span></td><td>" +
                esc(state.suppliers.find((s) => s.id === v.supplier)?.name || "Chưa chọn đối tác") +
                "</td><td><b>" +
                v.capacity +
                " chỗ</b></td><td>" +
                vehicleDocsCell(v) +
                "</td><td>" +
                vehicleFuelCell(v) +
                "</td><td>" +
                (activeBookings.length
                  ? activeBookings
                      .map((b) => `<span class='badge green' style='margin: 1px 0;'>${systemIcon("flag")} ${b.id} (${fmt(b.start)} – ${fmt(b.end)})</span>`)
                      .join("<br>")
                  : "<span class='badge' style='color: var(--muted);'>Xe đang rảnh</span>") +
                "</td></tr>"
              );
            }),
          ),
        )}
      </div>
      <div>
        ${card(
          "Điều phối xe cho các đoàn tour",
          table(
            ["BOOKING", "SỐ KHÁCH", "PHƯƠNG TIỆN ĐÃ GÁN", "TRẠNG THÁI", "THAO TÁC"],
            state.bookings.filter((b) => ["Preparing", "Running"].includes(b.status)).map((b) => {
              const assignedVehicle = state.vehicles.find((v) => v.id === b.vehicle);
              const statusBadge = b.vehicleConfirmed
                ? badge("Đã chốt xe", "green")
                : b.vehicle
                  ? badge("Đã gán xe", "amber")
                  : badge("Chưa phân xe", "red");

              return (
                "<tr><td><strong>" +
                entityLink("booking", b.id) +
                "</strong><span class='sub'>" +
                esc(b.tour) +
                "</span></td><td><b>" +
                b.pax +
                " pax</b></td><td>" +
                (assignedVehicle
                  ? "<strong>" + esc(assignedVehicle.name) + "</strong><span class='sub'>" + assignedVehicle.plate + " (" + assignedVehicle.capacity + " chỗ)</span>"
                  : "<span style='color: var(--muted);'>Chưa phân công</span>") +
                "</td><td>" +
                statusBadge +
                "</td><td>" +
                (b.status === "Preparing" && can("vehicles_manage")
                  ? btn("Điều phối", "vehicleForm('" + b.id + "')", "small")
                  : "<span class='sub'>" + (b.status === "Running" ? "Tour đang chạy" : "—") + "</span>") +
                "</td></tr>"
              );
            }),
          ),
        )}
      </div>
    </div>`
  );
};

/* ---------- Giấy tờ, bảo dưỡng, nhiên liệu ---------- */
const vehicleDocFields = [["inspectionExpiry", "Đăng kiểm"], ["insuranceExpiry", "Bảo hiểm"], ["nextMaintenance", "Bảo dưỡng"]];
function vehicleExpiryState(date) {
  if (!date) return { tone: "", text: "Chưa nhập", left: null };
  const left = Math.ceil((new Date(date) - new Date(todayISO())) / 864e5);
  return left < 0 ? { tone: "red", text: "Quá hạn " + Math.abs(left) + " ngày", left } : left <= 30 ? { tone: "amber", text: "Còn " + left + " ngày", left } : { tone: "green", text: fmt(date), left };
}
function vehicleDocsCell(v) {
  return vehicleDocFields.map(([k, l]) => { const st = vehicleExpiryState(v[k]); return `<div class="metricline"><span>${l}</span>${badge(st.text, st.tone)}</div>`; }).join("") + (can("vehicles_manage") ? btn("Cập nhật hồ sơ", `vehicleDocsForm('${v.id}')`, "small") : "");
}
function vehicleFuelCell(v) {
  const logs = v.fuelLogs || [], total = logs.reduce((n, l) => n + Number(l.cost || 0), 0);
  return `<b>${money(total)}</b><span class="sub">${logs.reduce((n, l) => n + Number(l.liters || 0), 0).toFixed(0)} lít · ${logs.length} lần đổ</span>` + (can("vehicles_manage") ? btn("Ghi nhiên liệu", `fuelForm('${v.id}')`, "small") : "");
}
/* Xe có giấy tờ/bảo dưỡng hết hạn trước hoặc trong tour thì không được gán. */
function vehicleDocProblem(v, b) {
  return vehicleDocFields.map(([k, l]) => (v[k] && v[k] < (b.end || b.start) ? l : "")).filter(Boolean);
}
function vehicleDocsForm(id) {
  const v = state.vehicles.find((x) => x.id === id);
  modal("Hồ sơ xe · " + esc(v.name), `<form onsubmit="saveVehicleDocs(event,'${id}')"><div class="formgrid">${vehicleDocFields.map(([k, l]) => `<label>${l} — hạn<input name="${k}" type="date" value="${esc(v[k] || "")}"></label>`).join("")}<label>Lái xe<input name="driver" value="${esc(v.driver || "")}"></label><label>SĐT lái xe<input name="driverPhone" value="${esc(v.driverPhone || "")}"></label></div><div class="formfooter"><button class="btn primary">Lưu</button></div></form>`, true);
}
function saveVehicleDocs(e, id) {
  e.preventDefault();
  if (!requireCapability("vehicles_manage")) return;
  const v = state.vehicles.find((x) => x.id === id), f = new FormData(e.target);
  vehicleDocFields.forEach(([k]) => (v[k] = f.get(k) || ""));
  v.driver = f.get("driver").trim(); v.driverPhone = f.get("driverPhone").trim();
  audit("vehicle", id, "UPDATE", `Cập nhật hồ sơ xe ${id}`);
  save(); closeModal(); render();
}
function fuelForm(id) {
  const v = state.vehicles.find((x) => x.id === id);
  const bs = state.bookings.filter((b) => b.vehicle === id);
  modal("Ghi nhiên liệu · " + esc(v.name), `<form onsubmit="saveFuel(event,'${id}')"><div class="formgrid"><label>Ngày<input name="date" type="date" value="${todayISO()}" required></label><label>Số lít<input name="liters" type="number" min="1" step="0.1" required></label><label>Thành tiền (VND)<input name="cost" type="number" min="0" step="1000" required></label><label>Booking (nếu có)<select name="booking"><option value="">—</option>${bs.map((b) => `<option>${b.id}</option>`).join("")}</select></label></div><div class="formfooter"><button class="btn primary">Lưu</button></div></form>`, true);
}
function saveFuel(e, id) {
  e.preventDefault();
  if (!requireCapability("vehicles_manage")) return;
  const v = state.vehicles.find((x) => x.id === id), f = new FormData(e.target);
  (v.fuelLogs ||= []).push({ date: f.get("date"), liters: +f.get("liters"), cost: +f.get("cost"), booking: f.get("booking") || "" });
  audit("vehicle", id, "FUEL", `Đổ ${f.get("liters")} lít cho ${id}`);
  save(); closeModal(); render();
}

function vehicleAvailable(v, b) {
  return (
    v.capacity >= b.pax &&
    !vehicleDocProblem(v, b).length &&
    !state.bookings.some(
      (x) =>
        x.id !== b.id &&
        !["Completed", "Cancelled"].includes(x.status) &&
        x.vehicle === v.id &&
        x.start <= b.end &&
        x.end >= b.start,
    )
  );
}

function vehicleForm(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Điều phối phương tiện · Booking " + id,
    `<p class="sub" style="margin-bottom: 14px;">Đoàn <b>${b.pax} khách</b> · Lịch trình: <b>${fmt(b.start)} – ${fmt(b.end)}</b>. Xe cần có sức chứa ≥ ${b.pax} chỗ và không bị trùng lịch chạy.</p>
    <form onsubmit="assignVehicle(event,'${id}')">
      <div class="formgrid">
        <label class="full">Lựa chọn xe phù hợp
          <select name="vehicle" required>
            <option value="">-- Chọn phương tiện --</option>
            ${state.vehicles
              .map(
                (v) =>
                  '<option value="' +
                  v.id +
                  '" ' +
                  (!vehicleAvailable(v, b) ? "disabled" : "") +
                  " " +
                  (b.vehicle === v.id ? "selected" : "") +
                  ">" +
                  v.id +
                  " · " +
                  esc(v.name) +
                  " · " +
                  v.capacity +
                  " chỗ (Biển số: " +
                  v.plate +
                  ")" +
                  (!vehicleAvailable(v, b) ? (vehicleDocProblem(v, b).length ? " [Hết hạn: " + vehicleDocProblem(v, b).join(", ") + "]" : " [Không đủ chỗ / trùng lịch]") : " [Trống lịch sẵn sàng]") +
                  "</option>",
              )
              .join("")}
          </select>
        </label>
        <label class="full">Trạng thái xác nhận với nhà xe
          <select name="confirmed">
            <option value="0" ${!b.vehicleConfirmed ? "selected" : ""}>Chờ nhà xe xác nhận (Pending)</option>
            <option value="1" ${b.vehicleConfirmed ? "selected" : ""}>Nhà xe đã nhận lệnh điều xe (Confirmed)</option>
          </select>
        </label>
      </div>
      <p class="notice">Sau khi xác nhận điều xe, thông tin xe và lái xe sẽ được tự động tích hợp vào Phiếu dịch vụ (Voucher) và gửi cho HDV phụ trách đoàn.</p>
      <div class="formfooter">
        <button class="btn primary" type="submit">Lưu điều phối xe</button>
      </div>
    </form>`,
    true,
  );
}

function assignVehicle(e, id) {
  e.preventDefault();
  if (!requireCapability("vehicles_manage")) return;
  let f = new FormData(e.target),
    b = state.bookings.find((b) => b.id === id),
    v = state.vehicles.find((v) => v.id === f.get("vehicle"));
  if (!v || !vehicleAvailable(v, b))
    return toast("Phương tiện không đủ chỗ hoặc trùng lịch với tour khác.");
  b.vehicle = v.id;
  b.vehicleConfirmed = f.get("confirmed") === "1";
  let s = b.services.find((s) => s.type === "Vehicle");
  if (s) {
    s.supplier = v.supplier;
    setServiceStatus(b, s, b.vehicleConfirmed ? "CONFIRMED" : "WAITING", b.vehicleConfirmed ? "Nhà xe đã nhận lệnh" : "Đã điều xe, chờ nhà xe xác nhận");
  }
  b.voucher = false;
  audit("booking", id, "VEHICLE", id + " gán xe " + v.id + " (" + v.name + ")");
  closeModal();
  render();
  if (document.querySelector(".booking360")) openBooking(id, "services");
  toast("Đã phân công thành công xe " + v.name + " cho booking " + id);
}

function newVehicleForm() {
  const carriers = state.suppliers.filter((x) => x.type === "Vehicle");
  modal(
    "Thêm phương tiện",
    `<form onsubmit="addVehicle(event)"><div class="formgrid"><label class="full">Tên xe${field("name", "text", "", true)}</label><label>Biển số${field("plate", "text", "", true)}</label><label>Sức chứa (chỗ)<input name="capacity" type="number" min="2" max="60" required></label><label class="full">Nhà xe đối tác<select name="supplier" required>${carriers.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label></div><div class="formfooter"><button class="btn primary">Lưu phương tiện</button></div></form>`,
    true,
  );
}

function addVehicle(e) {
  e.preventDefault();
  if (!requireCapability("vehicles_manage")) return;
  const f = new FormData(e.target);
  const plate = f.get("plate").trim().toUpperCase();
  if (state.vehicles.some((v) => v.plate === plate)) return toast("Biển số đã tồn tại.");
  const vehicle = { id: nextBusinessId("vehicles"), name: f.get("name").trim(), plate, capacity: +f.get("capacity"), supplier: f.get("supplier") };
  state.vehicles.push(vehicle);
  audit("vehicle", vehicle.id, "CREATE", `Thêm phương tiện ${vehicle.id} (${vehicle.name})`);
  closeModal();
  render();
}
