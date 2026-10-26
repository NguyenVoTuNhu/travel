/* MODULE mod-tourtemplates — Quản lý tour mẫu (T3-03): thêm/sửa/xóa, phân loại, nhập từ tệp CSV. */

const tplLimits = {
  bytes: 2 * 1024 * 1024,
  templates: 200,
  days: 60,
  name: 200,
  title: 200,
  text: 3000,
  lines: 40,
};

const tplCsvHeaders = [
  "Tên mẫu",
  "Khu vực",
  "Quốc gia",
  "Loại tour",
  "Ngày",
  "Tiêu đề ngày",
  "Mô tả ngày",
];

/* Tên cột chấp nhận khi nhập (đã bỏ dấu, chữ thường, bỏ ký tự lạ). */
const tplCsvAliases = {
  name: ["tenmau", "tentour", "name", "template"],
  region: ["khuvuc", "vung", "region"],
  country: ["quocgia", "thitruong", "country"],
  type: ["loaitour", "loai", "type"],
  day: ["ngay", "stt", "day"],
  title: ["tieudengay", "tieude", "title"],
  text: ["motangay", "mota", "noidung", "text", "description"],
};

let tplBack = false;
let tplDraft = null;

/* Collection có thể chưa có trong state: tự tạo mảng rỗng. */
const tplList = () => (state.tourTemplates ||= []);
const tplFind = (id) => tplList().find((t) => t.id === id);
const tplKey = (name) => String(name).trim().toLowerCase();

function tplNameTaken(name, exceptId) {
  return tplList().some((t) => t.id !== exceptId && tplKey(t.name) === tplKey(name));
}

/* Mẫu cũ chỉ có `itinerary` (mảng tiêu đề); mẫu mới có thêm `program` kèm mô tả. */
function tplProgram(t) {
  if (t.program?.length) {
    return t.program.map((p) => ({ title: p.title || "", text: p.text || "" }));
  }
  return (t.itinerary || []).map((title) => ({ title, text: "" }));
}

/* Người tạo hoặc CEO được sửa/xóa; mẫu cũ chưa có người tạo chỉ CEO sửa. */
function tplCanEdit(t) {
  if (!can("tour_design_manage")) return false;
  return can("all") || t.owner === actor().name;
}

/* ---------- Giao diện danh sách ---------- */
function tplMeta(t) {
  const labels = [designTemplateRegion(t), t.country, t.type].filter(Boolean).map(esc);
  labels.push(`${tplProgram(t).length} ngày`);
  if (t.owner) labels.push(esc(t.owner));
  return labels.join(" · ");
}

function tplRow(t) {
  const titles = tplProgram(t).map((p) => p.title);
  const route = titles.slice(0, 3).join(" → ") + (titles.length > 3 ? "…" : "");
  const edit = tplCanEdit(t)
    ? btn("Sửa", `tplForm('${t.id}')`, "small") + btn("Xóa", `tplDelete('${t.id}')`, "small")
    : "";
  return [
    `<div class="dz-tpl">`,
    `<div><b>${esc(t.name)}</b><small>${tplMeta(t)}</small><small>${esc(route)}</small></div>`,
    `<div class="actions">`,
    `${btn("Dùng mẫu", `designApplyTemplate('${t.id}')`, "small primary")}${edit}`,
    `</div>`,
    `</div>`,
  ].join("");
}

function tplToolbar() {
  if (!can("tour_design_manage")) return "";
  const add = btn(systemIcon("plus") + " Thêm mẫu", "tplForm('')", "small primary");
  const upload = btn(systemIcon("file-import") + " Nhập từ tệp", "tplImportOpen()", "small");
  return `<div class="dz-tools">${add}${upload}</div>`;
}

/* ---------- Form thêm/sửa ---------- */
function tplOptions(values, current) {
  const list = current && !values.includes(current) ? [current, ...values] : values;
  const items = list.map((v) => `<option ${v === current ? "selected" : ""}>${esc(v)}</option>`);
  return `<option value="">-- Chưa phân loại --</option>${items.join("")}`;
}

function tplDayRow(p = { title: "", text: "" }) {
  return [
    `<div class="tpl-day">`,
    `<input name="dayTitle" maxlength="${tplLimits.title}" placeholder="Tiêu đề ngày"`,
    ` value="${esc(p.title)}">`,
    `<button type="button" title="Bỏ ngày" onclick="tplRemoveDay(this)">`,
    `${systemIcon("xmark")}</button>`,
    `<textarea name="dayText" rows="2" maxlength="${tplLimits.text}"`,
    ` placeholder="Mô tả hoạt động">${esc(p.text)}</textarea>`,
    `</div>`,
  ].join("");
}

