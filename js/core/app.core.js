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

const uiTranslations = {
  "Tour Operator Management System": "Hệ thống quản lý điều hành tour",
  "Your Next Journey, Well Managed": "Hành trình tiếp theo, được quản lý trọn vẹn",
  "Live Tour Operations": "Điều hành tour trực tiếp",
  "TypicOne ERP Workspace": "Không gian làm việc TypicOne ERP",
  "CRM Sales Workspace": "Không gian CRM và kinh doanh",
  "Website Lead Automation": "Tự động hóa khách hàng tiềm năng từ website",
  "Customer Service Cases": "Hồ sơ chăm sóc khách hàng",
  "Customer Service": "Chăm sóc khách hàng",
  "Dashboard Sales": "Tổng quan kinh doanh",
  "Sales Dashboard": "Tổng quan kinh doanh",
  "Sales & Marketing KPI": "KPI kinh doanh và tiếp thị",
  "Operations & Accounting KPI": "KPI điều hành và kế toán",
  "Operations Dashboard": "Tổng quan điều hành",
  "AI Automation": "Tự động hóa AI",
  "Vehicle Management": "Quản lý xe",
  "Vehicle Company & Fleet": "Đơn vị vận chuyển và đội xe",
  "Vehicle Bookings": "Phân xe cho đặt chỗ",
  "Supplier master": "Danh mục nhà cung cấp",
  "Supplier Score": "Điểm nhà cung cấp",
  "Supplier Issues": "Sự cố nhà cung cấp",
  "Guide Issues": "Sự cố hướng dẫn viên",
  "Payment Received": "Đã nhận thanh toán",
  "Supplier Invoice": "Hóa đơn nhà cung cấp",
  "Due date": "Ngày đến hạn",
  "Sales Owner": "Nhân viên kinh doanh",
  "Follow-up": "Chăm sóc tiếp theo",
  "Welcome Email": "Email chào mừng",
  "Task Follow-up": "Công việc chăm sóc tiếp theo",
  "Auto Create Lead": "Tự động tạo khách hàng tiềm năng",
  "Assign Sales": "Phân công nhân viên kinh doanh",
  "Email Welcome": "Gửi email chào mừng",
  "Lead Website": "Khách hàng tiềm năng từ website",
  "Feedback Form": "Phiếu phản hồi",
  "Review & Referral": "Đánh giá và giới thiệu",
  "Cost & Profit": "Chi phí và lợi nhuận",
  "Cash Flow": "Dòng tiền",
  "Pending Services": "Dịch vụ chờ xác nhận",
  "Tours Running": "Tour đang chạy",
  "Campaign Leads": "Khách hàng tiềm năng từ chiến dịch",
  "Template Database": "Mẫu từ database",
  "Draft Program": "Chương trình nháp",
  "Email quotation": "Email báo giá",
  "Database Online": "CSDL trực tuyến",
  "Customer ID": "Mã khách hàng",
  "Company / Contact": "Công ty / Người liên hệ",
  "Rooming List": "Danh sách phân phòng",
  "Base amount": "Giá trị tính thuế",
  "VAT rate": "Thuế suất VAT",
  "Please find our proposed itinerary and quotation for": "Xin gửi quý khách chương trình và báo giá đề xuất cho",
  "Guide Portal": "Cổng thông tin hướng dẫn viên",
  "Recovery Plan": "Phương án xử lý",
  "Feedback & CSAT": "Phản hồi và CSAT",
  "After-tour Cases": "Hồ sơ sau tour",
  "Final Payment": "Thanh toán quyết toán",
  "Luxury Vietnam Escape": "Hành trình nghỉ dưỡng Việt Nam cao cấp",
  "Family Vietnam Discovery": "Khám phá Việt Nam dành cho gia đình",
  "Hanoi & Ha Long Highlights": "Điểm nhấn Hà Nội và Hạ Long",
  "CRM & Sales": "CRM và Kinh doanh",
  "Marketing & KPI": "Tiếp thị và KPI",
  Bookings: "Đặt chỗ", Booking: "Đặt chỗ", Quotation: "Báo giá", Quotations: "Báo giá",
  Invoice: "Hóa đơn", Deposit: "Đặt cọc", Final: "Quyết toán", Amount: "Số tiền",
  Revenue: "Doanh thu", Cost: "Chi phí", Profit: "Lợi nhuận", Margin: "Biên lợi nhuận",
  Receivable: "Phải thu", Payable: "Phải trả", Traffic: "Lượt truy cập",
  Campaigns: "Chiến dịch", Campaign: "Chiến dịch", Customers: "Khách hàng",
  Customer: "Khách hàng", Client: "Khách hàng", Country: "Quốc gia", Source: "Nguồn",
  Status: "Trạng thái", Type: "Loại", Owner: "Người phụ trách", Guide: "Hướng dẫn viên",
  Supplier: "Nhà cung cấp", Vehicle: "Xe", Capacity: "Sức chứa", Confirm: "Xác nhận",
  Confirmed: "Đã xác nhận", Assigned: "Đã phân công", Pending: "Đang chờ",
  Preparing: "Đang chuẩn bị", Running: "Đang chạy", Completed: "Hoàn tất",
  Cancelled: "Đã hủy", Draft: "Bản nháp", Sent: "Đã gửi", Accepted: "Đã chấp nhận",
  Paid: "Đã thanh toán", Overdue: "Quá hạn", Open: "Đang mở", Resolved: "Đã xử lý",
  Received: "Đã nhận", Active: "Đang hoạt động", Inactive: "Ngừng hoạt động",
  New: "Mới", Contacted: "Đã liên hệ", Qualified: "Đủ điều kiện",
  "Quote Sent": "Đã gửi báo giá", Negotiation: "Đang thương lượng", Won: "Thành công",
  Lost: "Thất bại", "Not Sent": "Chưa gửi", Done: "Hoàn thành", Responded: "Đã phản hồi",
  Recovery: "Xử lý phục hồi", Review: "Đánh giá", Referral: "Giới thiệu", Closed: "Đã đóng",
  High: "Cao", Medium: "Trung bình", Low: "Thấp", Intake: "Tiếp nhận",
  Validate: "Kiểm tra", Routing: "Phân công", Engage: "Tương tác", Action: "Hành động",
  Workspace: "Không gian làm việc", Sales: "Kinh doanh", Marketing: "Tiếp thị",
  Operations: "Điều hành", Finance: "Tài chính", Automation: "Tự động hóa",
  Pipeline: "Quy trình", Leads: "Khách hàng tiềm năng", Lead: "Khách hàng tiềm năng",
  Pax: "Số khách", Budget: "Ngân sách", Currency: "Tiền tệ", Version: "Phiên bản",
  Subject: "Tiêu đề", Dear: "Kính gửi", "Best regards": "Trân trọng",
  Website: "Trang web", Vietnam: "Việt Nam", Cambodia: "Campuchia", Thailand: "Thái Lan",
  France: "Pháp", Germany: "Đức", English: "Tiếng Anh", French: "Tiếng Pháp",
  Dashboard: "Tổng quan", Profile: "Hồ sơ", Company: "Công ty", Contact: "Liên hệ",
  Arrival: "Ngày đến", Departure: "Ngày đi", Services: "Dịch vụ", Service: "Dịch vụ",
  Hotel: "Khách sạn", Restaurant: "Nhà hàng", Transport: "Vận chuyển", Cruise: "Du thuyền",
  Insurance: "Bảo hiểm", Contract: "Hợp đồng", Passport: "Hộ chiếu", File: "Tệp",
  Voucher: "Phiếu dịch vụ", Feedback: "Phản hồi",
  Template: "Mẫu", Channel: "Kênh", Reminder: "Nhắc lại", Overall: "Tổng thể",
  Itinerary: "Hành trình", Support: "Hỗ trợ", Comment: "Nhận xét", Consent: "Đồng ý",
  Priority: "Ưu tiên", Description: "Mô tả", Quality: "Chất lượng", Price: "Giá",
  Response: "Phản hồi", Complaint: "Khiếu nại", Input: "Đầu vào", Output: "Đầu ra",
  Phase: "Giai đoạn", Stack: "Công nghệ", Mobile: "Di động", Guest: "Khách",
  Reference: "Tham chiếu", Time: "Thời gian", Subject: "Tiêu đề",
  Language: "Ngôn ngữ", Area: "Khu vực", Rating: "Đánh giá", Task: "Công việc",
  Issue: "Sự cố", Assignment: "Phân công", Start: "Bắt đầu", End: "Kết thúc",
  Document: "Tài liệu", Content: "Nội dung", Base: "Giá trị gốc", Rate: "Tỷ lệ",
  Form: "Biểu mẫu", Journey: "Hành trình", Workflow: "Quy trình", Cases: "Hồ sơ",
  Case: "Hồ sơ", After: "Sau",
  Role: "Vai trò", Module: "Phân hệ", Demo: "Bản trình diễn", Database: "Cơ sở dữ liệu",
  Backend: "Máy chủ", Frontend: "Giao diện", Production: "Thực tế", Storage: "Kho lưu trữ",
  Approve: "Phê duyệt", Approval: "Phê duyệt", Pay: "Thanh toán", Checklist: "Danh sách kiểm tra",
  Name: "Tên", Date: "Ngày", Phone: "Điện thoại", Notes: "Ghi chú", Note: "Ghi chú",
  NOT_SENT: "CHƯA GỬI", PENDING: "ĐANG CHỜ", SENT: "ĐÃ GỬI", RESPONDED: "ĐÃ PHẢN HỒI",
  RECOVERY: "CẦN XỬ LÝ", REVIEW: "ĐÁNH GIÁ", REFERRAL: "GIỚI THIỆU", CLOSED: "ĐÃ ĐÓNG",
  NEW: "MỚI", CONTACTED: "ĐÃ LIÊN HỆ", QUALIFIED: "ĐỦ ĐIỀU KIỆN",
  NEGOTIATION: "ĐANG THƯƠNG LƯỢNG", WON: "THÀNH CÔNG", LOST: "THẤT BẠI",
  DONE: "HOÀN THÀNH", OPEN: "ĐANG MỞ", HIGH: "CAO", MEDIUM: "TRUNG BÌNH", LOW: "THẤP",
};

