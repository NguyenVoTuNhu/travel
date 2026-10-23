/* MODULE mod-accounting — hóa đơn, thu tiền, công nợ, chi NCC, VAT, quyết toán tour. */

let accountingTab = "overview";

/* ---------- Khóa sổ theo tháng ---------- */
const lockedThrough = () => policy().lockedThrough || "";
const periodLocked = (iso) => !!(lockedThrough() && iso && String(iso).slice(0, 7) <= lockedThrough());
const lockMsg = (iso) => toast(`Kỳ ${String(iso).slice(0, 7)} đã khóa sổ — không thể thêm hoặc sửa số liệu của kỳ này.`);
function closePeriod(e) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const m = new FormData(e.target).get("month");
  if (!m || m >= todayISO().slice(0, 7)) return toast("Chỉ khóa sổ các tháng đã kết thúc.");
  const open = state.bookings.filter((b) => b.status === "Completed" && !b.settlement && String(b.end).slice(0, 7) <= m);
  if (open.length) return toast(`Còn ${open.length} tour kết thúc trong kỳ chưa quyết toán (${open.map((b) => b.id).join(", ")}).`);
  if (!state.settings.length) state.settings.push({ id: "CFG-1" });
  state.settings[0].policy = { ...(state.settings[0].policy || {}), lockedThrough: m };
  audit("settings", "period", "LOCK", `Khóa sổ đến hết tháng ${m}`);
  save(); render(); toast("Đã khóa sổ đến hết tháng " + m + ".");
}
function reopenPeriod() {
  if (!requireCapability("all", "Chỉ Giám đốc được mở khóa sổ.")) return;
  state.settings[0].policy = { ...(state.settings[0].policy || {}), lockedThrough: "" };
  audit("settings", "period", "UNLOCK", "Mở khóa sổ");
  save(); render(); toast("Đã mở khóa sổ.");
}

/* ---------- Lãi / lỗ theo tour ---------- */
function pnlRows() {
  return state.bookings.filter((b) => b.status !== "Cancelled").map((b) => {
    const s = settlementFigures(b), done = !!b.settlement;
    const revenue = done ? b.settlement.revenue : s.revenue, cost = done ? b.settlement.actualCost : s.actualCost;
    const revenueU = fxLedgerNumber(b, revenue);
    const costU = fxLedgerNumber(b, cost);
    return {
      b,
      revenue,
      cost,
      profit: revenue - cost,
      revenueU,
      costU,
      profitU: revenueU - costU,
      margin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
      done,
    };
  });
}
function exportPnl() {
  const unit = fxLedgerCode();
  const cents = (n) => Math.round(n * 100) / 100;
  const head = ["Booking", "Khách", "Tour", "Khởi hành", `Thực thu (${unit})`, `Chi phí (${unit})`, `Lợi nhuận (${unit})`, "Biên %", "Đã quyết toán"];
  const body = pnlRows().map((r) => [r.b.id, r.b.client, r.b.tour, r.b.start, cents(r.revenueU), cents(r.costU), cents(r.profitU), r.margin.toFixed(1), r.done ? "Có" : "Chưa"]);
  const rows = [head].concat(body);
  downloadFile(`lai-lo-theo-tour-${todayISO()}.csv`, "\uFEFF" + rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv;charset=utf-8");
}
function accountingPnlTab() {
  const rows = pnlRows();
  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  const byMonth = {};
  rows.forEach((r) => { const m = String(r.b.start).slice(0, 7); (byMonth[m] ||= { revenue: 0, cost: 0, profit: 0, n: 0 }); byMonth[m].revenue += r.revenueU; byMonth[m].cost += r.costU; byMonth[m].profit += r.profitU; byMonth[m].n++; });
  const lock = lockedThrough();
  const lockUi = can("accounting_manage") ? `<form class="filters" onsubmit="closePeriod(event)"><label>Khóa sổ đến hết tháng <input type="month" name="month" max="${addDaysSafe(todayISO().slice(0, 7) + "-01", -1).slice(0, 7)}" required></label><button class="btn small primary">Khóa sổ</button>${lock && can("all") ? btn("Mở khóa", "reopenPeriod()", "small") : ""}</form>` : "";
  return `<div class="stats stats--compact">${stat("THỰC THU", fxLedgerShort(sum("revenueU")), rows.length + " tour")}${stat("CHI PHÍ", fxLedgerShort(sum("costU")), "Thực tế hoặc dự toán")}${stat("LỢI NHUẬN", fxLedgerShort(sum("profitU")), sum("revenueU") ? ((sum("profitU") / sum("revenueU")) * 100).toFixed(1) + "% biên" : "—")}${stat("KỲ KHÓA SỔ", lock || "Chưa khóa", lock ? "Đã khóa đến hết " + lock : "Có thể khóa các tháng đã qua")}</div>` +
    card("Lãi / lỗ theo tháng khởi hành", lockUi + table(["THÁNG", "SỐ TOUR", "THỰC THU", "CHI PHÍ", "LỢI NHUẬN", "KỲ"], Object.entries(byMonth).sort().map(([m, v]) => `<tr><td><b>${m}</b></td><td>${v.n}</td><td>${fxLedgerText(v.revenue)}</td><td>${fxLedgerText(v.cost)}</td><td><b class="${v.profit >= 0 ? "moneypositive" : "text-bad"}">${fxLedgerText(v.profit)}</b></td><td>${m <= lock ? badge("Đã khóa", "red") : badge("Đang mở", "green")}</td></tr>`))) +
    card("Lãi / lỗ theo tour", rows.length ? table(["BOOKING", "KHÁCH", "THỰC THU", "CHI PHÍ", "LỢI NHUẬN", "BIÊN", "TÌNH TRẠNG"], rows.map((r) => `<tr><td>${entityLink("booking", r.b.id)}<span class="sub">${esc(r.b.tour)}</span></td><td>${esc(r.b.client)}</td><td>${fxLedgerText(r.revenueU)}</td><td>${fxLedgerText(r.costU)}</td><td><b class="${r.profitU >= 0 ? "moneypositive" : "text-bad"}">${fxLedgerText(r.profitU)}</b></td><td>${badge(r.margin.toFixed(1) + "%", r.margin < policy().minMarginPct ? "red" : "green")}</td><td>${r.done ? badge("Đã quyết toán", "green") : badge("Tạm tính", "amber")}</td></tr>`)) : '<div class="empty">Chưa có dữ liệu.</div>', btn("Xuất CSV", "exportPnl()", "small"));
}
let cashFrom = "";
let cashTo = "";
let cashPeriod = "day";

const accountingMonthStart = () => todayISO().slice(0, 8) + "01";
const accountingMonthEnd = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("en-CA");
};

