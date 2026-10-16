/* WORKFLOW — lớp nghiệp vụ dùng chung: trạng thái, phê duyệt, nhật ký, phạm vi dữ liệu và liên kết giữa các phân hệ.
   Luồng chuẩn: Lead → Khách hàng → Báo giá → Booking → Hóa đơn/Thanh toán → Dịch vụ NCC → HDV → Tour → Quyết toán → CSKH. */

const todayISO = () => new Date().toLocaleDateString("en-CA");
const nowISO = () => new Date().toISOString();
const dateTimeVN = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

/* ---------- Nhãn trạng thái ---------- */
const leadLabels = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Đủ điều kiện",
  "QUOTE SENT": "Đã gửi báo giá",
  NEGOTIATION: "Đàm phán",
  WON: "Thành công",
  LOST: "Thất bại",
  UNQUALIFIED: "Không đủ điều kiện",
};
const leadTones = { WON: "green", LOST: "red", UNQUALIFIED: "red", "QUOTE SENT": "blue", NEGOTIATION: "blue" };
const leadFlow = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE SENT", "NEGOTIATION", "WON"];
const leadNextStates = {
  NEW: ["CONTACTED", "UNQUALIFIED", "LOST"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "LOST"],
  QUALIFIED: ["LOST"],
  "QUOTE SENT": ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["LOST"],
  UNQUALIFIED: ["CONTACTED"],
};

const quoteLabels = {
  Draft: "Bản nháp",
  PendingApproval: "Chờ CEO duyệt",
  Sent: "Đã gửi khách",
  Accepted: "Khách đã chấp nhận",
  Rejected: "Khách từ chối",
};
const quoteTones = { Draft: "", PendingApproval: "amber", Sent: "blue", Accepted: "green", Rejected: "red" };

const bookingLabels = {
  PendingDeposit: "Chờ đặt cọc",
  PendingApproval: "Chờ phê duyệt",
  Confirmed: "Đã xác nhận",
  Preparing: "Đang chuẩn bị",
  Running: "Đang chạy",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
};
const bookingTones = {
  PendingDeposit: "amber",
  PendingApproval: "amber",
  Confirmed: "blue",
  Preparing: "amber",
  Running: "green",
  Completed: "green",
  Cancelled: "red",
};
const bookingOpenStatuses = ["PendingDeposit", "PendingApproval", "Confirmed", "Preparing", "Running"];
const bookingOpsStatuses = ["Confirmed", "Preparing", "Running", "Completed"];

const serviceLabels = {
  NOT_BOOKED: "Chưa đặt",
  WAITING: "Chờ NCC",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "NCC từ chối",
  CANCELLED: "Đã hủy",
};
const serviceTones = { NOT_BOOKED: "", WAITING: "amber", CONFIRMED: "green", REJECTED: "red", CANCELLED: "red" };

const approvalTypes = {
  QUOTE_PRICE: "Giá báo giá / chiết khấu",
  NO_DEPOSIT: "Miễn đặt cọc",
  COST_OVERRUN: "Chi phí vượt dự toán",
  CANCEL: "Hủy tour",
  REFUND: "Hoàn tiền",
};
const approvalLabels = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };

const issueSeverityLabels = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", CRITICAL: "Khẩn cấp" };
const issueStatusLabels = { Open: "Đang mở", Processing: "Đang xử lý", Resolved: "Đã xử lý" };

function statusBadge(map, tones, code) {
  return badge(map[code] || code || "—", tones[code] || "");
}
const leadBadge = (status) => statusBadge(leadLabels, leadTones, status);
const quoteBadge = (status) => statusBadge(quoteLabels, quoteTones, status);
const bookingBadge = (booking) => statusBadge(bookingLabels, bookingTones, booking.status);
const serviceBadge = (service) => statusBadge(serviceLabels, serviceTones, serviceStatus(service));

/* ---------- Chính sách nghiệp vụ (CEO chỉnh trong Cài đặt) ---------- */
const defaultPolicy = {
  minMarginPct: 15,
  maxDiscountPct: 10,
  requireDeposit: true,
  depositPct: 30,
  costOverrunPct: 5,
  settlementGraceDays: 7,
  quoteValidDays: 14,
  monthlyTarget: 0,
  refund30: 90,
  refund15: 50,
  refund7: 20,
};

function policy() {
  return { ...defaultPolicy, ...(state.settings?.[0]?.policy || {}) };
}

/* ---------- Nhật ký & lịch sử ---------- */
function actor() {
  return {
    id: currentUser?.id || "",
    name: currentUser?.fullName || "Hệ thống",
    role: rolelabels?.[currentUser?.role] || currentUser?.role || "",
  };
}

