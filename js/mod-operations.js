/* MODULE mod-operations — Trung tâm điều hành: tiếp nhận booking, đặt dịch vụ NCC, lịch điều hành, sự cố. */

let opsTab = "board";
let opsServiceFilter = "open";
let opsIssueFilter = "open";

const opsActive = () => state.bookings.filter((b) => ["Preparing", "Running"].includes(b.status));

function daysUntil(date) {
  return Math.ceil((new Date(date + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 864e5);
}

views.operations = () => {
  const bs = state.bookings.filter((b) => bookingOpsStatuses.includes(b.status));
  const waitingTakeover = bs.filter((b) => b.status === "Confirmed").length;
  const svcs = opsActive().flatMap((b) => bookingServices(b).filter((s) => s.type !== "Guide").map((s) => ({ b, s })));
  const waiting = svcs.filter(({ s }) => serviceStatus(s) === "WAITING").length;
  const toBook = svcs.filter(({ s }) => ["NOT_BOOKED", "REJECTED"].includes(serviceStatus(s))).length;
  const running = bs.filter((b) => b.status === "Running").length;
  const openIssues = state.issues.filter((i) => i.status !== "Resolved").length;
  const noGuide = opsActive().filter((b) => !b.guide).length;
  const tabs = [
    ["board", "Bảng điều hành"],
    ["services", `Dịch vụ NCC (${waiting + toBook})`],
    ["schedule", "Lịch điều hành"],
    ["issues", `Sự cố (${openIssues})`],
  ];
  let body = "";
  if (opsTab === "services") body = opsServicesTab(svcs);
  else if (opsTab === "schedule") body = opsScheduleTab();
  else if (opsTab === "issues") body = opsIssuesTab();
  else body = opsBoardTab(bs);
  return (
    title("Trung tâm điều hành tour", "Tiếp nhận booking đã cọc, đặt dịch vụ, phân công HDV – xe và theo dõi tour từng ngày.", btn("Danh sách booking", "go('bookings')") + btn("Ghi nhận sự cố", "issueForm()", "primary")) +
    `<div class="stats">
      ${stat("CHỜ TIẾP NHẬN", waitingTakeover, "Booking đã cọc, chưa có điều hành")}
      ${stat("DỊCH VỤ CẦN XỬ LÝ", toBook, waiting + " đang chờ NCC trả lời")}
      ${stat("TOUR ĐANG CHẠY", running, noGuide + " tour chuẩn bị chưa có HDV")}
      ${stat("SỰ CỐ ĐANG MỞ", openIssues, "Nhà cung cấp, HDV, khách hàng")}
    </div>
    <nav class="tabs" aria-label="Điều hành">${tabs.map(([k, l]) => `<button class="btn ${opsTab === k ? "selected" : ""}" onclick="opsTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    body
  );
};

function opsTourCard(b) {
  const guide = findGuide(b.guide);
  const pending = bookingServices(b).filter((s) => s.type !== "Guide" && serviceStatus(s) !== "CONFIRMED").length;
  const d = daysUntil(b.start);
  const issues = state.issues.filter((i) => i.booking === b.id && i.status !== "Resolved").length;
  return `<article class="tourcard">
    <div class="cardhead"><span class="eyebrow">${b.id} · ${b.pax} KHÁCH</span>${b.status === "Preparing" ? badge(d >= 0 ? `Còn ${d} ngày` : "Quá ngày đi", d <= 7 ? "red" : "amber") : bookingBadge(b)}</div>
    <h3>${esc(b.tour)}</h3>
    <div class="sub">${customerLink(b.client)} · ĐH: ${esc(b.operator || "Chưa nhận")}</div>
    <div class="dates">${systemIcon("calendar-days")} ${fmt(b.start)} — ${fmt(b.end)}</div>
    ${b.status === "Confirmed" ? "" : `<div class="barrow" style="margin: 10px 0;"><div class="bar" style="flex: 1;"><i style="width:${progress(b)}%"></i></div><small>${progress(b)}% sẵn sàng</small></div>`}
    <div class="bottom"><div class="sub">
      ${b.status === "Confirmed" ? "<b>Cần tiếp nhận để bắt đầu đặt dịch vụ</b>" : (guide ? `${systemIcon("user-tie")} <b>${esc(guide.name)}</b>${b.guideConfirmed ? "" : " (chờ xác nhận)"}` : `<span class="text-warn">${systemIcon("triangle-exclamation")} Chưa có HDV</span>`) + "<br>" + (pending ? `<span class="text-bad">● ${pending} dịch vụ chưa chốt</span>` : '<span class="text-good">✓ Dịch vụ đã chốt</span>') + (issues ? `<br><span class="text-bad">⚠ ${issues} sự cố</span>` : "")}
    </div>${b.status === "Confirmed" && can("operations_manage") ? btn("Tiếp nhận", `takeoverForm('${b.id}')`, "small primary") : btn("Mở hồ sơ →", `openBooking('${b.id}')`, "small")}</div>
  </article>`;
}

function opsBoardTab(bs) {
  const cols = [
    ["Confirmed", "Chờ tiếp nhận", bs.filter((b) => b.status === "Confirmed")],
    ["Preparing", "Đang chuẩn bị", bs.filter((b) => b.status === "Preparing").sort((a, b) => a.start.localeCompare(b.start))],
    ["Running", "Đang chạy", bs.filter((b) => b.status === "Running")],
    ["Completed", "Hoàn tất gần đây", bs.filter((b) => b.status === "Completed").sort((a, b) => b.end.localeCompare(a.end)).slice(0, 4)],
  ];
  return `<div class="ops-board">${cols.map(([k, label, items]) => `<section class="ops-col ops-col--${k}"><header><b>${label}</b><span>${items.length}</span></header><div class="ops-col-body">${items.map(opsTourCard).join("") || '<div class="empty">Không có booking.</div>'}</div></section>`).join("")}</div>`;
}

function opsServicesTab(svcs) {
  const filtered = svcs.filter(({ s }) => (opsServiceFilter === "open" ? serviceStatus(s) !== "CONFIRMED" : opsServiceFilter === "all" || serviceStatus(s) === opsServiceFilter)).sort((x, y) => x.b.start.localeCompare(y.b.start));
  const rows = filtered.map(({ b, s }) => {
    const st = serviceStatus(s);
    const sup = findSupplier(s.supplier);
    const d = daysUntil(b.start);
    let actions = "";
    if (b.status === "Preparing" || b.status === "Running") {
      if (st === "NOT_BOOKED" && s.supplier) actions += btn("Gửi yêu cầu NCC", `requestSupplier('${b.id}','${s.type}')`, "small primary");
      if (st === "WAITING") actions += btn("NCC xác nhận", `supplierConfirmForm('${b.id}','${s.type}')`, "small primary") + btn("NCC từ chối", `supplierRejectForm('${b.id}','${s.type}')`, "small");
      if (st === "REJECTED" || st === "NOT_BOOKED") actions += btn("Chọn NCC", `serviceForm('${b.id}','${s.type}')`, "small");
    }
    return `<tr><td>${entityLink("booking", b.id)}<span class="sub">${esc(b.client)}</span></td><td><b>${typesVI[s.type] || s.type}</b></td><td>${sup ? entityLink("supplier", sup.id, sup.name) : '<span class="sub">Chưa chọn</span>'}</td><td>${money(s.cost)}</td><td>${serviceBadge(s)}</td><td class="${d <= 7 ? "task-overdue" : ""}">${fmt(b.start)}<span class="sub">còn ${d} ngày</span></td><td><div class="actions">${actions}</div></td></tr>`;
  });
  return card(
    "Phiếu xác nhận dịch vụ nhà cung cấp",
    `<div class="filters"><select aria-label="Lọc dịch vụ" onchange="opsServiceFilter=this.value;render()">${[["open", "Cần xử lý"], ["WAITING", "Đang chờ NCC"], ["REJECTED", "NCC từ chối"], ["NOT_BOOKED", "Chưa đặt"], ["CONFIRMED", "Đã xác nhận"], ["all", "Tất cả"]].map(([v, l]) => `<option value="${v}" ${opsServiceFilter === v ? "selected" : ""}>${l}</option>`).join("")}</select><span class="sub" style="margin-left:auto">${filtered.length} dịch vụ</span></div>` +
      (rows.length ? table(["BOOKING", "DỊCH VỤ", "NHÀ CUNG CẤP", "CHI PHÍ", "TRẠNG THÁI", "KHỞI HÀNH", ""], rows) : '<div class="empty">Không có dịch vụ nào cần xử lý.</div>'),
  );
}

/* ---------- Lịch điều hành (HDV & xe) ---------- */
function scheduleGrid(kind) {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toLocaleDateString("en-CA");
  });
  const resources = kind === "guide" ? state.guides : state.vehicles;
  const today = todayISO();
  const rows = resources.map((r) => {
    const cells = days.map((d) => {
      const b = state.bookings.find((x) => x[kind] === r.id && !["Completed", "Cancelled"].includes(x.status) && x.start <= d && x.end >= d) || state.bookings.find((x) => x[kind] === r.id && x.status === "Completed" && x.start <= d && x.end >= d);
      const block = kind === "guide" && (r.blocks || []).find((x) => x.from <= d && x.to >= d);
      const cls = b ? (b.status === "Completed" ? "is-done" : (kind === "guide" ? b.guideConfirmed : b.vehicleConfirmed) ? "is-booked" : "is-pending") : block ? "is-blocked" : "";
      const click = b ? ` onclick="openBooking('${b.id}')"` : "";
      return `<i class="${cls} ${d === today ? "is-today" : ""}" title="${b ? b.id + " · " + esc(b.tour) : block ? "Bận: " + esc(block.reason || "") : fmt(d)}"${click}></i>`;
    });
    return `<div class="sched-row"><span class="sched-name">${esc(r.name)}<small>${r.id}</small></span><div class="sched-cells">${cells.join("")}</div></div>`;
  });
  const header = days.map((d, i) => (i % 7 === 0 ? `<b>${fmt(d).slice(0, 5)}</b>` : "<b></b>")).join("");
  return `<div class="sched"><div class="sched-row sched-head"><span class="sched-name"></span><div class="sched-cells sched-cells--head">${header}</div></div>${rows.join("") || '<div class="empty">Chưa có dữ liệu.</div>'}</div>`;
}

