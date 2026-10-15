/* MODULE mod-accounting — giao diện và nghiệp vụ của phân hệ Travel. */

const accountingToday = () => new Date().toLocaleDateString("en-CA");
const accountingMonthStart = () => accountingToday().slice(0, 8) + "01";
const accountingMonthEnd = () => {
  const date = new Date();
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).toLocaleDateString("en-CA");
};

function balance(b) {
  return Math.max(0, b.revenue - b.received);
}

const renderAccountingBalances = () => {
  let bs = state.bookings,
    received = bs.reduce((n, b) => n + b.received, 0),
    paid = state.payables
      .filter((p) => p.status === "Paid")
      .reduce((n, p) => n + p.amount, 0);
  return (
    title(
      "Thu chi & công nợ",
      "Các thao tác ghi nhận tiền demo, không thực hiện giao dịch ngân hàng.",
      btn("Xuất sổ thu chi CSV", "exportData('transactions')"),
    ) +
    `<div class="stats">${stat("ĐÃ THU KHÁCH", short(received), "Lũy kế booking trong database")}${stat("CÒN PHẢI THU", short(bs.reduce((n, b) => n + balance(b), 0)), "Giá trị hợp đồng − đã thu")}${stat("PHẢI TRẢ NCC", short(state.payables.filter((p) => p.status !== "Paid").reduce((n, p) => n + p.amount, 0)), "Các hóa đơn NCC đang theo dõi")}${stat("THU − CHI", short(received - paid), "Chưa tính số dư đầu kỳ / mọi chi phí")}</div><div class="alert">Demo chưa phát hành hóa đơn điện tử hoặc chuyển khoản thật. Trạng thái duyệt và thanh toán được đồng bộ vào database.</div>` +
    card(
      "Công nợ khách hàng · Receivable",
      table(
        [
          "BOOKING / KHÁCH",
          "GIÁ TRỊ HỢP ĐỒNG",
          "ĐÃ THU",
          "CÒN PHẢI THU",
          "TIẾN ĐỘ THU",
          "THAO TÁC",
        ],
        bs.map(
          (b) =>
            "<tr><td>" +
            b.id +
            '<span class="sub">' +
            esc(b.client) +
            "</span></td><td>" +
            money(b.revenue) +
            "</td><td>" +
            money(b.received) +
            "</td><td>" +
            money(balance(b)) +
            "</td><td>" +
            badge(
              b.received >= b.revenue
                ? "FINAL PAYMENT"
                : b.received > 0
                  ? "DEPOSIT"
                  : "Chưa thu",
              b.received > 0 ? "green" : "amber",
            ) +
            "</td><td>" +
            (balance(b) > 0
              ? btn("Ghi nhận thu", "receiveForm('" + b.id + "')", "small")
              : "—") +
            "</td></tr>",
        ),
      ),
    ) +
    card(
      "Hóa đơn NCC · Approve → Pay",
      table(
        [
          "MÃ / BOOKING",
          "NHÀ CUNG CẤP",
          "SỐ TIỀN",
          "HẠN THANH TOÁN",
          "TRẠNG THÁI",
          "THAO TÁC",
        ],
        state.payables.map(
          (p) =>
            "<tr><td>" +
            p.id +
            '<span class="sub">' +
            p.booking +
            "</span></td><td>" +
            esc(state.suppliers.find((s) => s.id === p.supplier)?.name) +
            "</td><td>" +
            money(p.amount) +
            "</td><td>" +
            fmt(p.due) +
            "</td><td>" +
            badge(
              {
                Pending: "Chờ duyệt",
                Approved: "Đã duyệt",
                Paid: "Đã thanh toán",
              }[p.status],
              p.status === "Pending" ? "amber" : "green",
            ) +
            "</td><td>" +
            (p.status === "Pending"
              ? btn("Duyệt khoản chi", "approvePay('" + p.id + "')", "small")
              : p.status === "Approved"
                ? btn("Ghi nhận chi", "paySupplier('" + p.id + "')", "small")
                : "—") +
            "</td></tr>",
        ),
      ),
    ) +
    card(
      "Nhật ký thu chi phiên demo",
      state.transactions.length
        ? table(
            ["LOẠI", "BOOKING / HÓA ĐƠN", "SỐ TIỀN", "THỜI ĐIỂM"],
            state.transactions.map(
              (t) =>
                "<tr><td>" +
                badge(
                  t.type === "IN" ? "Thu" : "Chi",
                  t.type === "IN" ? "green" : "amber",
                ) +
                "</td><td>" +
                t.ref +
                "</td><td>" +
                money(t.amount) +
                "</td><td>" +
                esc(t.time) +
                "</td></tr>",
            ),
          )
        : '<p class="sub">Chưa có thao tác thu chi mới. Số liệu đã thu ban đầu là số dư mẫu.</p>',
    )
  );
};

