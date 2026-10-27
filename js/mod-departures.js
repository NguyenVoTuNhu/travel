/* MODULE mod-departures — Chuyến khởi hành SIC (T3-07c): mở bán từ bản thiết kế tour SIC, quản lý đơn vị ghép và số chỗ. */

let departureQuery = "";

/* Collection có thể chưa có trong state (trình duyệt còn giữ bản data.js cũ): tự tạo mảng rỗng. */
const departureStore = () => (state.departures ||= []);
const departureFind = (id) => departureStore().find((dep) => dep.id === id);

const departureStatusLabels = { OPEN: "Đang mở bán", CLOSED: "Đã đóng bán", CANCELLED: "Đã hủy" };
const departureUnitLabels = { NEW: "Chưa báo giá", QUOTED: "Đã báo giá", BOOKED: "Đã đặt", CANCELLED: "Đã hủy" };
const departureUnitTones = { NEW: "", QUOTED: "blue", BOOKED: "green", CANCELLED: "red" };

/* ---------- Dữ liệu và số chỗ ---------- */
function departureUnits(dep) {
  if (!Array.isArray(dep.units)) dep.units = [];
  return dep.units;
}

/* Chỗ đã giữ = tổng khách các đơn vị chưa hủy (T3-07d: hủy booking thì đơn vị chuyển Đã hủy và trả chỗ). */
function departureUsed(dep) {
  return departureUnits(dep)
    .filter((u) => u.status !== "CANCELLED")
    .reduce((sum, u) => sum + (Number(u.pax) || 0), 0);
}

function departureLeft(dep) {
  return Math.max(0, (Number(dep.capacity) || 0) - departureUsed(dep));
}

function departureSeatStatus(dep) {
  if (dep.status === "CANCELLED") return { text: "Đã hủy", tone: "red" };
  if (dep.status === "CLOSED") return { text: "Đã đóng bán", tone: "amber" };
  const left = departureLeft(dep);
  if (left <= 0) return { text: "Đã đầy", tone: "red" };
  return { text: `Còn ${left} chỗ`, tone: "green" };
}

function departureSummaryText(dep) {
  return `Đã giữ ${departureUsed(dep)} / ${Number(dep.capacity) || 0} khách · ${departureUnits(dep).length} đơn vị`;
}

/* Các hàm chọn/kiểm tra trùng của tour SIC thiết kế dùng được cho chuyến qua một đối tượng giả có `sicUnits`. */
const departureAsDesign = (dep) => ({ sicUnits: departureUnits(dep).filter((u) => u.status !== "CANCELLED") });

function departureDraftCount(draftId) {
  return departureStore().filter((dep) => dep.draftId === draftId && dep.status !== "CANCELLED").length;
}

/* ---------- Quyền ---------- */
const departureCanManage = () => can("tour_design_manage");

function departureCanEditUnits(dep) {
  return departureCanManage() && dep.status === "OPEN";
}

function departureCanDelete(dep) {
  if (!departureCanManage()) return false;
  if (!can("all") && dep.owner !== actor().name) return false;
  return !departureUnits(dep).some((u) => u.quoteId || u.bookingId);
}

/* ---------- Thư viện: tab Chuyến SIC ---------- */
function departureTabs() {
  const total = departureStore().length;
  const tab = (key, label) => {
    const active = designLibraryTab === key ? "active" : "";
    return `<button class="${active}" onclick="designLibraryTab='${key}';render()">${label}</button>`;
  };
  const tabs = tab("programs", "Chương trình") + tab("departures", `Chuyến SIC (${total})`);
  return `<nav class="dz-tabs dep-tabs">${tabs}</nav>`;
}

function departureCompare(a, b) {
  const rank = (dep) => (dep.status === "CANCELLED" ? 1 : 0);
  return rank(a) - rank(b) || String(a.start).localeCompare(String(b.start));
}

function departureSearchText(dep) {
  const names = departureUnits(dep).map((u) => designSicUnitName(u)).join(" ");
  return `${dep.id} ${dep.name} ${dep.start} ${dep.owner} ${names}`.toLowerCase();
}

function departureFiltered() {
  const q = departureQuery.trim().toLowerCase();
  const list = [...departureStore()].sort(departureCompare);
  return q ? list.filter((dep) => departureSearchText(dep).includes(q)) : list;
}

function departureCard(dep) {
  const seat = departureSeatStatus(dep);
  const open = dep.status === "OPEN" && departureLeft(dep) > 0;
  const owner = esc(dep.owner || "Chưa phân công");
  const role = esc(dep.ownerRole || "Người mở bán");
  return [
    `<article class="tour-card dep-card" onclick="departureDetail('${dep.id}')" tabindex="0"`,
    ` onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();departureDetail('${dep.id}')}"`,
    ` aria-label="Xem chi tiết chuyến ${esc(dep.name)}">`,
    `<div class="tour-card-cover"><span>${systemIcon("calendar-days")}</span>`,
    `<em class="${open ? "is-ready" : ""}">${esc(seat.text)}</em></div>`,
    `<div class="tour-card-body"><div class="tour-card-title"><div><small>${esc(dep.id)}</small>`,
    `<h3>${esc(dep.name)}</h3></div><span>${systemIcon("arrow-right")}</span></div>`,
    `<p>Khởi hành ${fmt(dep.start)} · ${departureUnits(dep).length} đơn vị ghép</p>`,
    `<div class="tour-card-meta"><span>${systemIcon("calendar-days")} ${Number(dep.days) || 0} ngày</span>`,
    `<span>${systemIcon("users")} ${departureUsed(dep)}/${Number(dep.capacity) || 0} khách</span></div></div>`,
    `<footer><span><b>${owner}</b><small>${role}</small></span>`,
    `<div class="tour-card-end"><time>${dateTimeVN(dep.updatedAt)}</time></div></footer>`,
    `</article>`,
  ].join("");
}