function audit(entity, entityId, action, summary) {
  const who = actor();
  state.auditLogs = state.auditLogs || [];
  state.auditLogs.unshift({
    id: nextStableId("auditLogs"),
    at: nowISO(),
    userId: who.id,
    user: who.name,
    role: who.role,
    entity,
    entityId,
    action,
    summary,
  });
  state.auditLogs = state.auditLogs.slice(0, 600);
  log(summary);
}

function pushHistory(record, entry) {
  record.statusHistory = record.statusHistory || [];
  record.statusHistory.unshift({ at: nowISO(), by: actor().name, ...entry });
}

/* ---------- Phạm vi dữ liệu theo vai trò ---------- */
function myName() {
  return currentUser?.fullName || "";
}

/* Tài khoản hướng dẫn viên (không tính CEO có quyền "all"). */
const isGuideRole = () => (roleCapabilities[role] || []).includes("guide_portal");

/* Chỉ giới hạn khi tài khoản trùng tên với một người phụ trách trong danh mục; tài khoản khác giữ nguyên quyền xem theo menu. */
function isScoped() {
  return !can("all") && (roleCapabilities[role] || []).includes("crm_scope_assigned");
}

function scopedLeads() {
  const leads = state.leads || [];
  if (!isScoped()) return leads;
  if (can("marketing_manage") && !can("quotes_manage")) {
    const mine = (state.campaigns || []).filter((c) => c.owner === myName()).map((c) => c.id);
    if (!marketingOwners.includes(myName())) return leads.filter((l) => l.campaign);
    return leads.filter((l) => l.campaign && mine.includes(l.campaign));
  }
  return crmOwners.includes(myName()) ? leads.filter((l) => l.sales === myName()) : leads;
}

function scopedBookings() {
  const all = state.bookings || [];
  if (isGuideRole()) return all.filter((b) => b.guide && b.guide === activeGuideId());
  if (can("all") || can("booking_financials")) return all;
  if (can("operations_manage")) return all.filter((b) => bookingOpsStatuses.includes(b.status));
  if (can("bookings_manage") && crmOwners.includes(myName())) return all.filter((b) => b.sales === myName());
  return all;
}

function scopedQuotes() {
  const all = state.quotes || [];
  if (!isScoped() || !crmOwners.includes(myName())) return all;
  const ids = new Set(scopedLeads().map((l) => l.id));
  return all.filter((q) => ids.has(q.lead));
}

function scopedCareCases() {
  const all = state.customerServiceCases || [];
  if (can("all")) return all;
  return all.filter((item) => {
    const b = findBooking(item.bookingId);
    if (!b) return true;
    if (can("operations_manage") && operationOwners.includes(myName())) return b.operator === myName();
    if (can("bookings_manage") && crmOwners.includes(myName())) return b.sales === myName();
    return true;
  });
}

/* ---------- Truy xuất nhanh ---------- */
const findLead = (id) => (state.leads || []).find((x) => x.id === id);
const findQuote = (id) => (state.quotes || []).find((x) => x.id === id);
const findBooking = (id) => (state.bookings || []).find((x) => x.id === id);
const findCustomerByName = (name) => (state.customers || []).find((c) => c.name === name);
const findSupplier = (id) => (state.suppliers || []).find((x) => x.id === id);
const findGuide = (id) => (state.guides || []).find((x) => x.id === id);
const findInvoice = (id) => (state.invoices || []).find((x) => x.id === id);
const findCampaign = (id) => (state.campaigns || []).find((x) => x.id === id);
const bookingInvoices = (b) => (state.invoices || []).filter((i) => i.booking === b.id);
const bookingPayables = (b) => (state.payables || []).filter((p) => p.booking === b.id);
const approvalsFor = (ref) => (state.approvals || []).filter((a) => a.ref === ref);
const pendingApproval = (ref, type) => approvalsFor(ref).find((a) => a.status === "PENDING" && (!type || a.type === type));

/* ---------- Liên kết giữa các trang ---------- */
function canOpenBooking() {
  return can("operations_manage") || can("bookings_manage") || can("booking_financials") || isGuideRole();
}

function entityLink(type, id, label) {
  if (!id) return '<span class="sub">—</span>';
  const text = esc(label || id);
  const open = {
    lead: () => can("crm_manage") && `leadDetail('${id}')`,
    quote: () => (can("quotes_manage") || can("approvals_manage") || can("all")) && `quoteDetail('${id}')`,
    booking: () => canOpenBooking() && `openBooking('${id}')`,
    customer: () => (can("customers_manage") || can("all")) && `customerDetail('${id}')`,
    invoice: () => (can("accounting_manage") || can("all")) && `openInvoice('${id}')`,
    guide: () => (can("guides_manage") || can("all")) && `guideDetail('${id}')`,
    supplier: () => (can("suppliers_manage") || can("accounting_manage") || can("all")) && `supplierDetail('${id}')`,
    campaign: () => (can("marketing_manage") || can("all")) && `campaignDetail('${id}')`,
    care: () => can("care_manage") && `openCareCase('${id}')`,
  }[type]?.();
  return open
    ? `<button type="button" class="entity-link" onclick="${open}">${text}</button>`
    : `<span class="entity-text">${text}</span>`;
}