function opsScheduleTab() {
  return (
    card("Lịch Hướng dẫn viên · 6 tuần tới", scheduleGrid("guide") + '<div class="sched-legend"><span><i class="is-booked"></i>Đã nhận tour</span><span><i class="is-pending"></i>Chờ HDV xác nhận</span><span><i class="is-blocked"></i>HDV báo bận</span><span><i class="is-done"></i>Đã hoàn tất</span></div>') +
    card("Lịch Phương tiện · 6 tuần tới", scheduleGrid("vehicle") + '<div class="sched-legend"><span><i class="is-booked"></i>Nhà xe đã nhận lệnh</span><span><i class="is-pending"></i>Chờ nhà xe xác nhận</span></div>')
  );
}

/* ---------- Tiếp nhận booking ---------- */
function takeoverForm(id) {
  const b = findBooking(id);
  const me = operationOwners.includes(myName()) ? myName() : b.operator || operationOwners[0];
  modal(
    (b.operator ? "Đổi điều hành phụ trách · " : "Tiếp nhận booking · ") + id,
    `<form onsubmit="takeoverBooking(event,'${id}')"><p class="sub">${esc(b.tour)} · ${esc(b.client)} · ${fmt(b.start)} – ${fmt(b.end)} · ${b.pax} khách</p><label>Điều hành viên phụ trách<select name="operator">${operationOwners.map((owner) => `<option ${owner === me ? "selected" : ""}>${esc(owner)}</option>`).join("")}</select></label><div class="formfooter"><button class="btn primary">${b.operator ? "Cập nhật" : "Tiếp nhận & bắt đầu chuẩn bị"}</button></div></form>`,
    true,
  );
}

