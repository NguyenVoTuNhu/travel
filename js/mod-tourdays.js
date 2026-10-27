/* MODULE mod-tourdays — Ngân hàng "ngày tour" (T3-02): kho ngày dùng lại, nhặt ngày hoặc cả tour mẫu để ghép lịch trình. */

let tourDayFilter = { q: "", language: "" };
let tourDayPick = [];
let tourDayWithServices = true;
let tourDayBack = false;

/* Collection có thể chưa có trong state (trình duyệt còn giữ bản data.js cũ): tự tạo mảng rỗng. */
const tourDayStore = () => (state.tourDays ||= []);
const tourDayList = () => tourDayStore();
const tourDayFind = (id) => tourDayList().find((day) => day.id === id);
const tourDayKey = (title, language) => `${String(title).trim().toLowerCase()}|${language}`;

function tourDayCanEdit(day) {
  if (!can("tour_design_manage")) return false;
  return can("all") || day.owner === actor().name;
}

function tourDayServiceText(day) {
  return (day.services || []).map((svc) => {
    const sup = findSupplier(svc.supplier);
    const price = sup && svc.priceIndex !== "" && svc.priceIndex != null ? (sup.prices || [])[Number(svc.priceIndex)] : null;
    return `${svcLabel(svc.cat)}: ${sup?.name || ""}${price ? ` ${price.name}` : ""}`;
  }).join(" · ");
}

function tourDayFiltered() {
  const q = tourDayFilter.q.trim().toLowerCase();
  const lang = tourDayFilter.language;
  return tourDayList().filter((day) => {
    if (lang && day.language !== lang) return false;
    if (!q) return true;
    return `${day.title} ${day.text} ${tourDayServiceText(day)}`.toLowerCase().includes(q);
  });
}

function tourDayLanguages() {
  return travelLanguages.length ? travelLanguages : ["Tiếng Việt"];
}

/* Bộ lọc dùng chung cho tab quản lý và hộp thoại nhặt ngày. */
function tourDayFilters() {
  const f = tourDayFilter;
  const langs = tourDayLanguages().map((l) => `<option ${f.language === l ? "selected" : ""}>${esc(l)}</option>`);
  return [
    `<div class="tour-day-filters">`,
    `<input class="dz-search" placeholder="Tìm theo tiêu đề, nội dung, dịch vụ…" value="${esc(f.q)}"`,
    ` onchange="tourDayFilterChange('q',this.value)">`,
    `<select aria-label="Ngôn ngữ" onchange="tourDayFilterChange('language',this.value)">`,
    `<option value="">Mọi ngôn ngữ</option>${langs.join("")}</select>`,
    `</div>`,
  ].join("");
}

function tourDayFilterChange(key, value) {
  tourDayFilter[key] = value;
  if (document.querySelector(".tour-day-picker")) tourDayPicker(false);
  else designRefresh(["templates"]);
}

