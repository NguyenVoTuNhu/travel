/* CORE — router, phân quyền giao diện, UI dùng chung, định dạng, modal và xuất file. */

const money = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫",
  short = (n) =>
    n >= 1e9
      ? (n / 1e9).toFixed(2) + " tỷ"
      : n >= 1e6
        ? (n / 1e6).toFixed(1) + " tr"
        : money(n),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  fmt = (d) => (d ? d.split("-").reverse().join("/") : "—");

const pages = [
  ["dashboard", "◈", "Tổng quan CEO"],
  ["crm", "◉", "CRM & Sales"],
  ["design", "⌁", "Thiết kế tour"],
  ["quotes", "▤", "Báo giá"],
  ["bookings", "▣", "Bookings"],
  ["operations", "◎", "Trung tâm điều hành"],
  ["suppliers", "◇", "Nhà cung cấp"],
  ["guides", "♧", "Hướng dẫn viên"],
  ["vehicles", "▰", "Xe & vận chuyển"],
  ["accounting", "≋", "Kế toán & công nợ"],
  ["marketing", "↗", "Marketing & KPI"],
  ["documents", "▧", "Kho tài liệu"],
  ["care", "♡", "Chăm sóc khách hàng"],
  ["guideapp", "▯", "Ứng dụng HDV"],
  ["help", "?", "Hướng dẫn dự án"],
];

let rights = {};
let rolelabels = {};
let roleCapabilities = {};

function applyRoleConfiguration(roles) {
  rights = Object.fromEntries(roles.map((item) => [item.id, item.menus || []]));
  rolelabels = Object.fromEntries(roles.map((item) => [item.id, item.label]));
  roleCapabilities = Object.fromEntries(
    roles.map((item) => [item.id, item.capabilities || []]),
  );
}

function can(capability) {
  const capabilities = roleCapabilities[role] || [];
  return capabilities.includes("all") || capabilities.includes(capability);
}

let current = "dashboard",
  role = "",
  supPage = 1,
  supSearch = "",
  supType = "",
  supSort = "score",
  bookingFilter = "all",
  crmSearch = "",
  docFilter = "all",
  careFilter = "all";

function toast(t) {
  document.getElementById("toast").innerHTML =
    '<div class="toast">' + esc(t) + "</div>";
  setTimeout(() => (document.getElementById("toast").innerHTML = ""), 4000);
}

function go(p) {
  if (!rights[role].includes(p)) {
    toast(
      "Vai trò này không có màn hình " +
        (pages.find((x) => x[0] === p)?.[2] || p),
    );
    return;
  }
  current = p;
  document.body.classList.remove("navopen");
  render();
  window.scrollTo(0, 0);
}

function workspaceSection(page) {
  if (["crm", "design", "quotes", "bookings"].includes(page))
    return "KHÁCH HÀNG & KINH DOANH";
  if (["operations", "suppliers", "guides", "vehicles"].includes(page))
    return "ĐIỀU HÀNH TOUR";
  if (["accounting", "documents"].includes(page)) return "TÀI CHÍNH & TÀI LIỆU";
  if (["marketing", "care"].includes(page)) return "MARKETING & CHĂM SÓC";
  return "TYPIC TRAVEL WORKSPACE";
}

function title(t, p, action = "") {
  return (
    '<div class="pagetop"><div><div class="eyebrow">TYPIC TRAVEL / ' +
    (pages.find((x) => x[0] === current)?.[2] || "") +
    "</div><h1>" +
    t +
    "</h1><p>" +
    p +
    '</p></div><div class="actions">' +
    action +
    "</div></div>"
  );
}

function btn(t, fn, cls = "") {
  return (
    '<button class="btn ' + cls + '" onclick="' + fn + '">' + t + "</button>"
  );
}

function badge(t, c = "") {
  return '<span class="badge ' + c + '">' + esc(t) + "</span>";
}

function stat(label, value, meta) {
  return (
    '<div class="stat"><small>' +
    label +
    "</small><strong>" +
    value +
    '</strong><div class="meta">' +
    meta +
    "</div></div>"
  );
}

function card(t, body, extra = "") {
  return (
    '<section class="card"><div class="cardhead"><h3>' +
    t +
    "</h3>" +
    extra +
    "</div>" +
    body +
    "</section>"
  );
}