function tplFormHtml(t, id) {
  const region = t.region || designTemplateRegion(t);
  const rows = tplProgram(t).map((p) => tplDayRow(p)).join("");
  return [
    `<form onsubmit="tplSave(event,'${id}')" class="tpl-form">`,
    `<label>Tên mẫu <i class="req">*</i>`,
    `<input name="name" required maxlength="${tplLimits.name}" value="${esc(t.name)}"></label>`,
    `<div class="formgrid">`,
    `<label>Khu vực<select name="region">${tplOptions(tourRegions, region)}</select></label>`,
    `<label>Quốc gia<select name="country">${tplOptions(crmCountries, t.country)}</select></label>`,
    `<label>Loại tour<select name="type">${tplOptions(tourTypes, t.type)}</select></label>`,
    `</div>`,
    `<div class="tpl-days-head"><b>Lịch trình</b>`,
    `${btn(systemIcon("plus") + " Thêm ngày", "tplAddDay()", "small")}</div>`,
    `<div id="tplDayRows" class="tpl-days">${rows}</div>`,
    `<div class="formfooter">${btn("Hủy", "tplReturn()")}`,
    `<button class="btn primary" type="submit">Lưu</button></div>`,
    `</form>`,
  ].join("");
}

/* Đóng hộp thoại; nếu đang mở từ trình thiết kế tour thì quay lại trình thiết kế. */
function tplReturn() {
  closeModal();
  if (tplBack) designOpenBuilder();
}

function tplForm(id) {
  if (!requireCapability("tour_design_manage")) return;
  const t = id ? tplFind(id) : null;
  if (id && !t) return;
  if (t && !tplCanEdit(t)) return toast("Chỉ người tạo hoặc CEO được sửa mẫu này.");
  const blank = { name: "", country: "", type: "", program: [{ title: "", text: "" }] };
  tplBack = !!document.querySelector(".tour-builder-modal");
  modal(id ? "Sửa tour mẫu" : "Thêm tour mẫu", tplFormHtml(t || blank, id));
}

function tplAddDay() {
  const box = document.getElementById("tplDayRows");
  if (!box) return;
  if (box.children.length >= tplLimits.days) return toast(`Tối đa ${tplLimits.days} ngày.`);
  box.insertAdjacentHTML("beforeend", tplDayRow());
  box.lastElementChild.querySelector("input")?.focus();
}

function tplRemoveDay(button) {
  const box = document.getElementById("tplDayRows");
  if (box && box.children.length <= 1) return toast("Mẫu cần ít nhất một ngày.");
  button.closest(".tpl-day")?.remove();
}

function tplFormDays(form) {
  const titles = form.getAll("dayTitle");
  const texts = form.getAll("dayText");
  const days = [];
  let orphan = false;
  titles.forEach((raw, i) => {
    const title = String(raw).trim();
    const text = String(texts[i] || "").trim();
    if (!title && text) orphan = true;
    if (title) days.push({ title, text });
  });
  return { days, orphan };
}

function tplSave(e, id) {
  e.preventDefault();
  if (!requireCapability("tour_design_manage")) return;
  const form = new FormData(e.target);
  const name = String(form.get("name") || "").trim();
  const { days, orphan } = tplFormDays(form);
  if (!name) return toast("Hãy nhập tên mẫu.");
  if (orphan) return toast("Có ngày đã nhập mô tả nhưng thiếu tiêu đề.");
  if (!days.length) return toast("Mẫu cần ít nhất một ngày có tiêu đề.");
  if (tplNameTaken(name, id)) return toast("Đã có mẫu trùng tên.");
  const fields = {
    name,
    region: String(form.get("region") || ""),
    country: String(form.get("country") || ""),
    type: String(form.get("type") || ""),
    itinerary: days.map((day) => day.title),
    program: days,
    updatedAt: new Date().toISOString(),
  };
  const t = id ? tplFind(id) : null;
  if (id && (!t || !tplCanEdit(t))) return toast("Chỉ người tạo hoặc CEO được sửa mẫu này.");
  if (t) {
    Object.assign(t, fields);
    audit("template", t.id, "UPDATE", `Sửa mẫu tour ${name}`);
  } else {
    const created = {
      id: nextBusinessId("tourTemplates"),
      owner: actor().name,
      createdAt: fields.updatedAt,
      ...fields,
    };
    tplList().push(created);
    audit("template", created.id, "CREATE", `Thêm mẫu tour ${name}`);
  }
  save();
  toast("Đã lưu tour mẫu.");
  tplReturn();
}