function customerLink(name) {
  const customer = findCustomerByName(name);
  return customer ? entityLink("customer", customer.id, name) : esc(name);
}

/* Điều hướng có ngữ cảnh: goTo('accounting', { accountingTab: 'payable' }) */
function goTo(page, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    try {
      window[key] = value;
    } catch (_) {}
  }
  closeModal();
  go(page);
}

const pageStateBindings = {
  crmTab: (v) => (crmTab = v),
  accountingTab: (v) => (accountingTab = v),
  opsTab: (v) => (opsTab = v),
  marketingTab: (v) => (marketingTab = v),
  bookingFilter: (v) => (bookingFilter = v),
  quoteStatusFilter: (v) => (quoteStatusFilter = v),
  docFilter: (v) => (docFilter = v),
  careFilter: (v) => (careFilter = v),
  settingsTab: (v) => (settingsTab = v),
  approvalTab: (v) => (approvalTab = v),
  guideTab: (v) => (guideTab = v),
  guidesTab: (v) => (guidesTab = v),
};

function navigate(page, params = {}) {
  for (const [key, value] of Object.entries(params)) pageStateBindings[key]?.(value);
  closeModal();
  go(page);
}

/* ---------- Hành trình nghiệp vụ (thanh liên kết Lead → … → CSKH) ---------- */
function journeySteps({ lead, quote, booking }) {
  const b = booking;
  const q = quote || (b?.quote && findQuote(b.quote));
  const l = lead || (b?.lead && findLead(b.lead)) || (q?.lead && findLead(q.lead));
  const pay = b ? paymentState(b) : null;
  const careCase = b && (state.customerServiceCases || []).find((c) => c.bookingId === b.id);
  const tourDone = b?.status === "Completed";
  return [
    { label: "Lead", ref: l?.id, done: !!l, link: l && entityLink("lead", l.id), sub: l ? leadLabels[l.status] : "" },
    { label: "Báo giá", ref: q?.id, done: !!q && ["Accepted"].includes(q.status), current: !!q && q.status !== "Accepted", link: q && entityLink("quote", q.id), sub: q ? `v${q.version} · ${quoteLabels[q.status]}` : "" },
    { label: "Booking", ref: b?.id, done: !!b, link: b && entityLink("booking", b.id), sub: b ? bookingLabels[b.status] : "" },
    { label: "Thanh toán", ref: b?.id, done: !!b && (b.depositWaived || pay.received >= depositRequired(b)) && pay.received > 0 || (!!b && b.depositWaived), current: !!b && !(pay.received >= depositRequired(b)), sub: b ? pay.label : "" },
    { label: "Điều hành", ref: b?.id, done: !!b && ["Preparing", "Running", "Completed"].includes(b.status), current: b?.status === "Confirmed", sub: b ? (b.operator || "Chưa tiếp nhận") : "" },
    { label: "Tour", ref: b?.id, done: tourDone, current: b?.status === "Running", sub: b && b.status !== "Cancelled" ? (tourDone ? "Hoàn tất" : b.status === "Running" ? "Đang chạy" : "Chưa khởi hành") : "" },
    { label: "Quyết toán", ref: b?.id, done: !!b?.settlement, current: tourDone && !b?.settlement, sub: b ? (b.settlement ? "Đã chốt lợi nhuận" : "Chưa quyết toán") : "" },
    { label: "CSKH", ref: careCase?.id, done: careCase?.status === "CLOSED", current: !!careCase && careCase.status !== "CLOSED", link: careCase && entityLink("care", careCase.id), sub: careCase ? careStatusLabels?.[careCase.status] || careCase.status : "" },
  ];
}

function journeyBar(ctx) {
  const steps = journeySteps(ctx);
  if (ctx.booking?.status === "Cancelled")
    return `<div class="journey-bar journey-bar--cancelled"><span>Booking đã hủy</span></div>`;
  return `<ol class="journey-bar" aria-label="Hành trình nghiệp vụ">${steps
    .map((s) => `<li class="${s.done ? "is-done" : s.current ? "is-current" : ""}"><i></i><b>${s.label}</b><span>${s.link || esc(s.ref || "")}</span><small>${esc(s.sub || "")}</small></li>`)
    .join("")}</ol>`;
}

/* ---------- Thanh toán ---------- */
function depositRequired(b) {
  const p = policy();
  if (!p.requireDeposit || b.depositWaived) return 0;
  return b.depositAmount != null ? Number(b.depositAmount) : Math.round((b.revenue || 0) * p.depositPct / 100);
}

