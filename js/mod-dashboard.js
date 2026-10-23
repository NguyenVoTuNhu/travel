/* MODULE mod-dashboard — dashboard điều hành tổng hợp từ dữ liệu hệ thống. */

const dashboardStatusLabels = bookingLabels;

const dashboardToday = todayISO();
const dashboardMonthStart = dashboardToday.slice(0, 8) + "01";
let dashboardDateFrom = dashboardMonthStart;
let dashboardDateTo = dashboardToday;
let dashboardDateLabel = "Tháng này";
let dashboardDateOpen = false;

function dashboardDateISO(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toLocaleDateString("en-CA");
}

function dashboardFilterDate(rows, field = "start") {
  return rows.filter((row) => {
    const value = String(row[field] || "").slice(0, 10);
    return value && value >= dashboardDateFrom && value <= dashboardDateTo;
  });
}

function setDashboardDatePreset(preset) {
  const now = new Date(), end = new Date(now), start = new Date(now);
  const labels = { today:"Hôm nay", d7:"7 ngày qua", d30:"30 ngày qua", d90:"90 ngày qua", month:"Tháng này", previous:"Tháng trước" };
  if (preset === "d7") start.setDate(start.getDate() - 6);
  if (preset === "d30") start.setDate(start.getDate() - 29);
  if (preset === "d90") start.setDate(start.getDate() - 89);
  if (preset === "month") start.setDate(1);
  if (preset === "previous") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  }
  dashboardDateFrom = dashboardDateISO(start);
  dashboardDateTo = dashboardDateISO(end);
  dashboardDateLabel = labels[preset] || "Tùy chọn";
  dashboardDateOpen = false;
  render();
}

function applyDashboardDate(e) {
  e.preventDefault();
  const form = new FormData(e.target), from = String(form.get("from")), to = String(form.get("to"));
  if (!from || !to || from > to) return toast("Khoảng ngày chưa hợp lệ.");
  dashboardDateFrom = from;
  dashboardDateTo = to;
  dashboardDateLabel = "Tùy chọn";
  dashboardDateOpen = false;
  render();
}

function dashboardDateControl() {
  const presets = [["today","Hôm nay"],["d7","7 ngày qua"],["d30","30 ngày qua"],["d90","90 ngày qua"],["month","Tháng này"],["previous","Tháng trước"]];
  return `<div class="dashboard-date-picker"><button class="dashboard-date-trigger" onclick="dashboardDateOpen=!dashboardDateOpen;render()" aria-expanded="${dashboardDateOpen}"><i class="fa-regular fa-calendar"></i><span>${fmt(dashboardDateFrom)} → ${fmt(dashboardDateTo)}</span><i class="fa-solid fa-chevron-down"></i></button>${dashboardDateOpen ? `<div class="dashboard-date-popover"><div class="dashboard-date-presets">${presets.map(([key,label]) => `<button class="${dashboardDateLabel === label ? "active" : ""}" onclick="setDashboardDatePreset('${key}')">${label}</button>`).join("")}</div><form onsubmit="applyDashboardDate(event)"><label>Từ ngày<input type="date" name="from" value="${dashboardDateFrom}" required></label><span>→</span><label>Đến ngày<input type="date" name="to" value="${dashboardDateTo}" required></label><div><button type="button" class="btn" onclick="dashboardDateOpen=false;render()">Hủy</button><button class="btn primary">Áp dụng</button></div></form></div>` : ""}</div>`;
}

function dashboardIcon(name) {
  const icons = {
    revenue:"dollar-sign",profit:"arrow-trend-up",tour:"suitcase-rolling",guests:"users",
    receivable:"wallet",payable:"file-invoice-dollar",alert:"triangle-exclamation",activity:"clock",
  };
  return systemIcon(icons[name] || icons.activity);
}

function dashboardSparkline(values) {
  const data = values.map(Number).filter(Number.isFinite).slice(-6);
  if (data.length < 2) return "";
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((value, index) => `${index / (data.length - 1) * 112},${38 - (value - min) / range * 32}`).join(" ");
  return `<svg class="dashboard-kpi-sparkline" viewBox="0 0 112 42" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}"/></svg>`;
}