function departureLibraryBody() {
  const list = departureFiltered();
  const searching = !!departureQuery;
  const title = searching ? "Không tìm thấy chuyến phù hợp" : "Chưa có chuyến khởi hành SIC";
  const hint = searching
    ? "Thử tìm bằng mã chuyến, tên tour hoặc đơn vị ghép khác."
    : "Mở bán chuyến từ một bản thiết kế tour SIC ở tab Chương trình.";
  const empty = designEmpty("calendar-days", title, hint);
  return [
    `<div class="tour-library-toolbar"><label>${systemIcon("magnifying-glass")}`,
    `<input value="${esc(departureQuery)}" placeholder="Tìm theo mã chuyến, tên tour, đơn vị ghép…"`,
    ` onchange="departureQuery=this.value;render()"></label><span>${list.length} chuyến</span></div>`,
    `<section class="tour-grid">${list.length ? list.map(departureCard).join("") : empty}</section>`,
  ].join("");
}

/* ---------- Mở bán chuyến từ bản thiết kế SIC ---------- */
function departureCardAction(item) {
  if (!departureCanManage() || item.design?.tourKind !== "sic") return "";
  return [
    `<button class="tour-card-open" title="Mở bán chuyến" aria-label="Mở bán chuyến từ ${esc(item.id)}"`,
    ` onclick="departureOpenClick(event,'${item.id}')" onkeydown="event.stopPropagation()">`,
    `${systemIcon("calendar-days")} Mở bán</button>`,
  ].join("");
}

function departureDetailAction(rec) {
  if (!departureCanManage() || rec.design?.tourKind !== "sic") return "";
  return btn(systemIcon("calendar-days") + " Mở bán chuyến", `departureOpenForm('${rec.id}')`);
}

function departureOpenClick(e, draftId) {
  e.stopPropagation();
  departureOpenForm(draftId);
}

function departureOpenForm(draftId) {
  if (!requireCapability("tour_design_manage")) return;
  const rec = (state.drafts || []).find((r) => r.id === draftId && r.design);
  if (!rec) return toast("Không tìm thấy bản thiết kế.");
  const d = { ...blankDesign(), ...rec.design };
  if (!designIsSic(d)) return toast("Chỉ mở bán chuyến từ bản thiết kế tour SIC.");
  if (!d.name.trim() || !(d.days > 0)) return toast("Hãy đặt tên và thời lượng cho tour SIC trước khi mở bán.");
  const units = designSicUnits(d);
  const copy = units.length
    ? [
        `<label class="dep-check"><input type="checkbox" name="copy" checked>`,
        ` Chép ${units.length} đơn vị ghép (${designSicTotal(d)} khách) từ bản thiết kế</label>`,
      ].join("")
    : "";
  const note = departureDraftCount(draftId)
    ? `<p class="dep-note">Chương trình này đã có ${departureDraftCount(draftId)} chuyến đang mở bán. Mỗi chuyến phải khác ngày khởi hành.</p>`
    : "";
  modal(
    "Mở bán chuyến SIC",
    [
      `<form class="dep-form" onsubmit="departureOpenSubmit(event,'${rec.id}')">`,
      `<p class="dep-form-name"><small>${esc(rec.id)}</small><b>${esc(d.name)}</b></p>`,
      `<div class="formgrid">`,
      `<label>Ngày khởi hành <i class="req">*</i>`,
      `<input type="date" name="start" required min="${todayISO()}" value="${esc(d.start || "")}"></label>`,
      `<label>Sức chứa (khách) <i class="req">*</i>`,
      `<input type="number" name="capacity" required min="1" max="${designSicMaxPax}" value="${Number(d.sicCapacity) || ""}"></label>`,
      `</div>`,
      copy,
      note,
      `<div class="formfooter">${btn("Hủy", "closeModal()")}<button class="btn primary" type="submit">Mở bán chuyến</button></div>`,
      `</form>`,
    ].join(""),
  );
}

function departureValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (Number.isNaN(Date.parse(`${value}T00:00:00`))) return false;
  return value >= todayISO();
}

function departureDuplicateDate(draftId, start, exceptId = "") {
  return departureStore().some((dep) => {
    return dep.id !== exceptId && dep.draftId === draftId && dep.start === start && dep.status !== "CANCELLED";
  });
}