function receiveForm(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Ghi nhận thu tiền · " + id,
    `<form onsubmit="receiveMoney(event,'${id}')">${line("Khách", esc(b.client))}${line("Còn phải thu", money(balance(b)))}<label style="margin-top:20px">Số tiền thu (VND)<input name="amount" type="number" min="1" max="${balance(b)}" value="${balance(b)}" required></label><label>Phương thức<select name="method"><option>Chuyển khoản</option><option>Tiền mặt</option></select></label><p class="notice">Ghi nhận thử nghiệm; không kết nối ngân hàng.</p><div class="formfooter"><button class="btn primary" type="submit">Ghi nhận thu</button></div></form>`,
    true,
  );
}

function recordCustomerReceipt(e, id) {
  e.preventDefault();
  let b = state.bookings.find((b) => b.id === id),
    f = new FormData(e.target),
    amount = +f.get("amount");
  if (!Number.isFinite(amount) || amount <= 0 || amount > balance(b))
    return toast("Số tiền phải lớn hơn 0 và không vượt công nợ.");
  b.received += amount;
  state.transactions.unshift({
    type: "IN",
    ref: id,
    amount,
    method: f.get("method"),
    time: new Date().toLocaleString("vi-VN"),
  });
  log(id + " thu " + money(amount));
  closeModal();
  render();
  toast("Đã ghi nhận thu " + money(amount));
}

function approvePay(id) {
  let p = state.payables.find((p) => p.id === id);
  if (p.status !== "Pending") return;
  p.status = "Approved";
  log("Duyệt khoản chi " + id);
  render();
  toast("Đã duyệt " + id + ". Có thể ghi nhận thanh toán.");
}

function paySupplier(id) {
  let p = state.payables.find((p) => p.id === id);
  if (p.status !== "Approved") return toast("Khoản chi phải được duyệt trước.");
  p.status = "Paid";
  state.transactions.unshift({
    type: "OUT",
    ref: id,
    amount: p.amount,
    time: new Date().toLocaleString("vi-VN"),
  });
  log("Ghi nhận chi " + id);
  render();
  toast("Đã ghi nhận chi trong demo.");
}