const supplierPayables = () => (state.payables || []).filter((p) => p.kind !== "REFUND");
const refundPayables = () => (state.payables || []).filter((p) => p.kind === "REFUND");
const payableLabels = { Pending: "Chờ duyệt chi", Approved: "Đã duyệt, chờ chi", Paid: "Đã chi tiền" };
const invoiceOutstanding = (i) => Math.max(0, i.amount - (i.paid || 0));
const invoiceTypeLabels = { Deposit: "Đặt cọc", Final: "Thanh toán còn lại", Settlement: "Quyết toán" };

function invoiceStatusBadge(i) {
  if (i.paid >= i.amount) return badge("Đã thanh toán", "green");
  if (i.due && i.due < todayISO()) return badge("Quá hạn", "red");
  return badge(i.paid > 0 ? "Thanh toán một phần" : "Chờ thanh toán", "amber");
}

/* ---------- Tổng hợp số liệu ---------- */
/* Các tổng ở tiền của sổ (USD khi đã có tỷ giá): mỗi khoản quy đổi theo tỷ giá của booking của nó. */
function accountingTotals() {
  const live = state.bookings.filter((b) => b.status !== "Cancelled");
  const payables = state.payables || [];
  const unpaid = payables.filter((p) => p.status !== "Paid");
  const paid = payables.filter((p) => p.status === "Paid");
  const bookingOf = (b) => b;
  const payableBooking = (p) => findBooking(p.booking);
  const received = fxLedgerTotal(state.bookings, bookingOf, (b) => b.received || 0);
  const refunded = fxLedgerTotal(state.bookings, bookingOf, (b) => b.refunded || 0);
  const receivable = fxLedgerTotal(live, bookingOf, (b) => balance(b));
  const payable = fxLedgerTotal(unpaid, payableBooking, (p) => p.amount);
  const paidOut = fxLedgerTotal(paid, payableBooking, (p) => p.amount);
  return { received, refunded, receivable, payable, paidOut, net: received - paidOut };
}

/* ---------- Nhận tiền ---------- */
function applyReceipt(b, amount, method, invoiceId = "", paid = null) {
  b.received = (b.received || 0) + amount;
  let left = amount;
  const open = bookingInvoices(b)
    .filter((i) => i.paid < i.amount)
    .sort((a, c) => (a.id === invoiceId ? -1 : c.id === invoiceId ? 1 : (a.due || "").localeCompare(c.due || "")));
  for (const i of open) {
    if (left <= 0) break;
    const allocate = Math.min(left, i.amount - i.paid);
    i.paid += allocate;
    i.paidAt = todayISO();
    left -= allocate;
  }
  const tx = {
    id: nextBusinessId("transactions"),
    type: "IN",
    ref: b.id,
    invoice: invoiceId || open[0]?.id || "",
    amount,
    currency: paid?.currency || "VND",
    original: paid?.original ?? amount,
    method,
    date: todayISO(),
    time: new Date().toLocaleString("vi-VN"),
    by: actor().name,
  };
  state.transactions.unshift(tx);
  state.docs.push({ id: nextBusinessId("docs"), booking: b.id, type: "Receipt", name: "Phiếu thu " + tx.id, date: todayISO(), generated: true });
  audit("booking", b.id, "PAYMENT", `${b.id}: kế toán ghi nhận thu ${fxLedgerMoney(b, amount)} (${method})`);
  const confirmed = reevaluateBookingPayment(b);
  return confirmed;
}

/* Công nợ còn lẻ dưới 1 xu USD (do làm tròn VND) vẫn hiện là 0,01 USD: số nhập chênh dưới 1 xu so với công nợ thì coi là thu đủ. */
function nearBalance(b, usd, vnd) {
  const rate = fxRate(fxDisplayCurrency, fxEntryOf(b));
  if (Math.abs(vnd - balance(b)) <= 1) return true;
  return !!rate && Math.abs(usd - balance(b) / rate) < 0.0099;
}

/* Tiền khách có thể trả: USD (tiền ghi sổ), EUR, CAD, VND theo bảng tỷ giá hôm nay; chưa có tỷ giá thì chỉ VND. */
function receiptCurrencies() {
  if (!fxLedgerReady()) return ["VND"];
  return fxPinnedCurrencies.filter((code) => code === "VND" || fxRate(code));
}