function departureOpenSubmit(e, draftId) {
  e.preventDefault();
  if (!requireCapability("tour_design_manage")) return;
  const rec = (state.drafts || []).find((r) => r.id === draftId && r.design);
  if (!rec) return toast("Không tìm thấy bản thiết kế.");
  const d = { ...blankDesign(), ...rec.design };
  if (!designIsSic(d)) return toast("Chỉ mở bán chuyến từ bản thiết kế tour SIC.");
  const form = new FormData(e.target);
  const start = String(form.get("start") || "");
  const capacity = Math.floor(Number(form.get("capacity")) || 0);
  if (!departureValidDate(start)) return toast("Ngày khởi hành phải từ hôm nay trở đi.");
  if (capacity < 1 || capacity > designSicMaxPax) return toast(`Sức chứa phải từ 1 đến ${designSicMaxPax} khách.`);
  if (departureDuplicateDate(draftId, start)) return toast("Chương trình này đã có chuyến mở bán vào ngày đó.");
  const units = form.get("copy") ? departureCopyUnits(d) : [];
  const total = units.reduce((sum, u) => sum + u.pax, 0);
  if (total > capacity) return toast(`Sức chứa ${capacity} nhỏ hơn số khách đã ghép (${total}).`);
  const design = designSnapshot(d);
  design.sicUnits = [];
  design.start = start;
  design.sicCapacity = capacity;
  const now = nowISO();
  const dep = {
    id: nextStableId("departures"),
    draftId,
    name: d.name.trim(),
    start,
    days: Number(d.days) || 0,
    capacity,
    status: "OPEN",
    design,
    units,
    owner: actor().name,
    ownerRole: actor().role,
    createdAt: now,
    updatedAt: now,
  };
  departureStore().push(dep);
  audit("departure", dep.id, "CREATE", `Mở bán chuyến SIC ${dep.name} ngày ${start}, sức chứa ${capacity}`);
  save();
  closeModal();
  designLibraryTab = "departures";
  if (current === "design") render();
  else go("design");
  toast(`Đã mở bán chuyến ${dep.id}.`);
}

function departureCopyUnits(d) {
  return designSicUnits(d).map((u) => ({
    refType: u.refType,
    refId: u.refId,
    name: u.name,
    pax: Math.max(1, Math.floor(Number(u.pax) || 1)),
    status: "NEW",
    quoteId: "",
    bookingId: "",
  }));
}

/* ---------- Chi tiết chuyến ---------- */
function departureKpi(label, value) {
  return `<div><small>${label}</small><b>${value}</b></div>`;
}

function departureHeadHtml(dep) {
  const seat = departureSeatStatus(dep);
  const status = badge(departureStatusLabels[dep.status] || dep.status, dep.status === "CANCELLED" ? "red" : "blue");
  return [
    `<div class="dep-head"><div><small>${esc(dep.id)} · từ bản thiết kế ${esc(dep.draftId)}</small>`,
    `<h3>${esc(dep.name)}</h3></div><div class="dep-badges">${status}${badge(seat.text, seat.tone)}</div></div>`,
    `<div class="dep-kpis">`,
    departureKpi("Khởi hành", fmt(dep.start)),
    departureKpi("Thời lượng", `${Number(dep.days) || 0} ngày`),
    departureKpi("Sức chứa", `${Number(dep.capacity) || 0} khách`),
    departureKpi("Đã giữ", `${departureUsed(dep)} khách`),
    departureKpi("Còn lại", `${departureLeft(dep)} chỗ`),
    `</div>`,
  ].join("");
}

function departureInfoPanel(dep) {
  const editable = departureCanManage() && dep.status !== "CANCELLED";
  const lock = editable ? "" : "disabled";
  return [
    `<section class="dep-panel"><h3>Thông tin chuyến</h3><div class="dep-fields">`,
    `<label>Ngày khởi hành`,
    `<input id="depStart" type="date" min="${todayISO()}" value="${esc(dep.start)}" ${lock}`,
    ` onchange="departureSetStart('${dep.id}',this.value)"></label>`,
    `<label>Sức chứa (khách)`,
    `<input id="depCapacity" type="number" min="1" max="${designSicMaxPax}" value="${Number(dep.capacity) || ""}" ${lock}`,
    ` onchange="departureSetCapacity('${dep.id}',this.value)"></label>`,
    `<span>Người mở bán <b>${esc(dep.owner || "—")}</b></span>`,
    `<span>Cập nhật <b>${dateTimeVN(dep.updatedAt)}</b></span>`,
    `</div></section>`,
  ].join("");
}

function departureUnitRow(dep, u, i) {
  const editable = departureCanEditUnits(dep) && !u.quoteId && !u.bookingId;
  const lock = editable ? "" : "disabled";
  const label = departureUnitLabels[u.status] || u.status;
  const remove = editable
    ? [
        `<button type="button" class="btn small dz-sic-remove" onclick="departureRemoveUnit('${dep.id}',${i})"`,
        ` aria-label="Bỏ đơn vị khỏi chuyến" title="Bỏ đơn vị khỏi chuyến">${systemIcon("trash")}</button>`,
      ].join("")
    : "<span></span>";
  return [
    `<div class="dep-unit">`,
    `<div class="dz-sic-name"><b>${esc(designSicUnitName(u))}</b>`,
    `<small>${esc(designSicSourceLabels[u.refType] || "")}${esc(departureUnitHint(u))}</small></div>`,
    `<span class="dep-unit-status">${badge(label, departureUnitTones[u.status] || "")}${departureUnitActions(dep, u, i)}</span>`,
    `<label class="dz-sic-pax"><span>Số khách</span>`,
    `<input id="depPax${i}" type="number" min="1" max="${designSicMaxPax}" value="${Number(u.pax) || 1}" ${lock}`,
    ` onchange="departureSetPax('${dep.id}',${i},this.value)"></label>`,
    remove,
    `</div>`,
  ].join("");
}

