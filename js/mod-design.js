/* MODULE mod-design — Thiết kế tour 5 bước: thông tin → mẫu → lịch trình → chi phí → báo giá. */

let design = null;
const tourTypes = ["Du lịch nghỉ dưỡng", "Văn hóa – Di sản", "Khám phá – Mạo hiểm", "Gia đình", "Trăng mật", "Đoàn / MICE"];
let designTpl = { tab: "templates", region: "", country: "", type: "", q: "" };

const designSteps = [
  ["info", "Thông tin & Yêu cầu", "Khách hàng, nhu cầu, ngân sách"],
  ["template", "Chọn mẫu tour", "Mẫu có sẵn hoặc tour của tôi"],
  ["itinerary", "Thiết kế lịch trình", "Ngày, địa điểm, dịch vụ"],
  ["cost", "Chi phí & Dự toán", "Dịch vụ, giá, lợi nhuận"],
  ["preview", "Xem trước & Xuất báo giá", "Kiểm tra và hoàn tất"],
];
const tourRegions = ["Việt Nam", "Đông Nam Á", "Đông Bắc Á", "Nam Á", "Châu Âu", "Châu Mỹ", "Châu Úc", "Châu Phi", "Trung Đông"];
let designLibraryQuery = "";
let designLibraryTab = "programs";

const optionList = (values) => values.map((value) => `<option>${esc(value)}</option>`).join("");
const svcCats = () => serviceTypes.concat(["Other"]);
const svcLabel = (t) => (t === "Other" ? "Khác" : typesVI[t] || t);
const svcIcons = { Hotel: "hotel", Vehicle: "van-shuttle", Meal: "utensils", Ticket: "ticket", Guide: "user-tie", Other: "ellipsis" };

function designableLeads() {
  return scopedLeads().filter((lead) => leadIsOpen(lead));
}

function designSelectedCustomer(d = ensureDesign()) {
  if (d.customerType === "customer" && d.customerId) return (state.customers || []).find((c) => c.id === d.customerId) || null;
  return findLead(d.lead) || null;
}
function designCustomerName(d = ensureDesign()) {
  if (designIsSic(d)) return `Tour ghép SIC · ${designSicUnits(d).length} đơn vị`;
  return designSelectedCustomer(d)?.name || "Chưa chọn";
}
function designCustomerSelection(d = ensureDesign()) {
  return d.customerType === "customer" && d.customerId ? `customer|${d.customerId}` : d.lead ? `lead|${d.lead}` : "";
}

function blankDesign() {
  return { id: "", lead: "", customerId: "", customerType: "lead", name: "", country: "", pax: 2, days: 5, pricingMode: "total", pricingSource: "manual", unitPrice: 0, manualUnitPrice: 0, pricingProfileId: "", pricingTierPax: 1, paxPrices: {}, budgetNative: "", currency: travelCurrencies[0] || "", tourType: "", start: "", language: travelLanguages[0] || "Tiếng Việt", note: "", itNote: "", template: "", program: [], services: {}, amount: 0, tab: "detail", svcTab: "", cur: fxDisplayCurrency, sort: false, viewStep: "info" };
}

const ensureDesign = () => (design ||= blankDesign());
const designItems = (d, cat) => d.services[cat] || [];
const designCatCost = (d, cat) => designItems(d, cat).reduce((n, i) => n + Number(i.cost || 0), 0);
const designCost = (d) => svcCats().reduce((n, c) => n + designCatCost(d, c), 0);
const designMargin = (d) => (d.amount ? ((d.amount - designCost(d)) / d.amount) * 100 : 0);

function designFmt(d, vnd) {
  return fxMoney(vnd, d.cur || fxDisplayCurrency);
}

/* Tỷ giá lấy từ bảng VCB (mod-fx.js), chỉ xem — không nhập tay. */
function designRateField(d) {
  const code = d.currency || fxDisplayCurrency;
  const rate = fxRate(code);
  const text = rate ? `1 ${code} = ${new Intl.NumberFormat("vi-VN").format(rate)} ₫` : "Chưa có tỷ giá VCB";
  return `<label class="dz-field">Tỷ giá VCB (giá bán)<input value="${esc(text)}" readonly></label>`;
}

/* Ô nhập tiền của thiết kế tour theo tiền đang chọn (d.cur, mặc định USD); dữ liệu vẫn lưu bằng VND. */
function designInputCode(d) {
  return fxInputCode(d.cur || fxDisplayCurrency);
}

function designInputValue(d, vnd) {
  return fxFromVnd(vnd, designInputCode(d));
}

function designInputStep(d, vndStep) {
  return designInputCode(d) === "VND" ? String(vndStep) : "any";
}

function designCurToggle(d) {
  if (!fxCurrent()) return '<small class="sub">Chưa có tỷ giá VCB · đang hiển thị VND</small>';
  const buttons = fxViewCurrencies(d.currency).map((code) => {
    const active = (d.cur || fxDisplayCurrency) === code ? "active" : "";
    return `<button class="${active}" onclick="designCur('${esc(code)}')">${esc(code)}</button>`;
  });
  return `<span class="dz-seg">${buttons.join("")}</span>`;
}

/* ---------- Trạng thái các bước ---------- */
function designInfoDone(d) {
  const named = d.name.trim() && d.days > 0 && d.start;
  if (designIsSic(d)) {
    const total = designSicTotal(d);
    return !!(named && d.sicCapacity > 0 && total > 0 && total <= d.sicCapacity);
  }
  return !!((d.lead || (d.customerType === "customer" && d.customerId)) && named && d.pax > 0);
}

function designStepState(d) {
  const done = {
    info: designInfoDone(d),
    template: !!(d.template || d.program.some((p) => p.title.trim())),
    itinerary: d.program.length > 0 && d.program.every((p) => p.title.trim()),
    cost: designCost(d) > 0 && d.amount > 0,
  };
  done.preview = done.info && done.itinerary && done.cost;
  const current = designSteps.find(([k]) => !done[k])?.[0] || "preview";
  return { done, current };
}

function designStepsHtml(d) {
  const { done } = designStepState(d);
  const active = d.viewStep || "info";
  return designSteps
    .map(([k, label, sub], i) => `<button type="button" class="dz-step ${done[k] ? "is-done" : ""} ${active === k ? "is-current" : ""}" aria-current="${active === k ? "step" : "false"}" onclick="designGoto('${k}')"><span class="dz-step-no">${done[k] ? systemIcon("check") : i + 1}</span><span><b>${label}</b><small>${sub}</small></span></button>`)
    .join("");
}