/* Số khách trả (tiền `code`) → VND ghi sổ: đổi sang USD theo tỷ giá hôm nay, rồi sang VND theo tỷ giá của booking. */
function receiptVnd(b, original, code) {
  if (!fxLedgerReady()) return Math.round(original);
  const entry = fxEntryOf(b);
  const usd = code === fxDisplayCurrency ? original : fxConvert(original, code, fxDisplayCurrency, fxCurrent());
  if (usd === null) return 0;
  const vnd = fxToVnd(usd, fxDisplayCurrency, entry);
  return nearBalance(b, usd, vnd) ? balance(b) : vnd;
}

/* Đổi tiền trong form thu: tính lại số tiền từ số USD còn phải thu. */
function receiveCurrencyChange(select) {
  const form = select.form;
  const usd = Number(form.dataset.usd);
  const value = fxConvert(usd, fxDisplayCurrency, select.value, fxCurrent());
  if (value === null) return;
  form.elements.amount.value = select.value === "VND" ? Math.round(value) : Math.round(value * 100) / 100;
}

function receiveForm(id, invoiceId = "") {
  const b = findBooking(id);
  if (!b) return;
  const invs = bookingInvoices(b).filter((i) => i.paid < i.amount);
  const preset = invoiceId ? findInvoice(invoiceId) : null;
  const defaultVnd = preset ? invoiceOutstanding(preset) : Math.min(balance(b), invs[0] ? invoiceOutstanding(invs[0]) : balance(b));
  const codes = receiptCurrencies();
  const smallest = codes[0] === "VND" ? 1 : 0.01;
  const defaultAmount = defaultVnd > 0 ? Math.max(smallest, fxFromVnd(defaultVnd, codes[0], fxEntryOf(b))) : 0;
  const currencyOptions = codes.map((code) => `<option value="${esc(code)}">${esc(code)}</option>`).join("");
  const outstandingOf = (i) => fxLedgerMoney(b, invoiceOutstanding(i));
  modal(
    "Ghi nhận thu tiền · " + id,
    `<form data-usd="${defaultAmount}" onsubmit="receiveMoney(event,'${id}')">${line("Khách", esc(b.client))}${line("Giá trị hợp đồng", fxLedgerMoney(b, b.revenue))}${line("Đã thu", fxLedgerMoney(b, b.received || 0))}${line("Còn phải thu", `<b>${fxLedgerMoney(b, balance(b))}</b>`)}
    <div class="formgrid" style="margin-top:14px"><label>Khách trả bằng<select name="currency" onchange="receiveCurrencyChange(this)">${currencyOptions}</select></label><label>Số tiền thu<input name="amount" type="number" min="0.01" step="any" value="${defaultAmount}" required></label><label>Phương thức<select name="method"><option>Chuyển khoản</option><option>Tiền mặt</option><option>Thẻ</option></select></label>
    <label class="full">Thu cho hóa đơn<select name="invoice"><option value="">Tự phân bổ theo hạn</option>${invs.map((i) => `<option value="${i.id}" ${i.id === invoiceId ? "selected" : ""}>${i.id} · ${invoiceTypeLabels[i.type] || i.type} · còn ${outstandingOf(i)}</option>`).join("")}</select></label></div>
    <div class="notice">Sổ ghi bằng USD. Khách trả EUR/CAD/VND thì quy đổi sang USD theo tỷ giá VCB hôm nay.</div>
    ${b.status === "PendingDeposit" ? `<div class="notice">Khi tổng đã thu đạt mức đặt cọc yêu cầu (${fxLedgerMoney(b, depositRequired(b))}), booking tự chuyển sang <b>Đã xác nhận</b> và bàn giao cho Điều hành.</div>` : ""}
    <div class="formfooter"><button class="btn primary" type="submit">Xác nhận đã nhận tiền</button></div></form>`,
    true,
  );
}

function receiveMoney(e, id) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const b = findBooking(id);
  const f = new FormData(e.target);
  const code = String(f.get("currency") || "VND");
  const original = +f.get("amount");
  if (b.status === "Cancelled") return toast("Booking đã hủy, không thể thu thêm.");
  if (!Number.isFinite(original) || original <= 0) return toast("Số tiền phải lớn hơn 0.");
  const amount = receiptVnd(b, original, code);
  if (!amount || amount > balance(b)) return toast("Số tiền phải lớn hơn 0 và không vượt công nợ.");
  const confirmed = applyReceipt(b, amount, f.get("method"), f.get("invoice"), { currency: code, original });
  save();
  closeModal();
  render();
  toast(confirmed ? "Đã nhận tiền. Booking chuyển sang Đã xác nhận và bàn giao cho Điều hành." : "Đã ghi nhận thu " + fxLedgerMoney(b, amount) + ".");
  if (document.querySelector(".booking360")) openBooking(id);
}

/* ---------- Hóa đơn khách hàng ---------- */
function depositInvoiceForm(id) {
  const b = findBooking(id);
  const need = depositRequired(b);
  if (!need) return toast("Booking này không yêu cầu đặt cọc.");
  invoiceForm(id, "Deposit", Math.max(0, need - (b.received || 0)));
}