/* Khách trong hệ thống chưa có trong chuyến này. */
function departurePicker(dep) {
  const { leads, customers } = designSicPickables(departureAsDesign(dep));
  const option = (kind, r) => `<option value="${kind}|${esc(r.id)}">${esc(r.name)} · ${esc(r.id)}</option>`;
  const groups = [
    `<optgroup label="Khách hàng thường">${customers.map((c) => option("customer", c)).join("")}</optgroup>`,
    `<optgroup label="Khách hàng tiềm năng">${leads.map((l) => option("lead", l)).join("")}</optgroup>`,
  ].join("");
  return [
    `<label class="dz-field"><span>Chọn khách hàng trong hệ thống (chọn lần lượt nhiều khách)</span>`,
    `<select onchange="departureAddRef('${dep.id}',this.value)">`,
    `<option value="">-- Chọn khách hàng để ghép --</option>${groups}</select></label>`,
  ].join("");
}

function departureManualForm(dep) {
  return [
    `<div class="dz-sic-manual">`,
    `<label class="dz-field"><span>Hoặc nhập đơn vị chưa có trong hệ thống</span>`,
    `<input id="depName" maxlength="80" placeholder="Tên đơn vị / công ty ghép"></label>`,
    `<label class="dz-field"><span>Số khách</span>`,
    `<input id="depManualPax" type="number" min="1" max="${designSicMaxPax}" value="1"></label>`,
    `<button type="button" class="btn primary" onclick="departureAddManual('${dep.id}')">Thêm đơn vị</button>`,
    `</div>`,
  ].join("");
}

function departureUnitsCard(dep) {
  const units = departureUnits(dep);
  const seat = departureSeatStatus(dep);
  const empty = '<p class="sub">Chưa có đơn vị ghép trong chuyến này.</p>';
  const list = units.length ? units.map((u, i) => departureUnitRow(dep, u, i)).join("") : empty;
  const locked = dep.status === "OPEN"
    ? "Bạn không có quyền sửa đơn vị."
    : "Chuyến không còn mở bán — mở bán lại để thêm hoặc sửa đơn vị.";
  const adder = departureCanEditUnits(dep)
    ? `<div class="dz-sic-add">${departurePicker(dep)}${departureManualForm(dep)}</div>`
    : `<p class="dep-note">${locked}</p>`;
  const body = [
    `<p class="dz-sic-summary" id="depSummary">${esc(departureSummaryText(dep))}</p>`,
    `<div class="dep-units">${list}</div>`,
    adder,
  ].join("");
  return card("Đơn vị ghép", body, `<span id="depSeat">${badge(seat.text, seat.tone)}</span>`);
}

function departureProgramPanel(dep) {
  const days = designDetailDays({ ...blankDesign(), ...dep.design });
  return `<details class="dep-program"><summary>Lịch trình của chuyến</summary><ol class="tour-detail-days">${days}</ol></details>`;
}

function departureFooter(dep) {
  const manage = departureCanManage();
  const del = departureCanDelete(dep)
    ? btn(systemIcon("trash") + " Xóa chuyến", `departureDelete('${dep.id}')`, "danger tour-detail-delete")
    : "";
  const cancel = manage && dep.status !== "CANCELLED"
    ? btn("Hủy chuyến", `departureSetStatus('${dep.id}','CANCELLED')`, "danger")
    : "";
  let toggle = "";
  if (manage && dep.status === "OPEN") toggle = btn("Đóng bán", `departureSetStatus('${dep.id}','CLOSED')`);
  if (manage && dep.status === "CLOSED") toggle = btn("Mở bán lại", `departureSetStatus('${dep.id}','OPEN')`, "primary");
  return `${del}${cancel}${btn("Đóng", "closeModal()")}${toggle}`;
}

function departureDetailHtml(dep) {
  return [
    `<div class="dep-detail">`,
    `<div id="dep-head">${departureHeadHtml(dep)}</div>`,
    `<div id="dep-info">${departureInfoPanel(dep)}</div>`,
    `<div id="dep-units-card">${departureUnitsCard(dep)}</div>`,
    departureProgramPanel(dep),
    `<footer id="dep-footer">${departureFooter(dep)}</footer>`,
    `</div>`,
  ].join("");
}

function departureDetail(id) {
  const dep = departureFind(id);
  if (!dep) return toast("Không tìm thấy chuyến khởi hành.");
  modal(`Chuyến khởi hành · ${esc(dep.id)}`, departureDetailHtml(dep));
}

/* ---------- Cập nhật giao diện ---------- */
/* Chỉ cập nhật phần đầu (nhãn, số liệu) và dòng tổng — không vẽ lại ô đang nhập để giữ con trỏ khi bấm Tab. */
function departureRefreshStats(dep) {
  const head = document.getElementById("dep-head");
  if (head) head.innerHTML = departureHeadHtml(dep);
  const seat = departureSeatStatus(dep);
  const holder = document.getElementById("depSeat");
  if (holder) holder.innerHTML = badge(seat.text, seat.tone);
  const summary = document.getElementById("depSummary");
  if (summary) summary.textContent = departureSummaryText(dep);
}

function departureRefreshUnits(dep) {
  const box = document.getElementById("dep-units-card");
  if (box) box.innerHTML = departureUnitsCard(dep);
  departureRefreshStats(dep);
}