function tourDaySnippet(day) {
  const text = String(day.text || "").replace(/\s+/g, " ").trim();
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

function tourDayMeta(day) {
  const parts = [esc(day.language || "")];
  if ((day.services || []).length) parts.push(`${day.services.length} dịch vụ gợi ý`);
  parts.push(esc(day.owner || ""));
  return parts.filter(Boolean).join(" · ");
}

function tourDayManageRow(day) {
  const edit = tourDayCanEdit(day)
    ? btn("Sửa", `tourDayForm('${day.id}')`, "small") + btn("Xóa", `tourDayDelete('${day.id}')`, "small")
    : "";
  return [
    `<div class="dz-tpl">`,
    `<div><b>${esc(day.title)}</b><small>${tourDayMeta(day)}</small>`,
    `<small>${esc(tourDaySnippet(day))}</small></div>`,
    `<div class="actions">${edit}</div>`,
    `</div>`,
  ].join("");
}

/* Tab "Ngân hàng ngày" ở bước chọn mẫu: xem, thêm, sửa, xóa. */
function tourDayManagePanel() {
  const days = tourDayFiltered();
  const hasProgram = ensureDesign().program.some((p) => p.title.trim());
  const save = hasProgram
    ? btn(systemIcon("bookmark") + " Lưu lịch trình đang thiết kế", "tourDaySaveProgram()", "small")
    : "";
  const add = btn(systemIcon("plus") + " Thêm ngày", "tourDayForm('')", "small primary");
  const empty = designEmpty("calendar-day", "Ngân hàng ngày còn trống", "Thêm ngày để dùng lại khi ghép tour.");
  return [
    `<div class="dz-tools">${add}${save}</div>`,
    tourDayFilters(),
    `<div class="dz-tpl-list">${days.length ? days.map(tourDayManageRow).join("") : empty}</div>`,
  ].join("");
}

/* Form thêm/sửa một ngày. `seed` là dữ liệu điền sẵn khi lưu từ lịch trình đang thiết kế. */
function tourDayServiceRow(svc = { cat: "Hotel", supplier: "", priceIndex: "" }) {
  const cats = svcCats();
  const cat = cats.includes(svc.cat) ? svc.cat : (cats[0] || "Other");
  const suppliers = (state.suppliers || []).filter((sup) => sup.type === cat);
  const supplier = suppliers.find((sup) => sup.id === svc.supplier) || null;
  const prices = supplier ? (supplier.prices || []).map((price, i) => ({ price, i })) : [];
  const catOptions = cats.map((c) => `<option value="${esc(c)}" ${c === cat ? "selected" : ""}>${esc(svcLabel(c))}</option>`).join("");
  const supplierOptions = [`<option value="">Chọn nhà cung cấp trong hệ thống</option>`, ...suppliers.map((sup) => `<option value="${esc(sup.id)}" ${sup.id === svc.supplier ? "selected" : ""}>${esc(sup.name)}</option>`)].join("");
  const priceOptions = [`<option value="">Chỉ chọn NCC (chưa chọn hạng mục giá)</option>`, ...prices.map(({ price, i }) => `<option value="${i}" ${String(i) === String(svc.priceIndex) ? "selected" : ""}>${esc(price.name)} · ${money(price.price)} ${esc(price.unit || "")}</option>`)].join("");
  return `<div class="tour-day-svc"><div class="tour-day-svc-top"><select name="svcCat" aria-label="Loại dịch vụ" onchange="tourDayRefreshServiceRow(this)">${catOptions}</select><input type="search" aria-label="Tìm nhà cung cấp" placeholder="Tìm nhà cung cấp…" oninput="tourDayFilterSupplierOptions(this)"></div><div class="tour-day-svc-bottom"><select name="svcSupplier" aria-label="Chọn nhà cung cấp" onchange="tourDayRefreshServiceRow(this)">${supplierOptions}</select><select name="svcPrice" aria-label="Hạng mục giá">${priceOptions}</select><button type="button" title="Xóa dịch vụ" aria-label="Xóa dịch vụ" onclick="tourDayRemoveServiceRow(this)">${systemIcon("trash")}</button></div></div>`;
}

function tourDayFilterSupplierOptions(input) {
  const query = String(input.value || "").trim().toLowerCase();
  const select = input.closest(".tour-day-svc")?.querySelector('[name="svcSupplier"]');
  if (!select) return;
  for (const option of select.options) option.hidden = !!query && option.value !== "" && !option.textContent.toLowerCase().includes(query);
}

function tourDayRefreshServiceRow(control) {
  const row = control.closest(".tour-day-svc");
  if (!row) return;
  const rows = Array.from(document.querySelectorAll(".tour-day-svc"));
  const rowIndex = rows.indexOf(row);
  const cat = row.querySelector('[name="svcCat"]')?.value || "Hotel";
  const supplier = row.querySelector('[name="svcSupplier"]')?.value || "";
  const search = row.querySelector('input[type="search"]')?.value || "";
  const priceIndex = row.querySelector('[name="svcPrice"]')?.value || "";
  row.outerHTML = tourDayServiceRow({ cat, supplier, priceIndex });
  const replacement = document.querySelectorAll(".tour-day-svc")[rowIndex];
  if (replacement && search) { const input = replacement.querySelector('input[type="search"]'); if (input) { input.value = search; tourDayFilterSupplierOptions(input); } }
}

function tourDayRemoveServiceRow(button) {
  button.closest(".tour-day-svc")?.remove();
}

function tourDayAddServiceRow() {
  document.getElementById("tourDaySvcRows")?.insertAdjacentHTML("beforeend", tourDayServiceRow());
}

function tourDayFormHtml(day, id) {
  const langs = tourDayLanguages().map((l) => `<option ${l === day.language ? "selected" : ""}>${esc(l)}</option>`);
  const rows = (day.services || []).map((svc) => tourDayServiceRow(svc)).join("");
  return [
    `<form onsubmit="saveTourDay(event,'${id}')" class="tour-day-form">`,
    `<div class="formgrid">`,
    `<label>Tiêu đề ngày <i class="req">*</i>`,
    `<input name="title" required maxlength="200" value="${esc(day.title)}" placeholder="Ví dụ: Hà Nội – Phố cổ và ẩm thực"></label>`,
    `<label>Ngôn ngữ<select name="language">${langs.join("")}</select></label>`,
    `</div>`,
    `<label>Mô tả hoạt động<textarea name="text" maxlength="3000" rows="6"`,
    ` placeholder="Hoạt động, bữa ăn, nơi nghỉ…">${esc(day.text)}</textarea></label>`,
    `<div class="tour-day-svc-head"><b>Dịch vụ gợi ý</b>`,
    `${btn(systemIcon("plus") + " Thêm dịch vụ", "tourDayAddServiceRow()", "small")}</div>`,
    `<small class="muted">Chỉ chọn nhà cung cấp có sẵn trong hệ thống. Có thể chọn hạng mục giá để tự tính chi phí khi ghép ngày vào tour; không nhập tên NCC thủ công.</small>`,
    `<div id="tourDaySvcRows">${rows}</div>`,
    `<div class="formfooter">${btn("Hủy", "tourDayReturn()")}<button class="btn primary" type="submit">Lưu</button></div>`,
    `</form>`,
  ].join("");
}

function tourDayReturn() {
  closeModal();
  if (tourDayBack) designOpenBuilder();
}

function tourDayOpenForm(day, id) {
  if (!requireCapability("tour_design_manage")) return;
  tourDayBack = !!document.querySelector(".tour-builder-modal");
  modal(id ? "Sửa ngày trong ngân hàng" : "Thêm ngày vào ngân hàng", tourDayFormHtml(day, id));
}

function tourDayForm(id) {
  const day = id ? tourDayFind(id) : null;
  if (id && !day) return;
  if (day && !tourDayCanEdit(day)) return toast("Chỉ người tạo hoặc CEO được sửa ngày này.");
  const blank = { title: "", text: "", language: ensureDesign().language, services: [] };
  tourDayOpenForm(day || blank, id);
}

/* Lưu một ngày trong lịch trình đang thiết kế vào ngân hàng. */
function tourDaySaveFrom(index) {
  const d = ensureDesign();
  const p = d.program[index];
  if (!p || !p.title.trim()) return toast("Hãy nhập tiêu đề ngày trước khi lưu vào ngân hàng.");
  tourDayOpenForm({ title: p.title, text: p.text, language: d.language, services: [] }, "");
}

function tourDayServicesFromForm(form) {
  const cats = form.getAll("svcCat");
  const suppliers = form.getAll("svcSupplier");
  const prices = form.getAll("svcPrice");
  const list = [];
  cats.forEach((cat, i) => {
    const supplier = String(suppliers[i] || "");
    if (!supplier || !findSupplier(supplier)) return;
    const sup = findSupplier(supplier);
    if (sup.type !== cat) return;
    const priceIndex = String(prices[i] || "");
    const price = priceIndex !== "" ? (sup.prices || [])[Number(priceIndex)] : null;
    list.push({ cat: String(cat), supplier, priceIndex: price && Number.isInteger(Number(priceIndex)) ? Number(priceIndex) : "" });
  });
  return list;
}

function tourDayDuplicate(title, language, exceptId = "") {
  const key = tourDayKey(title, language);
  return tourDayList().some((day) => day.id !== exceptId && tourDayKey(day.title, day.language) === key);
}

function saveTourDay(e, id) {
  e.preventDefault();
  if (!requireCapability("tour_design_manage")) return;
  const form = new FormData(e.target);
  const title = String(form.get("title") || "").trim();
  const language = String(form.get("language") || tourDayLanguages()[0]);
  if (!title) return toast("Hãy nhập tiêu đề ngày.");
  if (tourDayDuplicate(title, language, id)) return toast("Đã có ngày trùng tiêu đề và ngôn ngữ.");
  const fields = {
    title,
    language,
    text: String(form.get("text") || "").trim(),
    services: tourDayServicesFromForm(form),
    updatedAt: new Date().toISOString(),
  };
  const day = id ? tourDayFind(id) : null;
  if (id && (!day || !tourDayCanEdit(day))) return toast("Chỉ người tạo hoặc CEO được sửa ngày này.");
  if (day) {
    Object.assign(day, fields);
    audit("tourDay", day.id, "UPDATE", `Sửa ngày trong ngân hàng: ${title}`);
  } else {
    const created = { id: nextStableId("tourDays"), owner: actor().name, createdAt: fields.updatedAt, ...fields };
    tourDayStore().push(created);
    audit("tourDay", created.id, "CREATE", `Thêm ngày vào ngân hàng: ${title}`);
  }
  save();
  toast("Đã lưu ngày vào ngân hàng.");
  tourDayReturn();
}

function tourDayDelete(id) {
  const day = tourDayFind(id);
  if (!day) return;
  if (!tourDayCanEdit(day)) return toast("Chỉ người tạo hoặc CEO được xóa ngày này.");
  if (!confirm(`Xóa ngày “${day.title}” khỏi ngân hàng? Các tour đã ghép từ ngày này không bị ảnh hưởng.`)) return;
  state.tourDays = tourDayStore().filter((item) => item.id !== id);
  tourDayPick = tourDayPick.filter((pickId) => pickId !== id);
  audit("tourDay", id, "DELETE", `Xóa ngày khỏi ngân hàng: ${day.title}`);
  save();
  designRefresh(["templates"]);
  toast("Đã xóa ngày khỏi ngân hàng.");
}

/* Lưu cả lịch trình đang thiết kế thành các ngày riêng trong ngân hàng (bỏ ngày trống và ngày trùng). */
function tourDaySaveProgram() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  let added = 0;
  for (const p of d.program) {
    const title = p.title.trim();
    if (!title || tourDayDuplicate(title, d.language)) continue;
    const now = new Date().toISOString();
    const day = { id: nextStableId("tourDays"), title, text: p.text.trim(), language: d.language };
    tourDayStore().push({ ...day, services: [], owner: actor().name, createdAt: now, updatedAt: now });
    added += 1;
  }
  if (!added) return toast("Không có ngày mới để lưu (ngày trống hoặc đã có trong ngân hàng).");
  audit("tourDay", "-", "CREATE", `Lưu ${added} ngày từ lịch trình “${d.name || "chưa đặt tên"}” vào ngân hàng`);
  save();
  designRefresh(["templates"]);
  toast(`Đã lưu ${added} ngày vào ngân hàng.`);
}