/* Lịch thanh toán theo đợt: cọc → đợt cuối trước khởi hành 7 ngày. Trạng thái tính theo tổng đã thu. */
function paymentSchedule(b) {
  const rev = Number(b.revenue || 0), dep = Math.min(rev, depositRequired(b));
  const base = (b.createdAt || nowISO()).slice(0, 10);
  const plan = [];
  if (dep > 0) plan.push({ label: "Đợt 1 · Đặt cọc", amount: dep, due: addDaysSafe(base, 3) });
  const mid = Math.round((rev - dep) / 2 / 1000) * 1000;
  if (b.start && rev - dep > 5000000) {
    plan.push({ label: "Đợt 2 · Thanh toán giữa kỳ", amount: mid, due: addDaysSafe(b.start, -21) });
    plan.push({ label: "Đợt 3 · Thanh toán cuối", amount: rev - dep - mid, due: addDaysSafe(b.start, -7) });
  } else plan.push({ label: "Đợt cuối · Thanh toán còn lại", amount: rev - dep, due: addDaysSafe(b.start || base, -7) });
  let left = Number(b.received || 0);
  return plan.filter((x) => x.amount > 0).map((x) => {
    const paid = Math.min(x.amount, left); left -= paid;
    const status = paid >= x.amount ? "PAID" : x.due < todayISO() ? "OVERDUE" : paid > 0 ? "PARTIAL" : "PENDING";
    return { ...x, paid, status };
  });
}
function addDaysSafe(iso, n) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); }

/* Hoàn tiền gợi ý theo chính sách hủy (CEO có thể sửa). */
function refundSuggestion(b) {
  const p = policy();
  const days = b.start ? Math.ceil((new Date(b.start) - new Date(todayISO())) / 864e5) : 0;
  const pct = days >= 30 ? p.refund30 : days >= 15 ? p.refund15 : days >= 7 ? p.refund7 : 0;
  return { days, pct, amount: Math.round(Number(b.received || 0) * pct / 100 / 1000) * 1000 };
}

function balance(b) {
  if (b.status === "Cancelled") return 0;
  return Math.max(0, (b.revenue || 0) - (b.received || 0));
}

function paymentState(b) {
  const received = Number(b.received || 0);
  const revenue = Number(b.revenue || 0);
  const need = depositRequired(b);
  const overdueInvoice = bookingInvoices(b).some((i) => i.paid < i.amount && i.due && i.due < todayISO());
  let code = "UNPAID";
  let label = "Chưa thu";
  let tone = "red";
  if (b.status === "Cancelled") {
    code = "CANCELLED";
    label = b.refunded ? "Đã hoàn tiền" : "Đã hủy";
    tone = "";
  } else if (revenue > 0 && received >= revenue) {
    code = "PAID";
    label = "Đã thanh toán đủ";
    tone = "green";
  } else if (received > 0 && received >= need) {
    code = "DEPOSITED";
    label = "Đã đặt cọc";
    tone = "blue";
  } else if (received > 0) {
    code = "PARTIAL";
    label = "Thu một phần";
    tone = "amber";
  }
  if (overdueInvoice && code !== "PAID") {
    label += " · quá hạn";
    tone = "red";
  }
  return { code, label, tone, received, revenue, due: Math.max(0, revenue - received), need, overdue: overdueInvoice, pct: revenue ? Math.min(100, Math.round((received / revenue) * 100)) : 0 };
}

const paymentBadge = (b) => {
  const s = paymentState(b);
  return badge(s.label, s.tone);
};

/* Khi kế toán ghi nhận thu: đủ điều kiện cọc thì booking tự chuyển sang "Đã xác nhận" để bàn giao điều hành. */
function reevaluateBookingPayment(b) {
  if (!["PendingDeposit", "PendingApproval"].includes(b.status)) return false;
  if (b.status === "PendingApproval" && !b.depositWaived) return false;
  if (b.depositWaived || (b.received || 0) >= depositRequired(b)) {
    setBookingStatus(b, "Confirmed", b.depositWaived ? "CEO miễn đặt cọc — bàn giao điều hành" : "Kế toán xác nhận đã nhận đủ tiền cọc");
    return true;
  }
  return false;
}

/* ---------- Booking: máy trạng thái ---------- */
function setBookingStatus(b, status, note = "") {
  if (b.status === status) return;
  const from = b.status;
  b.status = status;
  pushHistory(b, { from, to: status, note });
  audit("booking", b.id, "STATUS", `${b.id}: ${bookingLabels[from] || from} → ${bookingLabels[status] || status}${note ? " · " + note : ""}`);
}

/* ---------- Dịch vụ NCC: trạng thái riêng từng dịch vụ ---------- */
function serviceStatus(s) {
  if (s.status) return s.status;
  return s.confirmed ? "CONFIRMED" : s.supplier ? "NOT_BOOKED" : "NOT_BOOKED";
}