const uiTranslationEntries = Object.entries(uiTranslations).sort(
  (a, b) => b[0].length - a[0].length,
);

function translateVisibleText(value) {
  let output = String(value ?? "");
  for (const [english, vietnamese] of uiTranslationEntries) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replace(new RegExp("\\b" + escaped + "\\b", "gi"), (match) =>
      match === match.toUpperCase() ? vietnamese.toUpperCase() : vietnamese,
    );
  }
  return output;
}

function localizeUI(root = document.body) {
  if (!root) return;
  const translateElement = (element) => {
    for (const attribute of ["placeholder", "aria-label", "title"])
      if (element.hasAttribute?.(attribute))
        element.setAttribute(attribute, translateVisibleText(element.getAttribute(attribute)));
  };
  if (root.nodeType === Node.TEXT_NODE) {
    if (!root.parentElement?.matches("script,style")) root.nodeValue = translateVisibleText(root.nodeValue);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.matches("script,style")) node.nodeValue = translateVisibleText(node.nodeValue);
    } else translateElement(node);
  }
}

function startUILocalization() {
  localizeUI(document.body);
  new MutationObserver((mutations) => {
    for (const mutation of mutations)
      for (const node of mutation.addedNodes) {
        localizeUI(node);
        if (node.nodeType === Node.ELEMENT_NODE) paginateTables(node);
      }
  }).observe(document.body, { childList: true, subtree: true });
}