function table(headers, rows) {
  return (
    '<div class="tablewrap"><table><thead><tr>' +
    headers.map((h) => "<th>" + h + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

function render() {
  document.getElementById("nav").innerHTML = pages
    .filter((p) => rights[role].includes(p[0]))
    .map(
      (p) =>
        '<button class="' +
        (current === p[0] ? "active" : "") +
        '" onclick="go(\'' +
        p[0] +
        "')\"><span>" +
        p[1] +
        "</span>" +
        p[2] +
        "</button>",
    )
    .join("");
  document.getElementById("crumb").textContent = pages.find(
    (p) => p[0] === current,
  )[2];
  document.getElementById("crumbSection").textContent = workspaceSection(current);
  document.getElementById("app").innerHTML = views[current]();
}

const views = {};

function modal(t, body, narrow = false) {
  document.getElementById("overlay").innerHTML =
    '<div class="modalback" onclick="if(event.target===this)closeModal()"><section class="modal ' +
    (narrow ? "narrow" : "") +
    '" role="dialog" aria-modal="true" aria-label="' +
    esc(t) +
    '"><div class="modalhead"><div><div class="eyebrow">TYPIC TRAVEL WORKSPACE</div><h2>' +
    t +
    '</h2></div><button class="close" onclick="closeModal()" aria-label="Đóng">×</button></div>' +
    body +
    "</section></div>";
  document.body.style.overflow = "hidden";
  setTimeout(
    () => document.querySelector(".modal input,.modal button")?.focus(),
    0,
  );
}

function closeModal() {
  document.getElementById("overlay").innerHTML = "";
  document.body.style.overflow = "";
}

function line(l, v) {
  return '<div class="metricline"><span>' + l + "</span><b>" + v + "</b></div>";
}

function createQuote() {
  if (!draft) return;
  draft.program = draft.program.map((p, i) =>
    document.getElementById("day" + i).value.trim(),
  );
  if (draft.program.some((p) => !p)) {
    toast("Hãy nhập nội dung cho tất cả ngày.");
    return;
  }
  let l = state.leads.find((l) => l.id === draft.lead),
    id = "QT-" + String(state.quotes.length + 1).padStart(3, "0");
  state.quotes.push({
    ...draft,
    id,
    client: l.name,
    version: 1,
    status: "Draft",
  });
  l.status = "QUOTE SENT";
  log("Tạo " + id + " cho " + l.name);
  go("quotes");
  toast("Đã tạo báo giá nháp " + id + ".");
}

function addDays(s, n) {
  let d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function downloadFile(name, text, type) {
  let a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadBackup() {
  downloadFile(
    "Typic Travel_Database_Backup.json",
    JSON.stringify(state, null, 2),
    "application/json",
  );
  toast("Đã xuất bản sao dữ liệu đang nạp từ database.");
}

function exportData(kind) {
  let hs, rs;
  if (kind === "leads") {
    hs = [
      "Lead ID",
      "Name",
      "Country",
      "Source",
      "Pax",
      "Budget VND",
      "Status",
      "Sales",
      "Follow-up",
    ];
    rs = state.leads.map((l) => [
      l.id,
      l.name,
      l.country,
      l.source,
      l.pax,
      l.budget,
      l.status,
      l.sales,
      l.followup,
    ]);
  } else if (kind === "bookings") {
    hs = [
      "Booking ID",
      "Client",
      "Tour",
      "Arrival",
      "Departure",
      "Pax",
      "Revenue VND",
      "Cost VND",
      "Received VND",
      "Status",
    ];
    rs = state.bookings.map((b) => [
      b.id,
      b.client,
      b.tour,
      b.start,
      b.end,
      b.pax,
      b.revenue,
      b.cost,
      b.received,
      b.status,
    ]);
  } else {
    hs = ["Type", "Reference", "Amount VND", "Time"];
    rs = state.transactions.map((t) => [t.type, t.ref, t.amount, t.time]);
  }
  let cell = (x) =>
    '"' +
    String(x)
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  downloadFile(
    "Typic Travel_" + kind + ".csv",
    "\ufeff" + [hs, ...rs].map((r) => r.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất CSV.");
}

function printable(t, body) {
  let w = window.open("", "_blank");
  if (!w) return toast("Cho phép cửa sổ pop-up để in / lưu PDF.");
  w.document.write(
    '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' +
      esc(t) +
      '</title><style>body{font:14px/1.7 system-ui;color:#193b31;max-width:850px;margin:40px auto;padding:0 24px}h1{font-size:28px}h2{font-size:18px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}small{color:#718275}.top{border-bottom:2px solid #193b31;padding-bottom:18px}.note{margin-top:30px;font-size:11px;color:#68776e}button{background:#226d53;color:white;border:0;padding:10px 18px;border-radius:6px}@media print{button{display:none}body{margin:0;max-width:none}}</style></head><body><div class="top"><small>TYPIC TRAVEL / ERP V1 DEMO</small><h1>' +
      esc(t) +
      "</h1></div>" +
      body +
      '<p class="note">Tài liệu minh họa · Dữ liệu mẫu · Không phải hợp đồng hoặc chứng từ thực tế.</p><button onclick="window.print()">In / Lưu PDF</button></body></html>',
  );
  w.document.close();
}

function field(n, type = "text", value = "", required = false) {
  return (
    '<input name="' +
    n +
    '" type="' +
    type +
    '" value="' +
    esc(value) +
    '" ' +
    (required ? "required" : "") +
    ">"
  );
}

pages.splice(
  2,
  0,
  ["customers", "◌", "Khách hàng"],
  ["sales", "↗", "Dashboard Sales"],
);

pages.splice(pages.length - 1, 0, ["ai", "⌁", "AI Automation"]);
