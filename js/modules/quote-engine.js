/* MODULE quote-engine — thiết kế tour từ cấu hình và template trong database. */

let draft = null;

const optionList = (values) =>
  values.map((value) => `<option>${esc(value)}</option>`).join("");

function renderTourDesignForm() {
  const availableLeads = state.leads.filter((lead) => lead.status !== "LOST");
  const leadOptions = availableLeads
    .map(
      (lead) =>
        `<option value="${lead.id}">${lead.id} · ${esc(lead.name)}</option>`,
    )
    .join("");
  const templateOptions = state.tourTemplates
    .map((template) => `<option>${esc(template.name)}</option>`)
    .join("");
  const templateSummary = state.tourTemplates
    .map(
      (template) =>
        `<div class="timeline"><b>${esc(template.name)}</b><p>${esc(template.itinerary.join(" · "))}</p></div>`,
    )
    .join("");

  return (
    title(
      "Thiết kế chương trình tour",
      "Tạo chương trình, dự toán và chuyển thành báo giá có phiên bản.",
      badge("TEMPLATE DATABASE", "green"),
    ) +
    `<div class="grid"><div>${card(
      "Thông tin thiết kế",
      `<form id="designform" onsubmit="buildTour(event)"><div class="formgrid"><label class="full">Chọn khách từ CRM<select name="lead" id="designlead" onchange="fillDesign(this.value)" required><option value="">Chọn Lead</option>${leadOptions}</select></label><label>Chương trình<select name="template" required><option value="">Chọn template</option>${templateOptions}</select></label><label>Country / Thị trường<select name="country" required><option value="">Chọn thị trường</option>${optionList(crmCountries)}</select></label><label>Budget (nguyên tệ)<input name="budgetNative" type="number" min="1" required></label><label>Currency<select name="currency" required><option value="">Chọn tiền tệ</option>${optionList(travelCurrencies)}</select></label><label>Tỷ giá quy đổi sang VND<input name="rate" type="number" min="1" required></label><label>Thời lượng (ngày)<input name="days" type="number" min="1" max="60" required></label><label>Số khách<input name="pax" type="number" min="1" max="100" required></label><label>Ngày khởi hành<input name="start" type="date" required></label><label>Giá bán nhóm (VND)<input name="amount" type="number" min="1" step="1000000" required></label><label>Dự toán chi phí (VND)<input name="cost" type="number" min="0" step="1000000" required></label><label>Ngôn ngữ chương trình<select name="language" required>${optionList(travelLanguages)}</select></label><label class="full">Yêu cầu đặc biệt<textarea name="note" placeholder="Ăn chay, phòng gia đình, trải nghiệm văn hóa…"></textarea></label></div><div class="formfooter"><button class="btn primary" type="submit">Tạo chương trình</button></div></form>`,
    )}<div class="alert">Template, thị trường, tiền tệ và ngôn ngữ được nạp từ database. Sales chịu trách nhiệm nhập giá và tỷ giá áp dụng.</div></div><div id="programresult">${card("Bản nháp hành trình", '<div class="empty">Chọn Lead và template để tạo chương trình.</div>')}${card("Template có thể tái sử dụng", templateSummary || '<div class="empty">Chưa có template trong database.</div>')}</div></div>`
  );
}

function selectLead(id) {
  document.getElementById("designlead").value = id;
  fillDesign(id);
}

function fillDesign(id) {
  const lead = state.leads.find((item) => item.id === id);
  const form = document.getElementById("designform");
  if (!lead || !form) return;
  form.elements.pax.value = lead.pax || "";
  form.elements.amount.value = lead.budget || "";
  form.elements.cost.value = lead.budget ? Math.round(lead.budget * 0.7) : "";
  form.elements.note.value = lead.note || "";
  form.elements.country.value = lead.country || "";
}

function buildDraftProgram(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const template = state.tourTemplates.find(
    (item) => item.name === form.get("template"),
  );
  if (!template?.itinerary?.length) {
    toast("Template chưa có lịch trình trong database.");
    return;
  }

  const days = Number(form.get("days"));
  const amount = Number(form.get("amount"));
  const cost = Number(form.get("cost"));
  draft = {
    lead: form.get("lead"),
    tour: `${template.name} · ${days} ngày`,
    days,
    pax: Number(form.get("pax")),
    amount,
    cost,
    start: form.get("start"),
    note: form.get("note"),
    program: Array.from(
      { length: days },
      (_, index) => template.itinerary[index % template.itinerary.length],
    ),
  };

  document.getElementById("programresult").innerHTML = card(
    "Chương trình đề xuất",
    `<div class="tagset">${badge(draft.days + " ngày", "green")}${badge(draft.pax + " khách")}${badge("Biên dự kiến " + (((amount - cost) / amount) * 100).toFixed(1) + "%", "green")}</div><div style="margin-top:16px">${draft.program.map((item, index) => `<label>Ngày ${index + 1}<input id="day${index}" value="${esc(item)}"></label>`).join("")}</div><div class="notice">Yêu cầu khách: ${esc(draft.note || "Chưa có ghi chú")}</div><div class="formfooter">${btn("Tạo báo giá từ bản nháp", "createQuote()", "primary")}</div>`,
  );
}

views.design = () => renderTourDesignForm();

function buildTour(event) {
  buildDraftProgram(event);
  if (!draft) return;
  const form = new FormData(event.target);
  draft.country = form.get("country");
  draft.currency = form.get("currency");
  draft.budgetNative = Number(form.get("budgetNative"));
  draft.rate = Number(form.get("rate"));
  draft.language = form.get("language");

  const translation = travelTranslations[draft.language];
  if (translation?.length) {
    draft.program = draft.program.map(
      (_, index) => translation[index % translation.length],
    );
    draft.program.forEach((item, index) => {
      const input = document.getElementById("day" + index);
      if (input) input.value = item;
    });
  }

  document
    .getElementById("programresult")
    .insertAdjacentHTML(
      "beforeend",
      `<div class="alert green">Budget khách: ${esc(draft.budgetNative)} ${esc(draft.currency)} · Quy đổi ${money(draft.budgetNative * draft.rate)}. Giá bán nhóm và dự toán VND do Sales nhập.</div>`,
    );
  toast("Đã tạo chương trình từ template database.");
}