const tablePageSize = 12;

function paginateTables(root = document) {
  const wrappers = [];
  if (root.matches?.(".tablewrap")) wrappers.push(root);
  root.querySelectorAll?.(".tablewrap").forEach((wrapper) => wrappers.push(wrapper));
  wrappers.forEach(setupTablePagination);
}

function setupTablePagination(wrapper) {
  if (
    wrapper.dataset.paginated ||
    wrapper.closest("#supplierlist") ||
    wrapper.nextElementSibling?.classList.contains("pagination")
  )
    return;
  const rows = wrapper.querySelectorAll("tbody > tr");
  if (rows.length <= tablePageSize) return;
  wrapper.dataset.paginated = "true";
  wrapper.dataset.page = "1";
  const controls = document.createElement("div");
  controls.className = "pagination auto-pagination";
  controls.innerHTML = '<span class="pagination-summary"></span><div class="actions"><button class="btn small pagination-prev" type="button">← Trước</button><button class="btn small pagination-next" type="button">Tiếp →</button></div>';
  wrapper.insertAdjacentElement("afterend", controls);
  controls.querySelector(".pagination-prev").addEventListener("click", () => changeTablePage(wrapper, -1));
  controls.querySelector(".pagination-next").addEventListener("click", () => changeTablePage(wrapper, 1));
  updateTablePagination(wrapper);
}