function setServiceStatus(b, s, status, note = "", extra = {}) {
  const before = serviceStatus(s);
  s.status = status;
  s.confirmed = status === "CONFIRMED";
  Object.assign(s, extra);
  s.history = s.history || [];
  s.history.unshift({ at: nowISO(), by: actor().name, from: before, to: status, note });
  if (before === "CONFIRMED" && status !== "CONFIRMED") b.voucher = false;
  audit("booking", b.id, "SERVICE", `${b.id} · ${typesVI[s.type] || s.type}: ${serviceLabels[before]} → ${serviceLabels[status]}${note ? " · " + note : ""}`);
}

function bookingServices(b) {
  return (b.services || []).filter((s) => s.needed && serviceStatus(s) !== "CANCELLED");
}

function plannedServiceCost(b) {
  return bookingServices(b).reduce((n, s) => n + Number(s.cost || 0), 0);
}

/* ---------- Mức độ sẵn sàng của tour ---------- */
function readiness(b) {
  const services = bookingServices(b).filter((s) => s.type !== "Guide");
  const confirmed = services.filter((s) => serviceStatus(s) === "CONFIRMED").length;
  const rejected = services.filter((s) => serviceStatus(s) === "REJECTED").length;
  const overrun = pendingApproval(b.id, "COST_OVERRUN");
  const checks = [
    { key: "operator", label: "Điều hành đã tiếp nhận booking", ok: !!b.operator, fix: "Tiếp nhận booking" },
    { key: "services", label: `Dịch vụ NCC đã xác nhận (${confirmed}/${services.length})`, ok: services.length > 0 && confirmed === services.length, fix: rejected ? `${rejected} dịch vụ bị NCC từ chối` : "Gửi yêu cầu & xác nhận NCC" },
    { key: "guide", label: "Hướng dẫn viên đã nhận tour", ok: !!b.guide && !!b.guideConfirmed, fix: b.guide ? "Chờ HDV xác nhận" : "Phân công HDV" },
    { key: "voucher", label: "Phiếu dịch vụ (voucher) đã phát hành", ok: !!b.voucher, fix: "Tạo voucher" },
    { key: "pax", label: "Danh sách khách đã đủ họ tên", ok: (b.passengers || []).length >= (b.pax || 0) && !(b.passengers || []).some((p) => !p.name || /^Khách đi kèm/.test(p.name)), fix: "Bổ sung hành khách", soft: true },
    { key: "cost", label: "Chi phí trong ngưỡng dự toán", ok: !overrun, fix: "Chờ CEO duyệt chi phí vượt dự toán" },
  ];
  return checks;
}

function progress(b) {
  const checks = readiness(b).filter((c) => !c.soft);
  return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
}

function startBlockers(b) {
  return readiness(b).filter((c) => !c.ok && !c.soft);
}

/* ---------- Phê duyệt ---------- */
function requestApproval({ type, refType = "booking", ref, amount = 0, reason = "", data = {} }) {
  const existing = pendingApproval(ref, type);
  if (existing) {
    toast("Đã có yêu cầu phê duyệt đang chờ cho nghiệp vụ này.");
    return existing;
  }
  const who = actor();
  const approval = {
    id: nextStableId("approvals"),
    type,
    refType,
    ref,
    amount,
    reason,
    data,
    status: "PENDING",
    requestedBy: who.name,
    requestedById: who.id,
    requestedAt: nowISO(),
  };
  state.approvals.unshift(approval);
  audit(refType, ref, "APPROVAL_REQUEST", `Yêu cầu phê duyệt ${approvalTypes[type].toLowerCase()} cho ${ref}${reason ? " — " + reason : ""}`);
  save();
  return approval;
}

const approvalEffects = {
  QUOTE_PRICE(a, approved) {
    const q = findQuote(a.ref);
    if (!q) return;
    q.approval = { status: approved ? "APPROVED" : "REJECTED", version: q.version, by: actor().name, at: nowISO(), note: a.decisionNote || "" };
    if (q.status === "PendingApproval") q.status = "Draft";
  },
  NO_DEPOSIT(a, approved) {
    const b = findBooking(a.ref);
    if (!b) return;
    if (approved) {
      b.depositWaived = true;
      reevaluateBookingPayment(b);
    } else if (b.status === "PendingApproval") setBookingStatus(b, "PendingDeposit", "CEO từ chối miễn cọc");
  },
  COST_OVERRUN(a, approved) {
    const b = findBooking(a.ref);
    if (!b) return;
    if (approved) b.costApprovedTotal = a.data?.total ?? plannedServiceCost(b);
    else b.costRejectedAt = nowISO();
  },
  CANCEL(a, approved) {
    const b = findBooking(a.ref);
    if (!b || !approved) return;
    cancelBooking(b, Number(a.data?.refund || 0), a.reason);
  },
  REFUND(a, approved) {
    const b = findBooking(a.ref);
    if (!b || !approved) return;
    createRefundPayable(b, Number(a.amount || 0), a.reason);
  },
};