function invoiceForm(id = "", type = "", amount = "") {
  const options = state.bookings.filter((b) => b.status !== "Cancelled" && balance(b) > 0);
  if (!options.length) return toast("Không có booking nào còn công nợ để xuất hóa đơn.");
  const selected = id && options.find((b) => b.id === id) ? id : options[0].id;
  const b = findBooking(selected);
  const defType = type || (b.status === "PendingDeposit" ? "Deposit" : "Final");
  const defVnd = amount !== "" ? amount : defType === "Deposit" ? Math.max(0, depositRequired(b) - (b.received || 0)) : balance(b);
  const code = fxLedgerReady() ? fxDisplayCurrency : "VND";
  const defAmount = fxFromVnd(defVnd, code, fxEntryOf(b));
  const step = code === "VND" ? "1" : "any";
  modal(
    "Tạo hóa đơn khách hàng",
    `<form onsubmit="createInvoice(event)"><div class="formgrid"><label class="full">Booking<select name="booking" ${id ? "" : ""}>${options.map((x) => `<option value="${x.id}" ${x.id === selected ? "selected" : ""}>${x.id} · ${esc(x.client)} · còn ${fxLedgerMoney(x, balance(x))}</option>`).join("")}</select></label><label>Loại<select name="type">${["Deposit", "Final"].map((t) => `<option value="${t}" ${t === defType ? "selected" : ""}>${invoiceTypeLabels[t]}</option>`).join("")}</select></label><label>Số tiền (${code})<input name="amount" type="number" min="0.01" step="${step}" value="${defAmount}" required></label><label>Hạn thanh toán<input name="due" type="date" value="${addDays(todayISO(), 3)}" required></label></div><div class="notice">Mức cọc đề xuất theo chính sách: ${policy().depositPct}% giá trị hợp đồng. Hóa đơn ghi bằng ${code}. Tổng hóa đơn chưa thu không được vượt công nợ.</div><div class="formfooter"><button class="btn primary">Phát hành hóa đơn</button></div></form>`,
    true,
  );
}

/* Số nhập trên form hóa đơn (USD khi đã có tỷ giá, không thì VND) → VND ghi sổ theo tỷ giá của booking. */
function invoiceVnd(b, input) {
  if (!fxLedgerReady()) return Math.round(input);
  const vnd = fxToVnd(input, fxDisplayCurrency, fxEntryOf(b));
  return nearBalance(b, input, vnd) ? balance(b) : vnd;
}

function createInvoice(e) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const f = new FormData(e.target);
  const b = findBooking(f.get("booking"));
  const input = +f.get("amount");
  if (!Number.isFinite(input) || input <= 0) return toast("Số tiền hóa đơn phải lớn hơn 0.");
  const amount = invoiceVnd(b, input);
  const outstanding = bookingInvoices(b).reduce((n, i) => n + invoiceOutstanding(i), 0);
  if (amount + outstanding > balance(b) + 1) return toast("Tổng hóa đơn chưa thu không được vượt công nợ booking.");
  if (periodLocked(f.get("due"))) return lockMsg(f.get("due"));
  const inv = {
    id: nextBusinessId("invoices", f.get("due")),
    booking: b.id,
    type: f.get("type"),
    amount,
    paid: 0,
    due: f.get("due"),
    issuedAt: todayISO(),
    issuedBy: actor().name,
  };
  state.invoices.push(inv);
  state.docs.push({ id: nextBusinessId("docs"), booking: b.id, type: "Invoice", name: inv.id, date: todayISO(), generated: true });
  audit("booking", b.id, "INVOICE", `${b.id}: phát hành hóa đơn ${inv.id} ${fxLedgerMoney(b, amount)}`);
  closeModal();
  render();
  toast("Đã phát hành hóa đơn " + inv.id + ".");
  if (document.querySelector(".booking360")) openBooking(b.id, "finance");
}

function openInvoice(id) {
  const i = findInvoice(id);
  if (!i) return;
  const b = findBooking(i.booking);
  const txs = state.transactions.filter((t) => t.invoice === id);
  modal(
    "Hóa đơn " + id,
    card("Thông tin", line("Booking", entityLink("booking", i.booking)) + line("Khách hàng", esc(b?.client || "—")) + line("Loại", invoiceTypeLabels[i.type] || i.type) + line("Giá trị", fxLedgerMoney(b, i.amount)) + line("Đã thu", fxLedgerMoney(b, i.paid || 0)) + line("Còn lại", `<b>${fxLedgerMoney(b, invoiceOutstanding(i))}</b>`) + line("Hạn thanh toán", fmt(i.due)) + line("Trạng thái", invoiceStatusBadge(i))) +
      card("Lịch sử thu", txs.map((t) => `<div class="metricline"><span>${esc(t.time)} · ${esc(t.method || "")}</span><b>${fxTxMoney(b, t)}</b></div>`).join("") || '<p class="sub">Chưa có khoản thu.</p>') +
      `<div class="formfooter">${btn("In hóa đơn", `printInvoice('${id}')`)}${can("accounting_manage") && i.paid < i.amount && b?.status !== "Cancelled" ? btn("Ghi nhận thu", `receiveForm('${i.booking}','${id}')`, "primary") : ""}</div>`,
  );
}

function printInvoice(id) {
  const i = findInvoice(id);
  const b = findBooking(i.booking);
  printable("Hóa đơn " + id, `<h2>${esc(b.tour)}</h2><p>Khách hàng: ${esc(b.client)}<br>Booking: ${b.id}<br>Loại: ${invoiceTypeLabels[i.type] || i.type}<br>Hạn thanh toán: ${fmt(i.due)}</p><table><tr><th>Giá trị</th><th>Đã thu</th><th>Còn lại</th></tr><tr><td>${fxDual(i.amount, fxEntryOf(b))}</td><td>${fxDual(i.paid || 0, fxEntryOf(b))}</td><td>${fxDual(invoiceOutstanding(i), fxEntryOf(b))}</td></tr></table>`);
}