/* ---------- Khối giao diện ---------- */
function designInfoCard(d) {
  if (designIsSic(d)) return designSicInfoCard(d) + `<div id="dz-sic">${designSicUnitsCard(d)}</div>`;
  const leads = designableLeads();
  const leadOptions = leads.map((l) => `<option value="lead|${l.id}" ${d.customerType !== "customer" && d.lead === l.id ? "selected" : ""}>${esc(l.name)} · ${l.id} (${leadLabels[l.status]})</option>`).join("");
  const customers = (state.customers || []).filter((c) => !isScoped() || !crmOwners.includes(myName()) || !c.owner || c.owner === myName());
  const customerOptions = customers.map((c) => `<option value="customer|${c.id}" ${d.customerType === "customer" && d.customerId === c.id ? "selected" : ""}>${esc(c.name)} · ${c.id} (Khách hàng thường)</option>`).join("");
  const sel = (name, values, current, placeholder) => `<select onchange="designSet('${name}',this.value)">${placeholder ? `<option value="">${placeholder}</option>` : ""}${designOptionValues(values, current).map((v) => `<option ${v === current ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  return card(
    `<span class="dz-num">1</span> Thông tin khách hàng & yêu cầu`,
    `<div class="dz-form">
      <div class="dz-row dz-row--head"><label class="dz-field"><span>Chọn khách hàng <i class="req">*</i></span><select onchange="designPickLead(this.value)"><option value="">-- Chọn khách hàng --</option><optgroup label="Khách hàng tiềm năng">${leadOptions}</optgroup><optgroup label="Khách hàng thường">${customerOptions}</optgroup></select></label>${can("crm_manage") ? btn(systemIcon("plus") + " Khách hàng mới", "leadForm()", "small") : ""}</div>
      <label class="dz-field"><span>Tên chương trình <i class="req">*</i></span><input value="${esc(d.name)}" placeholder="Ví dụ: Việt Nam Heritage 10 ngày" onchange="designSet('name',this.value)"></label>
      <div class="dz-row dz-row--3"><label class="dz-field">Thị trường${sel("country", crmCountries, d.country, "-- Chọn --")}</label><label class="dz-field">Số khách<input type="number" min="1" max="100" value="${d.pax}" onchange="designSet('pax',this.value)"></label><label class="dz-field">Thời lượng (ngày)<input type="number" min="1" max="60" value="${d.days}" onchange="designSet('days',this.value)"></label></div>
      <div class="dz-row dz-row--2"><label class="dz-field">Ngân sách dự kiến<span class="dz-inline"><input type="number" min="0" value="${esc(d.budgetNative)}" placeholder="3500" onchange="designSet('budgetNative',this.value)"><select onchange="designSet('currency',this.value)">${travelCurrencies.map((c) => `<option ${c === d.currency ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></span></label><label class="dz-field">Loại tour${sel("tourType", tourTypes, d.tourType, "-- Chọn --")}</label></div>
      <div class="dz-row dz-row--3"><label class="dz-field"><span>Ngày khởi hành <i class="req">*</i></span><input type="date" min="${todayISO()}" value="${esc(d.start)}" onchange="designSet('start',this.value)"></label><label class="dz-field">Ngôn ngữ chương trình${sel("language", travelLanguages, d.language)}</label>${designRateField(d)}</div>
      <label class="dz-field">Yêu cầu đặc biệt<textarea maxlength="500" oninput="document.getElementById('dzNoteCount').textContent=this.value.length+'/500'" onchange="designSet('note',this.value)" placeholder="Ăn chay, phòng gia đình, khách lớn tuổi…">${esc(d.note)}</textarea><small class="dz-count" id="dzNoteCount">${d.note.length}/500</small></label>
    </div>`,
  );
}

function designTemplatesFiltered() {
  const f = designTpl;
  return state.tourTemplates.filter((t) => (!f.region || designTemplateRegion(t) === f.region) && (!f.country || !t.country || t.country === f.country) && (!f.type || !t.type || t.type === f.type) && (!f.q || t.name.toLowerCase().includes(f.q.toLowerCase())));
}

function designTemplateRegion(t) {
  if (t.region) return t.region;
  const text = `${t.country || ""} ${t.name || ""}`.toLowerCase();
  if (/việt nam|vietnam|hà nội|sài gòn|đà nẵng|huế|hạ long/.test(text)) return "Việt Nam";
  if (/campuchia|cambodia|thái lan|thailand|laos|lào|singapore|malaysia|indonesia|philippines|myanmar/.test(text)) return "Đông Nam Á";
  if (/japan|nhật|korea|hàn|china|trung quốc|taiwan|đài loan|hong kong/.test(text)) return "Đông Bắc Á";
  if (/india|ấn độ|nepal|bhutan|sri lanka|maldives/.test(text)) return "Nam Á";
  if (/france|pháp|germany|đức|italy|ý|spain|anh|uk|europe|châu âu/.test(text)) return "Châu Âu";
  if (/usa|mỹ|canada|mexico|brazil|argentina/.test(text)) return "Châu Mỹ";
  if (/australia|úc|new zealand/.test(text)) return "Châu Úc";
  if (/dubai|uae|qatar|turkey|thổ nhĩ kỳ|israel/.test(text)) return "Trung Đông";
  if (/africa|châu phi|egypt|ai cập|south africa/.test(text)) return "Châu Phi";
  return "";
}

function designTemplatesCard() {
  const f = designTpl;
  const regions = tourRegions;
  const mine = (state.drafts || []).filter((r) => r.design && r.owner === actor().name);
  const filt = (key, label, values) => `<select aria-label="${label}" onchange="designTpl.${key}=this.value;designRefresh(['templates'])"><option value="">${label}</option>${values.map((v) => `<option ${f[key] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  let body;
  if (f.tab === "mine") {
    body = mine.length
      ? mine.map((r) => `<div class="dz-tpl"><div><b>${esc(r.design.name || "Chương trình chưa đặt tên")}</b><small>${r.design.program.length} ngày · lưu ${dateTimeVN(r.savedAt)}</small></div><div class="actions">${btn("Mở", `designOpenDraft('${r.id}')`, "small primary")}${btn("Xóa", `designDeleteDraft('${r.id}')`, "small")}</div></div>`).join("")
      : designEmpty("folder-open", "Chưa có chương trình nào đã lưu", "Nhấn “Lưu nháp” để lưu chương trình đang thiết kế và dùng lại sau.");
  } else if (f.tab === "bank") {
    body = tourDayManagePanel();
  } else {
    const list = designTemplatesFiltered();
    body = list.length
      ? list.map(tplRow).join("")
      : designEmpty("file-circle-question", "Chưa có chương trình tour mẫu nào", "Bạn có thể tạo chương trình mới rồi lưu thành mẫu để dùng lại.", btn(systemIcon("plus") + " Tạo chương trình mới", "designNew()", "small"));
  }
  return card(
    `<span class="dz-num">2</span> Chọn chương trình mẫu`,
    `<nav class="dz-tabs"><button class="${f.tab === "templates" ? "active" : ""}" onclick="designTpl.tab='templates';designRefresh(['templates'])">Mẫu tour có sẵn</button><button class="${f.tab === "mine" ? "active" : ""}" onclick="designTpl.tab='mine';designRefresh(['templates'])">Tour của tôi (${mine.length})</button><button class="${f.tab === "bank" ? "active" : ""}" onclick="designTpl.tab='bank';designRefresh(['templates'])">Ngân hàng ngày (${(state.tourDays || []).length})</button></nav>
    ${f.tab === "templates" ? `${tplToolbar()}<div class="dz-filters">${filt("region", "Khu vực", regions)}${filt("country", "Quốc gia", crmCountries)}${filt("type", "Loại tour", tourTypes)}</div><input class="dz-search" placeholder="Tìm chương trình mẫu…" value="${esc(f.q)}" onchange="designTpl.q=this.value;designRefresh(['templates'])">` : ""}
    <div class="dz-tpl-list">${body}</div>`,
  );
}

function designEmpty(icon, title_, text, action = "") {
  return `<div class="dz-empty"><span class="dz-empty-art">${systemIcon(icon)}</span><b>${title_}</b><p>${text}</p>${action}</div>`;
}

function designItineraryCard(d) {
  const tabs = [["detail", "Lịch trình chi tiết"], ["overview", "Tổng quan"], ["notes", "Ghi chú"]];
  if (!tabs.some(([key]) => key === d.tab)) d.tab = "detail";
  let body;
  if (d.tab === "overview") {
    body = d.program.length ? `<ol class="dz-overview">${d.program.map((p, i) => `<li><b>Ngày ${i + 1}</b> ${esc(p.title || "(chưa đặt tên)")}</li>`).join("")}</ol>` : designEmpty("route", "Chưa có lịch trình", "Thêm ngày để bắt đầu.");
  } else if (d.tab === "notes") {
    body = `<label class="dz-field">Ghi chú nội bộ cho chương trình<textarea onchange="designSet('itNote',this.value)" placeholder="Lưu ý cho điều hành, điều kiện đặc biệt…">${esc(d.itNote)}</textarea></label>`;
  } else if (!d.program.length) {
    body = designEmpty("map-location-dot", "Chưa có lịch trình tour", "Hãy bắt đầu thêm ngày để xây dựng lịch trình chi tiết. Mỗi ngày có thể thêm điểm đến, hoạt động và ghi chú.", btn(systemIcon("plus") + " Thêm ngày đầu tiên", "designAddDay()", "primary"));
  } else {
    body = d.program
      .map(
        (p, i) => designDayCard(p, i, d),
      )
      .join("");
  }
  return card(
    `<span class="dz-num">3</span> Thiết kế lịch trình tour`,
    `<div class="dz-tools">${btn(systemIcon("plus") + " Thêm ngày", "designAddDay()", "small")}${btn(systemIcon("arrow-down-up-across-line") + " " + (d.sort ? "Xong" : "Sắp xếp"), "designToggleSort()", "small")}${btn(systemIcon("layer-group") + " Ngân hàng ngày", "tourDayPicker()", "small")}${btn(systemIcon("file-import") + " Nhập từ mẫu", "designImportForm()", "small")}</div>
    <nav class="dz-tabs">${tabs.map(([k, l]) => `<button class="${d.tab === k ? "active" : ""}" onclick="designSetTab('${k}')">${l}</button>`).join("")}</nav><div class="dz-itinerary">${body}</div>`,
  );
}

function designServicesCard(d) {
  const cats = svcCats();
  const cat = cats.includes(d.svcTab) ? d.svcTab : cats[0];
  const items = designItems(d, cat);
  const body = items.length
    ? items.map((it, i) => `<div class="dz-item"><input value="${esc(it.name)}" placeholder="Tên dịch vụ / nhà cung cấp" onchange="designItem('${cat}',${i},'name',this.value)"><input type="number" min="0" step="${designInputStep(d, 100000)}" value="${designInputValue(d, it.cost)}" aria-label="Chi phí (${designInputCode(d)})" onchange="designItem('${cat}',${i},'cost',this.value)"><span class="sub">${designInputCode(d)}</span><button title="Xóa" onclick="designDelItem('${cat}',${i})">${systemIcon("trash")}</button></div>`).join("") + `<div class="dz-tools" style="margin-top:10px">${btn(systemIcon("plus") + " Thêm dịch vụ " + svcLabel(cat).toLowerCase(), `designAddItem('${cat}')`, "small")}</div>`
    : `<div class="dz-manual-empty"><span>Chưa chọn dịch vụ ${svcLabel(cat).toLowerCase()}.</span>${btn(systemIcon("plus") + " Nhập thủ công", `designAddItem('${cat}')`, "small")}</div>`;
  const suggestions = designServiceSuggestions(cat, d);
  return card(
    `<span class="dz-num">4</span> Dịch vụ trong tour`,
    `<nav class="dz-pills">${cats.map((c) => `<button class="${c === cat ? "active" : ""}" onclick="designSvcTab('${c}')">${systemIcon(svcIcons[c] || "circle")} ${svcLabel(c)}${designItems(d, c).length ? ` <em>${designItems(d, c).length}</em>` : ""}</button>`).join("")}</nav>${suggestions}<div class="dz-services">${body}</div>`,
  );
}

function designResourceAvailable(kind, id, d) {
  if (!d.start) return true;
  const end = addDays(d.start, Math.max(0, (d.days || 1) - 1));
  if (kind === "guide") {
    const guide = findGuide(id);
    if ((guide?.blocks || []).some((x) => !(x.to < d.start || x.from > end))) return false;
    return !(state.bookings || []).some((b) => b.guide === id && !["Completed", "Cancelled"].includes(b.status) && !(b.end < d.start || b.start > end));
  }
  return !(state.bookings || []).some((b) => b.vehicle === id && !["Completed", "Cancelled"].includes(b.status) && !(b.end < d.start || b.start > end));
}

function designServiceSuggestions(cat, d) {
  let cards = [];
  if (cat === "Vehicle") {
    cards = (state.vehicles || []).map((v) => {
      const free = designResourceAvailable("vehicle", v.id, d), sup = findSupplier(v.supplier);
      const price = supplierLibrary("Vehicle", d.start).find((x) => x.sup.id === v.supplier);
      const total = price ? price.item.price * priceQuantity(price.item, { pax: d.pax, days: d.days }) : 0;
      return `<article class="dz-suggestion ${free ? "" : "is-busy"}"><span class="dz-suggestion-icon">${systemIcon("van-shuttle")}</span><div><b>${esc(v.name)}</b><small>${esc(v.plate)} · ${v.capacity} chỗ${sup ? ` · ${esc(sup.name)}` : ""}</small><strong>${total ? designFmt(d, total) : "Chưa có bảng giá"}</strong></div><button class="btn small" ${free ? `onclick="designAddResource('vehicle','${v.id}')"` : "disabled"}>${free ? "+ Chọn" : "Bận lịch"}</button></article>`;
    });
  } else if (cat === "Guide") {
    cards = (state.guides || []).map((g) => {
      const free = designResourceAvailable("guide", g.id, d), total = Number(g.rate || 0) * Math.max(1, d.days || 1);
      return `<article class="dz-suggestion ${free ? "" : "is-busy"}"><span class="dz-suggestion-icon">${systemIcon("user-tie")}</span><div><b>${esc(g.name)}</b><small>${esc(g.area || "Toàn quốc")} · ${esc(g.lang || "Chưa cập nhật ngôn ngữ")} · ${Number(g.rating || 0).toFixed(1)}/5</small><strong>${total ? designFmt(d, total) : "Chưa có đơn giá"}</strong></div><button class="btn small" ${free ? `onclick="designAddResource('guide','${g.id}')"` : "disabled"}>${free ? "+ Chọn" : "Bận lịch"}</button></article>`;
    });
  } else {
    cards = supplierLibrary(cat, d.start).map((x) => {
      const qty = priceQuantity(x.item, { pax: d.pax, days: d.days }), total = x.item.price * qty;
      return `<article class="dz-suggestion"><span class="dz-suggestion-icon">${systemIcon(svcIcons[cat] || "building")}</span><div><b>${esc(x.sup.name)}</b><small>${esc(x.item.name)} · ${qty}${esc(x.item.unit)}${x.item.season && x.item.season !== "Quanh năm" ? ` · ${esc(x.item.season)}` : ""}</small><strong>${designFmt(d, total)}</strong></div><button class="btn small" onclick="designAddFromLibrary('${cat}','${x.key}')">+ Chọn</button></article>`;
    });
  }
  if (!cards.length) return `<div class="dz-suggestion-empty">Chưa có ${svcLabel(cat).toLowerCase()} hoặc bảng giá phù hợp trong hệ thống.</div>`;
  return `<section class="dz-suggestions"><div class="dz-suggestions-head"><b>Đề xuất từ hệ thống</b><span>${cards.length} lựa chọn${d.start ? ` cho ngày ${fmt(d.start)}` : " · chọn ngày khởi hành để kiểm tra lịch trống"}</span></div><div class="dz-suggestion-list">${cards.slice(0, 8).join("")}</div></section>`;
}

function designPricingTier(d) {
  const profiles = typeof pricingSettings === "function" ? pricingSettings() : [];
  const profile = profiles.find((p) => p.id === d.pricingProfileId);
  if (!profile || !Array.isArray(profile.tiers) || !profile.tiers.length) return { profile: null, tier: null };
  const pax = Math.max(1, Number(d.pax) || 1);
  const lower = profile.tiers.filter((t) => Number(t.pax) <= pax).sort((a,b) => Number(b.pax)-Number(a.pax));
  const tier = lower[0] || profile.tiers.find((t) => Number(t.pax) === 1) || [...profile.tiers].sort((a,b) => Number(a.pax)-Number(b.pax))[0];
  return { profile, tier };
}
function designApplyPricing(d = ensureDesign()) {
  const pax = Math.max(1, Number(d.pax) || 1);
  const days = Math.max(1, Number(d.program.length || d.days) || 1);
  // Migrate drafts from the previous UI where "pax" combined basis and source.
  if (d.pricingMode === "pax") { d.pricingMode = "total"; d.pricingSource = "table"; }
  d.pricingMode = d.pricingMode === "daily" ? "daily" : "total";
  d.pricingSource = d.pricingSource === "table" || d.pricingSource === "profile" ? "table" : "manual";
  if (d.pricingSource === "table") {
    const { tier } = designPricingTier(d);
    d.pricingTierPax = Number(tier?.pax || 1);
    d.unitPrice = Number(tier?.priceVnd || 0);
  } else {
    if (d.manualUnitPrice === undefined || d.manualUnitPrice === null) d.manualUnitPrice = Number(d.unitPrice) || 0;
    d.unitPrice = Number(d.manualUnitPrice) || 0;
  }
  d.amount = Math.round(Math.max(0, Number(d.unitPrice) || 0) * pax * (d.pricingMode === "daily" ? days : 1));
  return d.amount;
}
function designPricingControls(d) {
  const mode = d.pricingMode === "daily" ? "daily" : "total";
  const source = d.pricingSource === "table" || d.pricingMode === "pax" ? "table" : "manual";
  const profiles = typeof pricingSettings === "function" ? pricingSettings() : [];
  const modeSelect = `<label class="dz-field">Cách tính giá<select onchange="designSetPricingMode(this.value)"><option value="daily" ${mode === "daily" ? "selected" : ""}>Giá theo ngày</option><option value="total" ${mode === "total" ? "selected" : ""}>Giá cả tour</option></select></label>`;
  const sourceSelect = `<label class="dz-field">Cách nhập giá<select onchange="designSetPricingSource(this.value)"><option value="manual" ${source === "manual" ? "selected" : ""}>Nhập giá mỗi khách</option><option value="table" ${source === "table" ? "selected" : ""}>Sử dụng bảng giá</option></select></label>`;
  if (source === "table") {
    const options = profiles.map((p) => `<option value="${esc(p.id)}" ${p.id === d.pricingProfileId ? "selected" : ""}>${esc(p.name)}</option>`).join("");
    const { profile, tier } = designPricingTier(d);
    const unit = tier ? designFmt(d, tier.priceVnd) : "—";
    const unitLabel = mode === "daily" ? "mỗi khách / ngày" : "mỗi khách / cả tour";
    const help = profile && tier ? `Tour ${d.pax} khách → áp dụng mức ${tier.pax} khách (${unit}/${unitLabel}). Tổng giá bán: ${designFmt(d, d.amount)}.` : "Chưa có bảng giá phù hợp. Hãy tạo bảng giá trước khi tiếp tục.";
    return `${modeSelect}${sourceSelect}<label class="dz-field">Bảng giá<select onchange="designSetPricingProfile(this.value)"><option value="">-- Chọn bảng giá --</option>${options}</select></label><div class="pricing-application"><b>Kết quả áp dụng</b><p>${esc(help)}</p>${!profiles.length ? `<button type="button" class="btn small" onclick="closeModal();go('pricing')">Tạo bảng giá</button>` : ""}</div>`;
  }
  const label = mode === "daily" ? `Giá mỗi khách / ngày (${designInputCode(d)})` : `Giá mỗi khách / cả tour (${designInputCode(d)})`;
  const amountLabel = `${designInputValue(d, d.unitPrice || 0) || ""}`;
  return `${modeSelect}${sourceSelect}<label class="dz-field">${label}<input type="number" min="0" step="${designInputStep(d, 500000)}" value="${d.unitPrice ? amountLabel : ""}" placeholder="Nhập đơn giá mỗi khách" onchange="designSetUnitPrice(this.value)"></label><div class="pricing-application"><b>Tổng giá bán dự kiến</b><p>${designFmt(d, d.amount)} · ${d.pax} khách${mode === "daily" ? ` · ${d.program.length || d.days} ngày` : ""}</p></div>`;
}

function designSummary(d) {
  const cost = designCost(d), margin = designMargin(d), min = policy().minMarginPct, profit = d.amount - cost;
  const saved = d.id ? badge("Đã lưu nháp", "blue") : badge("Dự thảo", "green");
  const toggle = designCurToggle(d);
  const row = (l, v) => `<div class="dz-kv"><span>${l}</span><b>${v}</b></div>`;
  return `${card("Tổng quan tour", row("Tên chương trình", esc(d.name || "Chưa đặt tên")) + row("Khách hàng", esc(designCustomerName(d))) + row("Thị trường", esc(d.country || "—")) + row("Thời lượng", d.program.length || d.days ? (d.program.length || d.days) + " ngày" : "—") + row("Số lượng khách", d.pax + " khách") + row("Ngày khởi hành", d.start ? fmt(d.start) : "Chưa chọn") + row("Loại tour", esc(d.tourType || "—")), saved)}
  ${card("Chi phí dự kiến", svcCats().map((c) => `<div class="dz-cost"><span>${systemIcon(svcIcons[c] || "circle")}${svcLabel(c)}</span><b>${designFmt(d, designCatCost(d, c))}</b></div>`).join("") + `<div class="dz-total"><span>Tổng chi phí</span><b>${designFmt(d, cost)}</b></div>`, toggle)}
  ${card("Lợi nhuận dự kiến", `${designPricingControls(d)}${row("Giá bán tổng tour", d.amount ? designFmt(d, d.amount) : "Chưa tính giá")}${row("Giá bán / khách", d.amount && d.pax ? designFmt(d, Math.round(d.amount / d.pax)) : "—")}${row("Lợi nhuận", `<span class="${profit >= 0 ? "text-good" : "text-bad"}">${designFmt(d, profit)}</span>`)}<div class="dz-margin ${!d.amount ? "" : margin < min ? "is-low" : "is-ok"}"><span>Tỷ suất lợi nhuận</span><b>${d.amount ? margin.toFixed(1) + "%" : "—"}</b></div><small class="sub">${d.amount && margin < min ? `Thấp hơn ngưỡng ${min}% — báo giá sẽ cần CEO duyệt trước khi gửi khách.` : `Ngưỡng tối thiểu theo chính sách: ${min}%.`}</small>`, btn(systemIcon("flag") + " Đánh giá", "designEvaluate()", "small"))}
  <section class="card dz-actions" id="dz-card-preview"><h3>Hành động</h3>${btn(systemIcon("floppy-disk") + " Lưu chương trình", "designSave()", "primary")}<div class="dz-actions-row">${btn(systemIcon("file-invoice") + " Tạo báo giá", "createQuote()")}${btn(systemIcon("share-nodes") + " Chia sẻ cho team", "designShare()")}</div>${can("tour_design_manage") ? `<button class="dz-link" onclick="designSaveTemplate()">Lưu thành mẫu tour</button>` : ""}</section>`;
}

function designCostQuickSummary(d) {
  const cost = designCost(d), profit = d.amount - cost, margin = designMargin(d), min = policy().minMarginPct;
  return card("Dự toán nhanh", `<div class="dz-quick-cost"><div><span>Tổng chi phí dịch vụ</span><b>${designFmt(d, cost)}</b></div><div><span>Tổng giá bán dự kiến</span><b>${designFmt(d, d.amount)}</b></div><div><span>Lợi nhuận</span><b class="${profit >= 0 ? "text-good" : "text-bad"}">${designFmt(d, profit)}</b></div><div class="dz-margin ${!d.amount ? "" : margin < min ? "is-low" : "is-ok"}"><span>Tỷ suất lợi nhuận</span><b>${d.amount ? margin.toFixed(1) + "%" : "—"}</b></div><small>Thiết lập cách tính giá ở bước “Xem trước & Xuất báo giá”. Ngưỡng lợi nhuận tối thiểu: ${min}%.</small></div>`, btn(systemIcon("flag") + " Đánh giá", "designEvaluate()", "small"));
}

const designParts = {
  steps: (d) => designStepsHtml(d),
  templates: () => designTemplatesCard(),
  itinerary: (d) => designItineraryCard(d),
  services: (d) => designServicesCard(d),
  summary: (d) => designSummary(d),
  stage: (d) => designStageHtml(d),
  sic: (d) => designSicUnitsCard(d),
};

function designStageHtml(d) {
  const step = d.viewStep || "info";
  const index = Math.max(0, designSteps.findIndex(([key]) => key === step));
  const content = {
    info: `<div class="dz-stage-single" id="dz-card-info">${designInfoCard(d)}</div>`,
    template: `<div class="dz-stage-single" id="dz-templates">${designTemplatesCard()}</div>`,
    itinerary: `<div class="dz-stage-single" id="dz-itinerary">${designItineraryCard(d)}</div>`,
    cost: `<div class="dz-stage-split"><div id="dz-services">${designServicesCard(d)}</div><div class="dz-summary-pane" id="dz-cost-summary">${designCostQuickSummary(d)}</div></div>`,
    preview: `<div class="dz-preview" id="dz-summary">${designSummary(d)}</div>`,
  }[step];
  const previous = index > 0 ? `<button class="btn" onclick="designGoto('${designSteps[index - 1][0]}')">${systemIcon("arrow-left")} Quay lại</button>` : "";
  const next = index < designSteps.length - 1 ? `<button class="btn primary" onclick="designGoto('${designSteps[index + 1][0]}')">Tiếp tục: ${designSteps[index + 1][1]} ${systemIcon("arrow-right")}</button>` : `<button class="btn primary" onclick="createQuote()">Xuất báo giá ${systemIcon("arrow-right")}</button>`;
  return `<section class="dz-stage" aria-label="Bước ${index + 1}: ${designSteps[index][1]}"><div class="dz-stage-head"><span>BƯỚC ${index + 1} / ${designSteps.length}</span><div><h2>${designSteps[index][1]}</h2><p>${designSteps[index][2]}</p></div></div>${content}<footer class="dz-stage-nav"><span class="dz-required"><i>*</i> Thông tin bắt buộc</span><div><button class="btn" onclick="closeModal();render()">Hủy</button><button class="btn" onclick="designSave()">${systemIcon("floppy-disk")} Lưu nháp</button>${previous}${next}</div></footer></section>`;
}

function designBuilderHtml(d) {
  return `<div class="tour-builder-modal">
    <nav class="dz-steps" id="dz-steps" aria-label="Các bước thiết kế tour">${designStepsHtml(d)}</nav>
    <div class="tour-builder-scroll"><div id="dz-stage">${designStageHtml(d)}</div></div>
  </div>`;
}

function designVisibleDrafts() {
  const drafts = (state.drafts || []).filter((item) => item.design);
  const visible = can("all") ? drafts : drafts.filter((item) => item.owner === actor().name);
  const query = designLibraryQuery.trim().toLowerCase();
  return query ? visible.filter((item) => `${item.id} ${item.design.name} ${item.owner} ${(item.design?.customerType === "customer" ? (state.customers || []).find((c) => c.id === item.design.customerId)?.name : findLead(item.lead)?.name) || ""}`.toLowerCase().includes(query)) : visible;
}

function designLibraryCard(item) {
  const d = { ...blankDesign(), ...item.design };
  const lead = findLead(item.lead || d.lead);
  const complete = designStepState(d).done.preview;
  const cost = designCost(d);
  return `<article class="tour-card" onclick="designDetail('${item.id}')" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();designDetail('${item.id}')}" aria-label="Xem chi tiết ${esc(d.name || "tour chưa đặt tên")}">
    <div class="tour-card-cover"><span>${systemIcon("route")}</span><em class="${complete ? "is-ready" : ""}">${complete ? "Sẵn sàng báo giá" : "Đang thiết kế"}</em></div>
    <div class="tour-card-body"><div class="tour-card-title"><div><small>${esc(item.id)}</small><h3>${esc(d.name || "Chương trình chưa đặt tên")}</h3></div><span>${systemIcon("arrow-right")}</span></div>
    <p>${designCardSubline(d, lead)}</p>
    <div class="tour-card-meta"><span>${systemIcon("calendar-days")} ${d.program.length || d.days || 0} ngày</span><span>${systemIcon("users")} ${d.pax || 0} khách</span><span>${systemIcon("wallet")} ${designFmt(d, d.amount || cost)}</span></div></div>
    ${designCardFooter(item)}
  </article>`;
}

function designRefresh(parts = Object.keys(designParts)) {
  const d = ensureDesign();
  for (const p of parts) {
    const el = document.getElementById("dz-" + p);
    if (el) el.innerHTML = designParts[p](d);
  }
  if (parts.includes("summary") || parts.includes("costsummary")) {
    const quick = document.getElementById("dz-cost-summary");
    if (quick) quick.innerHTML = designCostQuickSummary(d);
  }
}

views.design = () => {
  const body = designLibraryTab === "departures" ? departureLibraryBody() : designProgramsBody();
  return `<div class="tour-library">
    <header class="tour-library-head">
      <div>
        <span class="dz-eyebrow">TOUR WORKSPACE</span>
        <h1>Chương trình tour</h1>
        <p>Quản lý, xem lại và tiếp tục các chương trình tour đã thiết kế.</p>
      </div>
      ${designLibraryActions()}
    </header>
    ${departureTabs()}
    ${body}
  </div>`;
};

function designProgramsBody() {
  const tours = designVisibleDrafts();
  const all = (state.drafts || []).filter((item) => item.design && (can("all") || item.owner === actor().name));
  const ready = all.filter((item) => designStepState({ ...blankDesign(), ...item.design }).done.preview).length;
  return `<section class="tour-library-stats"><div><span>${systemIcon("folder-open")}</span><small>Tổng chương trình</small><b>${all.length}</b></div><div><span>${systemIcon("circle-check")}</span><small>Sẵn sàng báo giá</small><b>${ready}</b></div><div><span>${systemIcon("pen-ruler")}</span><small>Đang thiết kế</small><b>${all.length - ready}</b></div></section>
    <div class="tour-library-toolbar"><label>${systemIcon("magnifying-glass")}<input value="${esc(designLibraryQuery)}" placeholder="Tìm theo tên tour, khách hàng, mã chương trình…" oninput="designLibraryQuery=this.value;render()"></label><span>${tours.length} chương trình</span></div>
    <section class="tour-grid">${tours.length ? tours.map(designLibraryCard).join("") : designEmpty("route", designLibraryQuery ? "Không tìm thấy chương trình phù hợp" : "Chưa có chương trình tour", designLibraryQuery ? "Thử tìm bằng tên tour, khách hàng hoặc mã chương trình khác." : "Tạo chương trình đầu tiên bằng quy trình thiết kế 5 bước.", !designLibraryQuery ? btn(systemIcon("plus") + " Thiết kế tour mới", "designNew()", "primary") : "")}</section>`;
}

/* ---------- Thao tác ---------- */
function designGoto(key) {
  const d = ensureDesign();
  if (!designSteps.some(([step]) => step === key)) return;
  d.viewStep = key;
  designRefresh(["steps", "stage"]);
  document.getElementById("dz-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectLead(id) {
  if (design?.tourKind === "sic") design = null;
  ensureDesign();
  designPickLead(id);
  if (current === "design") designOpenBuilder();
}

function designPickLead(selection) {
  const d = ensureDesign();
  const [kind, id] = String(selection || "").includes("|") ? String(selection).split("|", 2) : ["lead", selection];
  d.customerType = kind === "customer" ? "customer" : "lead";
  d.customerId = kind === "customer" ? id : "";
  d.lead = kind === "lead" ? id : "";
  const lead = kind === "lead" ? findLead(id) : (state.customers || []).find((c) => c.id === id);
  if (lead) {
    d.pax = lead.pax || d.pax;
    d.country = lead.country || d.country;
    if (!d.amount && lead.budget) { d.amount = lead.budget; d.unitPrice = Math.round(lead.budget / Math.max(1, d.pax) / (d.pricingMode === "daily" ? Math.max(1, d.days) : 1)); }
    if (!d.note && lead.note) d.note = lead.note;
    if (!d.name && lead.tour) d.name = lead.tour;
    if (lead.start && !d.start) d.start = lead.start;
  }
  if (d.pricingMode === "pax") { d.pricingMode = "total"; d.pricingSource = "table"; }
  if (d.pricingSource === "table" || d.unitPrice) designApplyPricing(d);
  if (document.querySelector(".tour-builder-modal")) designRefresh(["steps", "stage"]);
  else render();
}

function designSetPricingMode(mode) {
  const d = ensureDesign();
  d.pricingMode = mode === "daily" ? "daily" : "total";
  designApplyPricing(d); designRefresh(["summary", "steps"]);
}
function designSetPricingSource(source) {
  const d = ensureDesign();
  if (source !== "table" && d.pricingSource === "table" && d.manualUnitPrice === undefined) d.manualUnitPrice = Number(d.unitPrice) || 0;
  d.pricingSource = source === "table" ? "table" : "manual";
  if (d.pricingSource === "table") {
    const profiles = typeof pricingSettings === "function" ? pricingSettings() : [];
    if (!profiles.some((p) => p.id === d.pricingProfileId)) d.pricingProfileId = profiles[0]?.id || "";
  }
  designApplyPricing(d); designRefresh(["summary", "steps"]);
}
function designSetUnitPrice(value) {
  const d = ensureDesign(); d.manualUnitPrice = fxToVnd(Math.max(0, Number(value) || 0), designInputCode(d)); d.unitPrice = d.manualUnitPrice;
  designApplyPricing(d); designRefresh(["summary", "steps"]);
}
function designSetPricingProfile(id) {
  const d = ensureDesign(); d.pricingProfileId = id || ""; designApplyPricing(d); designRefresh(["summary", "steps"]);
}

function designSet(field, value) {
  const d = ensureDesign();
  if (["pax", "days", "amount"].includes(field)) value = Math.max(0, Number(value) || 0);
  if (field === "amount") { value = fxToVnd(value, designInputCode(d)); d.unitPrice = Math.round(value / Math.max(1, Number(d.pax) || 1) / (d.pricingMode === "daily" ? Math.max(1, d.program.length || d.days || 1) : 1)); }
  if (field === "budgetNative") value = value === "" ? "" : Math.max(0, Number(value) || 0);
  if (field === "days") {
    value = Math.min(60, Math.max(1, value));
    while (d.program.length < value) d.program.push({ title: "", text: "" });
    while (d.program.length > value && !d.program[d.program.length - 1].title.trim() && !d.program[d.program.length - 1].text.trim()) d.program.pop();
    d.days = d.program.length;
    designApplyPricing(d);
    designRefresh(["itinerary", "steps", "summary"]);
    const input = document.querySelector('.dz-form input[onchange*="\'days\'"]');
    if (input) input.value = d.days;
    return;
  }
  d[field] = value;
  if (field === "pax" || field === "amount") designApplyPricing(d);
  designRefresh(["steps", "summary"]);
}

function designDay(i, field, value) {
  ensureDesign().program[i][field] = value;
  designRefresh(["steps"]);
}

function designAddDay() {
  const d = ensureDesign();
  if (d.program.length >= 60) return toast("Tối đa 60 ngày.");
  d.program.push({ title: "", text: "" });
  d.days = d.program.length;
  d.tab = "detail";
  designApplyPricing(d);
  designRefresh(["itinerary", "steps", "summary"]);
  const info = document.querySelector('.dz-form input[onchange*="\'days\'"]');
  if (info) info.value = d.days;
}

function designDelDay(i) {
  const d = ensureDesign();
  d.program.splice(i, 1);
  d.days = d.program.length || 1;
  designApplyPricing(d);
  designRefresh(["itinerary", "steps", "summary"]);
  const info = document.querySelector('.dz-form input[onchange*="\'days\'"]');
  if (info) info.value = d.days;
}

function designMoveDay(i, dir) {
  const d = ensureDesign();
  const j = i + dir;
  if (j < 0 || j >= d.program.length) return;
  [d.program[i], d.program[j]] = [d.program[j], d.program[i]];
  designApplyPricing(d);
  designRefresh(["itinerary", "summary"]);
}

/* Thẻ một ngày trong lịch trình. Bật "Sắp xếp": thẻ chỉ đọc, kéo được ở bất kỳ đâu trên thẻ. */
function designDayButton(title, action, icon, disabled = false) {
  const off = disabled ? " disabled" : "";
  return `<button title="${title}" onclick="${action}"${off}>${systemIcon(icon)}</button>`;
}

function designDayTools(i, d) {
  if (!d.sort) {
    const save = designDayButton("Lưu vào ngân hàng ngày", `tourDaySaveFrom(${i})`, "bookmark");
    return save + designDayButton("Xóa ngày", `designDelDay(${i})`, "trash");
  }
  const last = d.program.length - 1;
  const up = designDayButton("Lên", `designMoveDay(${i},-1)`, "arrow-up", i === 0);
  const down = designDayButton("Xuống", `designMoveDay(${i},1)`, "arrow-down", i === last);
  return up + down;
}

/* Chế độ sắp xếp: hiện chữ, không cho sửa; không có ô nhập nên kéo được ở mọi điểm trên thẻ. */
function designDayBodySorting(p, i, d) {
  const title = esc(p.title || "(chưa đặt tên)");
  const text = p.text ? `<div class="dz-day-text">${esc(p.text)}</div>` : "";
  return [
    `<div class="dz-day-head">`,
    `<span class="dz-day-no">Ngày ${i + 1}</span>`,
    `<b class="dz-day-title">${title}</b>`,
    `<div class="dz-day-tools">${designDayTools(i, d)}</div>`,
    `</div>`,
    text,
  ].join("");
}

function designDayBodyEditing(p, i, d) {
  return [
    `<div class="dz-day-head">`,
    `<span class="dz-day-no">Ngày ${i + 1}</span>`,
    `<input value="${esc(p.title)}" placeholder="Tiêu đề / điểm đến trong ngày"`,
    ` onchange="designDay(${i},'title',this.value)">`,
    `<div class="dz-day-tools">${designDayTools(i, d)}</div>`,
    `</div>`,
    `<textarea placeholder="Hoạt động, bữa ăn, nơi nghỉ…"`,
    ` onchange="designDay(${i},'text',this.value)">${esc(p.text)}</textarea>`,
  ].join("");
}

function designDayCard(p, i, d) {
  if (!d.sort) return `<div class="dz-day">${designDayBodyEditing(p, i, d)}</div>`;
  return [
    `<div class="dz-day is-sorting" draggable="true"`,
    ` ondragstart="designDragStart(event,${i})" ondragend="designDragEnd()"`,
    ` ondragover="designDragOver(event)" ondragleave="designDragLeave(event)"`,
    ` ondrop="designDrop(event,${i})" title="Kéo để đổi thứ tự ngày">`,
    designDayBodySorting(p, i, d),
    `</div>`,
  ].join("");
}

/* Kéo–thả đổi thứ tự ngày. HTML5 drag-and-drop không chạy trên màn hình cảm ứng: dùng nút lên/xuống. */
let designDragFrom = -1;

function designMoveDayTo(from, to) {
  const d = ensureDesign();
  const n = d.program.length;
  if (from < 0 || from >= n || to < 0 || to >= n || from === to) return false;
  const moved = d.program.splice(from, 1)[0];
  d.program.splice(to, 0, moved);
  designApplyPricing(d);
  return true;
}

/* Vị trí đích sau khi rút ngày `from` ra: thả phía trên hoặc phía dưới ngày `over`. */
function designDropIndex(from, over, after) {
  let to = over + (after ? 1 : 0);
  if (from < to) to -= 1;
  return to;
}

function designDropAfter(e) {
  const box = e.currentTarget.getBoundingClientRect();
  return e.clientY > box.top + box.height / 2;
}

function designClearDrop() {
  document.querySelectorAll(".dz-day.drop-before, .dz-day.drop-after, .dz-day.is-dragging").forEach((el) => {
    el.classList.remove("drop-before", "drop-after", "is-dragging");
  });
}

function designDragStart(e, i) {
  designDragFrom = i;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(i));
  const card = e.currentTarget.closest(".dz-day");
  if (!card) return;
  const box = card.getBoundingClientRect();
  if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(card, e.clientX - box.left, e.clientY - box.top);
  setTimeout(() => card.classList.add("is-dragging"), 0);
}

function designDragOver(e) {
  if (designDragFrom < 0) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  designClearDrop();
  const card = e.currentTarget;
  card.classList.add(designDropAfter(e) ? "drop-after" : "drop-before");
}

function designDragLeave(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return;
  e.currentTarget.classList.remove("drop-before", "drop-after");
}

function designDragEnd() {
  designDragFrom = -1;
  designClearDrop();
}

function designDrop(e, over) {
  e.preventDefault();
  const from = designDragFrom;
  const after = designDropAfter(e);
  designDragEnd();
  if (from < 0) return;
  const to = designDropIndex(from, over, after);
  if (!designMoveDayTo(from, to)) return;
  designRefresh(["itinerary"]);
}

function designToggleSort() {
  const d = ensureDesign();
  d.sort = !d.sort;
  d.tab = "detail";
  designRefresh(["itinerary"]);
}

function designSetTab(tab) {
  ensureDesign().tab = tab;
  designRefresh(["itinerary"]);
}

function designSvcTab(cat) {
  ensureDesign().svcTab = cat;
  designRefresh(["services"]);
}

function designAddItem(cat) {
  const d = ensureDesign();
  (d.services[cat] ||= []).push({ name: "", cost: 0 });
  designRefresh(["services", "summary", "steps"]);
}

/* Thêm dịch vụ từ bảng giá NCC: tên "NCC – hạng mục", chi phí = đơn giá × số lượng theo đơn vị tính. */
function designAddFromLibrary(cat, key) {
  if (!key) return;
  const d = ensureDesign(), [sid, idx] = key.split("|"), sup = findSupplier(sid), p = sup?.prices?.[+idx];
  if (!p) return;
  const qty = priceQuantity(p, { pax: d.pax, days: d.days || d.program.length });
  (d.services[cat] ||= []).push({ name: `${sup.name} – ${p.name} (${qty}${p.unit || ""})`, cost: p.price * qty, supplier: sid });
  designRefresh(["services", "summary", "steps"]);
  toast("Đã thêm từ bảng giá NCC.");
}

function designAddResource(kind, id) {
  const d = ensureDesign();
  if (kind === "vehicle") {
    const vehicle = (state.vehicles || []).find((item) => item.id === id);
    if (!vehicle) return;
    const price = supplierLibrary("Vehicle", d.start).find((x) => x.sup.id === vehicle.supplier);
    const cost = price ? price.item.price * priceQuantity(price.item, { pax: d.pax, days: d.days }) : 0;
    (d.services.Vehicle ||= []).push({ name: `${vehicle.name} · ${vehicle.plate} · ${vehicle.capacity} chỗ`, cost, vehicle: id, supplier: vehicle.supplier || "" });
  } else {
    const guide = findGuide(id);
    if (!guide) return;
    (d.services.Guide ||= []).push({ name: `${guide.name} · ${guide.area || "Toàn quốc"}`, cost: Number(guide.rate || 0) * Math.max(1, d.days || 1), guide: id });
  }
  designRefresh(["services", "summary", "steps"]);
  toast(kind === "vehicle" ? "Đã thêm xe từ hệ thống." : "Đã thêm hướng dẫn viên từ hệ thống.");
}

function designItem(cat, i, field, value) {
  const d = ensureDesign();
  const item = d.services[cat][i];
  item[field] = field === "cost" ? fxToVnd(Math.max(0, Number(value) || 0), designInputCode(d)) : value;
  designRefresh(["summary", "steps"]);
  designRefresh(["itinerary"]);
}

function designDelItem(cat, i) {
  ensureDesign().services[cat].splice(i, 1);
  designRefresh(["services", "summary", "steps"]);
}

function designCur(cur) {
  ensureDesign().cur = cur;
  designRefresh(["summary", "services", "steps"]);
}

function designEvaluate() {
  const d = ensureDesign();
  const cost = designCost(d);
  const min = policy().minMarginPct;
  if (!cost) return toast("Hãy nhập chi phí dịch vụ trước khi đánh giá.");
  const floor = Math.ceil(cost / (1 - min / 100) / 100000) * 100000;
  if (!d.amount) return toast(`Giá bán tối thiểu để đạt biên ${min}%: ${designFmt(d, floor)}.`);
  const margin = designMargin(d);
  toast(margin >= min ? `Đạt ngưỡng: biên ${margin.toFixed(1)}% (tối thiểu ${min}%).` : `Biên ${margin.toFixed(1)}% thấp hơn ${min}%. Giá bán tối thiểu: ${designFmt(d, floor)}.`);
}

function designTemplateProgram(t) {
  if (t.program?.length) return t.program.map((p) => ({ title: p.title || "", text: p.text || "" }));
  const d = ensureDesign();
  const translation = travelTranslations?.[d.language];
  const source = translation?.length ? translation : t.itinerary;
  return source.map((title) => ({ title, text: "" }));
}

/* Danh sách chọn: giữ giá trị đang dùng dù không còn trong danh mục (ví dụ loại tour của mẫu cũ) */
function designOptionValues(values, current) {
  if (!current || values.includes(current)) return values;
  return [...values, current];
}

function designApplyTemplate(id) {
  const d = ensureDesign();
  const t = state.tourTemplates.find((x) => x.id === id);
  if (!t) return;
  if (d.program.some((p) => p.title.trim() || p.text.trim()) && !confirm("Thay lịch trình hiện tại bằng mẫu này?")) return;
  d.template = t.name;
  d.name ||= t.name;
  if (t.type) d.tourType = t.type;
  d.program = designTemplateProgram(t);
  d.days = d.program.length;
  d.tab = "detail";
  if (t.services) d.services = JSON.parse(JSON.stringify(t.services));
  d.viewStep = "itinerary";
  if (document.querySelector(".tour-builder-modal")) designRefresh(["steps", "stage"]);
  else designOpenBuilder();
  toast(`Đã áp dụng mẫu “${t.name}” (${d.days} ngày${t.type ? ", loại tour: " + t.type : ""}).`);
}

function designImportForm() {
  modal(
    "Nhập lịch trình từ mẫu",
    state.tourTemplates.length ? state.tourTemplates.map((t) => `<div class="dz-tpl"><div><b>${esc(t.name)}</b><small>${t.itinerary.length} ngày</small></div>${btn("Nhập", `closeModal();designApplyTemplate('${t.id}')`, "small primary")}</div>`).join("") : '<div class="empty">Chưa có mẫu chương trình.</div>',
    true,
  );
}

function designNew() {
  design = blankDesign();
  design.program.push({ title: "", text: "" });
  design.days = 1;
  designOpenBuilder();
}

/* ---------- Tour ghép SIC (T3-07): ngày cố định, sức chứa, đơn vị ghép ---------- */
const designSicMaxPax = 100;
const designSicQuoteNotice =
  "Bản thiết kế tour SIC không tạo báo giá trực tiếp. Hãy mở bán chuyến, rồi tạo báo giá cho từng đơn vị ghép trong tab Chuyến SIC.";
const designSicSourceLabels = {
  customer: "Khách hàng thường",
  lead: "Khách hàng tiềm năng",
  manual: "Nhập tay (ngoài hệ thống)",
};

function designIsSic(d = ensureDesign()) {
  return d.tourKind === "sic";
}

function designSicUnits(d) {
  if (!Array.isArray(d.sicUnits)) d.sicUnits = [];
  return d.sicUnits;
}

function designSicTotal(d) {
  return designSicUnits(d).reduce((sum, u) => sum + (Number(u.pax) || 0), 0);
}

/* Giới hạn khách của chuyến: sức chứa đã đặt, chưa đặt thì dùng mức tối đa của ô số khách. */
function designSicLimit(d) {
  const capacity = Number(d.sicCapacity) || 0;
  return capacity > 0 ? capacity : designSicMaxPax;
}

function designSicStatus(d) {
  const capacity = Number(d.sicCapacity) || 0;
  if (capacity <= 0) return { text: "Chưa đặt sức chứa", tone: "amber" };
  const left = capacity - designSicTotal(d);
  if (left <= 0) return { text: "Đã đầy", tone: "red" };
  return { text: `Còn ${left} chỗ`, tone: "green" };
}

/* Tên hiện hành của khách trong hệ thống; khách đã bị xóa thì dùng tên đã lưu lúc ghép. */
function designSicUnitName(u) {
  if (u.refType === "customer") {
    return (state.customers || []).find((c) => c.id === u.refId)?.name || u.name;
  }
  if (u.refType === "lead") return findLead(u.refId)?.name || u.name;
  return u.name;
}

function designModalTitle(d) {
  if (designIsSic(d)) return d.id ? "Chỉnh sửa tour ghép SIC" : "Thiết kế tour ghép SIC";
  return d.id ? "Chỉnh sửa chương trình tour" : "Thiết kế chương trình tour";
}

function designCardSubline(d, lead) {
  if (designIsSic(d)) {
    const status = designSicStatus(d);
    return `Tour ghép SIC · ${designSicUnits(d).length} đơn vị · ${esc(status.text)}`;
  }
  return `${esc(lead?.name || "Chưa gắn khách hàng")} · ${esc(d.country || "Chưa chọn thị trường")}`;
}

function designLibraryActions() {
  const standard = btn(systemIcon("plus") + " Thiết kế tour mới", "designNew()", "primary");
  const sic = btn(systemIcon("users") + " Thiết kế tour SIC mới", "designNewSic()", "primary");
  return `<div class="tour-library-actions">${standard}${sic}</div>`;
}

function designNewSic() {
  if (!requireCapability("tour_design_manage")) return;
  design = blankDesign();
  design.tourKind = "sic";
  design.sicCapacity = 0;
  design.sicUnits = [];
  design.pax = 0;
  design.program.push({ title: "", text: "" });
  design.days = 1;
  const profiles = typeof pricingSettings === "function" ? pricingSettings() : [];
  if (profiles.length) {
    design.pricingSource = "table";
    design.pricingProfileId = profiles[0].id;
    designApplyPricing(design);
  }
  designOpenBuilder();
}

/* Đổi số khách của chuyến thì tính lại số khách tổng và giá theo bảng giá. */
function designSicSync(d, redrawList = true) {
  d.pax = designSicTotal(d);
  designApplyPricing(d);
  designRefresh(["steps", "summary"]);
  if (redrawList) designRefresh(["sic"]);
  else designSicRefreshStatus(d);
}

function designSicSummaryText(d) {
  const capacity = Number(d.sicCapacity) || 0;
  const units = designSicUnits(d).length;
  return `Đã ghép ${designSicTotal(d)}${capacity ? ` / ${capacity}` : ""} khách · ${units} đơn vị`;
}

/* Chỉ cập nhật dòng tổng và nhãn còn chỗ/đã đầy, không vẽ lại ô đang nhập (giữ con trỏ khi bấm Tab). */
function designSicRefreshStatus(d) {
  const summary = document.getElementById("dzSicSummary");
  if (summary) summary.textContent = designSicSummaryText(d);
  const status = designSicStatus(d);
  const holder = document.getElementById("dzSicStatus");
  if (holder) holder.innerHTML = badge(status.text, status.tone);
}

function designSicResetInput(id, value) {
  const input = document.getElementById(id);
  if (input) input.value = value;
}

function designSicSetCapacity(value) {
  const d = ensureDesign();
  const next = Math.floor(Number(value) || 0);
  if (next < 1 || next > designSicMaxPax) {
    toast(`Sức chứa phải từ 1 đến ${designSicMaxPax} khách.`);
    designSicResetInput("dzSicCapacity", d.sicCapacity || "");
    return;
  }
  const total = designSicTotal(d);
  if (next < total) {
    toast(`Sức chứa không thể nhỏ hơn số khách đã ghép (${total}).`);
    designSicResetInput("dzSicCapacity", d.sicCapacity || "");
    return;
  }
  d.sicCapacity = next;
  designRefresh(["steps"]);
  designSicRefreshStatus(d);
}

function designSicCustomerAllowed(c) {
  if (!isScoped() || !crmOwners.includes(myName())) return true;
  return !c.owner || c.owner === myName();
}

/* Khách trong hệ thống chưa được ghép vào chuyến này. */
function designSicPickables(d) {
  const used = designSicUnits(d).map((u) => `${u.refType}|${u.refId}`);
  const leads = designableLeads().filter((l) => !used.includes(`lead|${l.id}`));
  const customers = (state.customers || [])
    .filter(designSicCustomerAllowed)
    .filter((c) => !used.includes(`customer|${c.id}`));
  return { leads, customers };
}

function designSicIsDuplicate(d, unit) {
  const key = unit.name.toLowerCase();
  return designSicUnits(d).some((u) => {
    if (unit.refType !== "manual") return u.refType === unit.refType && u.refId === unit.refId;
    return designSicUnitName(u).toLowerCase() === key;
  });
}

function designSicAddUnit(d, unit) {
  const pax = Math.floor(Number(unit.pax) || 0);
  if (pax < 1) return toast("Số khách của đơn vị phải từ 1 trở lên.");
  if (designSicIsDuplicate(d, unit)) return toast("Đơn vị này đã có trong danh sách ghép.");
  const left = designSicLimit(d) - designSicTotal(d);
  if (left <= 0) return toast("Chuyến đã đầy, không thể thêm đơn vị.");
  const fitted = Math.min(pax, left);
  designSicUnits(d).push({
    refType: unit.refType,
    refId: unit.refId,
    name: unit.name,
    pax: fitted,
  });
  if (fitted < pax) toast(`Chỉ còn ${left} chỗ, đã ghi ${fitted} khách cho đơn vị này.`);
  designSicSync(d);
}

function designSicAddRef(selection) {
  const d = ensureDesign();
  const [kind, id] = String(selection || "").split("|", 2);
  if (!id || !["lead", "customer"].includes(kind)) return;
  const record = kind === "customer" ? (state.customers || []).find((c) => c.id === id) : findLead(id);
  if (!record) return toast("Khách hàng đã chọn không còn tồn tại.");
  designSicAddUnit(d, {
    refType: kind,
    refId: id,
    name: String(record.name || id).slice(0, 80),
    pax: Number(record.pax) || 1,
  });
}

function designSicAddManual() {
  const d = ensureDesign();
  const name = String(document.getElementById("dzSicName")?.value || "").trim();
  if (!name) return toast("Hãy nhập tên đơn vị ghép.");
  designSicAddUnit(d, {
    refType: "manual",
    refId: "",
    name: name.slice(0, 80),
    pax: Number(document.getElementById("dzSicPax")?.value) || 0,
  });
}

function designSicSetPax(i, value) {
  const d = ensureDesign();
  const unit = designSicUnits(d)[i];
  if (!unit) return;
  const wanted = Math.floor(Number(value) || 0);
  if (wanted < 1) {
    toast("Số khách của đơn vị phải từ 1 trở lên.");
    designSicResetInput(`dzSicPax${i}`, unit.pax);
    return;
  }
  const room = designSicLimit(d) - (designSicTotal(d) - unit.pax);
  if (wanted > room) toast(`Vượt sức chứa, đơn vị này tối đa ${room} khách.`);
  unit.pax = Math.min(wanted, room);
  designSicResetInput(`dzSicPax${i}`, unit.pax);
  designSicSync(d, false);
}

function designSicRemove(i) {
  const d = ensureDesign();
  designSicUnits(d).splice(i, 1);
  designSicSync(d);
}

/* ---------- Giao diện tour SIC ---------- */
function designSicSelect(name, values, current, placeholder) {
  const first = placeholder ? `<option value="">${placeholder}</option>` : "";
  const options = designOptionValues(values, current).map((v) => `<option ${v === current ? "selected" : ""}>${esc(v)}</option>`);
  return `<select onchange="designSet('${name}',this.value)">${first}${options.join("")}</select>`;
}

function designSicInfoCard(d) {
  const note = esc(d.note || "");
  const form = [
    `<div class="dz-form">`,
    `<label class="dz-field"><span>Tên chương trình <i class="req">*</i></span>`,
    `<input value="${esc(d.name)}" placeholder="Ví dụ: Hà Nội – Hạ Long SIC 4 ngày"`,
    ` onchange="designSet('name',this.value)"></label>`,
    `<div class="dz-row dz-row--3">`,
    `<label class="dz-field">Thị trường${designSicSelect("country", crmCountries, d.country, "-- Chọn --")}</label>`,
    `<label class="dz-field">Thời lượng (ngày)`,
    `<input type="number" min="1" max="60" value="${d.days}" onchange="designSet('days',this.value)"></label>`,
    `<label class="dz-field">Loại tour${designSicSelect("tourType", tourTypes, d.tourType, "-- Chọn --")}</label>`,
    `</div>`,
    `<div class="dz-row dz-row--3">`,
    `<label class="dz-field"><span>Ngày khởi hành cố định <i class="req">*</i></span>`,
    `<input type="date" min="${todayISO()}" value="${esc(d.start)}" onchange="designSet('start',this.value)"></label>`,
    `<label class="dz-field"><span>Sức chứa (khách) <i class="req">*</i></span>`,
    `<input id="dzSicCapacity" type="number" min="1" max="${designSicMaxPax}"`,
    ` value="${Number(d.sicCapacity) || ""}" placeholder="Ví dụ: 16"`,
    ` onchange="designSicSetCapacity(this.value)"></label>`,
    `<label class="dz-field">Ngôn ngữ chương trình${designSicSelect("language", travelLanguages, d.language)}</label>`,
    `</div>`,
    `<div class="dz-row dz-row--2">${designRateField(d)}</div>`,
    `<label class="dz-field">Ghi chú chuyến ghép`,
    `<textarea maxlength="500" onchange="designSet('note',this.value)"`,
    ` placeholder="Điểm đón, điều kiện ghép, lưu ý cho các đơn vị…">${note}</textarea></label>`,
    `</div>`,
  ].join("");
  return card(`<span class="dz-num">1</span> Thông tin tour ghép SIC`, form);
}

function designSicUnitRow(u, i) {
  return [
    `<div class="dz-sic-row">`,
    `<div class="dz-sic-name"><b>${esc(designSicUnitName(u))}</b>`,
    `<small>${esc(designSicSourceLabels[u.refType] || "")}</small></div>`,
    `<label class="dz-sic-pax"><span>Số khách</span>`,
    `<input id="dzSicPax${i}" type="number" min="1" max="${designSicMaxPax}"`,
    ` value="${Number(u.pax) || 1}" onchange="designSicSetPax(${i}, this.value)"></label>`,
    `<button type="button" class="btn small dz-sic-remove" onclick="designSicRemove(${i})"`,
    ` aria-label="Bỏ đơn vị khỏi chuyến" title="Bỏ đơn vị khỏi chuyến">${systemIcon("trash")}</button>`,
    `</div>`,
  ].join("");
}

function designSicPicker(d) {
  const { leads, customers } = designSicPickables(d);
  const option = (kind, r) => `<option value="${kind}|${esc(r.id)}">${esc(r.name)} · ${esc(r.id)}</option>`;
  const groups = [
    `<optgroup label="Khách hàng thường">${customers.map((c) => option("customer", c)).join("")}</optgroup>`,
    `<optgroup label="Khách hàng tiềm năng">${leads.map((l) => option("lead", l)).join("")}</optgroup>`,
  ].join("");
  return [
    `<label class="dz-field"><span>Chọn khách hàng trong hệ thống (chọn lần lượt nhiều khách)</span>`,
    `<select onchange="designSicAddRef(this.value)">`,
    `<option value="">-- Chọn khách hàng để ghép --</option>${groups}</select></label>`,
  ].join("");
}

function designSicManualForm() {
  return [
    `<div class="dz-sic-manual">`,
    `<label class="dz-field"><span>Hoặc nhập đơn vị chưa có trong hệ thống</span>`,
    `<input id="dzSicName" maxlength="80" placeholder="Tên đơn vị / công ty ghép"></label>`,
    `<label class="dz-field"><span>Số khách</span>`,
    `<input id="dzSicPax" type="number" min="1" max="${designSicMaxPax}" value="1"></label>`,
    `<button type="button" class="btn primary" onclick="designSicAddManual()">Thêm đơn vị</button>`,
    `</div>`,
  ].join("");
}

function designSicUnitsCard(d) {
  const units = designSicUnits(d);
  const status = designSicStatus(d);
  const empty = '<p class="sub">Chưa có đơn vị ghép. Chọn khách hàng trong hệ thống hoặc nhập đơn vị mới.</p>';
  const list = units.length ? units.map((u, i) => designSicUnitRow(u, i)).join("") : empty;
  const body = [
    `<p class="dz-sic-summary" id="dzSicSummary">${esc(designSicSummaryText(d))}</p>`,
    `<div class="dz-sic-list">${list}</div>`,
    `<div class="dz-sic-add">${designSicPicker(d)}${designSicManualForm()}</div>`,
  ].join("");
  return card("Đơn vị ghép", body, `<span id="dzSicStatus">${badge(status.text, status.tone)}</span>`);
}

function designDetailSicPanel(d) {
  if (!designIsSic(d)) return "";
  const status = designSicStatus(d);
  const rows = designSicUnits(d).map((u) => {
    return `<span>${esc(designSicUnitName(u))} <b>${Number(u.pax) || 0} khách</b></span>`;
  });
  const empty = "<span>Chưa có đơn vị ghép <b>—</b></span>";
  return [
    `<section class="tour-detail-panel"><h3>Tour ghép SIC</h3><div class="tour-detail-info">`,
    `<span>Sức chứa <b>${Number(d.sicCapacity) || 0} khách</b></span>`,
    `<span>Đã ghép <b>${designSicTotal(d)} khách</b></span>`,
    `<span>Tình trạng <b>${esc(status.text)}</b></span>`,
    `<span>Chuyến đang mở bán <b>${departureDraftCount(d.id)}</b></span>`,
    rows.length ? rows.join("") : empty,
    `</div></section>`,
  ].join("");
}

function designSicTextLines(d) {
  if (!designIsSic(d)) return [];
  const status = designSicStatus(d);
  const head = `Tour ghép SIC: ${designSicTotal(d)}/${Number(d.sicCapacity) || 0} khách (${status.text})`;
  const units = designSicUnits(d).map((u) => `- ${designSicUnitName(u)}: ${Number(u.pax) || 0} khách`);
  return [head, ...units];
}

function designOpenBuilder() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  if (!d.svcTab) d.svcTab = serviceTypes[0] || "Other";
  if (!designSteps.some(([key]) => key === d.viewStep)) d.viewStep = "info";
  modal(designModalTitle(d), designBuilderHtml(d));
}

/* ---------- Lưu nháp / mẫu / chia sẻ ---------- */
function designSnapshot(d) {
  const copy = JSON.parse(JSON.stringify(d));
  delete copy.sort;
  return copy;
}

function designSave() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  if (!d.name.trim() && !d.lead && !d.customerId && !d.program.length) return toast("Chưa có nội dung để lưu.");
  const rec = (state.drafts ||= []).find((r) => r.id === d.id);
  const data = { lead: d.lead, owner: actor().name, ownerRole: actor().role, savedAt: nowISO(), design: designSnapshot(d) };
  if (rec) Object.assign(rec, data);
  else {
    d.id = "NH-" + Date.now().toString(36).toUpperCase();
    state.drafts.push({ id: d.id, ...data, design: designSnapshot(d) });
  }
  save();
  designRefresh(["summary", "templates"]);
  if (current === "design") render();
  toast("Đã lưu nháp chương trình.");
}

function designOpenDraft(id) {
  const rec = state.drafts.find((r) => r.id === id);
  if (!rec) return;
  design = { ...blankDesign(), ...rec.design, lead: rec.lead || rec.design.lead, id: rec.id, sort: false };
  if (design.pricingMode === "pax") { design.pricingMode = "total"; design.pricingSource = "table"; }
  if (rec.design.manualUnitPrice === undefined && design.pricingSource !== "table") design.manualUnitPrice = Number(rec.design.unitPrice) || 0;
  // Backward compatibility: drafts created before the new price-profile flow only stored amount/paxPrices.
  if (!Number(design.unitPrice) && Number(design.amount) > 0 && design.pricingMode !== "pax" && design.pricingSource !== "table") {
    const factor = design.pricingMode === "daily" ? Math.max(1, design.program.length || design.days || 1) : 1;
    design.unitPrice = Number(design.paxPrices?.[design.pax]) || Math.round(Number(design.amount) / Math.max(1, Number(design.pax) || 1) / factor);
  }
  designOpenBuilder();
}

/* Chi tiết chương trình: cột lịch trình + bảng bên (dịch vụ, chi phí, thông tin).
   Không dùng thẻ aside vì style.css biến nó thành sidebar cố định (xem css/mod-design.css). */
function designDetailDay(day, index) {
  const title = esc(day.title || `Ngày ${index + 1}`);
  const text = esc(day.text || "Chưa có mô tả hoạt động.");
  return `<li><span>${index + 1}</span><div><b>${title}</b><p>${text}</p></div></li>`;
}

function designDetailDays(d) {
  if (!d.program.length) return `<li class="empty">Chưa có lịch trình.</li>`;
  return d.program.map((day, index) => designDetailDay(day, index)).join("");
}

function designDetailService(d, cat) {
  const label = `${systemIcon(svcIcons[cat] || "circle")} ${svcLabel(cat)}`;
  const value = `${designItems(d, cat).length} mục · ${designFmt(d, designCatCost(d, cat))}`;
  return `<div><span>${label}</span><b>${value}</b></div>`;
}

function designDetailHead(rec, d) {
  const lead = findLead(rec.lead || d.lead);
  const status = designStepState(d).done.preview ? "Sẵn sàng báo giá" : "Đang thiết kế";
  const sub = designCardSubline(d, lead);
  return [
    `<header>`,
    `<div><span class="tour-detail-status">${status}</span>`,
    `<h2>${esc(d.name || "Chương trình chưa đặt tên")}</h2><p>${sub}</p></div>`,
    `<div class="tour-detail-owner"><small>Người thiết kế</small>`,
    `<b>${esc(rec.owner || "Chưa phân công")}</b><span>${esc(rec.ownerRole || "Người thiết kế")}</span></div>`,
    `</header>`,
  ].join("");
}

function designDetailKpi(label, value) {
  return `<div><small>${label}</small><b>${value}</b></div>`;
}

function designDetailKpis(d) {
  return [
    `<section class="tour-detail-kpis">`,
    designDetailKpi("Thời lượng", `${d.program.length || d.days || 0} ngày`),
    designDetailKpi("Số khách", `${d.pax || 0} khách`),
    designDetailKpi("Tổng chi phí", designFmt(d, designCost(d))),
    designDetailKpi("Giá bán", designFmt(d, d.amount)),
    `</section>`,
  ].join("");
}

function designDetailSide(rec, d) {
  const services = svcCats().map((cat) => designDetailService(d, cat)).join("");
  const profit = designFmt(d, d.amount - designCost(d));
  const start = d.start ? fmt(d.start) : "Chưa chọn";
  return [
    `<div class="tour-detail-side">`,
    `<section class="tour-detail-panel"><h3>Dịch vụ & chi phí</h3>`,
    `<div class="tour-detail-services">${services}</div>`,
    `<div class="tour-detail-total"><span>Lợi nhuận dự kiến</span><b>${profit}</b></div></section>`,
    designDetailSicPanel(d),
    `<section class="tour-detail-panel"><h3>Thông tin chương trình</h3><div class="tour-detail-info">`,
    `<span>Khởi hành <b>${start}</b></span>`,
    `<span>Loại tour <b>${esc(d.tourType || "—")}</b></span>`,
    `<span>Cập nhật <b>${dateTimeVN(rec.savedAt)}</b></span>`,
    `</div></section>`,
    `</div>`,
  ].join("");
}

function designDetailFooter(rec) {
  const del = designCanDeleteDraft(rec)
    ? btn(systemIcon("trash") + " Xóa nháp", `designDeleteDraft('${rec.id}')`, "danger tour-detail-delete")
    : "";
  const edit = can("tour_design_manage")
    ? btn(systemIcon("pen") + " Tiếp tục thiết kế", `designOpenDraft('${rec.id}')`, "primary")
    : "";
  return `<footer>${del}${btn("Đóng", "closeModal()")}${departureDetailAction(rec)}${edit}</footer>`;
}

function designDetail(id) {
  const rec = (state.drafts || []).find((item) => item.id === id && item.design);
  if (!rec || (!can("all") && rec.owner !== actor().name)) return toast("Bạn không có quyền xem chương trình này.");
  const d = { ...blankDesign(), ...rec.design };
  const list = `<ol class="tour-detail-days">${designDetailDays(d)}</ol>`;
  const days = `<section><h3>Lịch trình chi tiết</h3>${list}</section>`;
  modal(
    `Chi tiết chương trình · ${esc(rec.id)}`,
    [
      `<div class="tour-detail">`,
      designDetailHead(rec, d),
      designDetailKpis(d),
      `<div class="tour-detail-grid">${days}${designDetailSide(rec, d)}</div>`,
      designDetailFooter(rec),
      `</div>`,
    ].join(""),
  );
}

/* Xóa chương trình nháp: chỉ người tạo (hoặc CEO), có hỏi lại và ghi nhật ký. */
function designCanDeleteDraft(rec) {
  if (!can("tour_design_manage")) return false;
  return can("all") || rec.owner === actor().name;
}

function designCardFooter(item) {
  const owner = esc(item.owner || "Chưa phân công");
  const role = esc(item.ownerRole || "Người thiết kế");
  const open = departureCardAction(item);
  const end = `<div class="tour-card-end"><time>${dateTimeVN(item.savedAt)}</time>${open}${designCardDelete(item)}</div>`;
  return `<footer><span><b>${owner}</b><small>${role}</small></span>${end}</footer>`;
}

function designCardDelete(rec) {
  if (!designCanDeleteDraft(rec)) return "";
  return [
    `<button class="tour-card-delete" title="Xóa nháp" aria-label="Xóa nháp ${esc(rec.id)}"`,
    ` onclick="designDeleteDraftClick(event,'${rec.id}')" onkeydown="event.stopPropagation()">`,
    systemIcon("trash"),
    `</button>`,
  ].join("");
}

function designDeleteDraftClick(e, id) {
  e.stopPropagation();
  designDeleteDraft(id);
}

function designDeleteDraft(id) {
  const rec = (state.drafts || []).find((r) => r.id === id);
  if (!rec) return toast("Không tìm thấy chương trình nháp.");
  if (!requireCapability("tour_design_manage")) return;
  if (!designCanDeleteDraft(rec)) return toast("Bạn chỉ xóa được chương trình nháp do mình tạo.");
  const name = rec.design?.name || "Chương trình chưa đặt tên";
  if (!confirm(`Xóa chương trình nháp “${name}” (${rec.id})?\nThao tác này không thể hoàn tác.`)) return;
  state.drafts = state.drafts.filter((r) => r.id !== id);
  if (design?.id === id) design.id = "";
  audit("draft", id, "DELETE", `Xóa chương trình nháp ${name} (${id})`);
  save();
  if (document.querySelector(".tour-detail")) closeModal();
  designRefresh(["templates", "summary"]);
  if (current === "design") render();
  toast("Đã xóa chương trình nháp.");
}

function designSaveTemplate() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  const titles = d.program.map((p) => p.title.trim()).filter(Boolean);
  if (!d.name.trim() || !titles.length) return toast("Hãy đặt tên và nhập lịch trình trước khi lưu mẫu.");
  if (state.tourTemplates.some((t) => t.name === d.name.trim())) return toast("Đã có mẫu trùng tên.");
  const program = d.program.filter((p) => p.title.trim()).map((p) => ({ title: p.title.trim(), text: p.text.trim() }));
  const now = new Date().toISOString();
  const t = {
    id: nextBusinessId("tourTemplates"),
    name: d.name.trim(),
    region: designTemplateRegion({ country: d.country, name: d.name }),
    itinerary: titles,
    program,
    country: d.country,
    type: d.tourType,
    owner: actor().name,
    createdAt: now,
    updatedAt: now,
  };
  state.tourTemplates.push(t);
  audit("template", t.id, "CREATE", `Lưu mẫu tour ${t.name}`);
  designRefresh(["templates"]);
  toast("Đã lưu thành mẫu tour.");
}

function designText(d) {
  const lines = [`${d.name || "Chương trình tour"} — ${d.program.length} ngày, ${d.pax} khách`, d.start ? `Khởi hành: ${fmt(d.start)}` : "", ...d.program.map((p, i) => `Ngày ${i + 1}: ${p.title}${p.text ? " — " + p.text.replace(/\n/g, "; ") : ""}`)];
  return lines.concat(designSicTextLines(d)).filter(Boolean).join("\n");
}

async function designShare() {
  const d = ensureDesign();
  if (!d.program.length) return toast("Chưa có lịch trình để chia sẻ.");
  try {
    await navigator.clipboard.writeText(designText(d));
    toast("Đã sao chép nội dung chương trình, dán vào chat/email để chia sẻ cho team.");
  } catch {
    modal("Chia sẻ chương trình", `<textarea style="min-height:220px" readonly>${esc(designText(d))}</textarea>`, true);
  }
}

function designPreview() {
  const d = ensureDesign();
  if (!d.program.length) return toast("Hãy thêm lịch trình trước khi xem trước.");
  modal(
    "Xem trước chương trình · " + esc(d.name || "Chưa đặt tên"),
    `<div class="quote-detail"><div class="quote-detail-summary">${line("Khách hàng", esc(designCustomerName(d)))}${line("Khởi hành", d.start ? fmt(d.start) : "—")}${line("Số khách", d.pax)}${line("Giá bán", d.amount ? designFmt(d, d.amount) : "Chưa nhập")}</div>${d.program.map((p, i) => `<div class="quote-day"><b>Ngày ${i + 1}</b><div><strong>${esc(p.title)}</strong><p>${esc(p.text).replace(/\n/g, "<br>")}</p></div></div>`).join("")}</div>`,
  );
}

/* Tên tour ghi trên báo giá. */
const designQuoteTour = (d) => `${d.name.trim()} · ${d.program.length} ngày`;

/* Dựng bản ghi báo giá từ một bản thiết kế (báo giá thường và báo giá của đơn vị trong chuyến SIC). */
function designQuoteRecord(d, client, id) {
  const breakdown = Object.fromEntries(svcCats().map((c) => [c, designCatCost(d, c)]));
  return {
    id,
    lead: d.lead || "",
    customerId: d.customerId || "",
    customerType: d.customerType || "lead",
    client,
    tour: designQuoteTour(d),
    days: d.program.length,
    pax: d.pax,
    pricingMode: d.pricingMode || "total",
    pricingSource: d.pricingSource || (d.pricingMode === "pax" ? "table" : "manual"),
    pricingProfileId: d.pricingProfileId || "",
    pricingProfileName: typeof pricingProfileName === "function" ? pricingProfileName(d.pricingProfileId) : "",
    pricingTierPax: Number(d.pricingTierPax || designPricingTier(d).tier?.pax || 1),
    unitPrice: Number(d.unitPrice || 0),
    manualUnitPrice: Number(d.manualUnitPrice || 0),
    paxPrices: JSON.parse(JSON.stringify(d.paxPrices || {})),
    pricePerPax: d.pax ? Math.round(d.amount / d.pax) : 0,
    amount: d.amount,
    cost: designCost(d),
    costBreakdown: breakdown,
    services: JSON.parse(JSON.stringify(d.services)),
    start: d.start,
    note: d.note,
    itNote: d.itNote,
    country: d.country,
    currency: d.currency,
    budgetNative: Number(d.budgetNative) || 0,
    fxDate: todayISO(),
    language: d.language,
    tourType: d.tourType,
    program: d.program.map((p) => (p.text.trim() ? `${p.title.trim()} — ${p.text.trim().replace(/\n/g, "; ")}` : p.title.trim())),
    version: 1,
    status: "Draft",
    history: [],
    createdAt: nowISO(),
    createdBy: actor().name,
  
  };
}

function createQuote() {
  if (!requireCapability("quotes_manage")) return;
  const d = ensureDesign();
  if (designIsSic(d)) return toast(designSicQuoteNotice);
  const missing = [];
  if (!d.lead && !(d.customerType === "customer" && d.customerId)) missing.push("chọn khách hàng");
  if (!d.name.trim()) missing.push("đặt tên chương trình");
  if (!d.start) missing.push("chọn ngày khởi hành");
  if (!d.program.length || d.program.some((p) => !p.title.trim())) missing.push("nhập tiêu đề cho tất cả các ngày");
  if (!(designCost(d) > 0)) missing.push("nhập chi phí dịch vụ");
  if (!(d.amount > 0)) missing.push("nhập giá bán");
  if (missing.length) return toast("Cần " + missing.join(", ") + ".");
  const lead = designSelectedCustomer(d);
  if (!lead) return toast("Khách hàng đã chọn không còn tồn tại.");
  const id = nextBusinessId("quotes");
  const tour = designQuoteTour(d);
  state.quotes.push(designQuoteRecord(d, lead.name, id));
  if (d.customerType !== "customer") {
    lead.tour = tour;
    lead.days = d.program.length;
    lead.start = d.start;
  }
  if (d.id) state.drafts = state.drafts.filter((r) => r.id !== d.id);
  audit("quote", id, "CREATE", `Tạo báo giá ${id} cho ${lead.name} (${money(d.amount)})`);
  design = null;
  go("quotes");
  quoteDetail(id);
  toast(`Đã tạo báo giá nháp ${id}. Kiểm tra rồi gửi cho khách.`);
}