function departureRefreshAll(dep) {
  departureRefreshUnits(dep);
  const info = document.getElementById("dep-info");
  if (info) info.innerHTML = departureInfoPanel(dep);
  const footer = document.getElementById("dep-footer");
  if (footer) footer.innerHTML = departureFooter(dep);
}

/* Ghi nhận thay đổi: cập nhật giờ, nhật ký, lưu, làm mới danh sách phía sau hộp thoại. */
function departureTouch(dep, summary) {
  dep.updatedAt = nowISO();
  audit("departure", dep.id, "UPDATE", summary);
  save();
  if (current === "design" && designLibraryTab === "departures") render();
}

function departureResetInput(id, value) {
  const input = document.getElementById(id);
  if (input) input.value = value;
}

/* ---------- Đơn vị ghép của chuyến ---------- */
function departureEditable(id) {
  const dep = departureFind(id);
  if (!dep || !departureCanEditUnits(dep)) {
    toast("Không sửa được đơn vị của chuyến này (chuyến không còn mở bán hoặc bạn không có quyền).");
    return null;
  }
  return dep;
}

function departureAddUnit(dep, unit) {
  const pax = Math.floor(Number(unit.pax) || 0);
  if (pax < 1) return toast("Số khách của đơn vị phải từ 1 trở lên.");
  if (designSicIsDuplicate(departureAsDesign(dep), unit)) return toast("Đơn vị này đã có trong chuyến.");
  const left = departureLeft(dep);
  if (left <= 0) return toast("Chuyến đã đầy, không thể thêm đơn vị.");
  const fitted = Math.min(pax, left);
  departureUnits(dep).push({
    refType: unit.refType,
    refId: unit.refId,
    name: unit.name,
    pax: fitted,
    status: "NEW",
    quoteId: "",
    bookingId: "",
  });
  if (fitted < pax) toast(`Chỉ còn ${left} chỗ, đã ghi ${fitted} khách cho đơn vị này.`);
  departureTouch(dep, `Thêm đơn vị ${unit.name} (${fitted} khách) vào chuyến ${dep.id}`);
  departureRefreshUnits(dep);
}

function departureAddRef(id, selection) {
  const dep = departureEditable(id);
  if (!dep) return;
  const [kind, refId] = String(selection || "").split("|", 2);
  if (!refId || !["lead", "customer"].includes(kind)) return;
  const record = kind === "customer" ? (state.customers || []).find((c) => c.id === refId) : findLead(refId);
  if (!record) return toast("Khách hàng đã chọn không còn tồn tại.");
  departureAddUnit(dep, {
    refType: kind,
    refId,
    name: String(record.name || refId).slice(0, 80),
    pax: Number(record.pax) || 1,
  });
}

function departureAddManual(id) {
  const dep = departureEditable(id);
  if (!dep) return;
  const name = String(document.getElementById("depName")?.value || "").trim();
  if (!name) return toast("Hãy nhập tên đơn vị ghép.");
  departureAddUnit(dep, {
    refType: "manual",
    refId: "",
    name: name.slice(0, 80),
    pax: Number(document.getElementById("depManualPax")?.value) || 0,
  });
}

function departureSetPax(id, i, value) {
  const dep = departureEditable(id);
  const unit = dep && departureUnits(dep)[i];
  if (!unit) return;
  const wanted = Math.floor(Number(value) || 0);
  if (wanted < 1) {
    toast("Số khách của đơn vị phải từ 1 trở lên.");
    departureResetInput(`depPax${i}`, unit.pax);
    return;
  }
  const room = departureLeft(dep) + (Number(unit.pax) || 0);
  if (wanted > room) toast(`Vượt sức chứa, đơn vị này tối đa ${room} khách.`);
  unit.pax = Math.min(wanted, room);
  departureResetInput(`depPax${i}`, unit.pax);
  departureTouch(dep, `Đổi số khách đơn vị ${unit.name} thành ${unit.pax} (chuyến ${dep.id})`);
  departureRefreshStats(dep);
}

function departureRemoveUnit(id, i) {
  const dep = departureEditable(id);
  const unit = dep && departureUnits(dep)[i];
  if (!unit) return;
  if (unit.quoteId || unit.bookingId) return toast("Đơn vị đã có báo giá/booking, không bỏ khỏi chuyến được.");
  departureUnits(dep).splice(i, 1);
  departureTouch(dep, `Bỏ đơn vị ${unit.name} khỏi chuyến ${dep.id}`);
  departureRefreshUnits(dep);
}

/* ---------- Thông tin và trạng thái chuyến ---------- */
function departureSetCapacity(id, value) {
  const dep = departureFind(id);
  if (!dep || !departureCanManage() || dep.status === "CANCELLED") return toast("Không sửa được chuyến này.");
  const next = Math.floor(Number(value) || 0);
  const used = departureUsed(dep);
  if (next < 1 || next > designSicMaxPax) {
    toast(`Sức chứa phải từ 1 đến ${designSicMaxPax} khách.`);
    departureResetInput("depCapacity", dep.capacity);
    return;
  }
  if (next < used) {
    toast(`Sức chứa không thể nhỏ hơn số khách đã giữ (${used}).`);
    departureResetInput("depCapacity", dep.capacity);
    return;
  }
  dep.capacity = next;
  departureTouch(dep, `Đổi sức chứa chuyến ${dep.id} thành ${next} khách`);
  departureRefreshStats(dep);
}