function dashboardTrend(values) {
  const data = values.map(Number).filter(Number.isFinite);
  if (data.length < 2) return "";
  const previous = data[data.length - 2], current = data[data.length - 1];
  if (!previous) return "";
  const change = (current - previous) / Math.abs(previous) * 100;
  const direction = change >= 0 ? "up" : "down";
  return `<span class="dashboard-kpi-trend dashboard-kpi-trend--${direction}">${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}%</span>`;
}

function dashboardKpi(tone, icon, label, value, meta, page, series = []) {
  return `<button class="dashboard-kpi dashboard-kpi--${tone}" onclick="go('${page}')">
    <span class="dashboard-kpi-head"><span class="dashboard-kpi-icon">${dashboardIcon(icon)}</span><span class="dashboard-kpi-label">${label}</span></span>
    <strong class="dashboard-kpi-value">${value}</strong>
    <span class="dashboard-kpi-footer">${dashboardTrend(series)}<span class="dashboard-kpi-meta">${meta}</span></span>
    ${dashboardSparkline(series)}
  </button>`;
}

function dashboardMonthlyRevenue(bookings) {
  const months = new Map();
  bookings.forEach((booking) => {
    const date = new Date(booking.start);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, (months.get(key) || 0) + fxLedgerNumber(booking, booking.revenue));
  });
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    .map(([key, value]) => ({ label: "T" + Number(key.slice(5)), value }));
}