/* ---------- Công nợ phải trả NCC ---------- */
function payableForm(bookingId = "") {
  const bs = state.bookings.filter((b) => b.status !== "Cancelled");
  const code = fxLedgerCode();
  modal(
    "Nhập hóa đơn nhà cung cấp",
    `<form onsubmit="createPayable(event)"><div class="formgrid"><label class="full">Booking<select name="booking" required>${bs.map((b) => `<option value="${b.id}" ${b.id === bookingId ? "selected" : ""}>${b.id} · ${esc(b.tour)}</option>`).join("")}</select></label><label>Nhà cung cấp<select name="supplier" required>${state.suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label><label>Số hóa đơn NCC${field("invoiceNo", "text", "", true)}</label><label>Số tiền (${code})<input name="amount" type="number" min="0.01" step="any" required></label><label>VAT đầu vào (%)<input name="vat" type="number" min="0" max="100" step="0.1" value="0"></label><label>Hạn thanh toán<input name="due" type="date" value="${addDays(todayISO(), 14)}" required></label></div><div class="notice">Số tiền nhập bằng ${code}, ghi sổ theo tỷ giá ngày chốt báo giá của booking. Nếu tổng chi cho booking vượt dự toán quá ${policy().costOverrunPct}%, khoản chi phải được Giám đốc phê duyệt trước khi duyệt chi.</div><div class="formfooter"><button class="btn primary">Lưu hóa đơn NCC</button></div></form>`,
    true,
  );
}

function createPayable(e) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const f = new FormData(e.target);
  const b = findBooking(f.get("booking"));
  const input = +f.get("amount");
  if (!Number.isFinite(input) || input <= 0) return toast("Số tiền không hợp lệ.");
  const amount = fxLedgerInputVnd(b, input);
  if (amount <= 0) return toast("Số tiền không hợp lệ.");
  if (periodLocked(f.get("due"))) return lockMsg(f.get("due"));
  const p = { id: nextBusinessId("payables", f.get("due")), kind: "SUPPLIER", supplier: f.get("supplier"), booking: f.get("booking"), amount, due: f.get("due"), status: "Pending", invoiceNo: f.get("invoiceNo").trim(), createdAt: nowISO() };
  state.payables.push(p);
  const vat = +f.get("vat");
  if (vat > 0) state.vat.push({ id: nextBusinessId("vat", p.due), ref: p.invoiceNo, type: "Input", base: amount, rate: vat, date: todayISO() });
  audit("booking", p.booking, "PAYABLE", `${p.booking}: nhập hóa đơn NCC ${p.id} ${fxLedgerMoney(b, amount)}`);
  closeModal();
  render();
}

function costLimit(b) {
  const budget = Math.max(Number(b.quoteCost || 0), plannedServiceCost(b), Number(b.costApprovedTotal || 0));
  return Math.round(budget * (1 + policy().costOverrunPct / 100));
}

function approvePayable(id) {
  if (!requireCapability("accounting_manage")) return;
  const p = state.payables.find((x) => x.id === id);
  if (!p || p.status !== "Pending") return;
  if (!["REFUND", "ADVANCE"].includes(p.kind)) {
    const total = supplierPayables().filter((x) => x.booking === p.booking && (x.id === id || x.status !== "Pending")).reduce((n, x) => n + x.amount, 0);
    const b = findBooking(p.booking);
    if (b && total > costLimit(b)) {
      requestApproval({ type: "COST_OVERRUN", ref: b.id, amount: total, reason: `Chi phí NCC ${fxLedgerMoney(b, total)} vượt dự toán ${fxLedgerMoney(b, costLimit(b))}`, data: { total } });
      return toast("Chi phí vượt dự toán, đã gửi yêu cầu Giám đốc phê duyệt.");
    }
  }
  p.status = "Approved";
  p.approvedBy = actor().name;
  audit("booking", p.booking, "PAYABLE", `Duyệt chi ${id}`);
  render();
  toast("Đã duyệt " + id + ". Có thể ghi nhận chi tiền.");
}

function payPayable(id) {
  if (!requireCapability("accounting_manage")) return;
  const p = state.payables.find((x) => x.id === id);
  if (!p || p.status !== "Approved") return toast("Khoản chi phải được duyệt trước.");
  p.status = "Paid";
  p.paidAt = todayISO();
  state.transactions.unshift({
    id: nextBusinessId("transactions"),
    type: "OUT",
    ref: p.booking,
    payable: id,
    amount: p.amount,
    date: todayISO(),
    time: new Date().toLocaleString("vi-VN"),
    by: actor().name,
  });
  const b = findBooking(p.booking);
  if (p.kind === "REFUND" && b) b.refunded = (b.refunded || 0) + p.amount;
  audit("booking", p.booking, "PAYMENT_OUT", `Chi ${fxLedgerMoney(b, p.amount)} cho ${id}`);
  render();
  toast("Đã ghi nhận chi tiền.");
}

/* ---------- Quyết toán ---------- */
function settlementFigures(b) {
  const costs = supplierPayables().filter((p) => p.booking === b.id);
  const actualCost = costs.reduce((n, p) => n + p.amount, 0) || plannedServiceCost(b);
  const revenue = (b.received || 0) - (b.refunded || 0);
  return { revenue, actualCost, profit: revenue - actualCost, hasCosts: costs.length > 0, unpaid: costs.filter((p) => p.status !== "Paid").length };
}