function departureSetStart(id, value) {
  const dep = departureFind(id);
  if (!dep || !departureCanManage() || dep.status === "CANCELLED") return toast("Không sửa được chuyến này.");
  if (!departureValidDate(value)) {
    toast("Ngày khởi hành phải từ hôm nay trở đi.");
    departureResetInput("depStart", dep.start);
    return;
  }
  if (departureDuplicateDate(dep.draftId, value, dep.id)) {
    toast("Chương trình này đã có chuyến mở bán vào ngày đó.");
    departureResetInput("depStart", dep.start);
    return;
  }
  if (departureHasLiveDocs(dep)) {
    toast("Chuyến đã có báo giá hoặc booking nên không đổi ngày được (báo giá và booking giữ ngày cũ).");
    departureResetInput("depStart", dep.start);
    return;
  }
  dep.start = value;
  if (dep.design) dep.design.start = value;
  departureTouch(dep, `Đổi ngày khởi hành chuyến ${dep.id} thành ${value}`);
  departureRefreshStats(dep);
}

function departureSetStatus(id, status) {
  const dep = departureFind(id);
  if (!dep || !requireCapability("tour_design_manage")) return;
  if (dep.status === "CANCELLED") return toast("Chuyến đã hủy, không đổi trạng thái được.");
  const booked = departureUnits(dep).filter((u) => u.status === "BOOKED").length;
  if (status === "CANCELLED" && booked > 0) {
    return toast(`Còn ${booked} booking đang hoạt động. Hãy hủy các booking đó trước khi hủy chuyến.`);
  }
  const ask = `Hủy chuyến ${dep.id} (${dep.name})?\nChuyến đã hủy không mở bán lại được.`;
  if (status === "CANCELLED" && !confirm(ask)) return;
  dep.status = status;
  departureTouch(dep, `Đổi trạng thái chuyến ${dep.id} thành ${departureStatusLabels[status]}`);
  departureRefreshAll(dep);
  toast(`Chuyến ${dep.id}: ${departureStatusLabels[status].toLowerCase()}.`);
}

function departureDelete(id) {
  const dep = departureFind(id);
  if (!dep) return;
  const denied = "Bạn không xóa được chuyến này (chỉ người mở bán/CEO, và chưa có báo giá/booking).";
  if (!departureCanDelete(dep)) return toast(denied);
  if (!confirm(`Xóa chuyến ${dep.id} (${dep.name})?\nThao tác này không thể hoàn tác.`)) return;
  state.departures = departureStore().filter((item) => item.id !== id);
  audit("departure", id, "DELETE", `Xóa chuyến SIC ${dep.name} (${id})`);
  save();
  closeModal();
  if (current === "design") render();
  toast("Đã xóa chuyến khởi hành.");
}

/* ---------- Báo giá và booking riêng cho từng đơn vị (T3-07d) ---------- */
/* Hồ sơ khách của đơn vị; đơn vị nhập tay hoặc khách đã bị xóa thì không có. */
function departureUnitRecord(u) {
  if (u.refType === "customer") return (state.customers || []).find((c) => c.id === u.refId) || null;
  if (u.refType === "lead") return findLead(u.refId) || null;
  return null;
}

/* Chuyến có báo giá hoặc booking chưa hủy (đổi ngày sẽ làm lệch với chứng từ). */
function departureHasLiveDocs(dep) {
  return departureUnits(dep).some((u) => (u.quoteId || u.bookingId) && u.status !== "CANCELLED");
}

/* Dòng ghi chú dưới tên đơn vị: lý do chưa tạo được báo giá. */
function departureUnitHint(u) {
  if (u.status !== "NEW" || u.refType !== "manual") return "";
  return " · Chưa có hồ sơ khách, chưa tạo được báo giá";
}

/*
 * Dựng "bản thiết kế" cho đúng một đơn vị từ chương trình đã lưu trong chuyến:
 * - giá mỗi khách lấy ở mức bảng giá theo TỔNG khách cả chuyến, nhân với số khách của đơn vị;
 * - chi phí chia theo đầu khách: chi phí chương trình / số khách lúc thiết kế (chưa có thì sức chứa) x số khách của đơn vị.
 */
function departureQuotePlan(dep, u) {
  const base = JSON.parse(JSON.stringify(dep.design || {}));
  const d = { ...blankDesign(), ...base, tourKind: "sic", sicUnits: [] };
  d.name = dep.name;
  d.start = dep.start;
  d.program = (Array.isArray(d.program) ? d.program : []).map((p) => ({ title: p.title || "", text: p.text || "" }));
  d.days = d.program.length;
  d.services = d.services || {};
  d.lead = u.refType === "lead" ? u.refId : "";
  d.customerId = u.refType === "customer" ? u.refId : "";
  d.customerType = u.refType === "customer" ? "customer" : "lead";
  const total = Math.max(1, departureUsed(dep));
  d.pax = total;
  designApplyPricing(d);
  const factor = d.pricingMode === "daily" ? Math.max(1, d.program.length) : 1;
  const unitPrice = Number(d.unitPrice) || 0;
  const reference = Math.max(1, Number(base.pax) || Number(dep.capacity) || 1);
  const ratio = (Number(u.pax) || 0) / reference;
  svcCats().forEach((cat) => {
    d.services[cat] = designItems(d, cat).map((item) => ({
      ...item,
      cost: Math.round((Number(item.cost) || 0) * ratio),
    }));
  });
  d.pax = Number(u.pax) || 0;
  d.amount = Math.round(unitPrice * d.pax * factor);
  const tail = "Hãy hoàn thiện bản nháp SIC rồi mở bán chuyến mới.";
  if (!d.program.length || d.program.some((p) => !p.title.trim())) {
    return { error: `Chương trình của chuyến chưa đủ tiêu đề cho các ngày. ${tail}` };
  }
  if (!(d.amount > 0)) return { error: `Chương trình của chuyến chưa có giá bán (bảng giá hoặc giá nhập tay). ${tail}` };
  if (!(designCost(d) > 0)) return { error: `Chương trình của chuyến chưa có chi phí dịch vụ. ${tail}` };
  return { design: d, total };
}

