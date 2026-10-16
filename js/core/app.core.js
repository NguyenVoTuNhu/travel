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

const tablePageSize = 10;

function paginationWindow(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  if (page <= 2) return [1, 2, page === 2 ? 3 : null, "…", pages].filter(Boolean);
  if (page >= pages - 1)
    return [1, "…", page === pages - 1 ? pages - 2 : null, pages - 1, pages].filter(Boolean);
  return [1, "…", page, "…", pages];
}

function paginationLabel(wrapper) {
  const labels = {
    quotes: "báo giá", customers: "khách hàng", bookings: "đặt tour",
    suppliers: "nhà cung cấp", guides: "hướng dẫn viên", vehicles: "phương tiện",
    approvals: "yêu cầu", users: "người dùng", documents: "tài liệu",
  };
  return wrapper.dataset.paginationLabel || labels[current] || "kết quả";
}

function filterCurrentView(value) {
  const query = String(value || "").trim().toLocaleLowerCase("vi");
  document.querySelectorAll("#app tbody > tr").forEach((row) => {
    row.dataset.searchFilteredOut = query && !row.textContent.toLocaleLowerCase("vi").includes(query) ? "true" : "false";
    if (!row.closest(".tablewrap")?.dataset.paginated)
      row.hidden = row.dataset.filteredOut === "true" || row.dataset.searchFilteredOut === "true";
  });
  document.querySelectorAll("#app .tablewrap[data-paginated]").forEach((wrapper) => updateTablePagination(wrapper, true));
}

function paginationPagesMarkup(page, pages) {
  return paginationWindow(page, pages).map((item) =>
    item === "…"
      ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>'
      : `<button class="pagination-page${item === page ? " is-active" : ""}" type="button" data-page="${item}" aria-label="Đến trang ${item}"${item === page ? ' aria-current="page"' : ""}>${item}</button>`,
  ).join("");
}

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
  controls.innerHTML = '<span class="pagination-summary"></span><nav class="pagination-controls" aria-label="Phân trang"><button class="pagination-arrow pagination-prev" type="button" aria-label="Trang trước"></button><span class="pagination-pages"></span><button class="pagination-arrow pagination-next" type="button" aria-label="Trang sau"></button></nav>';
  wrapper.insertAdjacentElement("afterend", controls);
  controls.querySelector(".pagination-prev").innerHTML = systemIcon("chevron-left");
  controls.querySelector(".pagination-next").innerHTML = systemIcon("chevron-right");
  controls.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    const page = Number(wrapper.dataset.page || 1);
    const nextPage = target.classList.contains("pagination-prev")
      ? page - 1
      : target.classList.contains("pagination-next") ? page + 1 : Number(target.dataset.page);
    if (Number.isFinite(nextPage)) changeTablePage(wrapper, nextPage);
  });
  updateTablePagination(wrapper);
}