function takeoverBooking(e, id) {
  e.preventDefault();
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id);
  b.operator = new FormData(e.target).get("operator");
  if (b.status === "Confirmed") setBookingStatus(b, "Preparing", "Điều hành " + b.operator + " tiếp nhận");
  else audit("booking", id, "OPERATOR", `${id} bàn giao cho ${b.operator}`);
  render();
  openBooking(id, "services");
  toast("Đã tiếp nhận " + id + ". Bắt đầu gửi yêu cầu cho nhà cung cấp.");
}

/* ---------- Dịch vụ NCC ---------- */
function serviceForm(id, type) {
  const b = findBooking(id),
    s = b.services.find((s) => s.type === type),
    ncc = state.suppliers.filter((n) => n.type === type);
  modal(
    `Dịch vụ ${typesVI[type]} · ${id}`,
    `<form onsubmit="saveService(event,'${id}','${type}')"><label>Nhà cung cấp<select name="supplier">${ncc.map((n) => `<option value="${n.id}" ${s.supplier === n.id ? "selected" : ""}>${esc(n.name)} · ${score(n)}/100</option>`).join("")}</select></label><label>Chi phí dự kiến (VND)<input type="number" name="cost" min="0" step="1000" value="${s.cost}" required></label><p class="notice">Đổi nhà cung cấp sẽ đưa dịch vụ về "Chưa đặt" và voucher cũ mất hiệu lực. Nếu tổng chi phí vượt dự toán quá ${policy().costOverrunPct}%, cần CEO phê duyệt trước khi khởi hành.</p><div class="formfooter"><button class="btn primary" type="submit">Lưu dịch vụ</button></div></form>`,
    true,
  );
}