/* Hộp thoại nhặt ngày: thứ tự bấm chọn = thứ tự ghép vào cuối lịch trình. */
function tourDayPickRow(day) {
  const at = tourDayPick.indexOf(day.id);
  const order = at >= 0 ? `<em class="tour-day-order">${at + 1}</em>` : "";
  return [
    `<label class="dz-tpl tour-day-pick ${at >= 0 ? "picked" : ""}">`,
    `<input type="checkbox" ${at >= 0 ? "checked" : ""} onchange="tourDayTogglePick('${day.id}')">`,
    `<div><b>${esc(day.title)}</b><small>${tourDayMeta(day)}</small>`,
    `<small>${esc(tourDaySnippet(day))}</small></div>${order}`,
    `</label>`,
  ].join("");
}

function tourDayTemplateRow(t) {
  const count = (t.program?.length || t.itinerary.length);
  return [
    `<div class="dz-tpl"><div><b>${esc(t.name)}</b><small>${count} ngày</small></div>`,
    `${btn("Thêm vào cuối", `tourDayAppendTemplate('${t.id}')`, "small")}</div>`,
  ].join("");
}

function tourDayPickerTemplates() {
  const q = tourDayFilter.q.trim().toLowerCase();
  const list = (state.tourTemplates || []).filter((t) => !q || t.name.toLowerCase().includes(q));
  if (!list.length) return "";
  return `<h3 class="tour-day-sub">Hoặc thêm cả tour mẫu</h3><div class="dz-tpl-list">${list.map(tourDayTemplateRow).join("")}</div>`;
}