function tplDelete(id) {
  const t = tplFind(id);
  if (!t) return;
  if (!tplCanEdit(t)) return toast("Chỉ người tạo hoặc CEO được xóa mẫu này.");
  if (!confirm(`Xóa mẫu “${t.name}”? Các tour đã dùng mẫu này không bị ảnh hưởng.`)) return;
  state.tourTemplates = tplList().filter((item) => item.id !== id);
  audit("template", id, "DELETE", `Xóa mẫu tour ${t.name}`);
  save();
  designRefresh(["templates"]);
  toast("Đã xóa tour mẫu.");
}

/* ---------- Nhập từ tệp CSV ---------- */
function tplCsvDelimiter(text) {
  const first = text.split(/\r?\n/, 1)[0];
  const counts = [",", ";", "\t"].map((c) => [c, first.split(c).length]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][0];
}

/* Đọc CSV: có ngoặc kép, dấu `""`, xuống dòng trong ô; dấu phân cách `,` `;` hoặc tab. */
function tplParseCsv(text) {
  const delimiter = tplCsvDelimiter(text);
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function tplHeaderKey(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tplColumnMap(header) {
  const keys = header.map(tplHeaderKey);
  const map = {};
  for (const [field, aliases] of Object.entries(tplCsvAliases)) {
    map[field] = keys.findIndex((key) => aliases.includes(key));
  }
  return map;
}

/* Ô xuất ra có thêm dấu ' trước ký tự = + @ - (chống CSV injection); nhập vào thì bỏ dấu đó. */
function tplCell(value) {
  const text = String(value ?? "").trim();
  return /^'[=+@-]/.test(text) ? text.slice(1) : text;
}

function tplMatch(value, values) {
  const key = tplKey(value);
  return values.find((v) => tplKey(v) === key) || "";
}

/* Gom các dòng theo tên mẫu: { dòng đầu, region, country, type, days: [{no, title, text}] }. */
function tplGroupRows(rows, map, report) {
  const groups = new Map();
  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const get = (field) => (map[field] >= 0 ? tplCell(row[map[field]]) : "");
    const name = get("name");
    const title = get("title");
    if (!name) {
      report.warnings.push(`Dòng ${line}: thiếu tên mẫu, đã bỏ qua.`);
      return;
    }
    if (!title) {
      report.warnings.push(`Dòng ${line} (${name}): thiếu tiêu đề ngày, đã bỏ qua.`);
      return;
    }
    const key = tplKey(name);
    if (!groups.has(key)) {
      groups.set(key, { name, line, region: "", country: "", type: "", days: [] });
    }
    const group = groups.get(key);
    group.region ||= get("region");
    group.country ||= get("country");
    group.type ||= get("type");
    group.days.push({ no: Number(get("day")), title, text: get("text"), line });
  });
  return [...groups.values()];
}

/* Nếu mọi ngày đều có số thứ tự hợp lệ thì xếp theo số; ngược lại giữ thứ tự dòng trong tệp. */
function tplOrderDays(days) {
  const numbered = days.every((day) => Number.isInteger(day.no) && day.no > 0);
  if (!numbered) return { days, error: "" };
  const unique = new Set(days.map((day) => day.no));
  if (unique.size !== days.length) return { days, error: "trùng số thứ tự ngày" };
  return { days: [...days].sort((a, b) => a.no - b.no), error: "" };
}

function tplClassify(group, report) {
  const result = {};
  const lists = [
    ["region", "khu vực", tourRegions],
    ["country", "quốc gia", crmCountries],
    ["type", "loại tour", tourTypes],
  ];
  for (const [field, label, values] of lists) {
    const raw = group[field];
    if (!raw) continue;
    const match = values.length ? tplMatch(raw, values) : raw;
    if (!match) {
      report.warnings.push(`${group.name}: ${label} “${raw}” không có trong danh sách, để trống.`);
    }
    result[field] = match;
  }
  return { region: "", country: "", type: "", ...result };
}

function tplDayProblem(days) {
  if (days.length > tplLimits.days) return `quá ${tplLimits.days} ngày`;
  const long = days.find((d) => d.title.length > tplLimits.title || d.text.length > tplLimits.text);
  return long ? `dòng ${long.line} có tiêu đề hoặc mô tả quá dài` : "";
}