function changeTablePage(wrapper, delta) {
  wrapper.dataset.page = String(Math.max(1, Number(wrapper.dataset.page || 1) + delta));
  updateTablePagination(wrapper);
  wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateTablePagination(wrapper, reset = false) {
  if (!wrapper?.dataset.paginated) return;
  const rows = [...wrapper.querySelectorAll("tbody > tr")];
  const available = rows.filter((row) => row.dataset.filteredOut !== "true");
  const pages = Math.max(1, Math.ceil(available.length / tablePageSize));
  let page = reset ? 1 : Number(wrapper.dataset.page || 1);
  page = Math.min(Math.max(1, page), pages);
  wrapper.dataset.page = String(page);
  rows.forEach((row) => (row.hidden = true));
  available.slice((page - 1) * tablePageSize, page * tablePageSize).forEach((row) => (row.hidden = false));
  const controls = wrapper.nextElementSibling;
  if (!controls?.classList.contains("auto-pagination")) return;
  controls.hidden = available.length <= tablePageSize;
  controls.querySelector(".pagination-summary").textContent = `${available.length} kết quả · Trang ${page}/${pages}`;
  controls.querySelector(".pagination-prev").disabled = page === 1;
  controls.querySelector(".pagination-next").disabled = page === pages;
}

const pages = [
  ["dashboard", "◈", "Tổng quan CEO"],
  ["crm", "◉", "CRM và Kinh doanh"],
  ["design", "⌁", "Thiết kế tour"],
  ["quotes", "▤", "Báo giá"],
  ["bookings", "▣", "Đặt chỗ"],
  ["operations", "◎", "Trung tâm điều hành"],
  ["suppliers", "◇", "Nhà cung cấp"],
  ["guides", "♧", "Hướng dẫn viên"],
  ["vehicles", "▰", "Xe & vận chuyển"],
  ["accounting", "≋", "Kế toán & công nợ"],
  ["marketing", "↗", "Tiếp thị và KPI"],
  ["documents", "▧", "Kho tài liệu"],
  ["care", "♡", "Chăm sóc khách hàng"],
  ["guideapp", "▯", "Ứng dụng HDV"],
  ["help", "?", "Hướng dẫn dự án"],
];

const navGroups = [
  ["TỔNG QUAN", ["dashboard"]],
  ["KHÁCH HÀNG & KINH DOANH", ["crm", "customers", "sales", "design", "quotes", "bookings"]],
  ["ĐIỀU HÀNH TOUR", ["operations", "suppliers", "guides", "vehicles"]],
  ["TÀI CHÍNH & TÀI LIỆU", ["accounting", "documents"]],
  ["TIẾP THỊ & CHĂM SÓC", ["marketing", "care"]],
  ["CÔNG CỤ & HỖ TRỢ", ["ai", "guideapp", "help"]],
];
const openNavGroups = new Set();
let navGroupsInitialized = false;

function toggleNavGroup(index) {
  if (openNavGroups.has(index)) openNavGroups.delete(index);
  else openNavGroups.add(index);
  renderNavigation();
}

function toggleMobileNav(force) {
  const open =
    typeof force === "boolean" ? force : !document.body.classList.contains("navopen");
  document.body.classList.toggle("navopen", open);
  document.querySelector(".mobile-nav-toggle")?.setAttribute("aria-expanded", String(open));
}

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
  const groupIndex = navGroups.findIndex(([, ids]) => ids.includes(p));
  if (groupIndex >= 0) openNavGroups.add(groupIndex);
  toggleMobileNav(false);
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
  return "KHÔNG GIAN LÀM VIỆC TYPICONE ERP";
}