function decideApproval(id, approved, note = "") {
  if (!requireCapability("approvals_manage", "Chỉ Giám đốc được phê duyệt nghiệp vụ này.")) return;
  const a = state.approvals.find((x) => x.id === id);
  if (!a || a.status !== "PENDING") return;
  a.status = approved ? "APPROVED" : "REJECTED";
  a.decidedBy = actor().name;
  a.decidedAt = nowISO();
  a.decisionNote = note;
  approvalEffects[a.type]?.(a, approved);
  audit(a.refType, a.ref, approved ? "APPROVED" : "REJECTED", `${approved ? "Duyệt" : "Từ chối"} ${approvalTypes[a.type].toLowerCase()} ${a.ref}${note ? " — " + note : ""}`);
  save();
}

function createRefundPayable(b, amount, reason) {
  if (amount <= 0) return null;
  const refund = {
    id: nextBusinessId("payables"),
    kind: "REFUND",
    supplier: "",
    payee: b.client,
    booking: b.id,
    amount,
    due: todayISO(),
    status: "Approved",
    note: reason || "Hoàn tiền khách",
    createdAt: nowISO(),
  };
  state.payables.push(refund);
  return refund;
}

function cancelBooking(b, refund = 0, reason = "") {
  (b.services || []).forEach((s) => {
    if (serviceStatus(s) !== "CANCELLED") setServiceStatus(b, s, "CANCELLED", "Hủy booking");
  });
  if (b.guide) {
    b.guideHistory = b.guideHistory || [];
    b.guideHistory.unshift({ at: nowISO(), guide: b.guide, action: "RELEASED", reason: "Booking bị hủy" });
  }
  b.cancelReason = reason;
  b.cancelledAt = nowISO();
  setBookingStatus(b, "Cancelled", reason || "Hủy tour");
  if (refund > 0) createRefundPayable(b, refund, "Hoàn tiền do hủy " + b.id);
  const lead = findLead(b.lead);
  if (lead && lead.status === "WON") {
    lead.statusHistory = lead.statusHistory || [];
    lead.statusHistory.unshift({ status: lead.status, at: nowISO(), note: "Booking " + b.id + " đã hủy" });
  }
}