/* Lý do bỏ cả mẫu (rỗng = nhập được). */
function tplSkipReason(group, report) {
  if (group.name.length > tplLimits.name) return "tên quá dài";
  const ordered = tplOrderDays(group.days);
  if (ordered.error) return ordered.error;
  const problem = tplDayProblem(ordered.days);
  if (problem) return problem;
  if (tplNameTaken(group.name, "")) return "đã có mẫu trùng tên";
  if (report.items.length >= tplLimits.templates) {
    return `vượt ${tplLimits.templates} mẫu mỗi lần nhập`;
  }
  return "";
}

function tplBuildImport(rows) {
  const report = { items: [], skipped: [], warnings: [], fatal: "" };
  const map = tplColumnMap(rows[0]);
  if (map.name < 0 || map.title < 0) {
    report.fatal = "Thiếu cột “Tên mẫu” hoặc “Tiêu đề ngày”. Hãy dùng tệp CSV mẫu.";
    return report;
  }
  for (const group of tplGroupRows(rows, map, report)) {
    const reason = tplSkipReason(group, report);
    if (reason) {
      report.skipped.push(`${group.name}: ${reason}.`);
      continue;
    }
    const days = tplOrderDays(group.days).days;
    const program = days.map((day) => ({ title: day.title, text: day.text }));
    report.items.push({ name: group.name, ...tplClassify(group, report), program });
  }
  return report;
}

async function tplImportFile(input) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!requireCapability("tour_design_manage")) return;
  if (/\.(xlsx|xls|xlsm)$/i.test(file.name)) {
    return toast("Chưa đọc được Excel. Hãy lưu thành “CSV UTF-8” rồi chọn lại.");
  }
  if (file.size > tplLimits.bytes) return toast("Tệp quá lớn (tối đa 2 MB).");
  let text = "";
  try {
    text = await file.text();
  } catch {
    return toast("Không đọc được tệp.");
  }
  text = text.replace(/^\ufeff/, "");
  if (text.includes("\ufffd")) return toast("Tệp không phải UTF-8. Hãy lưu bằng “CSV UTF-8”.");
  const rows = tplParseCsv(text);
  if (rows.length < 2) return toast("Tệp không có dữ liệu (cần dòng tiêu đề và ít nhất một dòng).");
  tplDraft = tplBuildImport(rows);
  tplImportReport();
}

function tplListHtml(title, items, tone) {
  if (!items.length) return "";
  const shown = items.slice(0, tplLimits.lines).map((text) => `<li>${esc(text)}</li>`);
  const more = items.length - shown.length;
  if (more > 0) shown.push(`<li>… và ${more} mục khác.</li>`);
  return [
    `<div class="tpl-import-block ${tone}">`,
    `<b>${title} (${items.length})</b><ul>${shown.join("")}</ul>`,
    `</div>`,
  ].join("");
}

function tplImportGuide() {
  const lists = [
    `Khu vực: ${tourRegions.join(", ")}.`,
    `Loại tour: ${tourTypes.join(", ")}.`,
    crmCountries.length ? `Quốc gia: ${crmCountries.join(", ")}.` : "",
  ].filter(Boolean);
  return [
    `<p>Mỗi dòng trong tệp là <b>một ngày</b> của một tour mẫu. Các dòng cùng “Tên mẫu” được gộp`,
    ` thành một mẫu.</p>`,
    `<ul class="tpl-import-cols">`,
    `<li><b>Tên mẫu</b> và <b>Tiêu đề ngày</b>: bắt buộc.</li>`,
    `<li><b>Khu vực, Quốc gia, Loại tour</b>: chọn đúng giá trị trong danh sách, sai thì để trống.</li>`,
    `<li><b>Ngày</b>: số thứ tự (tùy chọn). <b>Mô tả ngày</b>: tùy chọn.</li>`,
    `</ul>`,
    `<small class="muted">${lists.map(esc).join(" ")}</small>`,
    `<small class="muted">Lưu từ Excel bằng “CSV UTF-8”. Tối đa 2 MB, ${tplLimits.templates} mẫu,`,
    ` ${tplLimits.days} ngày mỗi mẫu. Mẫu trùng tên với mẫu đang có sẽ bị bỏ qua.</small>`,
  ].join("");
}