function settlementForm(id) {
  const b = findBooking(id);
  const s = settlementFigures(b);
  const code = fxLedgerCode();
  modal(
    "Quyết toán tour · " + id,
    `<form onsubmit="saveSettlement(event,'${id}')">${line("Giá trị hợp đồng", fxLedgerMoney(b, b.revenue))}${line("Thực thu (trừ hoàn tiền)", fxLedgerMoney(b, s.revenue))}${line("Còn phải thu", fxLedgerMoney(b, balance(b)))}${line("Dự toán chi phí", fxLedgerMoney(b, b.quoteCost || plannedServiceCost(b)))}
    <label style="margin-top:14px">Chi phí thực tế (${code})<input name="cost" type="number" min="0" step="any" value="${fxLedgerInput(b, s.actualCost)}" required></label>
    ${balance(b) > 0 ? `<div class="alert">Khách còn nợ ${fxLedgerMoney(b, balance(b))}. Nên thu đủ trước khi chốt quyết toán.</div>` : ""}
    ${s.unpaid ? `<div class="alert">Còn ${s.unpaid} khoản NCC chưa chi tiền.</div>` : ""}
    ${!s.hasCosts ? `<div class="notice">Chưa có hóa đơn NCC nào, hệ thống dùng chi phí dự toán.</div>` : ""}
    <div class="formfooter"><button class="btn primary">Chốt quyết toán</button></div></form>`,
    true,
  );
}

function saveSettlement(e, id) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const b = findBooking(id);
  if (b.status !== "Completed") return toast("Chỉ quyết toán tour đã hoàn tất.");
  if (periodLocked(b.end)) return lockMsg(b.end);
  const input = +new FormData(e.target).get("cost");
  if (!Number.isFinite(input) || input < 0) return toast("Chi phí không hợp lệ.");
  const cost = fxLedgerInputVnd(b, input, settlementFigures(b).actualCost);
  const revenue = (b.received || 0) - (b.refunded || 0);
  b.settlement = { revenue, actualCost: cost, profit: revenue - cost, by: actor().name, at: nowISO() };
  audit("booking", id, "SETTLEMENT", `${id}: quyết toán, lợi nhuận ${fxLedgerMoney(b, b.settlement.profit)}`);
  closeModal();
  render();
  toast("Đã quyết toán " + id + ".");
  if (document.querySelector(".booking360")) openBooking(id);
}

/* ---------- VAT ---------- */
function vatForm() {
  modal(
    "Nhập chứng từ VAT",
    `<form onsubmit="addVat(event)"><div class="formgrid"><label class="full">Số chứng từ${field("ref", "text", "", true)}</label><label>Loại<select name="type"><option value="Input">VAT đầu vào</option><option value="Output">VAT đầu ra</option></select></label><label>Giá trị tính thuế<input name="base" type="number" min="0" required></label><label>Thuế suất (%)<input name="rate" type="number" min="0" max="100" step="0.1" value="8" required></label><label>Ngày<input name="date" type="date" value="${todayISO()}" required></label></div><div class="formfooter"><button class="btn primary">Lưu chứng từ</button></div></form>`,
    true,
  );
}

function addVat(e) {
  e.preventDefault();
  if (!requireCapability("accounting_manage")) return;
  const f = new FormData(e.target);
  const v = { id: nextBusinessId("vat", f.get("date")), ref: f.get("ref"), type: f.get("type"), base: +f.get("base"), rate: +f.get("rate"), date: f.get("date") };
  if (v.rate < 0 || v.rate > 100 || v.base < 0 || !Number.isFinite(v.base) || !Number.isFinite(v.rate)) return toast("Kiểm tra số tiền và thuế suất.");
  state.vat.push(v);
  audit("vat", v.id, "CREATE", "Nhập chứng từ VAT " + v.ref);
  closeModal();
  render();
}