/* Lý do chưa tạo được báo giá cho đơn vị; chuỗi rỗng là tạo được. Chuyến đầy vẫn tạo được vì chỗ đã giữ từ lúc đơn vị vào chuyến. */
function departureQuoteBlock(dep, u) {
  if (dep.status === "CANCELLED") return "Chuyến đã hủy nên không tạo được báo giá.";
  if (u.status === "CANCELLED") return "Đơn vị này đã hủy.";
  if (u.quoteId || u.bookingId) return "Đơn vị này đã có báo giá.";
  if (u.refType === "manual") {
    return "Đơn vị nhập tay chưa có hồ sơ khách hàng. Hãy thêm khách vào hệ thống rồi chọn lại đơn vị này trong chuyến.";
  }
  if (!departureUnitRecord(u)) return "Hồ sơ khách của đơn vị này không còn trong hệ thống.";
  return departureQuotePlan(dep, u).error || "";
}

function departureUnitActions(dep, u, i) {
  const parts = [];
  if (u.quoteId) parts.push(entityLink("quote", u.quoteId));
  if (u.bookingId) parts.push(entityLink("booking", u.bookingId));
  const live = dep.status !== "CANCELLED";
  if (live && u.status === "NEW" && u.refType === "manual" && can("customers_manage")) {
    parts.push(`<button type="button" class="btn small" onclick="departureCreateCustomer('${dep.id}',${i})">Thêm khách hàng</button>`);
  }
  if (live && u.status === "NEW" && can("quotes_manage")) {
    parts.push(`<button type="button" class="btn small primary" onclick="departureCreateQuote('${dep.id}',${i})">Tạo báo giá</button>`);
  }
  if (live && u.status === "QUOTED" && departureCanManage()) {
    parts.push(`<button type="button" class="btn small" onclick="departureCancelUnit('${dep.id}',${i})">Hủy đơn vị</button>`);
  }
  return parts.join("");
}

function departureCreateCustomer(id, i) {
  if (!requireCapability("customers_manage")) return;
  const dep = departureFind(id);
  const unit = dep ? departureUnits(dep)[i] : null;
  if (!unit || unit.refType !== "manual" || unit.status !== "NEW") {
    return toast("Chỉ có thể tạo hồ sơ cho đơn vị nhập tay chưa báo giá.");
  }
  modal("Thêm khách hàng từ đơn vị ghép", `<form class="customer-form" onsubmit="departureSaveCustomer(event,'${esc(id)}',${i})">
    <p>Khách hàng mới sẽ được lưu vào hệ thống và liên kết với đơn vị <b>${esc(unit.name)}</b> trong chuyến SIC để có thể tạo báo giá.</p>
    <h3>Thông tin khách hàng</h3>
    <div class="formgrid">
      <label class="full">Tên khách hàng / Công ty<input name="name" required maxlength="120" value="${esc(unit.name)}"></label>
      <label>Người liên hệ<input name="contact" required maxlength="120" value="${esc(unit.name)}"></label>
      <label>Số điện thoại<input name="phone" type="tel" required maxlength="40"></label>
      <label>Email<input name="email" type="email" maxlength="120"></label>
      <label>Tỉnh / Thành phố<input name="country" maxlength="100"></label>
      <label class="full">Địa chỉ<input name="address" maxlength="240"></label>
    </div>
    <div class="formfooter"><button class="btn" type="button" onclick="closeModal()">Hủy</button><button class="btn primary" type="submit">Tạo khách hàng và liên kết</button></div>
  </form>`, false);
}

function departureSaveCustomer(event, id, i) {
  event.preventDefault();
  if (!requireCapability("customers_manage")) return;
  const dep = departureFind(id);
  const unit = dep ? departureUnits(dep)[i] : null;
  if (!unit || unit.refType !== "manual" || unit.status !== "NEW") {
    return toast("Đơn vị đã thay đổi trạng thái, không thể liên kết khách hàng.");
  }
  const form = new FormData(event.target);
  const values = Object.fromEntries(["name", "contact", "phone", "email", "country", "address"].map((key) => [key, String(form.get(key) || "").trim()]));
  if (!values.name || !values.contact || !values.phone) return toast("Hãy nhập tên khách hàng, người liên hệ và số điện thoại.");
  if (values.email && (state.customers || []).some((item) => String(item.email || "").toLowerCase() === values.email.toLowerCase())) {
    return toast("Email đã tồn tại trong hệ thống. Hãy kiểm tra khách hàng hiện có.");
  }
  const customer = { id: nextBusinessId("customers"), careLog: [], segment: "", whatsapp: "", birthday: "", owner: actor().name || "", status: "prospect", ...values };
  (state.customers ||= []).push(customer);
  unit.refType = "customer";
  unit.refId = customer.id;
  unit.name = customer.name.slice(0, 80);
  save();
  log(`Thêm khách hàng ${customer.name} từ chuyến SIC ${dep.id}`);
  closeModal();
  departureDetail(id);
  toast("Đã tạo khách hàng và liên kết với đơn vị. Có thể tạo báo giá.");
}