function tplImportOpen() {
  if (!requireCapability("tour_design_manage")) return;
  tplBack = !!document.querySelector(".tour-builder-modal");
  const pick = [
    `<label class="btn small primary tpl-file">${systemIcon("file-import")} Chọn tệp CSV`,
    `<input type="file" accept=".csv,.txt,text/csv" onchange="tplImportFile(this)"></label>`,
  ].join("");
  const tools = [
    pick,
    btn("Tải CSV mẫu", "tplDownloadSample()", "small"),
    btn("Xuất mẫu hiện có", "tplExportAll()", "small"),
  ].join("");
  const footer = `<div class="formfooter">${btn("Đóng", "tplReturn()")}</div>`;
  const html = [
    `<div class="tpl-import">${tplImportGuide()}`,
    `<div class="dz-tools">${tools}</div>${footer}</div>`,
  ].join("");
  modal("Nhập tour mẫu từ tệp CSV", html);
}

function tplImportReport() {
  const report = tplDraft;
  const count = report.items.length;
  const days = report.items.reduce((n, item) => n + item.program.length, 0);
  const lines = report.items.map((item) => {
    const meta = [item.region, item.country, item.type].filter(Boolean).join(" · ");
    return `${item.name} — ${item.program.length} ngày${meta ? ` · ${meta}` : ""}`;
  });
  const head = report.fatal
    ? `<p class="tpl-import-error">${esc(report.fatal)}</p>`
    : `<p>Sẽ thêm <b>${count}</b> tour mẫu (${days} ngày).</p>`;
  const confirmBtn = count ? btn(`Nhập ${count} mẫu`, "tplImportConfirm()", "primary") : "";
  const footer = [
    `<div class="formfooter">${btn("Chọn tệp khác", "tplImportOpen()")}`,
    `${confirmBtn}</div>`,
  ].join("");
  const body = [
    head,
    tplListHtml("Sẽ thêm", lines, "is-ok"),
    tplListHtml("Bỏ qua cả mẫu", report.skipped, "is-bad"),
    tplListHtml("Lưu ý", report.warnings, "is-warn"),
    footer,
  ].join("");
  modal("Xem lại trước khi nhập", `<div class="tpl-import">${body}</div>`);
}

function tplImportConfirm() {
  if (!requireCapability("tour_design_manage")) return;
  const report = tplDraft;
  if (!report?.items.length) return;
  const now = new Date().toISOString();
  let added = 0;
  for (const item of report.items) {
    if (tplNameTaken(item.name, "")) continue;
    tplList().push({
      id: nextBusinessId("tourTemplates"),
      name: item.name,
      region: item.region,
      country: item.country,
      type: item.type,
      itinerary: item.program.map((day) => day.title),
      program: item.program,
      owner: actor().name,
      createdAt: now,
      updatedAt: now,
    });
    added += 1;
  }
  tplDraft = null;
  if (!added) return toast("Không có mẫu mới để nhập (tên đã tồn tại).");
  audit("template", "-", "CREATE", `Nhập ${added} mẫu tour từ tệp CSV`);
  save();
  toast(`Đã nhập ${added} tour mẫu.`);
  tplReturn();
}

/* ---------- Tải tệp CSV ---------- */
function tplCsvText(rows) {
  const cell = (x) => `"${String(x ?? "").replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
  const lines = rows.map((row) => row.map(cell).join(","));
  return `\ufeff${lines.join("\r\n")}`;
}

function tplDownloadSample() {
  const name = "Tên tour mẫu (xóa dòng ví dụ này)";
  const rows = [
    tplCsvHeaders,
    [name, tourRegions[0], "", tourTypes[0], 1, "Tiêu đề ngày 1", "Mô tả hoạt động ngày 1"],
    [name, "", "", "", 2, "Tiêu đề ngày 2", "Mô tả hoạt động ngày 2"],
  ];
  downloadFile("TypicOne ERP_tour_mau_CSV_mau.csv", tplCsvText(rows), "text/csv;charset=utf-8");
}

function tplExportAll() {
  const rows = [tplCsvHeaders];
  for (const t of tplList()) {
    const region = designTemplateRegion(t);
    tplProgram(t).forEach((p, i) => {
      rows.push([t.name, region, t.country || "", t.type || "", i + 1, p.title, p.text]);
    });
  }
  if (rows.length === 1) return toast("Chưa có tour mẫu để xuất.");
  downloadFile("TypicOne ERP_tour_mau.csv", tplCsvText(rows), "text/csv;charset=utf-8");
  toast("Đã xuất CSV.");
}