function checkCostOverrun(b) {
  b.cost = plannedServiceCost(b);
  const baseline = b.quoteCost ?? b.cost;
  b.quoteCost = baseline;
  const limit = baseline * (1 + policy().costOverrunPct / 100);
  if (b.cost > limit && b.cost > (b.costApprovedTotal || 0)) {
    requestApproval({ type: "COST_OVERRUN", ref: b.id, amount: b.cost - baseline, reason: `Chi phí ${money(b.cost)} vượt dự toán ${money(baseline)} (${(((b.cost - baseline) / baseline) * 100).toFixed(1)}%)`, data: { total: b.cost } });
    return true;
  }
  return false;
}

function saveService(e, id, type) {
  e.preventDefault();
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id);
  if (!["Preparing", "Running"].includes(b.status)) return toast("Hãy tiếp nhận booking trước khi đặt dịch vụ.");
  const s = b.services.find((s) => s.type === type),
    f = new FormData(e.target);
  const changedSupplier = s.supplier !== f.get("supplier");
  s.supplier = f.get("supplier");
  s.cost = +f.get("cost");
  if (changedSupplier) setServiceStatus(b, s, "NOT_BOOKED", "Đổi nhà cung cấp");
  const overrun = checkCostOverrun(b);
  audit("booking", id, "SERVICE", `${id} cập nhật ${typesVI[type]} (${money(s.cost)})`);
  render();
  openBooking(id, "services");
  toast(overrun ? "Đã lưu. Chi phí vượt dự toán — đã gửi CEO phê duyệt." : "Đã cập nhật dịch vụ.");
}

function requestSupplier(id, type) {
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id),
    s = b.services.find((x) => x.type === type);
  if (!s.supplier) return toast("Hãy chọn nhà cung cấp trước.");
  setServiceStatus(b, s, "WAITING", "Đã gửi yêu cầu đặt dịch vụ", { requestedAt: nowISO() });
  refreshBookingViews(id);
  toast(`Đã gửi yêu cầu ${typesVI[type]} cho ${findSupplier(s.supplier)?.name}.`);
}

function requestAllSuppliers(id) {
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id);
  b.services.filter((s) => s.needed && s.type !== "Guide" && serviceStatus(s) === "NOT_BOOKED" && s.supplier).forEach((s) => setServiceStatus(b, s, "WAITING", "Đã gửi yêu cầu đặt dịch vụ", { requestedAt: nowISO() }));
  refreshBookingViews(id);
}