/* ---------- Dòng tiền ---------- */
function cashRows() {
  const from = cashFrom || accountingMonthStart();
  const to = cashTo || accountingMonthEnd();
  const groups = {};
  for (const t of state.transactions) {
    const d = t.date || todayISO();
    if (d < from || d > to) continue;
    let k = d;
    if (cashPeriod === "month") k = d.slice(0, 7);
    if (cashPeriod === "week") {
      const date = new Date(d + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      k = "Tuần từ " + date.toISOString().slice(0, 10);
    }
    groups[k] ||= { IN: 0, OUT: 0 };
    groups[k][t.type] += fxLedgerNumber(findBooking(t.ref), t.amount);
  }
  return Object.entries(groups).sort();
}

/* ---------- Giao diện ---------- */
function accountingTabContent() {
  const bs = state.bookings;
  if (accountingTab === "fx") return fxRatesPanel();
  if (accountingTab === "invoices") {
    return card(
      "Hóa đơn khách hàng & thanh toán",
      state.invoices.length
        ? table(
            ["HÓA ĐƠN", "BOOKING", "LOẠI", "GIÁ TRỊ", "ĐÃ THU", "HẠN", "TRẠNG THÁI", ""],
            [...state.invoices].reverse().map((i) => `<tr><td><button class="entity-link" onclick="openInvoice('${i.id}')">${i.id}</button></td><td>${entityLink("booking", i.booking)}</td><td>${badge(invoiceTypeLabels[i.type] || i.type, "blue")}</td><td>${fxLedgerMoney(findBooking(i.booking), i.amount)}</td><td class="moneypositive">${fxLedgerMoney(findBooking(i.booking), i.paid || 0)}</td><td>${fmt(i.due)}</td><td>${invoiceStatusBadge(i)}</td><td>${i.paid < i.amount && findBooking(i.booking)?.status !== "Cancelled" && can("accounting_manage") ? btn("Thu tiền", `receiveForm('${i.booking}','${i.id}')`, "small") : ""}</td></tr>`),
          )
        : '<div class="empty">Chưa có hóa đơn nào.</div>',
      can("accounting_manage") ? btn("+ Tạo hóa đơn", "invoiceForm()", "primary small") : "",
    );
  }
  if (accountingTab === "receivable") {
    const list = bs.filter((b) => b.status !== "Cancelled");
    return card(
      "Công nợ phải thu khách hàng",
      table(
        ["BOOKING / KHÁCH", "GIÁ TRỊ", "ĐÃ THU", "CÒN PHẢI THU", "THANH TOÁN", "TRẠNG THÁI", ""],
        list.map((b) => `<tr><td>${entityLink("booking", b.id)}<span class="sub">${esc(b.client)}</span></td><td>${fxLedgerMoney(b, b.revenue)}</td><td class="moneypositive">${fxLedgerMoney(b, b.received || 0)}</td><td><b class="text-warn">${fxLedgerMoney(b, balance(b))}</b></td><td>${paymentBadge(b)}</td><td>${bookingBadge(b)}</td><td>${balance(b) > 0 && can("accounting_manage") ? btn("Thu tiền", `receiveForm('${b.id}')`, "small primary") : ""}</td></tr>`),
      ),
    );
  }
  if (accountingTab === "payable") {
    const all = state.payables;
    return card(
      "Công nợ phải trả: hóa đơn NCC & hoàn tiền khách",
      all.length
        ? table(
            ["MÃ / BOOKING", "ĐỐI TƯỢNG", "SỐ TIỀN", "HẠN", "TRẠNG THÁI", ""],
            all.map((p) => {
              const overdue = p.status !== "Paid" && p.due < todayISO();
              const payee = p.kind === "REFUND" ? `Hoàn tiền: ${esc(p.payee || "")}` : p.kind === "ADVANCE" ? `Tạm ứng HDV: ${esc(p.payee || "")}` : esc(findSupplier(p.supplier)?.name || "NCC khác");
              return `<tr><td>${p.id}<span class="sub">${entityLink("booking", p.booking)}${p.invoiceNo ? " · HĐ " + esc(p.invoiceNo) : ""}</span></td><td>${payee}</td><td><b>${fxLedgerMoney(findBooking(p.booking), p.amount)}</b></td><td>${fmt(p.due)}${overdue ? " " + badge("Quá hạn", "red") : ""}</td><td>${badge(payableLabels[p.status] || p.status, p.status === "Paid" ? "green" : p.status === "Approved" ? "blue" : "amber")}</td><td>${can("accounting_manage") ? (p.status === "Pending" ? btn("Duyệt chi", `approvePayable('${p.id}')`, "small") : p.status === "Approved" ? btn("Chi tiền", `payPayable('${p.id}')`, "small primary") : "") : ""}</td></tr>`;
            }),
          )
        : '<div class="empty">Chưa có khoản phải trả.</div>',
      can("accounting_manage") ? btn("+ Nhập hóa đơn NCC", "payableForm()", "primary small") : "",
    );
  }
  if (accountingTab === "vat") {
    const out = state.vat.filter((v) => v.type === "Output").reduce((n, v) => n + Math.round((v.base * v.rate) / 100), 0);
    const inn = state.vat.filter((v) => v.type !== "Output").reduce((n, v) => n + Math.round((v.base * v.rate) / 100), 0);
    return `<div class="stats stats--compact">${stat("VAT ĐẦU RA", short(out), "Phát sinh")}${stat("VAT ĐẦU VÀO", short(inn), "Được khấu trừ")}${stat("VAT PHẢI NỘP", short(out - inn), "Đầu ra − đầu vào")}</div><div class="notice">Chứng từ VAT ghi và khai bằng VND theo quy định thuế Việt Nam, không quy đổi USD.</div>` +
      card(
        "Thuế GTGT",
        state.vat.length
          ? table(["CHỨNG TỪ", "LOẠI", "GIÁ TRỊ TÍNH THUẾ", "THUẾ SUẤT", "TIỀN THUẾ", "NGÀY"], state.vat.map((v) => `<tr><td><b>${esc(v.ref)}</b></td><td>${badge(v.type === "Output" ? "Đầu ra" : "Đầu vào", v.type === "Output" ? "green" : "blue")}</td><td>${money(v.base)}</td><td>${v.rate}%</td><td>${money(Math.round((v.base * v.rate) / 100))}</td><td>${fmt(v.date)}</td></tr>`))
          : '<div class="empty">Chưa có chứng từ VAT.</div>',
        can("accounting_manage") ? btn("+ Nhập chứng từ", "vatForm()", "small primary") : "",
      );
  }
  if (accountingTab === "settlement") {
    const done = bs.filter((b) => ["Completed", "Running", "Preparing", "Confirmed"].includes(b.status));
    return card(
      "Chi phí & quyết toán theo booking",
      table(
        ["BOOKING", "THỰC THU", "DỰ TOÁN", "CHI NCC", "LỢI NHUẬN", "TRẠNG THÁI", ""],
        done.map((b) => {
          const s = settlementFigures(b);
          const costs = supplierPayables().filter((p) => p.booking === b.id).reduce((n, p) => n + p.amount, 0);
          return `<tr><td>${entityLink("booking", b.id)}<span class="sub">${esc(b.client)}</span></td><td>${fxLedgerMoney(b, s.revenue)}</td><td>${fxLedgerMoney(b, b.quoteCost || plannedServiceCost(b))}</td><td>${fxLedgerMoney(b, costs)}</td><td><b class="${(b.settlement?.profit ?? s.profit) >= 0 ? "moneypositive" : "text-bad"}">${fxLedgerMoney(b, b.settlement?.profit ?? s.profit)}</b></td><td>${b.settlement ? badge("Đã quyết toán", "green") : b.status === "Completed" ? badge("Chờ quyết toán", "amber") : badge("Tour chưa kết thúc")}</td><td>${b.status === "Completed" && !b.settlement && can("accounting_manage") ? btn("Quyết toán", `settlementForm('${b.id}')`, "small primary") : ""}</td></tr>`;
        }),
      ),
    );
  }
  if (accountingTab === "pnl") return accountingPnlTab();
  if (accountingTab === "cashflow") {
    const rows = cashRows();
    return card(
      "Dòng tiền thu chi",
      `<div class="filters"><label>Từ ngày <input type="date" value="${cashFrom || accountingMonthStart()}" onchange="cashFrom=this.value;render()"></label><label>Đến ngày <input type="date" value="${cashTo || accountingMonthEnd()}" onchange="cashTo=this.value;render()"></label><label>Kỳ <select onchange="cashPeriod=this.value;render()">${[["day", "Ngày"], ["week", "Tuần"], ["month", "Tháng"]].map(([v, l]) => `<option value="${v}" ${cashPeriod === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>${btn("Xuất CSV", "exportData('transactions')")}</div>` +
        (rows.length ? table(["KỲ", "THU", "CHI", "RÒNG"], rows.map(([k, g]) => `<tr><td>${k}</td><td class="moneypositive">${fxLedgerText(g.IN)}</td><td>${fxLedgerText(g.OUT)}</td><td><b>${fxLedgerText(g.IN - g.OUT)}</b></td></tr>`)) : '<div class="empty">Không có giao dịch trong kỳ.</div>'),
    );
  }
  if (accountingTab === "docs") {
    const docs = state.docs.filter((d) => ["Invoice", "Receipt", "Contract", "Voucher"].includes(d.type));
    return card("Chứng từ kế toán", docs.length ? table(["MÃ", "LOẠI", "TÊN", "BOOKING", "NGÀY"], [...docs].reverse().map((d) => `<tr><td>${d.id}</td><td>${badge(d.type)}</td><td>${esc(d.name)}</td><td>${d.booking ? entityLink("booking", d.booking) : "—"}</td><td>${fmt(d.date)}</td></tr>`)) : '<div class="empty">Chưa có chứng từ.</div>');
  }
  // Tổng quan
  const needDeposit = bs.filter((b) => b.status === "PendingDeposit");
  const overdue = state.invoices.filter((i) => i.paid < i.amount && i.due && i.due < todayISO());
  const toApprove = state.payables.filter((p) => p.status === "Pending");
  const toPay = state.payables.filter((p) => p.status === "Approved");
  const toSettle = bs.filter((b) => b.status === "Completed" && !b.settlement);
  const row = (icon, text, action) => `<div class="metricline"><span>${text}</span>${btn("Xử lý", action, "small")}</div>`;
  const items = [
    ...needDeposit.map((b) => row("", `${entityLink("booking", b.id)} chờ cọc ${fxLedgerMoney(b, depositRequired(b))} · ${bookingInvoices(b).length ? "đã xuất hóa đơn" : "chưa xuất hóa đơn"}`, bookingInvoices(b).length ? `receiveForm('${b.id}')` : `depositInvoiceForm('${b.id}')`)),
    ...overdue.map((i) => row("", `Hóa đơn ${i.id} quá hạn, còn ${fxLedgerMoney(findBooking(i.booking), invoiceOutstanding(i))}`, `openInvoice('${i.id}')`)),
    ...toApprove.map((p) => row("", `${p.id} chờ duyệt chi ${fxLedgerMoney(findBooking(p.booking), p.amount)}`, `approvePayable('${p.id}')`)),
    ...toPay.map((p) => row("", `${p.id} đã duyệt, chờ chi ${fxLedgerMoney(findBooking(p.booking), p.amount)}`, `payPayable('${p.id}')`)),
    ...toSettle.map((b) => row("", `${entityLink("booking", b.id)} chờ quyết toán`, `settlementForm('${b.id}')`)),
  ];
  return card("Việc kế toán cần xử lý", items.length ? items.join("") : '<div class="empty">Không có việc tồn đọng.</div>');
}

views.accounting = () => {
  const t = accountingTotals();
  const tabs = [["overview", "Tổng quan"], ["invoices", "Hóa đơn & thanh toán"], ["receivable", "Phải thu"], ["payable", "Phải trả NCC"], ["vat", "VAT"], ["settlement", "Chi phí & quyết toán"], ["pnl", "Lãi / lỗ theo tour"], ["cashflow", "Dòng tiền"], ["docs", "Chứng từ"]];
  if (can("fx_manage")) tabs.push(["fx", "Tỷ giá"]);
  return (
    title("Kế toán", "Hóa đơn, thu cọc, công nợ, chi nhà cung cấp và quyết toán tour.", can("accounting_manage") ? btn("+ Tạo hóa đơn", "invoiceForm()", "primary") : "") +
    `<div class="stats">${stat("ĐÃ THU", fxSumMoney(state.bookings, (b) => b.received || 0), "Tiền khách đã trả")}${stat("CÒN PHẢI THU", fxSumMoney(state.bookings.filter((b) => b.status !== "Cancelled"), (b) => balance(b)), "Công nợ khách hàng")}${stat("PHẢI TRẢ", fxLedgerShort(t.payable), "NCC & hoàn tiền chưa chi")}${stat("DÒNG TIỀN RÒNG", fxLedgerShort(t.net), "Thu − chi thực tế")}</div>
    <nav class="tabs">${tabs.map(([k, l]) => `<button class="btn ${accountingTab === k ? "selected" : ""}" onclick="accountingTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    accountingTabContent()
  );
};