views.accounting = () =>
  title(
    "Accounting",
    "Invoice · Deposit · Final · Supplier Invoice · VAT · Debt · Cash Flow",
    btn("+ Tạo hóa đơn", "invoiceForm()", "primary"),
  ) +
  card(
    "Invoices · Deposit / Final",
    table(
      ["INVOICE", "BOOKING", "TYPE", "AMOUNT", "PAID", "STATUS", "THAO TÁC"],
      state.invoices.map(
        (i) =>
          "<tr><td>" +
          i.id +
          "</td><td>" +
          i.booking +
          "</td><td>" +
          i.type +
          "</td><td>" +
          money(i.amount) +
          "</td><td>" +
          money(i.paid) +
          "</td><td>" +
          badge(
            i.paid >= i.amount ? "Payment Received" : "Pending",
            i.paid >= i.amount ? "green" : "amber",
          ) +
          "</td><td>" +
          (i.paid < i.amount
            ? btn(
                "Payment Received",
                "invoicePaymentForm('" + i.id + "')",
                "small",
              )
            : "—") +
          "</td></tr>",
      ),
    ),
  ) +
  renderAccountingBalances().replace(
    /<div class="pagetop">[\s\S]*?<\/div><\/div>/,
    "",
  ) +
  card(
    "VAT Documents · Input / Output",
    `<div class="actions">${btn("+ Nhập chứng từ VAT", "vatForm()")}</div>` +
      table(
        ["CHỨNG TỪ", "TYPE", "BASE", "RATE", "VAT", "NGÀY"],
        state.vat.map(
          (v) =>
            "<tr><td>" +
            esc(v.ref) +
            "</td><td>" +
            v.type +
            "</td><td>" +
            money(v.base) +
            "</td><td>" +
            v.rate +
            "%</td><td>" +
            money(Math.round((v.base * v.rate) / 100)) +
            "</td><td>" +
            fmt(v.date) +
            "</td></tr>",
        ),
      ) +
      '<p class="notice">Thuế suất do người dùng nhập theo chứng từ mẫu. Không tự áp dụng thuế suất hoặc phát hành hóa đơn điện tử.</p>',
  ) +
  card(
    "Cash Flow · Ngày / Tuần / Tháng",
    `<div class="filters"><label>Từ ngày<input type="date" id="cashfrom" value="${accountingMonthStart()}"></label><label>Đến ngày<input type="date" id="cashto" value="${accountingMonthEnd()}"></label><select id="cashperiod" aria-label="Kỳ dòng tiền"><option value="day">Ngày</option><option value="week">Tuần</option><option value="month">Tháng</option></select>${btn("Xem dòng tiền", "cashReport()")}</div><div id="cashreport"><p class="sub">Chọn kỳ để nhóm các giao dịch phát sinh. Không gồm số dư thu ban đầu.</p></div>`,
  );

function invoiceForm() {
  modal(
    "Tạo Invoice",
    `<form onsubmit="createInvoice(event)"><label>Booking<select name="booking">${state.bookings.map((b) => '<option value="' + b.id + '">' + b.id + " · " + esc(b.client) + "</option>").join("")}</select></label><label>Type<select name="type"><option>Deposit</option><option>Final</option></select></label><label>Amount (VND)<input name="amount" type="number" min="1" required></label><label>Due date<input name="due" type="date" value="${accountingToday()}" required></label><div class="alert">Nhập số tiền cọc hoặc phần cuối theo hợp đồng. Không mặc định tỷ lệ vì tài liệu không quy định.</div><div class="formfooter"><button class="btn primary">Tạo invoice</button></div></form>`,
    true,
  );
}

function createInvoice(e) {
  e.preventDefault();
  let f = new FormData(e.target),
    b = state.bookings.find((b) => b.id === f.get("booking")),
    amount = +f.get("amount"),
    outstanding = state.invoices
      .filter((i) => i.booking === b.id)
      .reduce((n, i) => n + i.amount - i.paid, 0);
  if (
    amount <= 0 ||
    !Number.isFinite(amount) ||
    amount + outstanding > balance(b)
  )
    return toast("Tổng hóa đơn chưa thu không được vượt công nợ booking.");
  let i = {
    id: "INV-" + String(state.invoices.length + 1).padStart(3, "0"),
    booking: b.id,
    type: f.get("type"),
    amount,
    paid: 0,
    due: f.get("due"),
  };
  state.invoices.push(i);
  state.docs.push({
    id: "DOC-" + i.id,
    booking: b.id,
    type: "Invoice",
    name: i.id,
    date: new Date().toISOString().slice(0, 10),
    generated: true,
  });
  log("Tạo " + i.type + " " + i.id);
  closeModal();
  render();
}