function supplierConfirmForm(id, type) {
  modal(
    `NCC xác nhận ${typesVI[type]} · ${id}`,
    `<form onsubmit="supplierConfirm(event,'${id}','${type}')"><label>Mã xác nhận / số booking của NCC${field("code", "text", "", true)}</label><label>Ghi chú (giờ đón, loại phòng…)<textarea name="note"></textarea></label><div class="formfooter"><button class="btn primary">Ghi nhận NCC đã xác nhận</button></div></form>`,
    true,
  );
}

function supplierConfirm(e, id, type) {
  e.preventDefault();
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id),
    s = b.services.find((x) => x.type === type),
    f = new FormData(e.target);
  setServiceStatus(b, s, "CONFIRMED", f.get("note") || "NCC xác nhận", { confirmCode: f.get("code").trim(), confirmedAt: nowISO() });
  refreshBookingViews(id);
  toast("NCC đã xác nhận " + typesVI[type] + ".");
}

function supplierRejectForm(id, type) {
  modal(
    `NCC từ chối ${typesVI[type]} · ${id}`,
    `<form onsubmit="supplierReject(event,'${id}','${type}')"><label>Lý do NCC từ chối<textarea name="reason" required placeholder="Hết phòng, hết xe, giá thay đổi…"></textarea></label><p class="notice">Dịch vụ chuyển sang "NCC từ chối" và một sự cố nhà cung cấp được ghi nhận. Hãy chọn NCC khác để tiếp tục.</p><div class="formfooter"><button class="btn danger">Ghi nhận từ chối</button></div></form>`,
    true,
  );
}

function supplierReject(e, id, type) {
  e.preventDefault();
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id),
    s = b.services.find((x) => x.type === type),
    reason = new FormData(e.target).get("reason").trim();
  setServiceStatus(b, s, "REJECTED", reason);
  state.issues.push({ id: nextBusinessId("issues"), booking: id, type: "Supplier", severity: "MEDIUM", note: `${findSupplier(s.supplier)?.name || "NCC"} từ chối ${typesVI[type]}: ${reason}`, status: "Open", reporter: actor().name, createdAt: nowISO() });
  refreshBookingViews(id);
}

function refreshBookingViews(id) {
  render();
  if (document.querySelector(".booking360")) openBooking(id, bookingTab);
}

/* ---------- Voucher, kiểm tra trước tour, bắt đầu / hoàn tất ---------- */
function makeVoucher(id) {
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id);
  if (bookingServices(b).some((s) => s.type !== "Guide" && serviceStatus(s) !== "CONFIRMED")) return toast("Cần NCC xác nhận tất cả dịch vụ trước khi tạo voucher.");
  b.voucher = true;
  state.docs = state.docs.filter((d) => !(d.booking === id && d.type === "Voucher"));
  state.docs.unshift({ id: nextBusinessId("docs"), booking: id, type: "Voucher", name: "Voucher " + id, date: todayISO(), generated: true });
  audit("booking", id, "VOUCHER", `Tạo voucher ${id}`);
  refreshBookingViews(id);
  toast("Voucher đã sẵn sàng, có thể in / lưu PDF.");
}

function preTourCheck(id) {
  const b = findBooking(id);
  const checks = readiness(b);
  const blockers = checks.filter((c) => !c.ok && !c.soft);
  const pay = paymentState(b);
  modal(
    "Kiểm tra trước tour · " + id,
    `<div class="precheck">${checks.map((c) => `<div class="checkitem"><span class="${c.ok ? "ok" : c.soft ? "warn" : "no"}">${systemIcon(c.ok ? "circle-check" : c.soft ? "circle-exclamation" : "circle-xmark")}</span><div class="grow"><b>${esc(c.label)}</b>${c.ok ? "" : `<div class="sub">${esc(c.fix)}${c.soft ? " (khuyến nghị)" : ""}</div>`}</div></div>`).join("")}</div>
    <div class="checkitem"><span class="${pay.code === "UNPAID" || pay.code === "PARTIAL" ? "warn" : "ok"}">${systemIcon("wallet")}</span><div class="grow"><b>Thanh toán: ${esc(pay.label)}</b><div class="sub">Điều kiện cọc đã được kế toán xác nhận khi booking chuyển "Đã xác nhận".</div></div></div>
    <div class="formfooter">${btn("Đóng", `openBooking('${id}')`)}${b.status === "Preparing" ? `<button class="btn primary" ${blockers.length ? "disabled" : ""} onclick="startTour('${id}')">Bắt đầu tour</button>` : ""}</div>`,
    true,
  );
}