function tourDayPickerActions() {
  const n = tourDayPick.length;
  const check = tourDayWithServices ? "checked" : "";
  return [
    `<div class="tour-day-actions">`,
    `<label class="tour-day-with"><input type="checkbox" ${check} onchange="tourDayToggleServices(this.checked)">`,
    ` Kèm dịch vụ gợi ý</label>`,
    `<div>${btn("Hủy", "tourDayReturn()")}`,
    `${btn(`Thêm ${n} ngày đã chọn`, "tourDayAddPicked()", "primary")}</div>`,
    `</div>`,
  ].join("");
}

function tourDayPicker(fresh = true) {
  if (!requireCapability("tour_design_manage")) return;
  if (fresh) {
    tourDayPick = [];
    tourDayBack = !!document.querySelector(".tour-builder-modal");
  }
  const days = tourDayFiltered();
  const keep = document.querySelector(".tour-day-picker")?.scrollTop || 0;
  const empty = designEmpty("calendar-day", "Chưa có ngày phù hợp", "Thêm ngày ở bước Chọn mẫu → Ngân hàng ngày.");
  modal(
    "Ngân hàng ngày tour",
    [
      `<div class="tour-day-picker">`,
      `<p class="muted">Tích chọn các ngày muốn ghép. Số trên mỗi ngày là thứ tự sẽ được thêm vào cuối lịch trình.</p>`,
      tourDayFilters(),
      `<div class="dz-tpl-list">${days.length ? days.map(tourDayPickRow).join("") : empty}</div>`,
      tourDayPickerTemplates(),
      tourDayPickerActions(),
      `</div>`,
    ].join(""),
  );
  const box = document.querySelector(".tour-day-picker");
  if (box) box.scrollTop = keep;
}