function invoicePaymentForm(id) {
  let i = state.invoices.find((i) => i.id === id);
  modal(
    "Payment Received · " + id,
    `<form onsubmit="payInvoice(event,'${id}')"><label>Số tiền<input name="amount" type="number" min="1" max="${i.amount - i.paid}" value="${i.amount - i.paid}" required></label><div class="formfooter"><button class="btn primary">Ghi nhận thu</button></div></form>`,
    true,
  );
}

function payInvoice(e, id) {
  e.preventDefault();
  let i = state.invoices.find((i) => i.id === id),
    b = state.bookings.find((b) => b.id === i.booking),
    amount = +new FormData(e.target).get("amount");
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > i.amount - i.paid ||
    amount > balance(b)
  )
    return toast("Số tiền vượt hóa đơn hoặc công nợ.");
  i.paid += amount;
  b.received += amount;
  state.transactions.unshift({
    type: "IN",
    ref: b.id,
    invoice: id,
    amount,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleString("vi-VN"),
  });
  log(id + " Payment Received " + money(amount));
  closeModal();
  render();
}
// Generic payments also allocate to outstanding invoices to keep balances consistent.

function receiveMoney(e, id) {
  let before = state.bookings.find((b) => b.id === id).received;
  recordCustomerReceipt(e, id);
  let after = state.bookings.find((b) => b.id === id).received,
    left = after - before;
  for (const i of state.invoices.filter(
    (i) => i.booking === id && i.paid < i.amount,
  )) {
    let allocate = Math.min(left, i.amount - i.paid);
    i.paid += allocate;
    left -= allocate;
    if (left <= 0) break;
  }
  if (after > before) {
    state.transactions[0].date = new Date().toISOString().slice(0, 10);
    save();
    render();
  }
}

function vatForm() {
  modal(
    "VAT đầu vào / đầu ra",
    `<form onsubmit="addVat(event)"><label>Chứng từ${field("ref", "text", "", true)}</label><label>Type<select name="type"><option>Input</option><option>Output</option></select></label><label>Base amount<input name="base" type="number" min="0" required></label><label>VAT rate (%)<input name="rate" type="number" min="0" max="100" step="0.1" required></label><label>Ngày<input name="date" type="date" value="${accountingToday()}" required></label><div class="formfooter"><button class="btn primary">Lưu chứng từ</button></div></form>`,
    true,
  );
}

function addVat(e) {
  e.preventDefault();
  let f = new FormData(e.target),
    v = {
      ref: f.get("ref"),
      type: f.get("type"),
      base: +f.get("base"),
      rate: +f.get("rate"),
      date: f.get("date"),
    };
  if (
    v.rate < 0 ||
    v.rate > 100 ||
    v.base < 0 ||
    !Number.isFinite(v.base) ||
    !Number.isFinite(v.rate)
  )
    return toast("Kiểm tra số tiền và thuế suất.");
  state.vat.push(v);
  log("Nhập VAT " + v.ref);
  closeModal();
  render();
}

function cashReport() {
  let from = document.getElementById("cashfrom").value,
    to = document.getElementById("cashto").value,
    period = document.getElementById("cashperiod").value,
    groups = {};
  if (from > to) return toast("Ngày bắt đầu phải trước ngày kết thúc.");
  for (const t of state.transactions) {
    let d = t.date || new Date().toISOString().slice(0, 10);
    if (d < from || d > to) continue;
    let k = d;
    if (period === "month") k = d.slice(0, 7);
    if (period === "week") {
      let date = new Date(d + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      k = "Tuần từ " + date.toISOString().slice(0, 10);
    }
    groups[k] ||= { IN: 0, OUT: 0 };
    groups[k][t.type] += t.amount;
  }
  document.getElementById("cashreport").innerHTML = table(
    ["KỲ", "IN", "OUT", "NET"],
    Object.entries(groups)
      .sort()
      .map(
        ([k, g]) =>
          "<tr><td>" +
          k +
          "</td><td>" +
          money(g.IN) +
          "</td><td>" +
          money(g.OUT) +
          "</td><td>" +
          money(g.IN - g.OUT) +
          "</td></tr>",
      ),
  );
}