function dashboardRevenueChart(bookings) {
  const data = dashboardMonthlyRevenue(bookings);
  if (!data.length) return '<div class="dashboard-empty">Chưa có dữ liệu doanh thu theo thời gian.</div>';
  const width = 900, height = 300, left = 62, top = 24, chartWidth = 818, chartHeight = 220;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => ({
    ...item,
    x: left + (data.length === 1 ? chartWidth / 2 : index / (data.length - 1) * chartWidth),
    y: top + chartHeight - item.value / max * chartHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const grid = [0, .25, .5, .75, 1].map((ratio) => {
    const y = top + chartHeight * ratio;
    return `<g><line x1="${left}" y1="${y}" x2="880" y2="${y}"/><text x="52" y="${y + 4}" text-anchor="end">${fxLedgerShort(max * (1 - ratio))}</text></g>`;
  }).join("");
  return `<div class="dashboard-chart-scroll"><svg class="dashboard-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Doanh thu booking theo tháng: ${data.map((item) => item.label + " " + fxLedgerText(item.value)).join(", ")}">
    <defs><linearGradient id="dashboardRevenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".24"/><stop offset="1" stop-color="currentColor" stop-opacity=".02"/></linearGradient></defs>
    <g class="dashboard-chart-grid">${grid}</g>
    <polygon class="dashboard-chart-area" points="${left},${top + chartHeight} ${line} ${left + chartWidth},${top + chartHeight}"/>
    <polyline class="dashboard-chart-line" points="${line}"/>
    ${points.map((point) => `<g class="dashboard-chart-point" tabindex="0" aria-label="${point.label}: ${fxLedgerText(point.value)}"><circle cx="${point.x}" cy="${point.y}" r="5"/><text x="${point.x}" y="286" text-anchor="middle">${point.label}</text><title>${fxLedgerText(point.value)}</title></g>`).join("")}
  </svg></div>`;
}

function dashboardStatusChart(bookings) {
  const counts = bookings.reduce((result, booking) => {
    result[booking.status || "Khác"] = (result[booking.status || "Khác"] || 0) + 1;
    return result;
  }, {});
  const entries = Object.entries(counts);
  if (!entries.length) return '<div class="dashboard-empty">Chưa có booking để phân tích trạng thái.</div>';
  const circumference = 339.3;
  let offset = 0;
  const circles = entries.map(([status, count], index) => {
    const length = count / bookings.length * circumference;
    const result = `<circle class="dashboard-donut-segment dashboard-donut-segment--${index % 5}" cx="72" cy="72" r="54" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"><title>${dashboardStatusLabels[status] || status}: ${count}</title></circle>`;
    offset += length;
    return result;
  }).join("");
  return `<div class="dashboard-donut-layout"><svg class="dashboard-donut" viewBox="0 0 144 144" role="img" aria-label="Phân bổ ${bookings.length} booking theo trạng thái"><circle class="dashboard-donut-track" cx="72" cy="72" r="54"/>${circles}<text x="72" y="68" text-anchor="middle">${bookings.length}</text><text class="dashboard-donut-caption" x="72" y="87" text-anchor="middle">booking</text></svg><div class="dashboard-legend">${entries.map(([status, count], index) => `<div><i class="dashboard-legend-dot dashboard-legend-dot--${index % 5}"></i><span>${dashboardStatusLabels[status] || esc(status)}</span><b>${count}</b></div>`).join("")}</div></div>`;
}

function dashboardPreparation(bookings) {
  const preparing = bookings.filter((booking) => booking.status === "Preparing").slice(0, 5);
  if (!preparing.length) return '<div class="dashboard-empty">Không có tour nào đang chờ chuẩn bị.</div>';
  return `<div class="dashboard-tour-list">${preparing.map((booking) => {
    const ready = progress(booking);
    const pending = bookingServices(booking).filter((service) => serviceStatus(service) !== "CONFIRMED").length;
    return `<button class="dashboard-tour-row" onclick="openBooking('${booking.id}')">
      <span class="dashboard-tour-main"><b>${esc(booking.id)}</b><small>${esc(booking.tour)}</small></span>
      <span class="dashboard-tour-date"><small>Khởi hành</small><b>${fmt(booking.start)}</b></span>
      <span class="dashboard-tour-progress"><span><i style="--progress:${ready}%"></i></span><b>${ready}%</b></span>
      <span class="dashboard-tour-owner"><small>Điều hành</small><b>${esc(booking.operator || "Chưa phân công")}</b></span>
      <span class="dashboard-tour-risk ${pending ? "is-warning" : "is-ready"}">${pending ? pending + " dịch vụ chờ" : "Sẵn sàng"}</span>
    </button>`;
  }).join("")}</div>`;
}

function dashboardSalesPerformance(bookings) {
  const owners = [...new Set(bookings.map((booking) => booking.sales).filter(Boolean))];
  if (!owners.length) return '<div class="dashboard-empty">Chưa có booking được gán nhân viên kinh doanh.</div>';
  const rows = owners.map((owner) => ({ owner, value: bookings.filter((booking) => booking.sales === owner).reduce((sum, booking) => sum + fxLedgerNumber(booking, booking.revenue), 0) })).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((row) => row.value), 1);
  return `<div class="dashboard-ranking">${rows.map((row, index) => `<div class="dashboard-ranking-row"><span class="dashboard-rank">${index + 1}</span><span class="dashboard-ranking-name">${esc(row.owner)}<small>${fxLedgerShort(row.value)}</small></span><span class="dashboard-ranking-bar"><i style="--bar-size:${row.value / max * 100}%"></i></span></div>`).join("")}</div>`;
}

const dashLive = () => (state.bookings || []).filter((b) => b.status !== "Cancelled");
/* Lợi nhuận một booking theo tiền của sổ (USD khi đã có tỷ giá), tỷ giá ngày chốt báo giá của booking. */
const dashProfit = (b) => fxLedgerNumber(b, b.settlement ? b.settlement.profit : Number(b.revenue || 0) - Number(b.quoteCost || b.cost || 0));
const dashRevenue = (b) => fxLedgerNumber(b, b.revenue);
const dashBalance = (b) => fxLedgerNumber(b, balance(b));
const dashPending = (b) => bookingServices(b).filter((s) => serviceStatus(s) !== "CONFIRMED").length;

function dashboardQueue() {
  const items = workQueue().slice(0, 8);
  if (!items.length) return '<div class="dashboard-empty dashboard-empty--success">Không có việc tồn đọng. Mọi thứ đang đúng tiến độ.</div>';
  return `<div class="dashboard-alert-list">${items.map((item) => `<button onclick="${item.action ? item.action : `go('${item.page}')`}" class="dashboard-alert dashboard-alert--${item.priority === 0 ? "red" : item.priority === 1 ? "orange" : "violet"}"><span class="dashboard-alert-icon">${dashboardIcon("alert")}</span><span><b>${esc(item.title)}</b><small>${esc(item.meta || "")}</small></span><span aria-hidden="true">›</span></button>`).join("")}</div>`;
}

function dashboardActivities() {
  const logs = (state.auditLogs || []).slice(0, 6);
  if (!logs.length) return '<div class="dashboard-empty">Chưa có hoạt động mới được ghi nhận.</div>';
  return `<ol class="dashboard-activity-list">${logs.map((a, index) => `<li><span class="dashboard-activity-icon dashboard-activity-icon--${index % 4}">${dashboardIcon("activity")}</span><div><b>${esc(a.summary)}</b><small>${esc(a.user || "")} · ${dateTimeVN(a.at)}</small></div></li>`).join("")}</ol>`;
}

function dashboardFunnel(leads) {
  const stages = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST", "UNQUALIFIED"].filter((x) => leadLabels[x]);
  const max = Math.max(1, ...stages.map((st) => leads.filter((l) => l.status === st).length));
  return `<div class="funnel">${stages.map((st) => { const n = leads.filter((l) => l.status === st).length; return `<div class="funnel-row"><span>${leadLabels[st]}</span><div class="bar"><i style="width:${Math.round((n / max) * 100)}%"></i></div><b>${n}</b></div>`; }).join("")}</div>`;
}

const dashPanel = (title, sub, body, extra = "") => `<article class="dashboard-panel"><header><div><h2>${title}</h2><p>${sub}</p></div>${extra}</header>${body}</article>`;

function dashShell(eyebrow, heading, desc, actions, kpis, body) {
  return `<div class="dashboard-page"><header class="dashboard-heading"><div><span class="dashboard-eyebrow">TYPICONE ERP / ${eyebrow}</span><h1>${heading}</h1><p>${desc}</p></div><div class="dashboard-heading-actions">${actions}</div></header><section class="dashboard-kpi-grid">${kpis}</section>${body}</div>`;
}

/* Doanh thu tháng này so với tháng trước và mục tiêu tháng (cài đặt chính sách). */
function dashboardTarget(bs, allBookings) {
  const a = bs.reduce((n, booking) => n + dashRevenue(booking), 0);
  const from = new Date(dashboardDateFrom + "T00:00:00"), to = new Date(dashboardDateTo + "T00:00:00");
  const days = Math.round((to - from) / 864e5) + 1;
  const previousTo = new Date(from); previousTo.setDate(previousTo.getDate() - 1);
  const previousFrom = new Date(previousTo); previousFrom.setDate(previousFrom.getDate() - days + 1);
  const b = allBookings.filter((booking) => {
    const value = String(booking.start || "").slice(0, 10);
    return value >= dashboardDateISO(previousFrom) && value <= dashboardDateISO(previousTo);
  }).reduce((n, booking) => n + dashRevenue(booking), 0);
  /* Mục tiêu tháng nhập bằng VND trong Cài đặt; quy đổi theo tỷ giá hiện hành để so với doanh thu USD. */
  const target = dashboardDateLabel === "Tháng này" ? fxLedgerNumber(null, Number(policy().monthlyTarget || 0)) : 0;
  const mom = b ? ((a - b) / b) * 100 : null, pct = target ? Math.min(100, Math.round((a / target) * 100)) : 0;
  const momHtml = mom === null ? '<span class="sub">Kỳ trước chưa có doanh thu</span>' : `<span class="dashboard-kpi-trend dashboard-kpi-trend--${mom >= 0 ? "up" : "down"}">${mom >= 0 ? "↑" : "↓"} ${Math.abs(mom).toFixed(1)}%</span><span class="sub"> so với kỳ trước (${fxLedgerShort(b)})</span>`;
  const targetHtml = target ? `<div class="target-bar"><span style="width:${pct}%"></span></div><div class="target-meta"><b>${pct}%</b> mục tiêu ${fxLedgerShort(target)} · còn thiếu ${fxLedgerShort(Math.max(0, target - a))}</div>` : `<p class="sub">Chưa đặt mục tiêu doanh thu tháng. ${can("all") ? btn("Đặt mục tiêu", "go('settings')", "small") : ""}</p>`;
  return `<section class="dashboard-panel target-panel"><header><div><h2>Doanh thu ${dashboardDateLabel.toLowerCase()}</h2><p>${fmt(dashboardDateFrom)} – ${fmt(dashboardDateTo)}</p></div><span class="dashboard-panel-chip">${bs.length} booking</span></header><div class="target-body"><div class="target-value"><strong>${fxLedgerShort(a)}</strong>${momHtml}</div><div class="target-progress">${target ? targetHtml : '<p class="sub">Giá trị booking theo ngày khởi hành.</p>'}</div></div></section>`;
}

function dashboardCeo() {
  const allBs = dashLive();
  const bs = dashboardFilterDate(allBs);
  const revenue = bs.reduce((n, b) => n + dashRevenue(b), 0);
  const profit = bs.reduce((n, b) => n + dashProfit(b), 0);
  const running = bs.filter((b) => b.status === "Running");
  const preparing = bs.filter((b) => b.status === "Preparing");
  const receivable = bs.reduce((n, b) => n + dashBalance(b), 0);
  const unpaid = (state.payables || []).filter((p) => p.status !== "Paid");
  const payable = fxLedgerTotal(unpaid, (p) => findBooking(p.booking), (p) => Number(p.amount || 0));
  const pendingApprovals = (state.approvals || []).filter((a) => a.status === "PENDING").length;
  const feedback = bs.filter((b) => b.feedback);
  const csat = feedback.length ? (feedback.reduce((n, b) => n + Number(b.feedback.score || 0), 0) / feedback.length).toFixed(1) : "—";
  return dashShell(
    "TỔNG QUAN",
    "Trung tâm điều hành doanh nghiệp",
    "Kinh doanh, tour, dòng tiền và các việc chờ Giám đốc quyết định.",
    `${dashboardDateControl()}<button class="btn" onclick="exportData('bookings')">Xuất dữ liệu</button><button class="btn primary" onclick="go('approvals')">Phê duyệt${pendingApprovals ? " (" + pendingApprovals + ")" : ""}</button>`,
    dashboardKpi("blue", "revenue", "Giá trị booking", fxLedgerShort(revenue), bs.length + " booking", "bookings", dashboardMonthlyRevenue(bs).map((i) => i.value)) +
      dashboardKpi("violet", "profit", "Lợi nhuận", fxLedgerShort(profit), revenue ? (profit / revenue * 100).toFixed(1) + "% biên gộp" : "Chưa có doanh thu", "accounting", bs.map(dashProfit)) +
      dashboardKpi("orange", "tour", "Tour đang vận hành", running.length, preparing.length + " tour chuẩn bị", "operations") +
      dashboardKpi("cyan", "guests", "Khách đang đi tour", running.reduce((n, b) => n + Number(b.pax || 0), 0), "Trên tour đang chạy", "operations") +
      dashboardKpi("red", "receivable", "Phải thu", fxLedgerShort(receivable), "Còn phải thu từ khách", "accounting", bs.map(dashBalance)) +
      dashboardKpi("amber", "payable", "Phải trả", fxLedgerShort(payable), unpaid.filter((p) => p.due < todayISO()).length + " khoản quá hạn", "accounting"),
    dashboardTarget(bs, allBs) + `<section class="dashboard-grid dashboard-grid--charts"><article class="dashboard-panel dashboard-panel--wide"><header><div><h2>Doanh thu theo thời gian</h2><p>Booking trong khoảng ngày đã chọn</p></div></header>${dashboardRevenueChart(bs)}</article>${dashPanel("Trạng thái booking", "Cơ cấu trong khoảng đã chọn", dashboardStatusChart(bs))}</section>
    <section class="dashboard-grid dashboard-grid--operations">${dashPanel("Việc cần làm", "Xếp theo mức ưu tiên", dashboardQueue(), `<span class="dashboard-count-badge">${workQueue().length}</span>`)}${dashPanel("Hiệu suất kinh doanh", "Doanh thu theo Sales", dashboardSalesPerformance(bs))}${dashPanel("Hoạt động gần đây", "Nhật ký hệ thống", dashboardActivities())}</section>
    <section class="dashboard-health"><div><span>Lead / Báo giá</span><b>${state.leads.length} / ${state.quotes.length}</b><small>Kinh doanh</small></div><div><span>Dịch vụ chờ xác nhận</span><b>${bs.filter((b) => b.status === "Preparing").reduce((n, b) => n + dashPending(b), 0)}</b><small>Điều hành</small></div><div><span>Sự cố đang mở</span><b>${state.issues.filter((i) => i.status !== "Resolved").length}</b><small>Nhà cung cấp & HDV</small></div><div><span>CSAT</span><b>${csat}${csat === "—" ? "" : " / 5"}</b><small>${feedback.length} phản hồi</small></div><div><span>Chiến dịch</span><b>${state.campaigns.length}</b><small>Marketing</small></div></section>`,
  );
}

function dashboardMarketing() {
  const leads = scopedLeads();
  const campaigns = state.campaigns;
  const spend = campaigns.reduce((n, c) => n + (c.spend || 0), 0);
  const won = leads.filter((l) => l.status === "WON").length;
  const bad = leads.filter((l) => l.status === "UNQUALIFIED").length;
  return dashShell(
    "MARKETING",
    "Hiệu quả tiếp thị",
    "Lead theo chiến dịch, chi phí và tỷ lệ chuyển đổi.",
    `<button class="btn primary" onclick="campaignForm()">+ Chiến dịch</button>`,
    dashboardKpi("blue", "guests", "Lead", leads.length, "Gắn với chiến dịch", "crm") +
      dashboardKpi("violet", "revenue", "Ngân sách đã chi", short(spend), campaigns.length + " chiến dịch", "marketing") +
      dashboardKpi("orange", "profit", "Chi phí / lead", money(leads.length ? Math.round(spend / leads.length) : 0), "CPL trung bình", "marketing") +
      dashboardKpi("cyan", "tour", "Lead chốt đơn", won, leads.length ? Math.round((won / leads.length) * 100) + "% chuyển đổi" : "—", "crm") +
      dashboardKpi("red", "alert", "Lead không đạt", bad, "Loại khỏi phễu", "crm"),
    `<section class="dashboard-grid dashboard-grid--operations">${dashPanel("Phễu lead", "Theo trạng thái", dashboardFunnel(leads))}${dashPanel("Việc cần làm", "Ưu tiên", dashboardQueue())}${dashPanel("Nội dung", "Kế hoạch gần đây", state.contents.slice(0, 5).map((c) => line(esc(c.title), c.status === "Published" ? "Đã đăng" : c.status === "Scheduled" ? "Đã lên lịch" : "Bản nháp")).join("") || '<div class="dashboard-empty">Chưa có nội dung.</div>')}</section>`,
  );
}

function dashboardSales() {
  const leads = scopedLeads();
  const mine = scopedBookings();
  const quotes = scopedQuotes();
  const open = leads.filter((l) => !["WON", "LOST", "UNQUALIFIED"].includes(l.status));
  const revenue = mine.filter((b) => b.status !== "Cancelled").reduce((n, b) => n + dashRevenue(b), 0);
  return dashShell(
    "KINH DOANH",
    "Bàn làm việc Sales",
    "Lead đang chăm sóc, báo giá chờ phản hồi và booking đang chờ cọc.",
    `<button class="btn primary" onclick="navigate('crm',{crmTab:'leads'})">Mở Leads</button>`,
    dashboardKpi("blue", "guests", "Lead đang mở", open.length, leads.length + " lead phụ trách", "crm") +
      dashboardKpi("violet", "revenue", "Báo giá đang chờ", quotes.filter((q) => ["Sent", "PendingApproval"].includes(q.status)).length, "Cần theo dõi", "quotes") +
      dashboardKpi("orange", "tour", "Booking chờ cọc", mine.filter((b) => ["PendingDeposit", "PendingApproval"].includes(b.status)).length, "Chờ kế toán xác nhận", "bookings") +
      dashboardKpi("cyan", "profit", "Doanh thu booking", fxLedgerShort(revenue), mine.length + " booking", "bookings"),
    `<section class="dashboard-grid dashboard-grid--operations">${dashPanel("Phễu bán hàng", "Lead của bạn", dashboardFunnel(leads))}${dashPanel("Việc cần làm", "Chăm sóc & báo giá", dashboardQueue(), `<span class="dashboard-count-badge">${workQueue().length}</span>`)}${dashPanel("Booking của tôi", "Mới nhất", mine.slice(-5).reverse().map((b) => `<div class="metricline"><span>${entityLink("booking", b.id)} ${bookingBadge(b)}</span><b>${esc(b.client)}</b></div>`).join("") || '<div class="dashboard-empty">Chưa có booking.</div>')}</section>`,
  );
}

function dashboardOps() {
  const bs = dashLive();
  const active = bs.filter((b) => ["Preparing", "Running"].includes(b.status));
  const issues = state.issues.filter((i) => i.status !== "Resolved");
  const waiting = active.filter((b) => b.status === "Preparing").reduce((n, b) => n + dashPending(b), 0);
  const noGuide = active.filter((b) => b.status === "Preparing" && !b.guide).length;
  return dashShell(
    "ĐIỀU HÀNH",
    "Bảng điều hành tour",
    "Tour cần chuẩn bị, dịch vụ chờ nhà cung cấp, HDV và sự cố.",
    `<button class="btn primary" onclick="go('operations')">Trung tâm điều hành</button>`,
    dashboardKpi("blue", "tour", "Tour đang chạy", bs.filter((b) => b.status === "Running").length, "Đang diễn ra", "operations") +
      dashboardKpi("orange", "tour", "Tour chuẩn bị", bs.filter((b) => b.status === "Preparing").length, "Đã nhận bàn giao", "operations") +
      dashboardKpi("amber", "alert", "Dịch vụ chờ NCC", waiting, "Chưa xác nhận", "operations") +
      dashboardKpi("violet", "guests", "Tour thiếu HDV", noGuide, "Cần phân công", "guides") +
      dashboardKpi("red", "alert", "Sự cố đang mở", issues.length, "Cần xử lý", "operations"),
    `<section class="dashboard-panel dashboard-panel--tours"><header><div><h2>Tour cần chuẩn bị</h2><p>Theo tiến độ xác nhận dịch vụ</p></div><button class="btn small" onclick="go('operations')">Xem tất cả</button></header>${dashboardPreparation(bs)}</section>
    <section class="dashboard-grid dashboard-grid--operations">${dashPanel("Việc cần làm", "Ưu tiên", dashboardQueue(), `<span class="dashboard-count-badge">${workQueue().length}</span>`)}${dashPanel("Hoạt động gần đây", "Nhật ký", dashboardActivities())}</section>`,
  );
}

function dashboardAccounting() {
  const t = accountingTotals();
  const bs = dashLive();
  const need = bs.filter((b) => b.status === "PendingDeposit");
  const toSettle = bs.filter((b) => b.status === "Completed" && !b.settlement);
  const overdue = state.invoices.filter((i) => i.paid < i.amount && i.due && i.due < todayISO());
  return dashShell(
    "KẾ TOÁN",
    "Bảng tài chính",
    "Thu cọc, công nợ, chi nhà cung cấp và quyết toán.",
    `<button class="btn primary" onclick="go('accounting')">Mở Kế toán</button>`,
    dashboardKpi("blue", "revenue", "Đã thu", fxLedgerShort(t.received), "Tiền khách đã trả", "accounting") +
      dashboardKpi("red", "receivable", "Phải thu", fxLedgerShort(t.receivable), overdue.length + " hóa đơn quá hạn", "accounting", bs.map(dashBalance)) +
      dashboardKpi("amber", "payable", "Phải trả", fxLedgerShort(t.payable), "NCC & hoàn tiền", "accounting") +
      dashboardKpi("orange", "alert", "Booking chờ cọc", need.length, "Cần phát hành / xác nhận", "accounting") +
      dashboardKpi("violet", "profit", "Chờ quyết toán", toSettle.length, "Tour đã kết thúc", "accounting"),
    `<section class="dashboard-grid dashboard-grid--operations">${dashPanel("Việc cần làm", "Ưu tiên", dashboardQueue(), `<span class="dashboard-count-badge">${workQueue().length}</span>`)}${dashPanel("Dòng tiền gần đây", "Giao dịch mới nhất", state.transactions.slice(0, 6).map((x) => `<div class="metricline"><span>${x.type === "IN" ? badge("Thu", "green") : badge("Chi", "amber")} ${esc(x.ref)}</span><b>${fxLedgerMoney(findBooking(x.ref), x.amount)}</b></div>`).join("") || '<div class="dashboard-empty">Chưa có giao dịch.</div>')}</section>`,
  );
}

views.dashboard = () => {
  if (can("all") || can("approvals_manage")) return dashboardCeo();
  if (can("accounting_manage")) return dashboardAccounting();
  if (can("operations_manage")) return dashboardOps();
  if (can("bookings_manage")) return dashboardSales();
  if (can("marketing_manage")) return dashboardMarketing();
  return dashboardCeo();
};