function changeTablePage(wrapper, page) {
  wrapper.dataset.page = String(Math.max(1, page));
  updateTablePagination(wrapper);
  wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateTablePagination(wrapper, reset = false) {
  if (!wrapper?.dataset.paginated) return;
  const rows = [...wrapper.querySelectorAll("tbody > tr")];
  const available = rows.filter((row) => row.dataset.filteredOut !== "true" && row.dataset.searchFilteredOut !== "true");
  const pages = Math.max(1, Math.ceil(available.length / tablePageSize));
  let page = reset ? 1 : Number(wrapper.dataset.page || 1);
  page = Math.min(Math.max(1, page), pages);
  wrapper.dataset.page = String(page);
  rows.forEach((row) => (row.hidden = true));
  available.slice((page - 1) * tablePageSize, page * tablePageSize).forEach((row) => (row.hidden = false));
  const controls = wrapper.nextElementSibling;
  if (!controls?.classList.contains("auto-pagination")) return;
  controls.hidden = available.length <= tablePageSize;
  const start = available.length ? (page - 1) * tablePageSize + 1 : 0;
  const end = Math.min(page * tablePageSize, available.length);
  controls.querySelector(".pagination-summary").innerHTML = `Hiển thị <strong>${start}–${end}</strong> trên tổng <strong>${available.length}</strong> ${paginationLabel(wrapper)}`;
  controls.querySelector(".pagination-pages").innerHTML = paginationPagesMarkup(page, pages);
  controls.querySelector(".pagination-prev").disabled = page === 1;
  controls.querySelector(".pagination-next").disabled = page === pages;
}

const pages = [
  ["dashboard", "◈", "Tổng quan"],
  ["marketing", "↗", "Marketing"],
  ["crm", "◉", "CRM & Leads"],
  ["customers", "◇", "Khách hàng"],
  ["design", "⌁", "Thiết kế tour"],
  ["quotes", "▤", "Báo giá"],
  ["bookings", "▣", "Đặt tour"],
  ["operations", "◎", "Trung tâm điều hành"],
  ["suppliers", "◇", "Nhà cung cấp"],
  ["guides", "♧", "Hướng dẫn viên"],
  ["vehicles", "▰", "Phương tiện"],
  ["accounting", "≋", "Kế toán"],
  ["documents", "▧", "Tài liệu"],
  ["care", "♡", "Chăm sóc khách hàng"],
  ["approvals", "✓", "Phê duyệt"],
  ["users", "◍", "Người dùng & phân quyền"],
  ["settings", "⚙", "Cài đặt hệ thống"],
  ["guideapp", "▯", "Tour của tôi"],
];

const navGroups = [
  ["KINH DOANH", ["marketing", "crm", "customers", "design", "quotes", "bookings"]],
  ["ĐIỀU HÀNH TOUR", ["operations", "suppliers", "guides", "vehicles"]],
  ["TÀI CHÍNH & TÀI LIỆU", ["accounting", "documents"]],
  ["CHĂM SÓC KHÁCH HÀNG", ["care"]],
  ["QUẢN TRỊ", ["approvals", "users", "settings"]],
];

function navigationGroups() {
  if (can("all")) return navGroups;
  if (can("marketing_manage")) return [["TIẾP THỊ & LEAD", ["marketing", "crm"]]];
  if (can("bookings_manage")) return [
    ["QUY TRÌNH BÁN TOUR", ["crm", "customers", "design", "quotes", "bookings"]],
    ["CHĂM SÓC", ["care"]],
    ["HỒ SƠ", ["documents"]],
  ];
  if (can("operations_manage")) return [
    ["ĐIỀU HÀNH TOUR", ["operations", "bookings"]],
    ["NGUỒN LỰC", ["suppliers", "guides", "vehicles"]],
    ["HỒ SƠ & CSKH", ["documents", "care"]],
  ];
  if (can("accounting_manage")) return [["TÀI CHÍNH", ["accounting"]], ["CHỨNG TỪ", ["documents"]]];
  return navGroups;
}
const openNavGroups = new Set();
let navGroupsInitialized = false;
const SIDEBAR_COLLAPSED_KEY = "typicone_sidebar_collapsed";

function systemIcon(name, className = "") {
  return `<i class="fa-solid fa-${name}${className ? ` ${className}` : ""}" aria-hidden="true"></i>`;
}

function sidebarIcon(id) {
  const icons = {
    dashboard:"table-cells-large",crm:"user-check",customers:"users",
    design:"route",quotes:"file-invoice-dollar",bookings:"calendar-check",operations:"gears",
    suppliers:"building",guides:"user-tie",vehicles:"van-shuttle",accounting:"wallet",
    marketing:"bullhorn",documents:"folder-open",care:"headset",guideapp:"suitcase-rolling",
    approvals:"stamp",users:"user-shield",settings:"sliders",
  };
  return systemIcon(icons[id] || icons.dashboard, "nav-icon");
}

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

function toggleSidebarCollapsed(force) {
  if (window.matchMedia("(max-width: 768px)").matches) {
    toggleMobileNav(force);
    return;
  }
  const collapsed = typeof force === "boolean"
    ? force
    : !document.body.classList.contains("sidebar-collapsed");
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const control = document.querySelector(".sidebar-collapse-toggle");
  control?.setAttribute("aria-expanded", String(!collapsed));
  control?.setAttribute("aria-label", collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng");
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch (_) {}
}

function restoreSidebarState() {
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch (_) {}
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const control = document.querySelector(".sidebar-collapse-toggle");
  control?.setAttribute("aria-expanded", String(!collapsed));
  control?.setAttribute("aria-label", collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng");
}

let rights = {};
let rolelabels = {};
let roleCapabilities = {};
let rolePolicies = {};

const businessRolePolicies = {
  ceo: {
    label: "Giám đốc / CEO",
    aliases: ["ceo", "admin", "director", "giam doc", "giám đốc"],
    menus: ["dashboard", "marketing", "crm", "customers", "design", "quotes", "bookings", "operations", "suppliers", "guides", "vehicles", "accounting", "documents", "care", "approvals", "users", "settings"],
    capabilities: ["all"],
    features: ["Toàn quyền quản trị hệ thống", "Xem doanh thu, lợi nhuận, công nợ, hiệu suất nhân viên", "Phê duyệt chiết khấu, miễn cọc, chi phí vượt dự toán, hoàn tiền, hủy tour", "Quản lý người dùng, phân quyền và chính sách nghiệp vụ"],
  },
  marketing: {
    label: "Marketing",
    aliases: ["marketing", "tiep thi", "tiếp thị"],
    menus: ["dashboard", "marketing", "crm"],
    capabilities: ["marketing_manage", "crm_manage", "crm_scope_assigned"],
    features: ["Chiến dịch và Nội dung marketing", "Lead từ chiến dịch của mình", "Báo cáo KPI marketing (lead, CPL, tỷ lệ chốt)", "Không xem lợi nhuận, kế toán, chi phí tour"],
  },
  sales: {
    label: "Kinh doanh / Sales",
    aliases: ["sales", "kinh doanh"],
    menus: ["dashboard", "crm", "customers", "design", "quotes", "bookings", "documents", "care"],
    capabilities: ["crm_manage", "customers_manage", "tour_design_manage", "quotes_manage", "bookings_manage", "care_manage", "documents_manage", "sales_financials", "crm_scope_assigned"],
    features: ["Lead & Follow-up được giao", "Khách hàng", "Thiết kế tour và báo giá nhiều phiên bản", "Chốt báo giá → tạo Booking", "Đề nghị miễn cọc / hủy tour (CEO duyệt)", "Chăm sóc khách của mình"],
  },
  operations: {
    label: "Điều hành",
    aliases: ["operations", "operation", "operator", "dieu hanh", "điều hành"],
    menus: ["dashboard", "operations", "bookings", "suppliers", "guides", "vehicles", "documents", "care"],
    capabilities: ["operations_manage", "suppliers_manage", "guides_manage", "vehicles_manage", "documents_manage", "operations_costs", "guide_switch_profile", "care_manage"],
    features: ["Tiếp nhận booking đã xác nhận", "Đặt dịch vụ, theo dõi NCC xác nhận từng dịch vụ", "Phân công HDV và phương tiện, kiểm tra lịch trống", "Phiếu dịch vụ, bắt đầu/hoàn tất tour", "Sự cố vận hành"],
  },
  accounting: {
    label: "Kế toán",
    aliases: ["accounting", "accountant", "ke toan", "kế toán"],
    menus: ["dashboard", "accounting", "documents"],
    capabilities: ["accounting_manage", "documents_manage", "document_sensitive", "booking_financials", "booking_receipts"],
    features: ["Hóa đơn khách hàng, đặt cọc và thanh toán", "Công nợ phải thu / phải trả NCC", "Thuế GTGT, chi phí, dòng tiền", "Quyết toán tour và chốt lợi nhuận", "Chứng từ kế toán"],
  },
  guide: {
    label: "Hướng dẫn viên",
    aliases: ["guide", "tour guide", "hdv", "hướng dẫn viên"],
    menus: ["guideapp"],
    capabilities: ["guide_portal"],
    features: ["Chỉ thấy tour được phân công cho mình", "Xác nhận / từ chối nhận tour", "Lịch trình, danh sách khách, phiếu dịch vụ", "Báo cáo tình trạng và kết thúc tour", "Liên hệ khẩn cấp điều hành"],
  },
};

function normalizedRoleText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matchBusinessRole(item) {
  const text = normalizedRoleText(`${item.id} ${item.label}`);
  return Object.values(businessRolePolicies).find((policy) =>
    policy.aliases.some((alias) => text.includes(normalizedRoleText(alias))),
  );
}

function applyRoleConfiguration(roles) {
  const configured = roles.map((item) => {
    const policy = matchBusinessRole(item);
    return policy ? { ...item, label: item.label || policy.label, menus: policy.menus, capabilities: policy.capabilities, features: policy.features } : item;
  });
  rights = Object.fromEntries(configured.map((item) => [item.id, item.menus || []]));
  rolelabels = Object.fromEntries(configured.map((item) => [item.id, item.label]));
  roleCapabilities = Object.fromEntries(configured.map((item) => [item.id, item.capabilities || []]));
  rolePolicies = Object.fromEntries(configured.map((item) => [item.id, item]));
}

function can(capability) {
  const capabilities = roleCapabilities[role] || [];
  return capabilities.includes("all") || capabilities.includes(capability);
}

function requireCapability(capability, message = "Bạn không có quyền thực hiện thao tác này.") {
  if (can(capability)) return true;
  toast(message);
  return false;
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
  if (!rights[role]?.includes(p)) {
    toast(
      "Vai trò này không có màn hình " +
        (pages.find((x) => x[0] === p)?.[2] || p),
    );
    return;
  }
  current = p;
  const groupIndex = navigationGroups().findIndex(([, ids]) => ids.includes(p));
  if (groupIndex >= 0) openNavGroups.add(groupIndex);
  toggleMobileNav(false);
  render();
  window.scrollTo(0, 0);
}

function workspaceSection(page) {
  const group = navigationGroups().find(([, ids]) => ids.includes(page));
  return group ? group[0] : "KHÔNG GIAN LÀM VIỆC TYPICONE ERP";
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

function buttonActionIcon(text) {
  const label = String(text).toLowerCase();
  let icon = "";
  if (/chi tiết|xem hồ sơ|mở hồ sơ|mở case|điều hành tour/.test(label))
    icon = "fa-eye";
  else if (/cập nhật|điều phối|chỉnh sửa|sửa/.test(label))
    icon = "fa-pen";
  else if (/duyệt|hoàn thành|đã xử lý|xác nhận/.test(label))
    icon = "fa-circle-check";
  else if (/xóa|xoá|delete/.test(label))
    icon = "fa-trash";
  else if (/chăm sóc|cskh|hỗ trợ/.test(label))
    icon = "fa-headset";
  else if (/ghi nhận thu|ghi nhận chi|thanh toán/.test(label))
    icon = "fa-file-invoice-dollar";
  else if (/voucher|tài liệu|in /.test(label))
    icon = "fa-file-lines";
  if (!icon) return "";
  return `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
}

function btn(t, fn, cls = "") {
  const icon = cls.split(/\s+/).includes("small") ? buttonActionIcon(t) : "";
  if (icon) {
    const tone = /xóa|xoá|delete/i.test(t)
      ? " icon-action--danger"
      : /duyệt|hoàn thành|đã xử lý|xác nhận/i.test(t)
        ? " icon-action--success"
        : "";
    return '<button type="button" class="btn small icon-action' + tone + '" onclick="' + fn + '" aria-label="' + esc(t) + '" title="' + esc(t) + '">' + icon + "</button>";
  }
  return (
    '<button type="button" class="btn ' + cls + '" onclick="' + fn + '">' + t + "</button>"
  );
}

function badge(t, c = "") {
  return '<span class="badge ' + c + '">' + esc(translateVisibleText(t)) + "</span>";
}

function statIcon(label) {
  const text = String(label).toLowerCase();
  let icon = "chart-column";
  if (/doanh|revenue|thu|chi|công nợ|giá trị|profit|lợi nhuận/.test(text))
    icon = "sack-dollar";
  else if (/khách|lead|hướng dẫn|nhân|owner|user/.test(text))
    icon = "user-plus";
  else if (/tour|booking|đặt chỗ|vận hành/.test(text))
    icon = "suitcase-rolling";
  else if (/báo giá|quotation|hóa đơn|invoice|tài liệu|document/.test(text))
    icon = "file-invoice";
  else if (/nhà cung cấp|supplier|xe|vehicle/.test(text))
    icon = "truck";
  else if (/tỷ lệ|csat|điểm|won|hoàn thành|đã ký/.test(text))
    icon = "circle-check";
  return systemIcon(icon);
}

function stat(label, value, meta) {
  return (
    '<div class="stat"><div class="stat-head"><span class="stat-icon">' +
    statIcon(label) +
    '</span><small>' +
    label +
    "</small></div><strong>" +
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

function navTopButton(page, label) {
  return '<button type="button" class="nav-overview ' + (current === page ? "active" : "") + '" onclick="go(\'' + page + '\')"' + (current === page ? ' aria-current="page"' : "") + ' data-tooltip="' + label + '">' + sidebarIcon(page) + '<span class="nav-label">' + label + "</span></button>";
}

function renderNavigation() {
  restoreSidebarState();
  const allowed = (id) => rights[role]?.includes(id);
  const allowedPages = pages.filter((page) => allowed(page[0]));
  const groups = navigationGroups();
  if (!navGroupsInitialized) {
    groups.forEach(([, ids], index) => {
      if (allowedPages.some((page) => ids.includes(page[0]))) openNavGroups.add(index);
    });
    navGroupsInitialized = true;
  }
  const tops = ["dashboard", "guideapp"]
    .map((id) => allowedPages.find((page) => page[0] === id))
    .filter(Boolean)
    .map((page) => navTopButton(page[0], page[0] === "dashboard" && !can("all") ? "Hộp việc" : page[2]))
    .join("");
  const approvalsPending = (state.approvals || []).filter((a) => a.status === "PENDING").length;
  document.getElementById("nav").innerHTML =
    '<div class="nav-eyebrow">TYPICONE · ĐIỀU HÀNH TOUR</div>' +
    tops +
    groups
      .map(([label, ids], index) => {
        const items = allowedPages.filter((page) => ids.includes(page[0]));
        if (!items.length) return "";
        const expanded = openNavGroups.has(index);
        return (
          '<section class="navgroup"><button type="button" class="navgroup-title" onclick="toggleNavGroup(' + index + ')" aria-expanded="' + expanded + '"><span class="navgroup-heading">' + sidebarIcon(ids[0]) + "<span>" + label + '</span></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="navgroup-items"' + (expanded ? "" : " hidden") + ">" +
          items.map((page) => '<button class="' + (current === page[0] ? "active" : "") + '"' + (current === page[0] ? ' aria-current="page"' : "") + ' data-tooltip="' + page[2] + '" onclick="go(\'' + page[0] + "')\">" + sidebarIcon(page[0]) + '<span class="nav-label">' + page[2] + "</span>" + (page[0] === "approvals" && approvalsPending ? '<em class="nav-count">' + approvalsPending + "</em>" : "") + "</button>").join("") +
          "</div></section>"
        );
      })
      .join("");
}

function render() {
  renderNavigation();
  document.getElementById("crumb").textContent = pages.find(
    (p) => p[0] === current,
  )?.[2] || "";
  document.getElementById("crumbSection").textContent = workspaceSection(current);
  const app = document.getElementById("app");
  app.dataset.page = current;
  try {
    app.innerHTML = views[current]();
  } catch (error) {
    console.error("Render error:", current, error);
    app.innerHTML = `<div class="alert red"><b>Không hiển thị được màn hình này</b>${esc(error.message)}</div>`;
  }
  paginateTables(app);
  filterCurrentView(document.getElementById("globalSearch")?.value);
  renderNotificationBadge();
}

const views = {};

function appNotifications() {
  if (typeof state === "undefined" || !role) return [];
  return workQueue().filter((item) => rights[role]?.includes(item.page)).slice(0, 40);
}

function notificationSignature(items = appNotifications()) {
  return items.map((item) => `${item.page}|${item.title}|${item.meta}`).join("\n");
}

function readNotificationStorageKey() {
  return `typicone_notifications_read_${currentUser?.id || "anonymous"}`;
}

function savedNotificationSignature() {
  try {
    return localStorage.getItem(readNotificationStorageKey()) || "";
  } catch {
    return "";
  }
}

function unreadNotificationCount(items = appNotifications()) {
  return notificationSignature(items) === savedNotificationSignature() ? 0 : items.length;
}

function renderNotificationBadge() {
  const badgeElement = document.getElementById("notificationBadge");
  if (!badgeElement) return;
  const count = unreadNotificationCount();
  badgeElement.textContent = count > 99 ? "99+" : String(count);
  badgeElement.hidden = count === 0;
  badgeElement.closest("button")?.setAttribute("aria-label", count ? `Mở ${count} thông báo` : "Mở thông báo");
}

function openNotificationPage(page) {
  closeNotifications();
  go(page);
}

function openNotifications() {
  const existing = document.querySelector(".notification-popover");
  if (existing) return closeNotifications();
  closeModal();
  const items = appNotifications();
  const unread = unreadNotificationCount(items);
  const control = document.querySelector(".notification-button");
  const rect = control.getBoundingClientRect();
  document.getElementById("overlay").innerHTML =
    `<section class="notification-popover" role="dialog" aria-label="Thông báo" style="--popover-top:${Math.round(rect.bottom + 10)}px;--popover-right:${Math.max(12, Math.round(innerWidth - rect.right))}px">` +
    `<header><div><strong>Thông báo</strong>${unread ? `<span>${unread} mới</span>` : ""}</div><button type="button" onclick="markNotificationsRead()" aria-label="Đánh dấu tất cả là đã đọc"${unread ? "" : " disabled"}>Đánh dấu đã đọc</button></header>` +
    `<div class="notification-scroll">${items.length
      ? `<div class="notification-list">${items.map((item) => `<button class="notification-item" type="button" onclick="${item.action ? `closeNotifications();${esc(item.action)}` : `openNotificationPage('${item.page}')`}"><span>${systemIcon(item.icon || "bell")}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small></span><i>›</i></button>`).join("")}</div>`
      : '<div class="empty">Không có công việc nào cần xử lý lúc này.</div>'}</div>` +
    `<footer><button type="button" onclick="closeNotifications()">Đóng thông báo</button></footer></section>`;
  control.setAttribute("aria-expanded", "true");
  document.addEventListener("keydown", handleNotificationKeydown);
  setTimeout(() => document.addEventListener("click", handleNotificationOutsideClick), 0);
  document.querySelector(".notification-popover button")?.focus();
}

function markNotificationsRead() {
  try {
    localStorage.setItem(readNotificationStorageKey(), notificationSignature());
  } catch {}
  renderNotificationBadge();
  document.querySelector(".notification-popover > header span")?.remove();
  const button = document.querySelector(".notification-popover > header button");
  if (button) button.disabled = true;
  toast("Đã đánh dấu tất cả là đã đọc.");
}

function handleNotificationOutsideClick(event) {
  if (!event.target.closest(".notification-popover,.notification-button")) closeNotifications();
}

function handleNotificationKeydown(event) {
  if (event.key === "Escape") closeNotifications();
}

function closeNotifications() {
  const popover = document.querySelector(".notification-popover");
  if (!popover) return;
  document.getElementById("overlay").innerHTML = "";
  document.removeEventListener("click", handleNotificationOutsideClick);
  document.removeEventListener("keydown", handleNotificationKeydown);
  const control = document.querySelector(".notification-button");
  control?.setAttribute("aria-expanded", "false");
  control?.focus();
}

let modalReturnFocus = null;

function handleModalKeydown(event) {
  const dialog = document.querySelector(".modal");
  if (!dialog) return;
  if (event.key === "Escape") return closeModal();
  if (event.key !== "Tab") return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function modal(t, body, narrow = false) {
  closeNotifications();
  if (!document.querySelector(".modalback")) modalReturnFocus = document.activeElement;
  const kind = narrow ? "small" : /tour-builder-modal/.test(body) ? "workflow" : /(booking360|quote-detail|crm-profile|care-profile|customer-profile|guide-profile)/.test(body) ? "profile" : /^\s*<form[\s>]/.test(body) ? "form" : "standard";
  document.getElementById("overlay").innerHTML =
    '<div class="modalback" onclick="if(event.target===this)closeModal()"><section class="modal ' +
    (narrow ? "narrow " : "") + "modal--" + kind +
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
  if (typeof enforcePasswordChange === "function") setTimeout(enforcePasswordChange, 0);
}

function line(l, v) {
  return '<div class="metricline"><span>' + l + "</span><b>" + v + "</b></div>";
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
      '</title><style>body{font:14px/1.7 system-ui;color:#193b31;max-width:850px;margin:40px auto;padding:0 24px}h1{font-size:28px}h2{font-size:18px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}small{color:#718275}.top{border-bottom:2px solid #193b31;padding-bottom:18px}.note{margin-top:30px;font-size:11px;color:#68776e}button{background:#226d53;color:white;border:0;padding:10px 18px;border-radius:6px}@media print{button{display:none}body{margin:0;max-width:none}}</style></head><body><div class="top"><small>TYPICONE ERP</small><h1>' +
      esc(t) +
      "</h1></div>" +
      body +
      '<p class="note">Tài liệu được lập từ hệ thống TypicOne ERP.</p><button onclick="window.print()">In / Lưu PDF</button></body></html>',
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