function departureCreateQuote(id, i) {
  if (!requireCapability("quotes_manage")) return;
  const dep = departureFind(id);
  const u = dep ? departureUnits(dep)[i] : null;
  if (!u) return toast("Không tìm thấy đơn vị trong chuyến.");
  const reason = departureQuoteBlock(dep, u);
  if (reason) return toast(reason);
  const plan = departureQuotePlan(dep, u);
  const record = departureUnitRecord(u);
  const qid = nextBusinessId("quotes");
  const quote = designQuoteRecord(plan.design, record.name, qid);
  quote.departureId = dep.id;
  quote.departurePax = plan.total;
  state.quotes.push(quote);
  u.status = "QUOTED";
  u.quoteId = qid;
  if (u.refType === "lead") {
    record.tour = quote.tour;
    record.days = quote.days;
    record.start = quote.start;
  }
  audit("quote", qid, "CREATE", `Tạo báo giá ${qid} cho ${record.name}, chuyến ${dep.id} (${fxMoney(quote.amount)})`);
  departureTouch(dep, `Tạo báo giá ${qid} cho đơn vị ${record.name} (${u.pax} khách)`);
  closeModal();
  go("quotes");
  quoteDetail(qid);
  toast(`Đã tạo báo giá nháp ${qid} cho ${record.name}.`);
}

/* Đơn vị đã báo giá nhưng khách không đi nữa: trả chỗ, báo giá chưa chốt chuyển sang Từ chối. */
function departureCancelUnit(id, i) {
  if (!requireCapability("tour_design_manage")) return;
  const dep = departureFind(id);
  const u = dep ? departureUnits(dep)[i] : null;
  if (!u || dep.status === "CANCELLED") return toast("Không hủy được đơn vị này.");
  if (u.status !== "QUOTED") return toast("Chỉ hủy được đơn vị đã báo giá. Đơn vị đã đặt thì hủy ở booking.");
  const name = designSicUnitName(u);
  const ask = `Hủy đơn vị ${name} (${u.pax} khách) khỏi chuyến ${dep.id}?\nChỗ được trả lại và báo giá ${u.quoteId} không dùng được nữa.`;
  if (!confirm(ask)) return;
  u.status = "CANCELLED";
  const quote = findQuote(u.quoteId);
  if (quote && ["Draft", "Sent"].includes(quote.status)) {
    quote.status = "Rejected";
    quote.rejectReason = `Đơn vị rút khỏi chuyến ${dep.id}`;
  }
  departureTouch(dep, `Hủy đơn vị ${name} khỏi chuyến ${dep.id}`);
  departureRefreshUnits(dep);
  toast(`Đã hủy đơn vị ${name}, trả lại ${u.pax} chỗ.`);
}

/* Đơn vị đang gắn với một báo giá hoặc booking. */
function departureUnitOf(field, value) {
  for (const dep of departureStore()) {
    const unit = departureUnits(dep).find((u) => u[field] === value);
    if (unit) return { dep, unit };
  }
  return null;
}

/* Lý do không chốt được báo giá của chuyến (khách chấp nhận → tạo booking); rỗng là chốt được. */
function departureAcceptBlock(q) {
  const dep = departureFind(q.departureId);
  if (!dep) return "Chuyến khởi hành của báo giá này không còn tồn tại.";
  if (dep.status === "CANCELLED") return `Chuyến ${dep.id} đã hủy, không tạo được booking.`;
  const unit = departureUnits(dep).find((u) => u.quoteId === q.id);
  if (!unit) return "Báo giá này không còn gắn với đơn vị nào trong chuyến.";
  if (unit.status === "CANCELLED") return "Đơn vị của báo giá này đã bị hủy khỏi chuyến.";
  if (unit.status === "BOOKED") return "Đơn vị của báo giá này đã có booking.";
  return "";
}

function departureOnBookingCreated(q, booking) {
  const found = departureUnitOf("quoteId", q.id);
  if (!found) return;
  found.unit.status = "BOOKED";
  found.unit.bookingId = booking.id;
  found.dep.updatedAt = nowISO();
  audit("departure", found.dep.id, "UPDATE", `${booking.id} từ ${q.id}: đơn vị ${designSicUnitName(found.unit)} đã đặt chỗ`);
}

/* Hủy booking thì trả chỗ cho chuyến. */
function departureOnBookingCancelled(b) {
  const found = departureUnitOf("bookingId", b.id);
  if (!found || found.unit.status === "CANCELLED") return;
  found.unit.status = "CANCELLED";
  found.dep.updatedAt = nowISO();
  audit("departure", found.dep.id, "UPDATE", `Hủy ${b.id}: trả ${found.unit.pax} chỗ của chuyến ${found.dep.id}`);
}