/* ---------- Hàng đợi công việc theo vai trò (thông báo + dashboard) ---------- */
function workQueue() {
  const today = todayISO();
  const items = [];
  const add = (item) => items.push({ priority: 2, ...item });
  const bookings = state.bookings || [];

  if (can("approvals_manage")) {
    (state.approvals || []).filter((a) => a.status === "PENDING").forEach((a) =>
      add({ icon: "check-double", priority: 0, title: `Chờ duyệt: ${approvalTypes[a.type]}`, meta: `${a.ref} · ${a.requestedBy}${a.amount ? " · " + money(a.amount) : ""}`, page: "approvals" }));
  }
  if (can("crm_manage")) {
    scopedLeads().forEach((lead) => {
      const t = typeof lead.followup === "object" ? lead.followup : { dueDate: lead.followup, status: "PENDING" };
      if (t?.status === "PENDING" && t.dueDate && t.dueDate <= today && !["WON", "LOST", "UNQUALIFIED"].includes(lead.status))
        add({ icon: "phone", priority: t.dueDate < today ? 1 : 2, title: `Follow-up ${lead.name}`, meta: t.dueDate < today ? `Quá hạn từ ${fmt(t.dueDate)}` : "Đến hạn hôm nay", page: "crm", action: `leadDetail('${lead.id}')` });
    });
  }
  if (can("quotes_manage")) {
    scopedQuotes().filter((q) => q.status === "Draft" && q.approval?.status === "APPROVED" && q.approval.version === q.version)
      .forEach((q) => add({ icon: "file-circle-check", title: `${q.id} đã được CEO duyệt`, meta: "Có thể gửi báo giá cho khách", page: "quotes", action: `quoteDetail('${q.id}')` }));
    scopedQuotes().filter((q) => q.status === "Sent" && q.sentAt && (Date.now() - new Date(q.sentAt)) / 864e5 > 3)
      .forEach((q) => add({ icon: "clock", title: `${q.id} chưa có phản hồi`, meta: `${q.client} · đã gửi ${fmt(q.sentAt.slice(0, 10))}`, page: "quotes", action: `quoteDetail('${q.id}')` }));
    scopedBookings().filter((b) => b.status === "PendingDeposit")
      .forEach((b) => add({ icon: "hourglass-half", title: `${b.id} chờ đặt cọc`, meta: `${b.client} · cần cọc ${money(depositRequired(b))}`, page: "bookings", action: `openBooking('${b.id}')` }));
  }
  if (can("operations_manage")) {
    bookings.filter((b) => b.status === "Confirmed").forEach((b) =>
      add({ icon: "inbox", priority: 1, title: `${b.id} chờ tiếp nhận`, meta: `${b.client} · khởi hành ${fmt(b.start)}`, page: "operations", action: `openBooking('${b.id}')` }));
    bookings.filter((b) => ["Preparing"].includes(b.status)).forEach((b) => {
      const svcs = bookingServices(b);
      const rejected = svcs.filter((s) => serviceStatus(s) === "REJECTED").length;
      const pending = svcs.filter((s) => s.type !== "Guide" && serviceStatus(s) !== "CONFIRMED").length;
      const daysLeft = Math.ceil((new Date(b.start) - new Date(today)) / 864e5);
      if (rejected) add({ icon: "ban", priority: 1, title: `${b.id}: ${rejected} dịch vụ bị NCC từ chối`, meta: "Cần chọn nhà cung cấp khác", page: "operations", action: `openBooking('${b.id}','services')` });
      else if (pending) add({ icon: "truck", priority: daysLeft <= 7 ? 1 : 2, title: `${b.id} còn ${pending} dịch vụ chưa chốt`, meta: `${b.tour} · còn ${daysLeft} ngày`, page: "operations", action: `openBooking('${b.id}','services')` });
      if (!b.guide) add({ icon: "user-tie", priority: daysLeft <= 7 ? 1 : 2, title: `${b.id} chưa có HDV`, meta: `Khởi hành ${fmt(b.start)}`, page: "guides", action: `openBooking('${b.id}','services')` });
    });
    (state.issues || []).filter((i) => i.status !== "Resolved").forEach((i) =>
      add({ icon: "triangle-exclamation", priority: ["HIGH", "CRITICAL"].includes(i.severity) ? 0 : 2, title: `Sự cố ${i.id}`, meta: `${i.booking} · ${i.note}`.slice(0, 90), page: "operations", action: `navigate('operations',{opsTab:'issues'})` }));
  }
  if (can("operations_manage") || can("vehicles_manage")) {
    (state.vehicles || []).forEach((v) => [["inspectionExpiry", "đăng kiểm"], ["insuranceExpiry", "bảo hiểm"], ["nextMaintenance", "bảo dưỡng"]].forEach(([k, l]) => {
      if (!v[k]) return;
      const left = Math.ceil((new Date(v[k]) - new Date(today)) / 864e5);
      if (left <= 30) add({ icon: "car-burst", priority: left < 0 ? 1 : 2, title: `Xe ${v.id} ${left < 0 ? "quá hạn" : "sắp hết hạn"} ${l}`, meta: `${v.name} · ${fmt(v[k])}`, page: "vehicles" });
    }));
  }
  if (can("documents_manage")) {
    (state.docs || []).filter((d) => d.expiry && (can("document_sensitive") || !["Passport", "Invoice"].includes(d.type)) && !["Completed", "Cancelled"].includes(findBooking(d.booking)?.status)).forEach((d) => {
      const left = Math.ceil((new Date(d.expiry) - new Date(today)) / 864e5);
      if (left <= 30) add({ icon: "id-card", priority: left < 0 ? 1 : 2, title: `${d.type === "Passport" ? "Hộ chiếu/visa" : "Giấy tờ"} ${left < 0 ? "đã hết hạn" : "sắp hết hạn"}: ${d.name}`, meta: `${d.booking} · ${fmt(d.expiry)}`, page: "documents" });
    });
  }
  if (can("accounting_manage")) {
    bookings.filter((b) => b.status === "PendingDeposit" && !bookingInvoices(b).length).forEach((b) =>
      add({ icon: "file-invoice-dollar", priority: 1, title: `${b.id} cần phát hành yêu cầu đặt cọc`, meta: `${b.client} · ${money(depositRequired(b))}`, page: "accounting", action: `depositInvoiceForm('${b.id}')` }));
    (state.invoices || []).filter((i) => i.paid < i.amount && i.due && i.due < today).forEach((i) =>
      add({ icon: "bell", priority: 1, title: `Hóa đơn ${i.id} quá hạn`, meta: `${i.booking} · còn ${money(i.amount - i.paid)}`, page: "accounting", action: `openInvoice('${i.id}')` }));
    (state.payables || []).filter((p) => p.status === "Pending").forEach((p) =>
      add({ icon: "stamp", title: `${p.id} chờ duyệt chi`, meta: `${p.booking} · ${money(p.amount)}`, page: "accounting", action: `navigate('accounting',{accountingTab:'payable'})` }));
    (state.payables || []).filter((p) => p.status === "Approved").forEach((p) =>
      add({ icon: "money-bill-transfer", title: `${p.id} đã duyệt, chờ chi tiền`, meta: `${money(p.amount)} · hạn ${fmt(p.due)}`, page: "accounting", action: `navigate('accounting',{accountingTab:'payable'})` }));
    bookings.filter((b) => b.status === "Completed" && !b.settlement).forEach((b) =>
      add({ icon: "scale-balanced", title: `${b.id} chờ quyết toán`, meta: `${b.client} · tour kết thúc ${fmt(b.end)}`, page: "accounting", action: `navigate('accounting',{accountingTab:'settlement'})` }));
  }
  if (isGuideRole()) {
    bookings.filter((b) => b.guide === activeGuideId() && !b.guideConfirmed && ["Preparing", "Confirmed"].includes(b.status)).forEach((b) =>
      add({ icon: "user-check", priority: 0, title: `Xác nhận nhận tour ${b.id}`, meta: `${b.tour} · ${fmt(b.start)}`, page: "guideapp", action: `go('guideapp')` }));
  }
  if (can("care_manage")) {
    scopedCareCases().forEach((item) => {
      if (item.status === "RECOVERY" || (item.dueDate && item.dueDate < today && item.status !== "CLOSED"))
        add({ icon: "headset", title: `${item.id} cần chăm sóc`, meta: `${item.customer} · hạn ${fmt(item.dueDate)}`, page: "care", action: `openCareCase('${item.id}')` });
    });
  }
  const mine = (state.approvals || []).filter((a) => a.requestedById === currentUser?.id && a.status !== "PENDING" && a.decidedAt && Date.now() - new Date(a.decidedAt) < 3 * 864e5);
  mine.forEach((a) => add({ icon: a.status === "APPROVED" ? "circle-check" : "circle-xmark", title: `${approvalTypes[a.type]}: ${approvalLabels[a.status]}`, meta: `${a.ref}${a.decisionNote ? " · " + a.decisionNote : ""}`, page: a.refType === "quote" ? "quotes" : "bookings", action: a.refType === "quote" ? `quoteDetail('${a.ref}')` : `openBooking('${a.ref}')` }));
  return items.sort((x, y) => x.priority - y.priority);
}