function title(t, p, action = "") {
  return (
    '<div class="pagetop"><div><div class="eyebrow">TYPICONE ERP / ' +
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
  return '<span class="badge ' + c + '">' + esc(translateVisibleText(t)) + "</span>";
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

function renderNavigation() {
  const allowedPages = pages.filter((page) => rights[role].includes(page[0]));
  if (!navGroupsInitialized) {
    const activeGroup = navGroups.findIndex(([, ids]) => ids.includes(current));
    if (activeGroup >= 0) openNavGroups.add(activeGroup);
    navGroupsInitialized = true;
  }
  document.getElementById("nav").innerHTML = navGroups
    .map(([label, ids], index) => {
      const items = allowedPages.filter((page) => ids.includes(page[0]));
      if (!items.length) return "";
      const expanded = openNavGroups.has(index);
      return (
        '<section class="navgroup"><button type="button" class="navgroup-title" onclick="toggleNavGroup(' +
        index +
        ')" aria-expanded="' +
        expanded +
        '"><span>' +
        label +
        '</span><i aria-hidden="true">⌄</i></button><div class="navgroup-items"' +
        (expanded ? "" : " hidden") +
        ">" +
        items
          .map(
            (page) =>
              '<button class="' +
              (current === page[0] ? "active" : "") +
              '" onclick="go(\'' +
              page[0] +
              "')\"><span>" +
              page[1] +
              "</span>" +
              page[2] +
              "</button>",
          )
          .join("") +
        "</div></section>"
      );
    })
    .join("");
}

function render() {
  renderNavigation();
  document.getElementById("crumb").textContent = pages.find(
    (p) => p[0] === current,
  )[2];
  document.getElementById("crumbSection").textContent = workspaceSection(current);
  const app = document.getElementById("app");
  app.dataset.page = current;
  app.innerHTML = views[current]();
  paginateTables(app);
  renderNotificationBadge();
}

const views = {};

function appNotifications() {
  if (typeof state === "undefined") return [];
  const today = new Date().toLocaleDateString("en-CA");
  const items = [];
  (state.leads || []).forEach((lead) => {
    const task = typeof lead.followup === "object"
      ? lead.followup
      : { dueDate: lead.followup, status: "PENDING" };
    if (task?.status === "PENDING" && task.dueDate && task.dueDate <= today)
      items.push({ icon: "◎", title: `Follow-up ${lead.name}`, meta: task.dueDate < today ? `Quá hạn từ ${fmt(task.dueDate)}` : "Đến hạn hôm nay", page: "crm" });
  });
  (state.bookings || []).forEach((booking) => {
    const pending = (booking.services || []).filter((service) => service.needed && !service.confirmed).length;
    if (pending) items.push({ icon: "▣", title: `${booking.id} còn ${pending} dịch vụ`, meta: booking.tour, page: "operations" });
    const debt = Math.max(0, (booking.revenue || 0) - (booking.received || 0));
    if (debt) items.push({ icon: "₫", title: `${booking.id} còn phải thu`, meta: money(debt), page: "accounting" });
  });
  (state.customerServiceCases || []).forEach((item) => {
    if (item.status === "RECOVERY" || (item.dueDate && item.dueDate < today && item.status !== "CLOSED"))
      items.push({ icon: "♡", title: `${item.id} cần chăm sóc`, meta: `${item.customer} · Hạn ${fmt(item.dueDate)}`, page: "care" });
  });
  return items.filter((item) => rights[role]?.includes(item.page)).slice(0, 30);
}

function renderNotificationBadge() {
  const badgeElement = document.getElementById("notificationBadge");
  if (!badgeElement) return;
  const count = appNotifications().length;
  badgeElement.textContent = count > 99 ? "99+" : String(count);
  badgeElement.hidden = count === 0;
  badgeElement.closest("button")?.setAttribute("aria-label", count ? `Mở ${count} thông báo` : "Mở thông báo");
}

function openNotificationPage(page) {
  closeModal();
  go(page);
}

function openNotifications() {
  const items = appNotifications();
  modal(
    `Thông báo${items.length ? ` · ${items.length}` : ""}`,
    items.length
      ? `<div class="notification-list">${items.map((item) => `<button class="notification-item" type="button" onclick="openNotificationPage('${item.page}')"><span>${item.icon}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small></span><i>›</i></button>`).join("")}</div>`
      : '<div class="empty">Không có công việc nào cần xử lý lúc này.</div>',
    true,
  );
}

let modalReturnFocus = null;

function handleModalKeydown(event) {
  if (event.key === "Escape" && document.querySelector(".modalback")) closeModal();
}

function modal(t, body, narrow = false) {
  if (!document.querySelector(".modalback")) modalReturnFocus = document.activeElement;
  document.getElementById("overlay").innerHTML =
    '<div class="modalback" onclick="if(event.target===this)closeModal()"><section class="modal ' +
    (narrow ? "narrow" : "") +
    '" role="dialog" aria-modal="true" aria-label="' +
    esc(t) +
    '"><div class="modalhead"><div><div class="eyebrow">KHÔNG GIAN LÀM VIỆC TYPICONE ERP</div><h2>' +
    t +
    '</h2></div><button class="close" onclick="closeModal()" aria-label="Đóng">×</button></div>' +
    body +
    "</section></div>";
  document.body.style.overflow = "hidden";
  paginateTables(document.getElementById("overlay"));
  document.addEventListener("keydown", handleModalKeydown);
  setTimeout(
    () => document.querySelector(".modal input,.modal button")?.focus(),
    0,
  );
}

function closeModal() {
  document.getElementById("overlay").innerHTML = "";
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleModalKeydown);
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
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
    "TypicOne ERP_Database_Backup.json",
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
    "TypicOne ERP_" + kind + ".csv",
    "\ufeff" +
      [hs, ...rs]
        .map((row) => row.map((value) => cell(translateVisibleText(value))).join(","))
        .join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất CSV.");
}

function printable(t, body) {
  t = translateVisibleText(t);
  body = translateVisibleText(body);
  let w = window.open("", "_blank");
  if (!w) return toast("Cho phép cửa sổ pop-up để in / lưu PDF.");
  w.document.write(
    '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' +
      esc(t) +
      '</title><style>body{font:14px/1.7 system-ui;color:#193b31;max-width:850px;margin:40px auto;padding:0 24px}h1{font-size:28px}h2{font-size:18px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}small{color:#718275}.top{border-bottom:2px solid #193b31;padding-bottom:18px}.note{margin-top:30px;font-size:11px;color:#68776e}button{background:#226d53;color:white;border:0;padding:10px 18px;border-radius:6px}@media print{button{display:none}body{margin:0;max-width:none}}</style></head><body><div class="top"><small>TYPICONE ERP / ERP V1 DEMO</small><h1>' +
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
  ["sales", "↗", "Tổng quan kinh doanh"],
);

pages.splice(pages.length - 1, 0, ["ai", "⌁", "Tự động hóa AI"]);
