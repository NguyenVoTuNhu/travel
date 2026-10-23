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

const optionList = (values) => values.map((value) => `<option>${esc(value)}</option>`).join("");
const svcCats = () => serviceTypes.concat(["Other"]);
const svcLabel = (t) => (t === "Other" ? "Khác" : typesVI[t] || t);
const svcIcons = { Hotel: "hotel", Vehicle: "van-shuttle", Meal: "utensils", Ticket: "ticket", Guide: "user-tie", Other: "ellipsis" };

function designableLeads() {
  return scopedLeads().filter((lead) => leadIsOpen(lead));
}

function blankDesign() {
  return { id: "", lead: "", name: "", country: "", pax: 2, days: 5, budgetNative: "", currency: travelCurrencies[0] || "", tourType: "", start: "", language: travelLanguages[0] || "Tiếng Việt", note: "", itNote: "", template: "", program: [], services: {}, amount: 0, tab: "detail", svcTab: "", cur: fxDisplayCurrency, sort: false, viewStep: "info" };
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
function designStepState(d) {
  const done = {
    info: !!(d.lead && d.name.trim() && d.pax > 0 && d.days > 0 && d.start),
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
  const leads = designableLeads();
  const leadOptions = leads.map((l) => `<option value="${l.id}" ${d.lead === l.id ? "selected" : ""}>${esc(l.name)} · ${l.id} (${leadLabels[l.status]})</option>`).join("");
  const sel = (name, values, current, placeholder) => `<select onchange="designSet('${name}',this.value)">${placeholder ? `<option value="">${placeholder}</option>` : ""}${values.map((v) => `<option ${v === current ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  return card(
    `<span class="dz-num">1</span> Thông tin khách hàng & yêu cầu`,
    `<div class="dz-form">
      <div class="dz-row dz-row--head"><label class="dz-field"><span>Chọn khách hàng <i class="req">*</i></span><select onchange="designPickLead(this.value)"><option value="">-- Chọn lead từ CRM --</option>${leadOptions}</select></label>${can("crm_manage") ? btn(systemIcon("plus") + " Khách hàng mới", "leadForm()", "small") : ""}</div>
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
  } else {
    const list = designTemplatesFiltered();
    body = list.length
      ? list.map((t) => `<div class="dz-tpl"><div><b>${esc(t.name)}</b><small>${t.itinerary.length} ngày · ${esc(t.itinerary.slice(0, 3).join(" → "))}${t.itinerary.length > 3 ? "…" : ""}</small></div>${btn("Dùng mẫu", `designApplyTemplate('${t.id}')`, "small primary")}</div>`).join("")
      : designEmpty("file-circle-question", "Chưa có chương trình tour mẫu nào", "Bạn có thể tạo chương trình mới rồi lưu thành mẫu để dùng lại.", btn(systemIcon("plus") + " Tạo chương trình mới", "designNew()", "small"));
  }
  return card(
    `<span class="dz-num">2</span> Chọn chương trình mẫu`,
    `<nav class="dz-tabs"><button class="${f.tab === "templates" ? "active" : ""}" onclick="designTpl.tab='templates';designRefresh(['templates'])">Mẫu tour có sẵn</button><button class="${f.tab === "mine" ? "active" : ""}" onclick="designTpl.tab='mine';designRefresh(['templates'])">Tour của tôi (${mine.length})</button></nav>
    ${f.tab === "templates" ? `<div class="dz-filters">${filt("region", "Khu vực", regions)}${filt("country", "Quốc gia", crmCountries)}${filt("type", "Loại tour", tourTypes)}</div><input class="dz-search" placeholder="Tìm chương trình mẫu…" value="${esc(f.q)}" onchange="designTpl.q=this.value;designRefresh(['templates'])">` : ""}
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
        (p, i) => `<div class="dz-day"><div class="dz-day-head"><span class="dz-day-no">Ngày ${i + 1}</span><input value="${esc(p.title)}" placeholder="Tiêu đề / điểm đến trong ngày" onchange="designDay(${i},'title',this.value)"><div class="dz-day-tools">${d.sort ? `<button title="Lên" onclick="designMoveDay(${i},-1)" ${i === 0 ? "disabled" : ""}>${systemIcon("arrow-up")}</button><button title="Xuống" onclick="designMoveDay(${i},1)" ${i === d.program.length - 1 ? "disabled" : ""}>${systemIcon("arrow-down")}</button>` : ""}<button title="Xóa ngày" onclick="designDelDay(${i})">${systemIcon("trash")}</button></div></div><textarea placeholder="Hoạt động, bữa ăn, nơi nghỉ…" onchange="designDay(${i},'text',this.value)">${esc(p.text)}</textarea></div>`,
      )
      .join("");
  }
  return card(
    `<span class="dz-num">3</span> Thiết kế lịch trình tour`,
    `<div class="dz-tools">${btn(systemIcon("plus") + " Thêm ngày", "designAddDay()", "small")}${btn(systemIcon("arrow-down-up-across-line") + " " + (d.sort ? "Xong" : "Sắp xếp"), "designToggleSort()", "small")}${btn(systemIcon("file-import") + " Nhập từ mẫu", "designImportForm()", "small")}</div>
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
      return `<article class="dz-suggestion ${free ? "" : "is-busy"}"><span class="dz-suggestion-icon">${systemIcon("van-shuttle")}</span><div><b>${esc(v.name)}</b><small>${esc(v.plate)} · ${v.capacity} chỗ${sup ? ` · ${esc(sup.name)}` : ""}</small><strong>${total ? money(total) : "Chưa có bảng giá"}</strong></div><button class="btn small" ${free ? `onclick="designAddResource('vehicle','${v.id}')"` : "disabled"}>${free ? "+ Chọn" : "Bận lịch"}</button></article>`;
    });
  } else if (cat === "Guide") {
    cards = (state.guides || []).map((g) => {
      const free = designResourceAvailable("guide", g.id, d), total = Number(g.rate || 0) * Math.max(1, d.days || 1);
      return `<article class="dz-suggestion ${free ? "" : "is-busy"}"><span class="dz-suggestion-icon">${systemIcon("user-tie")}</span><div><b>${esc(g.name)}</b><small>${esc(g.area || "Toàn quốc")} · ${esc(g.lang || "Chưa cập nhật ngôn ngữ")} · ${Number(g.rating || 0).toFixed(1)}/5</small><strong>${total ? money(total) : "Chưa có đơn giá"}</strong></div><button class="btn small" ${free ? `onclick="designAddResource('guide','${g.id}')"` : "disabled"}>${free ? "+ Chọn" : "Bận lịch"}</button></article>`;
    });
  } else {
    cards = supplierLibrary(cat, d.start).map((x) => {
      const qty = priceQuantity(x.item, { pax: d.pax, days: d.days }), total = x.item.price * qty;
      return `<article class="dz-suggestion"><span class="dz-suggestion-icon">${systemIcon(svcIcons[cat] || "building")}</span><div><b>${esc(x.sup.name)}</b><small>${esc(x.item.name)} · ${qty}${esc(x.item.unit)}${x.item.season && x.item.season !== "Quanh năm" ? ` · ${esc(x.item.season)}` : ""}</small><strong>${money(total)}</strong></div><button class="btn small" onclick="designAddFromLibrary('${cat}','${x.key}')">+ Chọn</button></article>`;
    });
  }
  if (!cards.length) return `<div class="dz-suggestion-empty">Chưa có ${svcLabel(cat).toLowerCase()} hoặc bảng giá phù hợp trong hệ thống.</div>`;
  return `<section class="dz-suggestions"><div class="dz-suggestions-head"><b>Đề xuất từ hệ thống</b><span>${cards.length} lựa chọn${d.start ? ` cho ngày ${fmt(d.start)}` : " · chọn ngày khởi hành để kiểm tra lịch trống"}</span></div><div class="dz-suggestion-list">${cards.slice(0, 8).join("")}</div></section>`;
}

function designSummary(d) {
  const cost = designCost(d);
  const margin = designMargin(d);
  const min = policy().minMarginPct;
  const profit = d.amount - cost;
  const saved = d.id ? badge("Đã lưu nháp", "blue") : badge("Dự thảo", "green");
  const toggle = designCurToggle(d);
  const lead = findLead(d.lead);
  const row = (l, v) => `<div class="dz-kv"><span>${l}</span><b>${v}</b></div>`;
  return `${card("Tổng quan tour", row("Tên chương trình", esc(d.name || "Chưa đặt tên")) + row("Khách hàng", esc(lead?.name || "Chưa chọn")) + row("Thị trường", esc(d.country || "—")) + row("Thời lượng", d.program.length || d.days ? (d.program.length || d.days) + " ngày" : "—") + row("Số lượng khách", d.pax + " khách") + row("Ngày khởi hành", d.start ? fmt(d.start) : "Chưa chọn") + row("Loại tour", esc(d.tourType || "—")), saved)}
  ${card("Chi phí dự kiến", svcCats().map((c) => `<div class="dz-cost"><span>${systemIcon(svcIcons[c] || "circle")}${svcLabel(c)}</span><b>${designFmt(d, designCatCost(d, c))}</b></div>`).join("") + `<div class="dz-total"><span>Tổng chi phí</span><b>${designFmt(d, cost)}</b></div>`, toggle)}
  ${card(
    "Lợi nhuận dự kiến",
    `<label class="dz-field">Giá bán (${designInputCode(d)})<input type="number" min="0" step="${designInputStep(d, 500000)}" value="${d.amount ? designInputValue(d, d.amount) : ""}" placeholder="Nhập giá bán trọn gói" onchange="designSet('amount',this.value)"></label>
    ${row("Giá bán / khách", d.amount && d.pax ? designFmt(d, Math.round(d.amount / d.pax)) : "—")}${row("Lợi nhuận", `<span class="${profit >= 0 ? "text-good" : "text-bad"}">${designFmt(d, profit)}</span>`)}
    <div class="dz-margin ${!d.amount ? "" : margin < min ? "is-low" : "is-ok"}"><span>Tỷ suất lợi nhuận</span><b>${d.amount ? margin.toFixed(1) + "%" : "—"}</b></div>
    <small class="sub">${d.amount && margin < min ? `Thấp hơn ngưỡng ${min}% — báo giá sẽ cần CEO duyệt trước khi gửi khách.` : `Ngưỡng tối thiểu theo chính sách: ${min}%.`}</small>`,
    btn(systemIcon("flag") + " Đánh giá", "designEvaluate()", "small"),
  )}
  <section class="card dz-actions" id="dz-card-preview"><h3>Hành động</h3>${btn(systemIcon("floppy-disk") + " Lưu chương trình", "designSave()", "primary")}<div class="dz-actions-row">${btn(systemIcon("file-invoice") + " Tạo báo giá", "createQuote()")}${btn(systemIcon("share-nodes") + " Chia sẻ cho team", "designShare()")}</div>${can("tour_design_manage") ? `<button class="dz-link" onclick="designSaveTemplate()">Lưu thành mẫu tour</button>` : ""}</section>`;
}

function designCostQuickSummary(d) {
  const cost = designCost(d), profit = d.amount - cost, margin = designMargin(d), min = policy().minMarginPct;
  return card("Dự toán nhanh", `<div class="dz-quick-cost"><div><span>Tổng chi phí dịch vụ</span><b>${designFmt(d, cost)}</b></div><label class="dz-field">Giá bán dự kiến (${designInputCode(d)})<input type="number" min="0" step="${designInputStep(d, 500000)}" value="${d.amount ? designInputValue(d, d.amount) : ""}" placeholder="Nhập giá bán trọn gói" onchange="designSet('amount',this.value)"></label><div><span>Lợi nhuận dự kiến</span><b class="${profit >= 0 ? "text-good" : "text-bad"}">${designFmt(d, profit)}</b></div><div class="dz-margin ${!d.amount ? "" : margin < min ? "is-low" : "is-ok"}"><span>Tỷ suất lợi nhuận</span><b>${d.amount ? margin.toFixed(1) + "%" : "—"}</b></div><small>Ngưỡng lợi nhuận tối thiểu: ${min}%.</small></div>`, btn(systemIcon("flag") + " Đánh giá", "designEvaluate()", "small"));
}

const designParts = {
  steps: (d) => designStepsHtml(d),
  templates: () => designTemplatesCard(),
  itinerary: (d) => designItineraryCard(d),
  services: (d) => designServicesCard(d),
  summary: (d) => designSummary(d),
  stage: (d) => designStageHtml(d),
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
  return query ? visible.filter((item) => `${item.id} ${item.design.name} ${item.owner} ${findLead(item.lead)?.name || ""}`.toLowerCase().includes(query)) : visible;
}

function designLibraryCard(item) {
  const d = { ...blankDesign(), ...item.design };
  const lead = findLead(item.lead || d.lead);
  const complete = designStepState(d).done.preview;
  const cost = designCost(d);
  return `<article class="tour-card" onclick="designDetail('${item.id}')" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();designDetail('${item.id}')}" aria-label="Xem chi tiết ${esc(d.name || "tour chưa đặt tên")}">
    <div class="tour-card-cover"><span>${systemIcon("route")}</span><em class="${complete ? "is-ready" : ""}">${complete ? "Sẵn sàng báo giá" : "Đang thiết kế"}</em></div>
    <div class="tour-card-body"><div class="tour-card-title"><div><small>${esc(item.id)}</small><h3>${esc(d.name || "Chương trình chưa đặt tên")}</h3></div><span>${systemIcon("arrow-right")}</span></div>
    <p>${esc(lead?.name || "Chưa gắn khách hàng")} · ${esc(d.country || "Chưa chọn thị trường")}</p>
    <div class="tour-card-meta"><span>${systemIcon("calendar-days")} ${d.program.length || d.days || 0} ngày</span><span>${systemIcon("users")} ${d.pax || 0} khách</span><span>${systemIcon("wallet")} ${designFmt(d, d.amount || cost)}</span></div></div>
    <footer><span><b>${esc(item.owner || "Chưa phân công")}</b><small>${esc(item.ownerRole || "Người thiết kế")}</small></span><time>${dateTimeVN(item.savedAt)}</time></footer>
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
  const tours = designVisibleDrafts();
  const all = (state.drafts || []).filter((item) => item.design && (can("all") || item.owner === actor().name));
  const ready = all.filter((item) => designStepState({ ...blankDesign(), ...item.design }).done.preview).length;
  return `<div class="tour-library">
    <header class="tour-library-head"><div><span class="dz-eyebrow">TOUR WORKSPACE</span><h1>Chương trình tour</h1><p>Quản lý, xem lại và tiếp tục các chương trình tour đã thiết kế.</p></div>${btn(systemIcon("plus") + " Thiết kế tour mới", "designNew()", "primary")}</header>
    <section class="tour-library-stats"><div><span>${systemIcon("folder-open")}</span><small>Tổng chương trình</small><b>${all.length}</b></div><div><span>${systemIcon("circle-check")}</span><small>Sẵn sàng báo giá</small><b>${ready}</b></div><div><span>${systemIcon("pen-ruler")}</span><small>Đang thiết kế</small><b>${all.length - ready}</b></div></section>
    <div class="tour-library-toolbar"><label>${systemIcon("magnifying-glass")}<input value="${esc(designLibraryQuery)}" placeholder="Tìm theo tên tour, khách hàng, mã chương trình…" oninput="designLibraryQuery=this.value;render()"></label><span>${tours.length} chương trình</span></div>
    <section class="tour-grid">${tours.length ? tours.map(designLibraryCard).join("") : designEmpty("route", designLibraryQuery ? "Không tìm thấy chương trình phù hợp" : "Chưa có chương trình tour", designLibraryQuery ? "Thử tìm bằng tên tour, khách hàng hoặc mã chương trình khác." : "Tạo chương trình đầu tiên bằng quy trình thiết kế 5 bước.", !designLibraryQuery ? btn(systemIcon("plus") + " Thiết kế tour mới", "designNew()", "primary") : "")}</section>
  </div>`;
};

/* ---------- Thao tác ---------- */
function designGoto(key) {
  const d = ensureDesign();
  if (!designSteps.some(([step]) => step === key)) return;
  d.viewStep = key;
  designRefresh(["steps", "stage"]);
  document.getElementById("dz-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectLead(id) {
  ensureDesign();
  designPickLead(id);
  if (current === "design") designOpenBuilder();
}

function designPickLead(id) {
  const d = ensureDesign();
  d.lead = id;
  const lead = findLead(id);
  if (lead) {
    d.pax = lead.pax || d.pax;
    d.country = lead.country || d.country;
    if (!d.amount && lead.budget) d.amount = lead.budget;
    if (!d.note && lead.note) d.note = lead.note;
    if (!d.name && lead.tour) d.name = lead.tour;
    if (lead.start && !d.start) d.start = lead.start;
  }
  if (document.querySelector(".tour-builder-modal")) designRefresh(["steps", "stage"]);
  else render();
}

function designSet(field, value) {
  const d = ensureDesign();
  if (["pax", "days", "amount"].includes(field)) value = Math.max(0, Number(value) || 0);
  if (field === "amount") value = fxToVnd(value, designInputCode(d));
  if (field === "budgetNative") value = value === "" ? "" : Math.max(0, Number(value) || 0);
  if (field === "days") {
    value = Math.min(60, Math.max(1, value));
    while (d.program.length < value) d.program.push({ title: "", text: "" });
    while (d.program.length > value && !d.program[d.program.length - 1].title.trim() && !d.program[d.program.length - 1].text.trim()) d.program.pop();
    d.days = d.program.length;
    designRefresh(["itinerary", "steps", "summary"]);
    const input = document.querySelector('.dz-form input[onchange*="\'days\'"]');
    if (input) input.value = d.days;
    return;
  }
  d[field] = value;
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
  designRefresh(["itinerary", "steps", "summary"]);
  const info = document.querySelector('.dz-form input[onchange*="\'days\'"]');
  if (info) info.value = d.days;
}

function designDelDay(i) {
  const d = ensureDesign();
  d.program.splice(i, 1);
  d.days = d.program.length || 1;
  designRefresh(["itinerary", "steps", "summary"]);
  const info = document.querySelector('.dz-form input[onchange*="\'days\'"]');
  if (info) info.value = d.days;
}

function designMoveDay(i, dir) {
  const d = ensureDesign();
  const j = i + dir;
  if (j < 0 || j >= d.program.length) return;
  [d.program[i], d.program[j]] = [d.program[j], d.program[i]];
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
  (d.services[cat] ||= []).push({ name: `${sup.name} – ${p.name} (${qty} × ${money(p.price)})`, cost: p.price * qty, supplier: sid });
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
  const d = ensureDesign();
  const translation = travelTranslations?.[d.language];
  const source = translation?.length ? translation : t.itinerary;
  return source.map((title) => ({ title, text: "" }));
}

function designApplyTemplate(id) {
  const d = ensureDesign();
  const t = state.tourTemplates.find((x) => x.id === id);
  if (!t) return;
  if (d.program.some((p) => p.title.trim() || p.text.trim()) && !confirm("Thay lịch trình hiện tại bằng mẫu này?")) return;
  d.template = t.name;
  d.name ||= t.name;
  d.program = designTemplateProgram(t);
  d.days = d.program.length;
  d.tab = "detail";
  if (t.services) d.services = JSON.parse(JSON.stringify(t.services));
  d.viewStep = "itinerary";
  if (document.querySelector(".tour-builder-modal")) designRefresh(["steps", "stage"]);
  else designOpenBuilder();
  toast(`Đã áp dụng mẫu “${t.name}” (${d.days} ngày).`);
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

function designOpenBuilder() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  if (!d.svcTab) d.svcTab = serviceTypes[0] || "Other";
  if (!designSteps.some(([key]) => key === d.viewStep)) d.viewStep = "info";
  modal(d.id ? "Chỉnh sửa chương trình tour" : "Thiết kế chương trình tour", designBuilderHtml(d));
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
  if (!d.name.trim() && !d.lead && !d.program.length) return toast("Chưa có nội dung để lưu.");
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
  designOpenBuilder();
}

function designDetail(id) {
  const rec = (state.drafts || []).find((item) => item.id === id && item.design);
  if (!rec || (!can("all") && rec.owner !== actor().name)) return toast("Bạn không có quyền xem chương trình này.");
  const d = { ...blankDesign(), ...rec.design };
  const lead = findLead(rec.lead || d.lead);
  const days = d.program.length ? d.program.map((day, index) => `<li><span>${index + 1}</span><div><b>${esc(day.title || `Ngày ${index + 1}`)}</b><p>${esc(day.text || "Chưa có mô tả hoạt động.")}</p></div></li>`).join("") : `<li class="empty">Chưa có lịch trình.</li>`;
  const services = svcCats().map((cat) => `<div><span>${systemIcon(svcIcons[cat] || "circle")} ${svcLabel(cat)}</span><b>${designItems(d, cat).length} mục · ${designFmt(d, designCatCost(d, cat))}</b></div>`).join("");
  modal(`Chi tiết chương trình · ${esc(rec.id)}`, `<div class="tour-detail">
    <header><div><span class="tour-detail-status">${designStepState(d).done.preview ? "Sẵn sàng báo giá" : "Đang thiết kế"}</span><h2>${esc(d.name || "Chương trình chưa đặt tên")}</h2><p>${esc(lead?.name || "Chưa gắn khách hàng")} · ${esc(d.country || "Chưa chọn thị trường")}</p></div><div class="tour-detail-owner"><small>Người thiết kế</small><b>${esc(rec.owner || "Chưa phân công")}</b><span>${esc(rec.ownerRole || "Người thiết kế")}</span></div></header>
    <section class="tour-detail-kpis"><div><small>Thời lượng</small><b>${d.program.length || d.days || 0} ngày</b></div><div><small>Số khách</small><b>${d.pax || 0} khách</b></div><div><small>Tổng chi phí</small><b>${designFmt(d, designCost(d))}</b></div><div><small>Giá bán</small><b>${designFmt(d, d.amount)}</b></div></section>
    <div class="tour-detail-grid"><section><h3>Lịch trình chi tiết</h3><ol class="tour-detail-days">${days}</ol></section><aside><h3>Dịch vụ & chi phí</h3><div class="tour-detail-services">${services}</div><div class="tour-detail-total"><span>Lợi nhuận dự kiến</span><b>${designFmt(d, d.amount - designCost(d))}</b></div><h3>Thông tin chương trình</h3><div class="tour-detail-info"><span>Khởi hành <b>${d.start ? fmt(d.start) : "Chưa chọn"}</b></span><span>Loại tour <b>${esc(d.tourType || "—")}</b></span><span>Cập nhật <b>${dateTimeVN(rec.savedAt)}</b></span></div></aside></div>
    <footer>${btn("Đóng", "closeModal()")}${can("tour_design_manage") ? btn(systemIcon("pen") + " Tiếp tục thiết kế", `designOpenDraft('${rec.id}')`, "primary") : ""}</footer>
  </div>`);
}

function designDeleteDraft(id) {
  state.drafts = state.drafts.filter((r) => r.id !== id);
  if (design?.id === id) design.id = "";
  save();
  designRefresh(["templates", "summary"]);
}

function designSaveTemplate() {
  if (!requireCapability("tour_design_manage")) return;
  const d = ensureDesign();
  const titles = d.program.map((p) => p.title.trim()).filter(Boolean);
  if (!d.name.trim() || !titles.length) return toast("Hãy đặt tên và nhập lịch trình trước khi lưu mẫu.");
  if (state.tourTemplates.some((t) => t.name === d.name.trim())) return toast("Đã có mẫu trùng tên.");
  const t = { id: nextBusinessId("tourTemplates"), name: d.name.trim(), itinerary: titles, country: d.country, type: d.tourType };
  state.tourTemplates.push(t);
  audit("template", t.id, "CREATE", `Lưu mẫu tour ${t.name}`);
  designRefresh(["templates"]);
  toast("Đã lưu thành mẫu tour.");
}

function designText(d) {
  const lines = [`${d.name || "Chương trình tour"} — ${d.program.length} ngày, ${d.pax} khách`, d.start ? `Khởi hành: ${fmt(d.start)}` : "", ...d.program.map((p, i) => `Ngày ${i + 1}: ${p.title}${p.text ? " — " + p.text.replace(/\n/g, "; ") : ""}`)];
  return lines.filter(Boolean).join("\n");
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
    `<div class="quote-detail"><div class="quote-detail-summary">${line("Khách hàng", esc(findLead(d.lead)?.name || "—"))}${line("Khởi hành", d.start ? fmt(d.start) : "—")}${line("Số khách", d.pax)}${line("Giá bán", d.amount ? designFmt(d, d.amount) : "Chưa nhập")}</div>${d.program.map((p, i) => `<div class="quote-day"><b>Ngày ${i + 1}</b><div><strong>${esc(p.title)}</strong><p>${esc(p.text).replace(/\n/g, "<br>")}</p></div></div>`).join("")}</div>`,
  );
}

function createQuote() {
  if (!requireCapability("quotes_manage")) return;
  const d = ensureDesign();
  const missing = [];
  if (!d.lead) missing.push("chọn khách hàng");
  if (!d.name.trim()) missing.push("đặt tên chương trình");
  if (!d.start) missing.push("chọn ngày khởi hành");
  if (!d.program.length || d.program.some((p) => !p.title.trim())) missing.push("nhập tiêu đề cho tất cả các ngày");
  if (!(designCost(d) > 0)) missing.push("nhập chi phí dịch vụ");
  if (!(d.amount > 0)) missing.push("nhập giá bán");
  if (missing.length) return toast("Cần " + missing.join(", ") + ".");
  const lead = findLead(d.lead);
  if (!lead) return toast("Lead không còn tồn tại.");
  const id = nextBusinessId("quotes");
  const breakdown = Object.fromEntries(svcCats().map((c) => [c, designCatCost(d, c)]));
  const tour = `${d.name.trim()} · ${d.program.length} ngày`;
  state.quotes.push({
    id,
    lead: d.lead,
    client: lead.name,
    tour,
    days: d.program.length,
    pax: d.pax,
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
  });
  lead.tour = tour;
  lead.days = d.program.length;
  lead.start = d.start;
  if (d.id) state.drafts = state.drafts.filter((r) => r.id !== d.id);
  audit("quote", id, "CREATE", `Tạo báo giá ${id} cho ${lead.name} (${money(d.amount)})`);
  design = null;
  go("quotes");
  quoteDetail(id);
  toast(`Đã tạo báo giá nháp ${id}. Kiểm tra rồi gửi cho khách.`);
}
