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
  const lead = state.leads.find((item) => item.id === q.lead);
  const statusLabel =
    { Draft: "Nháp", Sent: "Đã đánh dấu gửi", Accepted: "Đã chấp nhận" }[
      q.status
    ] || q.status;
  const margin = q.amount ? ((q.amount - q.cost) / q.amount) * 100 : 0;
  const history = (q.history || [])
    .map(
      (item) =>
        `<div class="quote-history-row"><div><b>Phiên bản ${item.version}</b><small>${money(item.amount)}</small></div><span>Chi phí ${money(item.cost)}</span></div>`,
    )
    .join("");
  const actions =
    btn("In / Lưu PDF", "printQuote('" + id + "')") +
    btn("Email khách · mô phỏng", "simulateEmail('" + id + "')") +
    (q.status !== "Accepted"
      ? btn("Sửa giá", "reviseQuote('" + id + "')") +
        btn("Đánh dấu gửi", "markQuoteSent('" + id + "')") +
        btn(
          "Khách chấp nhận → Đặt chỗ",
          "acceptQuote('" + id + "')",
          "primary",
        )
      : badge("Đã chuyển thành Đặt chỗ", "green"));
  modal(
    "Chi tiết báo giá",
    `<div class="detail-panel quote-detail"><section class="quote-identity"><div class="quote-mark">QT</div><div><div class="quote-identity-line"><h3>${q.id}</h3>${badge(statusLabel, q.status === "Accepted" ? "green" : "amber")}</div><strong>${esc(q.client)}</strong><p>${esc(q.tour)}</p></div></section><div class="detail-summary"><div><small>Phiên bản</small><b>v${q.version}</b></div><div><small>Khởi hành</small><b>${fmt(q.start)}</b></div><div><small>Số khách</small><b>${q.pax} khách</b></div><div><small>Quốc gia</small><b>${esc(q.country || lead?.country || "—")}</b></div></div><section class="quote-finance"><div><small>Giá bán nhóm</small><strong>${money(q.amount)}</strong></div><div><small>Dự toán</small><strong>${money(q.cost)}</strong></div><div class="positive"><small>Lợi nhuận dự kiến</small><strong>${money(q.amount - q.cost)}</strong><span>Biên ${margin.toFixed(1)}%</span></div></section><div class="quote-detail-grid"><section class="detail-section"><div class="detail-section-head"><h3>Chương trình tour</h3><span>${q.days || q.program?.length || 0} ngày</span></div><div class="quote-itinerary">${q.program?.length ? q.program.map((item, index) => `<div class="quote-day"><b>Ngày ${index + 1}</b><p>${esc(item)}</p></div>`).join("") : '<div class="empty">Báo giá chưa có chương trình chi tiết.</div>'}</div></section><aside><section class="detail-section"><div class="detail-section-head"><h3>Thông tin gốc</h3></div>${line("Khách hàng tiềm năng", q.lead || "—")}${line("Ngân sách nguyên tệ", q.budgetNative ? esc(q.budgetNative) + " " + esc(q.currency) : "Báo giá VND")}${line("Tỷ giá", q.rate ? new Intl.NumberFormat("vi-VN").format(q.rate) : "—")}${line("Ngôn ngữ", esc(q.language || "—"))}</section><section class="detail-section"><div class="detail-section-head"><h3>Lịch sử phiên bản</h3></div>${history || '<div class="empty compact">Chưa có phiên bản trước.</div>'}</section></aside></div><p class="quote-note">Bản trình diễn không gửi email thật. Lịch sử phiên bản và người duyệt cần được lưu đầy đủ khi triển khai thực tế.</p><footer class="detail-footer">${actions}</footer></div>`,
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
}

function simulateEmail(id) {
  let q = state.quotes.find((q) => q.id === id);
  modal(
    "Email quotation · " + id,
    `<label>Đến${field("to", "email", state.leads.find((l) => l.id === q.lead)?.email || "")}</label><label>Tiêu đề${field("subject", "text", "TypicOne ERP — Báo giá " + id)}</label><label>Nội dung<textarea>Kính gửi ${esc(q.client)},\nXin gửi quý khách chương trình và báo giá đề xuất cho ${esc(q.tour)}.\nTrân trọng,\nTypicOne ERP</textarea></label><div class="alert">Mô phỏng Email khách trong tài liệu. Chưa kết nối Gmail Workspace; không gửi email thật.</div>${btn("Ghi nhận mô phỏng gửi", "markQuoteSent('" + id + "')", "primary")}`,
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
