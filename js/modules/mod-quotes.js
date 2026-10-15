/* MODULE mod-quotes — giao diện và nghiệp vụ của phân hệ Travel. */

views.quotes = () =>
  title(
    "Báo giá & phiên bản",
    "Giá bán, chi phí dự kiến và quá trình chốt chương trình.",
    btn("+ Thiết kế báo giá", "go('design')", "primary"),
  ) +
  card(
    "Danh sách báo giá",
    table(
      [
        "BÁO GIÁ",
        "KHÁCH HÀNG / TOUR",
        "GIÁ BÁN",
        "BIÊN DỰ KIẾN",
        "TRẠNG THÁI",
        "THAO TÁC",
      ],
      state.quotes.map(
        (q) =>
          "<tr><td><strong>" +
          q.id +
          '</strong><span class="sub">Phiên bản ' +
          q.version +
          "</span></td><td>" +
          esc(q.client) +
          '<span class="sub">' +
          esc(q.tour) +
          "</span></td><td>" +
          money(q.amount) +
          "</td><td>" +
          (((q.amount - q.cost) / q.amount) * 100).toFixed(1) +
          "%</td><td>" +
          badge(
            {
              Draft: "Nháp",
              Sent: "Đã đánh dấu gửi",
              Accepted: "Đã chấp nhận",
            }[q.status],
            q.status === "Accepted" ? "green" : "amber",
          ) +
          "</td><td>" +
          btn("Xem & thao tác", "quoteDetail('" + q.id + "')", "small") +
          "</td></tr>",
      ),
    ),
  ) +
  `<div class="alert">Nút “Đánh dấu gửi” chỉ đổi trạng thái demo. Chức năng in mở cửa sổ để lưu PDF; chưa gửi email hoặc tạo hóa đơn thật.</div>`;

function renderQuoteDetails(id) {
  let q = state.quotes.find((q) => q.id === id);
  modal(
    "Báo giá " + q.id + " · v" + q.version,
    card(
      esc(q.client),
      line("Chương trình", esc(q.tour)) +
        line("Ngày khởi hành", fmt(q.start)) +
        line("Số khách", q.pax) +
        line("Giá bán nhóm", money(q.amount)) +
        line("Dự toán", money(q.cost)) +
        line("Lợi nhuận dự kiến", money(q.amount - q.cost)),
    ) +
      card(
        "Chương trình tour",
        q.program?.length
          ? q.program
              .map(
                (p, i) =>
                  '<div class="timeline"><b>Ngày ' +
                  (i + 1) +
                  "</b><p>" +
                  esc(p) +
                  "</p></div>",
              )
              .join("")
          : '<p class="sub">Báo giá mẫu chưa có chương trình chi tiết. Có thể tạo bản mới từ Thiết kế tour.</p>',
      ) +
      `<div class="actions">${btn("In / Lưu PDF", "printQuote('" + id + "')")}${q.status !== "Accepted" ? btn("Sửa giá · tạo phiên bản", "reviseQuote('" + id + "')") + btn("Đánh dấu gửi", "markQuoteSent('" + id + "')") + btn("Khách chấp nhận → Booking", "acceptQuote('" + id + "')", "primary") : badge("Đã chuyển thành Booking", "green")}</div><p class="notice">Demo không gửi email. Khi chạy thật cần lưu lịch sử từng phiên bản và người duyệt.</p>`,
  );
}

function reviseQuote(id) {
  let q = state.quotes.find((q) => q.id === id);
  modal(
    "Điều chỉnh " + id,
    `<form onsubmit="saveRevision(event,'${id}')"><div class="formgrid"><label>Giá bán nhóm (VND)<input name="amount" type="number" min="1000000" step="1000000" value="${q.amount}" required></label><label>Dự toán (VND)<input name="cost" type="number" min="0" step="1000000" value="${q.cost}" required></label></div><div class="formfooter"><button class="btn primary" type="submit">Lưu phiên bản ${q.version + 1}</button></div></form>`,
    true,
  );
}

function saveRevision(e, id) {
  e.preventDefault();
  let q = state.quotes.find((q) => q.id === id),
    f = new FormData(e.target);
  q.history = q.history || [];
  q.history.push({ version: q.version, amount: q.amount, cost: q.cost });
  q.amount = +f.get("amount");
  q.cost = +f.get("cost");
  q.version++;
  q.status = "Draft";
  log(id + " lưu phiên bản " + q.version);
  closeModal();
  render();
  toast("Đã lưu phiên bản " + q.version);
}

function setQuoteSentStatus(id) {
  let q = state.quotes.find((q) => q.id === id);
  q.status = "Sent";
  log(id + " được đánh dấu đã gửi trong demo");
  render();
  quoteDetail(id);
  toast("Đã đánh dấu gửi. Không có email thực tế được gửi.");
}