function startTour(id) {
  if (!requireCapability("operations_manage")) return;
  const b = findBooking(id);
  if (b.status !== "Preparing") return;
  const blockers = startBlockers(b);
  if (blockers.length) return toast("Tour chưa đủ điều kiện: " + blockers.map((c) => c.fix).join("; "));
  setBookingStatus(b, "Running", "Điều hành bắt đầu tour");
  closeModal();
  render();
  openBooking(id);
  toast("Tour đã chuyển sang Đang chạy.");
}

function finishTour(id, by = "") {
  const b = findBooking(id);
  if (!b || b.status !== "Running") return;
  if (!can("operations_manage") && !(isGuideRole() && b.guide === activeGuideId())) return toast("Bạn không có quyền kết thúc tour này.");
  setBookingStatus(b, "Completed", by || "Tour hoàn tất");
  initializeCustomerService();
  render();
  if (document.querySelector(".booking360")) openBooking(id);
  toast("Tour hoàn tất. Hồ sơ chăm sóc sau tour và quyết toán đã được mở.");
}

function printVoucher(id) {
  const b = findBooking(id);
  if (isGuideRole() && b?.guide !== activeGuideId()) return toast("Voucher không thuộc tour được giao cho bạn.");
  if (!isGuideRole() && !can("operations_manage") && !can("documents_manage")) return toast("Bạn không có quyền xem voucher này.");
  if (!b.voucher) return toast("Chưa có voucher hợp lệ.");
  const g = findGuide(b.guide);
  const v = (state.vehicles || []).find((x) => x.id === b.vehicle);
  printable(
    "Phiếu dịch vụ (Voucher) " + id,
    `<h2>${esc(b.tour)}</h2><p>${esc(b.client)} · ${b.pax} khách<br>${fmt(b.start)} — ${fmt(b.end)}<br>HDV: ${esc(g?.name || "—")}${v ? `<br>Xe: ${esc(v.name)} · ${esc(v.plate)}` : ""}</p><table><tr><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Mã xác nhận</th><th>Trạng thái</th></tr>${bookingServices(b).map((s) => `<tr><td>${typesVI[s.type]}</td><td>${esc(findSupplier(s.supplier)?.name || "—")}</td><td>${esc(s.confirmCode || "—")}</td><td>${serviceLabels[serviceStatus(s)]}</td></tr>`).join("")}</table><h2>Lịch trình</h2>${(b.program || []).map((p, i) => `<p><b>Ngày ${i + 1}</b> · ${esc(p)}</p>`).join("")}`,
  );
}

/* ---------- Sự cố ---------- */
function opsIssuesTab() {
  const list = state.issues.filter((i) => (opsIssueFilter === "open" ? i.status !== "Resolved" : opsIssueFilter === "all" || i.status === opsIssueFilter)).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return card(
    "Sự cố & vấn đề phát sinh",
    `<div class="filters"><select aria-label="Lọc sự cố" onchange="opsIssueFilter=this.value;render()">${[["open", "Chưa xử lý xong"], ["Resolved", "Đã xử lý"], ["all", "Tất cả"]].map(([v, l]) => `<option value="${v}" ${opsIssueFilter === v ? "selected" : ""}>${l}</option>`).join("")}</select><span class="sub" style="margin-left:auto">${list.length} sự cố</span></div>` +
      (list.length
        ? table(
            ["MÃ", "BOOKING", "LOẠI", "NỘI DUNG", "MỨC ĐỘ", "BÁO CÁO", "TRẠNG THÁI", ""],
            list.map((i) => `<tr><td>${i.id}</td><td>${entityLink("booking", i.booking)}</td><td>${esc({ Supplier: "Nhà cung cấp", Guide: "HDV", Customer: "Khách hàng", Transport: "Vận chuyển", Other: "Khác" }[i.type] || i.type)}</td><td style="white-space:normal">${esc(i.note)}${i.resolution ? `<span class="sub">Xử lý: ${esc(i.resolution)}</span>` : ""}</td><td>${badge(issueSeverityLabels[i.severity] || "Trung bình", ["HIGH", "CRITICAL"].includes(i.severity) ? "red" : "amber")}</td><td><span class="sub">${esc(i.reporter || "")}<br>${dateTimeVN(i.createdAt)}</span></td><td>${badge(issueStatusLabels[i.status] || i.status, i.status === "Resolved" ? "green" : "amber")}</td><td><div class="actions">${i.status === "Open" && can("operations_manage") ? btn("Nhận xử lý", `startIssue('${i.id}')`, "small") : ""}${i.status !== "Resolved" && can("operations_manage") ? btn("Đã xử lý", `resolveIssueForm('${i.id}')`, "small") : ""}</div></td></tr>`),
          )
        : '<div class="empty">Không có sự cố nào.</div>'),
  );
}