/* ---------- Làm sạch / di chuyển dữ liệu cũ sang cấu trúc mới ---------- */
function migrateWorkflowData() {
  let changed = false;
  const touch = (fn) => {
    if (fn()) changed = true;
  };
  stages = leadFlow.concat(["LOST", "UNQUALIFIED"]);
  for (const lead of state.leads) {
    touch(() => {
      if (!lead.statusHistory) {
        lead.statusHistory = [{ status: lead.status, at: lead.createdAt || nowISO(), note: "Dữ liệu ban đầu" }];
        return true;
      }
    });
  }
  for (const b of state.bookings) {
    touch(() => {
      let c = false;
      if (!b.statusHistory) { b.statusHistory = [{ at: nowISO(), by: "Hệ thống", from: "", to: b.status, note: "Khởi tạo lịch sử trạng thái" }]; c = true; }
      if (!b.guideHistory) { b.guideHistory = []; c = true; }
      if (!b.guideReports) { b.guideReports = []; c = true; }
      for (const s of b.services || []) {
        if (!s.status) { s.status = s.confirmed ? "CONFIRMED" : "NOT_BOOKED"; c = true; }
        if (!s.history) { s.history = []; c = true; }
      }
      return c;
    });
  }
  for (const issue of state.issues) {
    touch(() => {
      let c = false;
      if (!issue.severity) { issue.severity = "MEDIUM"; c = true; }
      if (!issue.createdAt) { issue.createdAt = nowISO(); c = true; }
      if (!issue.reporter) { issue.reporter = "Điều hành"; c = true; }
      return c;
    });
  }
  for (const p of state.payables) touch(() => { if (!p.kind) { p.kind = "SUPPLIER"; return true; } });
  for (const q of state.quotes) {
    touch(() => {
      let c = false;
      if (!q.history) { q.history = []; c = true; }
      return c;
    });
  }
  for (const guide of state.guides) {
    touch(() => {
      let c = false;
      const defaults = {
        phone: "", email: "", dob: "", gender: "", nationality: "Việt Nam", address: "",
        licenseNo: "", licenseIssued: "", licenseExpiry: "", experienceYears: 0,
        specialties: "", emergencyName: "", emergencyPhone: "", status: "ACTIVE", note: "",
      };
      for (const [key, value] of Object.entries(defaults)) {
        if (guide[key] === undefined) { guide[key] = value; c = true; }
      }
      if (!Array.isArray(guide.blocks)) { guide.blocks = []; c = true; }
      return c;
    });
  }
  return changed;
}

/* Điểm mở rộng cho tính năng AI về sau (chưa bật): gợi ý lịch trình, gợi ý HDV, phân tích lợi nhuận. */
const aiExtensionPoints = Object.freeze({ itinerary: null, guideSuggestion: null, profitAnalysis: null });