function tourDayTogglePick(id) {
  const at = tourDayPick.indexOf(id);
  if (at >= 0) tourDayPick.splice(at, 1);
  else tourDayPick.push(id);
  tourDayPicker(false);
}

function tourDayToggleServices(value) {
  tourDayWithServices = !!value;
}

/* Gộp dịch vụ vào bước Chi phí, giá 0, bỏ dịch vụ đã có cùng tên. */
function tourDayMergeServices(d, groups) {
  for (const [cat, items] of Object.entries(groups)) {
    const key = svcCats().includes(cat) ? cat : "Other";
    const list = (d.services[key] ||= []);
    for (const item of items) {
      const sup = findSupplier(item.supplier);
      if (!sup || sup.type !== key) continue;
      const price = item.priceIndex !== "" && item.priceIndex != null ? (sup.prices || [])[Number(item.priceIndex)] : null;
      const qty = price ? priceQuantity(price, { pax: d.pax, days: d.days || d.program.length }) : 1;
      const name = price ? `${sup.name} – ${price.name} (${qty}${price.unit || ""})` : sup.name;
      if (list.some((x) => x.supplier === sup.id && x.name === name)) continue;
      list.push({ name, cost: price ? Number(price.price || 0) * qty : 0, supplier: sup.id });
    }
  }
}

function tourDayServiceGroups(days) {
  const groups = {};
  for (const day of days) {
    for (const svc of day.services || []) {
      if (!svc.supplier || !findSupplier(svc.supplier)) continue;
      (groups[svc.cat] ||= []).push({ supplier: svc.supplier, priceIndex: svc.priceIndex ?? "" });
    }
  }
  return groups;
}

/* Thêm các ngày vào cuối lịch trình rồi mở lại trình thiết kế ở bước Lịch trình. */
function tourDayAppend(programDays, groups, label) {
  const d = ensureDesign();
  const blankOnly = d.program.every((p) => !p.title.trim() && !p.text.trim());
  const base = blankOnly ? [] : d.program;
  if (base.length + programDays.length > 60) return toast("Tối đa 60 ngày.");
  d.program = base.concat(programDays.map((p) => ({ title: p.title, text: p.text || "" })));
  d.days = d.program.length;
  d.tab = "detail";
  d.viewStep = "itinerary";
  if (groups) tourDayMergeServices(d, groups);
  tourDayPick = [];
  closeModal();
  designOpenBuilder();
  toast(`Đã thêm ${programDays.length} ngày từ ${label} (tổng ${d.days} ngày).`);
}

function tourDayAddPicked() {
  const days = tourDayPick.map(tourDayFind).filter(Boolean);
  if (!days.length) return toast("Hãy chọn ít nhất một ngày.");
  const groups = tourDayWithServices ? tourDayServiceGroups(days) : null;
  tourDayAppend(days, groups, "ngân hàng");
}

function tourDayAppendTemplate(id) {
  const t = (state.tourTemplates || []).find((x) => x.id === id);
  if (!t) return;
  const days = t.program?.length ? t.program : t.itinerary.map((title) => ({ title, text: "" }));
  const groups = tourDayWithServices && t.services ? tourDayTemplateGroups(t.services) : null;
  tourDayAppend(days, groups, `mẫu “${t.name}”`);
}

function tourDayTemplateGroups(services) {
  const groups = {};
  for (const [cat, items] of Object.entries(services)) groups[cat] = items.map((item) => ({ name: item.name }));
  return groups;
}