function acceptQuote(id) {
  let q = state.quotes.find((q) => q.id === id);
  if (q.status === "Accepted") return;
  let l = state.leads.find((l) => l.id === q.lead);
  let bid = "BK-" + String(state.bookings.length + 1).padStart(3, "0"),
    services = serviceTypes.map((t, k) => ({
      type: t,
      needed: true,
      supplier:
        state.suppliers.find((supplier) => supplier.type === t)?.id || "",
      cost: Math.round(q.cost * (serviceCostWeights[k] || 0)),
      confirmed: false,
    }));
  if (services.length)
    services[services.length - 1].cost =
      q.cost - services.slice(0, -1).reduce((n, s) => n + s.cost, 0);
  state.bookings.push({
    id: bid,
    lead: q.lead,
    quote: q.id,
    client: q.client,
    tour: q.tour,
    start: q.start,
    end: addDays(q.start, q.days - 1),
    pax: q.pax,
    revenue: q.amount,
    cost: q.cost,
    sales: l.sales,
    operator: "",
    status: "Preparing",
    guide: "",
    voucher: false,
    received: 0,
    services,
    program: q.program || [],
    passengers: Array.from({ length: q.pax }, (_, i) => ({
      name: i === 0 ? q.client : "Guest " + (i + 1),
      notes: i === 0 ? "Khách liên hệ chính" : "Cần bổ sung tên khách",
    })),
    feedback: null,
  });
  q.status = "Accepted";
  l.status = "WON";
  log(id + " → " + bid + " · Bàn giao điều hành");
  closeModal();
  go("bookings");
  toast("Đã tạo " + bid + " và bàn giao điều hành. Chưa có thanh toán cọc.");
}

function printQuote(id) {
  let q = state.quotes.find((q) => q.id === id);
  printable(
    "Báo giá " + q.id + " · v" + q.version,
    "<h2>" +
      esc(q.client) +
      "</h2><p>" +
      esc(q.tour) +
      "<br>" +
      q.pax +
      " khách · " +
      fmt(q.start) +
      " · " +
      q.days +
      " ngày</p><table><tr><th>Hạng mục</th><th>Giá trị</th></tr><tr><td>Giá bán nhóm (VND)</td><td>" +
      money(q.amount) +
      "</td></tr><tr><td>Giá bình quân / khách</td><td>" +
      money(Math.round(q.amount / q.pax)) +
      "</td></tr></table><h2>Chương trình</h2>" +
      (q.program?.length
        ? q.program
            .map(
              (p, i) => "<p><b>Ngày " + (i + 1) + "</b> · " + esc(p) + "</p>",
            )
            .join("")
        : "<p>Chương trình chi tiết sẽ được bổ sung.</p>") +
      "<p>Điều khoản bao gồm, không bao gồm, thanh toán và hủy tour cần được chốt trước khi gửi khách.</p>",
  );
}

function quoteDetail(id) {
  renderQuoteDetails(id);
  let q = state.quotes.find((q) => q.id === id);
  document
    .querySelector(".modal")
    .insertAdjacentHTML(
      "beforeend",
      card(
        "Thông tin gốc và lịch sử phiên bản",
        line(
          "Country",
          esc(
            q.country ||
              state.leads.find((l) => l.id === q.lead)?.country ||
              "—",
          ),
        ) +
          line(
            "Budget nguyên tệ",
            q.budgetNative
              ? esc(q.budgetNative) + " " + esc(q.currency)
              : "Báo giá mẫu VND",
          ) +
          (q.history || [])
            .map((h) =>
              line(
                "Version " + h.version,
                money(h.amount) + " · Cost " + money(h.cost),
              ),
            )
            .join(""),
      ) + btn("Email khách · mô phỏng", "simulateEmail('" + id + "')"),
    );
}

function simulateEmail(id) {
  let q = state.quotes.find((q) => q.id === id);
  modal(
    "Email quotation · " + id,
    `<label>To${field("to", "email", state.leads.find((l) => l.id === q.lead)?.email || "")}</label><label>Subject${field("subject", "text", "Typic Travel — Quotation " + id)}</label><label>Nội dung<textarea>Dear ${esc(q.client)},\nPlease find our proposed itinerary and quotation for ${esc(q.tour)}.\nBest regards,\nTypic Travel</textarea></label><div class="alert">Mô phỏng Email khách trong tài liệu. Chưa kết nối Gmail Workspace; không gửi email thật.</div>${btn("Ghi nhận mô phỏng gửi", "markQuoteSent('" + id + "')", "primary")}`,
    true,
  );
}

function markQuoteSent(id) {
  let q = state.quotes.find((q) => q.id === id);
  if (q.status === "Accepted") {
    log(id + " mô phỏng gửi lại email, giữ trạng thái Accepted");
    toast("Mô phỏng gửi lại; không có email thật được gửi.");
    closeModal();
    render();
    return;
  }
  setQuoteSentStatus(id);
}