function issueForm(id = "") {
  const options = state.bookings.filter((b) => ["Preparing", "Running", "Confirmed"].includes(b.status) && (!isGuideRole() || b.guide === activeGuideId()));
  modal(
    "Ghi nhận sự cố",
    `<form onsubmit="addIssue(event)"><div class="formgrid"><label>Booking<select name="booking" required>${options.map((b) => `<option value="${b.id}" ${b.id === id ? "selected" : ""}>${b.id} · ${esc(b.client)}</option>`).join("")}</select></label><label>Loại<select name="type"><option value="Supplier">Nhà cung cấp</option><option value="Guide">Hướng dẫn viên</option><option value="Customer">Khách hàng</option><option value="Transport">Vận chuyển</option><option value="Other">Khác</option></select></label><label>Mức độ<select name="severity">${Object.entries(issueSeverityLabels).map(([k, l]) => `<option value="${k}" ${k === "MEDIUM" ? "selected" : ""}>${l}</option>`).join("")}</select></label><label class="full">Nội dung<textarea name="note" required></textarea></label></div><div class="formfooter"><button class="btn primary">Lưu sự cố</button></div></form>`,
    true,
  );
}

function addIssue(e) {
  e.preventDefault();
  if (!(can("operations_manage") || isGuideRole())) return toast("Bạn không có quyền ghi nhận sự cố.");
  const f = new FormData(e.target);
  const issue = { id: nextBusinessId("issues"), booking: f.get("booking"), type: f.get("type"), severity: f.get("severity"), note: f.get("note").trim(), status: "Open", reporter: actor().name, createdAt: nowISO() };
  state.issues.push(issue);
  audit("booking", issue.booking, "ISSUE", `${issue.booking} có sự cố (${issueSeverityLabels[issue.severity]}): ${issue.note}`);
  closeModal();
  render();
  toast("Đã ghi nhận sự cố " + issue.id + ".");
}

function startIssue(id) {
  if (!requireCapability("operations_manage")) return;
  const i = state.issues.find((x) => x.id === id);
  i.status = "Processing";
  i.handler = actor().name;
  audit("booking", i.booking, "ISSUE", `${actor().name} nhận xử lý sự cố ${id}`);
  render();
}

function resolveIssueForm(id) {
  modal("Xử lý sự cố " + id, `<form onsubmit="resolveIssue(event,'${id}')"><label>Cách xử lý<textarea name="resolution" required></textarea></label><div class="formfooter"><button class="btn primary">Đánh dấu đã xử lý</button></div></form>`, true);
}

function resolveIssue(e, id) {
  e.preventDefault();
  if (!requireCapability("operations_manage")) return;
  const i = state.issues.find((x) => x.id === id);
  i.status = "Resolved";
  i.resolution = new FormData(e.target).get("resolution").trim();
  i.resolvedAt = nowISO();
  audit("booking", i.booking, "ISSUE", `Đã xử lý sự cố ${id}: ${i.resolution}`);
  closeModal();
  render();
}
