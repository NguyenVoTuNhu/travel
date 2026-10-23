/* MODULE mod-bookings — danh sách đặt tour và hồ sơ Booking 360° (điểm giao nhau của Sales, Kế toán, Điều hành, HDV). */

function bookStatus(b) {
  return bookingBadge(b);
}

function bkLink(b) {
  return entityLink("booking", b.id);
}

const bookingFilterOrder = ["PendingDeposit", "PendingApproval", "Confirmed", "Preparing", "Running", "Completed", "Cancelled"];

views.bookings = () => {
  const all = scopedBookings();
  const showFinancials = can("sales_financials") || can("booking_financials");
  const opsView = can("operations_manage") && !can("all");
  const count = (s) => all.filter((b) => b.status === s).length;
  const statuses = opsView ? bookingFilterOrder.filter((s) => bookingOpsStatuses.includes(s)) : bookingFilterOrder;
  const filtered = all.filter((b) => bookingFilter === "all" || b.status === bookingFilter);
  const active = all.filter((b) => bookingOpenStatuses.includes(b.status));
  const totalRev = all.filter((b) => b.status !== "Cancelled").reduce((sum, b) => sum + (b.revenue || 0), 0);
  const waitingDeposit = count("PendingDeposit") + count("PendingApproval");

  return (
    title(
      opsView ? "Booking đã xác nhận" : "Đặt tour",
      opsView
        ? "Chỉ hiển thị booking đã đủ điều kiện thanh toán và bàn giao cho điều hành."
        : "Hồ sơ trung tâm nối Kinh doanh, Kế toán, Điều hành và Hướng dẫn viên.",
      btn("Xuất CSV", "exportData('bookings')") + (can("operations_manage") ? btn("Trung tâm điều hành →", "go('operations')", "primary") : ""),
    ) +
    `<div class="stats">
      ${stat("BOOKING ĐANG MỞ", active.length, `${all.length} booking trong phạm vi của bạn`)}
      ${stat(opsView ? "CHỜ TIẾP NHẬN" : "CHỜ ĐẶT CỌC", opsView ? count("Confirmed") : waitingDeposit, opsView ? "Đã cọc, chờ điều hành nhận" : "Chưa được kế toán xác nhận cọc")}
      ${stat("TOUR ĐANG CHẠY", count("Running"), all.filter((b) => b.status === "Running").reduce((n, b) => n + b.pax, 0) + " khách đang trong hành trình")}
      ${showFinancials ? stat("GIÁ TRỊ HỢP ĐỒNG", fxSumMoney(all.filter((b) => b.status !== "Cancelled"), (b) => b.revenue || 0), "Không tính booking đã hủy") : stat("DỊCH VỤ CHỜ XÁC NHẬN", active.reduce((n, b) => n + bookingServices(b).filter((s) => s.type !== "Guide" && serviceStatus(s) !== "CONFIRMED").length, 0), "Checklist điều hành cần xử lý")}
    </div>` +
    card(
      "Danh sách booking",
      `<div class="filters">
        <input placeholder="Tìm theo mã booking, khách hàng, chương trình, điều hành…" aria-label="Tìm booking" oninput="filterBookingRows(this.value)" />
        <select aria-label="Lọc trạng thái booking" onchange="bookingFilter=this.value;render()">
          <option value="all">Tất cả trạng thái (${all.length})</option>
          ${statuses.map((s) => `<option value="${s}" ${bookingFilter === s ? "selected" : ""}>${bookingLabels[s]} (${count(s)})</option>`).join("")}
        </select>
        <span class="sub" style="margin-left: auto; font-weight: 600;">Hiển thị ${filtered.length} / ${all.length} booking</span>
      </div>` +
        (filtered.length
          ? table(
              ["MÃ BOOKING", "KHÁCH HÀNG / TOUR", "THỜI GIAN", "KHÁCH", ...(showFinancials ? ["GIÁ TRỊ", "THANH TOÁN"] : []), "SẴN SÀNG", "TRẠNG THÁI", ""],
              filtered.map(
                (b) =>
                  `<tr class="bookrow" data-search="${esc([b.id, b.client, b.tour, b.operator, b.sales].join(" ").toLowerCase())}"><td>${bkLink(b)}</td><td><strong>${customerLink(b.client)}</strong><span class="sub">${esc(b.tour)}</span></td><td>${fmt(b.start)}<span class="sub">đến ${fmt(b.end)}</span></td><td><b>${b.pax}</b></td>${showFinancials ? `<td><b class="moneypositive">${fxLedgerMoney(b, b.revenue)}</b></td><td>${paymentBadge(b)}</td>` : ""}<td><div class="barrow"><div class="bar" style="flex: 1;"><i style="width:${progress(b)}%"></i></div><small>${progress(b)}%</small></div></td><td>${bookingBadge(b)}</td><td>${btn("Chi tiết", `openBooking('${b.id}')`, "small")}</td></tr>`,
              ),
            )
          : '<div class="empty">Không có booking nào ở trạng thái này.</div>'),
    ) +
    `<div class="alert green"><b>Luồng trạng thái:</b> Chờ đặt cọc → Đã xác nhận (kế toán xác nhận cọc hoặc CEO miễn cọc) → Đang chuẩn bị (điều hành tiếp nhận) → Đang chạy → Hoàn tất → Quyết toán → Chăm sóc sau tour. Thanh toán và trạng thái tour được theo dõi riêng.</div>`
  );
};

function filterBookingRows(q) {
  const rows = document.querySelectorAll(".bookrow");
  rows.forEach((row) => (row.dataset.filteredOut = String(!row.dataset.search.includes(q.toLowerCase()))));
  const wrapper = rows[0]?.closest(".tablewrap");
  if (wrapper?.dataset.paginated) updateTablePagination(wrapper, true);
  else rows.forEach((row) => (row.hidden = row.dataset.filteredOut === "true"));
}

/* ---------- Hồ sơ Booking 360° ---------- */
let bookingTab = "overview";

function openBooking(id, tab = "overview") {
  const b = findBooking(id);
  if (!b) return toast("Không tìm thấy booking " + id + ".");
  if (!canOpenBooking()) return toast("Bạn không có quyền xem hồ sơ booking này.");
  if (isGuideRole() && b.guide !== activeGuideId()) return toast("Booking này không được giao cho bạn.");
  bookingTab = tab;
  const showFin = can("sales_financials") || can("booking_financials");
  const tabs = [
    ["overview", "Tổng quan"],
    ["services", "Dịch vụ & điều hành"],
    ["pax", `Khách đoàn (${b.passengers?.length || 0})`],
    ...(showFin || can("operations_costs") ? [["finance", "Tài chính"]] : []),
    ["docs", "Tài liệu"],
    ["history", "Lịch sử"],
  ];
  if (!tabs.some(([k]) => k === tab)) bookingTab = "overview";
  const pay = paymentState(b);
  const customer = (state.customers || []).find((c) => c.id === b.customerId) || findCustomerByName(b.client);
  modal(
    `<span class="booking-title"><b>${b.id}</b> ${bookingBadge(b)} ${showFin ? paymentBadge(b) : ""}<small>${esc(b.tour)}</small></span>`,
    `<div class="booking360">
      ${journeyBar({ booking: b })}
      <div class="booking-meta">
        <div><small>Khách hàng</small><b>${customer ? entityLink("customer", customer.id, b.client) : esc(b.client)}</b></div>
        <div><small>Hành trình</small><b>${fmt(b.start)} – ${fmt(b.end)}</b></div>
        <div><small>Số khách</small><b>${b.pax}</b></div>
        <div><small>Sales</small><b>${esc(b.sales || "—")}</b></div>
        <div><small>Điều hành</small><b>${esc(b.operator || "Chưa tiếp nhận")}</b></div>
        <div><small>HDV</small><b>${b.guide ? entityLink("guide", b.guide, findGuide(b.guide)?.name) : "Chưa phân công"}</b></div>
      </div>
      ${bookingNextAction(b)}
      <nav class="tabbar" aria-label="Nội dung booking">${tabs.map(([k, l]) => `<button type="button" class="${bookingTab === k ? "active" : ""}" onclick="openBooking('${id}','${k}')">${l}</button>`).join("")}</nav>
      <div class="booking-tab">${bookingTabContent(b, bookingTab, pay)}</div>
      <footer class="detail-footer">${bookingFooterActions(b)}</footer>
    </div>`,
  );
}

function bookingNextAction(b) {
  let text = "",
    actionHtml = "",
    tone = "blue";
  const issueOpen = (state.issues || []).filter((i) => i.booking === b.id && i.status !== "Resolved").length;
  if (b.status === "PendingDeposit") {
    text = `Chờ khách đặt cọc <b>${fxLedgerMoney(b, depositRequired(b))}</b>. Điều hành chưa được nhận booking này.`;
    if (can("accounting_manage")) actionHtml = bookingInvoices(b).length ? btn("Ghi nhận thu tiền", `receiveForm('${b.id}')`, "primary") : btn("Phát hành yêu cầu đặt cọc", `depositInvoiceForm('${b.id}')`, "primary");
    else if (can("bookings_manage")) actionHtml = btn("Đề nghị CEO miễn cọc", `noDepositForm('${b.id}')`);
    tone = "amber";
  } else if (b.status === "PendingApproval") {
    text = "Đang chờ CEO phê duyệt miễn đặt cọc.";
    tone = "amber";
    const ap = pendingApproval(b.id, "NO_DEPOSIT");
    if (ap && can("approvals_manage")) actionHtml = btn("Xem & duyệt", `approvalDecisionForm('${ap.id}',true)`, "primary");
  } else if (b.status === "Confirmed") {
    text = "Booking đã xác nhận thanh toán — điều hành cần tiếp nhận để bắt đầu đặt dịch vụ.";
    if (can("operations_manage")) actionHtml = btn("Tiếp nhận booking", `takeoverForm('${b.id}')`, "primary");
  } else if (b.status === "Preparing") {
    const blockers = startBlockers(b);
    text = blockers.length ? `Còn ${blockers.length} việc trước khi khởi hành: ${blockers.map((c) => c.label.replace(/\(.*\)/, "").trim()).join(" · ")}.` : "Tour đã sẵn sàng khởi hành.";
    tone = blockers.length ? "amber" : "green";
    if (can("operations_manage")) actionHtml = btn("Kiểm tra trước tour", `preTourCheck('${b.id}')`, blockers.length ? "" : "primary");
  } else if (b.status === "Running") {
    text = issueOpen ? `Tour đang chạy · ${issueOpen} sự cố đang mở.` : "Tour đang diễn ra.";
    tone = issueOpen ? "amber" : "green";
    if (can("operations_manage")) actionHtml = btn("Hoàn tất tour", `finishTour('${b.id}')`, "primary");
  } else if (b.status === "Completed") {
    const pay = paymentState(b);
    text = b.settlement ? `Đã quyết toán · lợi nhuận thực tế ${can("booking_financials") || can("sales_financials") ? fxLedgerMoney(b, b.settlement.profit) : "đã chốt"}.` : "Tour đã hoàn tất — chờ kế toán quyết toán và CSKH thu thập phản hồi.";
    tone = b.settlement ? "green" : "blue";
    if (can("accounting_manage") && !b.settlement) actionHtml = btn("Quyết toán tour", `settlementForm('${b.id}')`, "primary");
    if (pay.due > 0 && can("accounting_manage")) actionHtml += btn("Thu công nợ", `receiveForm('${b.id}')`);
  } else if (b.status === "Cancelled") {
    text = `Booking đã hủy${b.cancelReason ? ": " + esc(b.cancelReason) : ""}.`;
    tone = "red";
  }
  const hasPending = (state.approvals || []).filter((a) => a.ref === b.id && a.status === "PENDING");
  return `<div class="next-action next-action--${tone}"><div><small>BƯỚC TIẾP THEO</small><p>${text}</p>${hasPending.length ? `<p class="sub">Đang chờ duyệt: ${hasPending.map((a) => approvalTypes[a.type]).join(", ")}</p>` : ""}</div><div class="actions">${actionHtml}</div></div>`;
}

function bookingTabContent(b, tab, pay) {
  if (tab === "services") return bookingServicesTab(b);
  if (tab === "pax") return bookingPaxTab(b);
  if (tab === "finance") return bookingFinanceTab(b, pay);
  if (tab === "docs") return bookingDocsTab(b);
  if (tab === "history") return bookingHistoryTab(b);
  return bookingOverviewTab(b);
}

function bookingOverviewTab(b) {
  const checks = readiness(b);
  const approvals = approvalsFor(b.id);
  const lead = findLead(b.lead);
  const quote = findQuote(b.quote);
  return `<div class="split">
    ${card("Mức độ sẵn sàng khởi hành · " + progress(b) + "%", checks.map((c) => `<div class="checkitem"><span class="${c.ok ? "ok" : "no"}">${systemIcon(c.ok ? "circle-check" : "circle")}</span><div class="grow"><b>${esc(c.label)}</b>${c.ok ? "" : `<div class="sub">${esc(c.fix)}</div>`}</div></div>`).join(""))}
    <div>
      ${card("Nguồn gốc booking", line("Lead", lead ? entityLink("lead", lead.id, lead.id + " · " + lead.name) : "—") + line("Báo giá", quote ? entityLink("quote", quote.id, quote.id + " · v" + quote.version) : "—") + line("Tạo lúc", dateTimeVN(b.createdAt)) + line("Chương trình", esc(b.tour)))}
      ${approvals.length ? card("Phê duyệt liên quan", approvals.slice(0, 5).map((a) => `<div class="metricline"><span>${approvalTypes[a.type]}${a.reason ? `<small class="sub"> · ${esc(a.reason)}</small>` : ""}</span>${badge(approvalLabels[a.status], a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : "amber")}</div>`).join("")) : ""}
    </div>
  </div>
  ${b.finalReport ? card("Báo cáo cuối tour của HDV", line("Người nộp", esc(b.finalReport.by) + " · " + dateTimeVN(b.finalReport.at)) + `<p>${esc(b.finalReport.summary)}</p>` + (b.finalReport.highlight ? `<p><b>Nổi bật:</b> ${esc(b.finalReport.highlight)}</p>` : "") + (b.finalReport.issues ? `<p><b>Vấn đề / đề xuất:</b> ${esc(b.finalReport.issues)}</p>` : "") + (b.finalReport.photos?.length ? `<div class="photo-row">${b.finalReport.photos.map((src) => `<img src="${src}" alt="Ảnh tour">`).join("")}</div>` : "")) : ""}
  ${card("Lịch trình", (b.program || []).length ? b.program.map((p, i) => `<div class="timeline"><b>Ngày ${i + 1}</b><p>${esc(p)}</p></div>`).join("") : '<div class="empty">Chưa có lịch trình chi tiết.</div>')}`;
}

function bookingServicesTab(b) {
  const canOp = can("operations_manage") && ["Preparing", "Running"].includes(b.status);
  const showCost = can("operations_costs") || can("booking_financials") || can("sales_financials");
  const guide = findGuide(b.guide);
  const vehicle = (state.vehicles || []).find((v) => v.id === b.vehicle);
  const rows = (b.services || []).filter((s) => s.needed).map((s) => {
    const st = serviceStatus(s);
    const sup = findSupplier(s.supplier);
    let actions = "";
    if (canOp && s.type !== "Guide" && st !== "CANCELLED") {
      if (st === "NOT_BOOKED" && s.supplier) actions += btn("Gửi yêu cầu NCC", `requestSupplier('${b.id}','${s.type}')`, "small primary");
      if (st === "WAITING") actions += btn("NCC xác nhận", `supplierConfirmForm('${b.id}','${s.type}')`, "small primary") + btn("NCC từ chối", `supplierRejectForm('${b.id}','${s.type}')`, "small");
      actions += btn(st === "REJECTED" ? "Chọn NCC khác" : "Đổi NCC / chi phí", `serviceForm('${b.id}','${s.type}')`, "small");
    }
    return `<tr><td><b>${typesVI[s.type] || s.type}</b>${s.confirmCode ? `<span class="sub">Mã xác nhận: ${esc(s.confirmCode)}</span>` : ""}</td><td>${sup ? entityLink("supplier", sup.id, sup.name) : '<span class="sub">Chưa chọn NCC</span>'}</td>${showCost ? `<td>${fxLedgerMoney(b, s.cost)}</td>` : ""}<td>${serviceBadge(s)}${s.history?.[0]?.note ? `<span class="sub">${esc(s.history[0].note)}</span>` : ""}</td><td><div class="actions">${actions || (s.type === "Guide" ? '<span class="sub">Theo phân công HDV</span>' : "")}</div></td></tr>`;
  });
  const bulk = canOp && (b.services || []).some((s) => s.needed && s.type !== "Guide" && serviceStatus(s) === "NOT_BOOKED" && s.supplier) ? btn("Gửi yêu cầu tất cả NCC", `requestAllSuppliers('${b.id}')`, "primary small") : "";
  return `${card("Dịch vụ nhà cung cấp", table(["DỊCH VỤ", "NHÀ CUNG CẤP", ...(showCost ? ["CHI PHÍ"] : []), "TRẠNG THÁI", ""], rows), bulk)}
  <div class="split">
    ${card("Hướng dẫn viên", guide ? `<b>${entityLink("guide", guide.id, guide.name)}</b><p class="sub">${esc(guide.lang)} · ${esc(guide.area)}</p>${b.guideConfirmed ? badge("Đã nhận tour", "green") : badge("Chờ HDV xác nhận", "amber")}` : '<p class="sub">Chưa phân công HDV.</p>', canOp ? btn(guide ? "Đổi HDV" : "Phân công HDV", `assignForm('${b.id}')`, "small") : "")}
    ${card("Phương tiện", vehicle ? `<b>${esc(vehicle.name)}</b><p class="sub">${esc(vehicle.plate)} · ${vehicle.capacity} chỗ</p>${b.vehicleConfirmed ? badge("Nhà xe đã nhận lệnh", "green") : badge("Chờ nhà xe xác nhận", "amber")}` : '<p class="sub">Chưa điều xe.</p>', canOp && can("vehicles_manage") ? btn(vehicle ? "Đổi xe" : "Điều xe", `vehicleForm('${b.id}')`, "small") : "")}
  </div>
  ${(b.guideHistory || []).length ? card("Lịch sử phân công HDV", b.guideHistory.map((h) => `<div class="metricline"><span>${esc(findGuide(h.guide)?.name || h.guide)} — ${{ ASSIGNED: "được phân công", CONFIRMED: "đã nhận tour", DECLINED: "từ chối", RELEASED: "được giải phóng" }[h.action] || h.action}${h.reason ? ` <small class="sub">(${esc(h.reason)})</small>` : ""}</span><small class="sub">${dateTimeVN(h.at)}</small></div>`).join("")) : ""}`;
}

function bookingPaxTab(b) {
  const canEdit = can("bookings_manage") || can("operations_manage");
  return card(
    "Danh sách khách / phân phòng",
    table(["STT", "HỌ TÊN", "GHI CHÚ / PHÒNG"], (b.passengers || []).map((p, i) => `<tr><td><b>${i + 1}</b></td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.notes)}</td></tr>`)),
    canEdit && !["Completed", "Cancelled"].includes(b.status) ? btn("Cập nhật danh sách", `passengerForm('${b.id}')`, "small") : "",
  );
}

function bookingFinanceTab(b, pay) {
  const showFin = can("sales_financials") || can("booking_financials");
  const profit = b.revenue - b.cost;
  const invs = bookingInvoices(b);
  const txs = (state.transactions || []).filter((t) => t.ref === b.id || invs.some((i) => i.id === t.invoice));
  const pays = bookingPayables(b);
  if (!showFin)
    return card("Chi phí phục vụ điều hành", line("Chi phí dịch vụ dự kiến", fxLedgerMoney(b, plannedServiceCost(b))) + line("Dự toán gốc", fxLedgerMoney(b, b.quoteCost ?? b.cost)));
  return `<div class="stats stats--compact">
      ${stat("GIÁ TRỊ HỢP ĐỒNG", fxLedgerMoney(b, b.revenue), `Cọc yêu cầu ${fxLedgerMoney(b, depositRequired(b))}`)}
      ${stat("ĐÃ THU", fxLedgerMoney(b, pay.received), pay.pct + "% giá trị")}
      ${stat("CÒN PHẢI THU", fxLedgerMoney(b, pay.due), pay.overdue ? "Có hóa đơn quá hạn" : "Theo hóa đơn đã phát hành")}
      ${stat("LỢI NHUẬN DỰ KIẾN", fxLedgerMoney(b, profit), b.revenue ? ((profit / b.revenue) * 100).toFixed(1) + "% biên gộp" : "—")}
    </div>
    ${card("Lịch thanh toán theo đợt", (() => { const sc = paymentSchedule(b); const tone = { PAID: "green", OVERDUE: "red", PARTIAL: "amber", PENDING: "" }, lab = { PAID: "Đã thu", OVERDUE: "Quá hạn", PARTIAL: "Thu một phần", PENDING: "Chưa đến hạn" }; return sc.length ? table(["ĐỢT", "SỐ TIỀN", "ĐÃ THU", "HẠN", "TÌNH TRẠNG"], sc.map((x) => `<tr><td><b>${x.label}</b></td><td>${fxLedgerMoney(b, x.amount)}</td><td>${fxLedgerMoney(b, x.paid)}</td><td>${fmt(x.due)}</td><td>${badge(lab[x.status], tone[x.status])}</td></tr>`)) : '<div class="empty">Chưa có giá trị hợp đồng.</div>'; })())}
    ${card("Hóa đơn khách hàng", invs.length ? table(["MÃ", "LOẠI", "SỐ TIỀN", "ĐÃ THU", "HẠN", ""], invs.map((i) => `<tr><td>${entityLink("invoice", i.id)}</td><td>${i.type === "Deposit" ? "Đặt cọc" : "Quyết toán"}</td><td>${fxLedgerMoney(b, i.amount)}</td><td>${fxLedgerMoney(b, i.paid)}</td><td>${fmt(i.due)}</td><td>${badge(i.paid >= i.amount ? "Đã thu" : i.due < todayISO() ? "Quá hạn" : "Chờ thu", i.paid >= i.amount ? "green" : i.due < todayISO() ? "red" : "amber")}</td></tr>`)) : '<div class="empty">Chưa phát hành hóa đơn.</div>')}
    ${can("booking_financials") ? card("Hóa đơn nhà cung cấp / hoàn tiền", pays.length ? table(["MÃ", "ĐỐI TƯỢNG", "SỐ TIỀN", "HẠN", "TRẠNG THÁI"], pays.map((p) => `<tr><td>${p.id}</td><td>${p.kind === "REFUND" ? "Hoàn tiền khách" : entityLink("supplier", p.supplier, findSupplier(p.supplier)?.name)}</td><td>${fxLedgerMoney(b, p.amount)}</td><td>${fmt(p.due)}</td><td>${badge({ Pending: "Chờ duyệt", Approved: "Đã duyệt", Paid: "Đã chi" }[p.status], p.status === "Paid" ? "green" : "amber")}</td></tr>`)) : '<div class="empty">Chưa có khoản chi.</div>') : ""}
    ${txs.length ? card("Giao dịch thu / chi", table(["LOẠI", "SỐ TIỀN", "THỜI ĐIỂM"], txs.map((t) => `<tr><td>${badge(t.type === "IN" ? "Thu" : "Chi", t.type === "IN" ? "green" : "amber")}</td><td>${fxTxMoney(b, t)}</td><td>${esc(t.time)}</td></tr>`))) : ""}
    ${b.settlement ? card("Quyết toán", line("Doanh thu thực thu", fxLedgerMoney(b, b.settlement.revenue)) + line("Chi phí thực tế", fxLedgerMoney(b, b.settlement.actualCost)) + line("Lợi nhuận chốt", `<b class="moneypositive">${fxLedgerMoney(b, b.settlement.profit)}</b>`) + line("Chốt bởi", esc(b.settlement.by) + " · " + dateTimeVN(b.settlement.at))) : ""}`;
}

function bookingDocsTab(b) {
  const docs = (typeof allDocs === "function" ? allDocs() : state.docs).filter((d) => d.booking === b.id);
  return card(
    "Tài liệu của booking",
    docs.length ? table(["TÀI LIỆU", "LOẠI", "NGÀY", ""], docs.map((d) => `<tr><td><strong>${esc(d.name)}</strong></td><td>${badge(d.type)}</td><td>${fmt(d.date)}</td><td>${btn("Mở", `openDocument('${d.id}')`, "small")}</td></tr>`)) : '<div class="empty">Chưa có tài liệu.</div>',
    can("documents_manage") ? btn("Tải tài liệu", "documentForm()", "small") : "",
  );
}

function bookingHistoryTab(b) {
  const logs = (state.auditLogs || []).filter((x) => x.entityId === b.id || x.summary.includes(b.id)).slice(0, 40);
  return `${card("Lịch sử chuyển trạng thái", (b.statusHistory || []).length ? (b.statusHistory || []).map((h) => `<div class="metricline"><span>${h.from ? (bookingLabels[h.from] || h.from) + " → " : ""}<b>${bookingLabels[h.to] || h.to}</b>${h.note ? `<small class="sub"> · ${esc(h.note)}</small>` : ""}</span><small class="sub">${esc(h.by || "")} · ${dateTimeVN(h.at)}</small></div>`).join("") : '<div class="empty">Chưa có lịch sử.</div>')}
  ${card("Nhật ký thao tác", logs.length ? logs.map((x) => `<div class="metricline"><span>${esc(x.summary)}</span><small class="sub">${esc(x.user)} · ${dateTimeVN(x.at)}</small></div>`).join("") : '<div class="empty">Chưa có thao tác nào được ghi nhận.</div>')}`;
}

function bookingFooterActions(b) {
  const open = !["Completed", "Cancelled"].includes(b.status);
  let a = "";
  if (can("operations_manage")) {
    if (b.status === "Preparing") a += btn("Ghi nhận sự cố", `issueForm('${b.id}')`) + btn("Kiểm tra trước tour", `preTourCheck('${b.id}')`) + btn("Tạo voucher", `makeVoucher('${b.id}')`);
    if (b.status === "Running") a += btn("Ghi nhận sự cố", `issueForm('${b.id}')`);
    if (b.voucher) a += btn("In voucher", `printVoucher('${b.id}')`);
  }
  if (isGuideRole() && b.voucher) a += btn("Voucher dịch vụ", `printVoucher('${b.id}')`);
  if (can("accounting_manage") && b.status !== "Cancelled") a += btn("Tạo hóa đơn", `invoiceForm('${b.id}')`) + (balance(b) > 0 ? btn("Ghi nhận thu", `receiveForm('${b.id}')`, "primary") : "");
  if ((can("bookings_manage") || can("approvals_manage")) && open && b.status !== "Running") a += btn(can("approvals_manage") ? "Hủy booking" : "Đề nghị hủy tour", `cancelForm('${b.id}')`, "danger");
  if (can("bookings_manage") && b.status === "Running") a += btn("Đề nghị hủy tour", `cancelForm('${b.id}')`, "danger");
  a += btn("In hợp đồng", `printContract('${b.id}')`);
  return a;
}

/* ---------- Thao tác thương mại trên booking ---------- */
function passengerForm(id) {
  const b = findBooking(id);
  modal(
    "Danh sách khách · " + id,
    `<form onsubmit="savePassengers(event,'${id}')"><label>Mỗi dòng một khách, định dạng: <i>Họ tên | ghi chú / phòng</i> (cần ${b.pax} khách)<textarea name="list" style="min-height: 220px;" required>${esc((b.passengers || []).map((p) => `${p.name} | ${p.notes || ""}`).join("\n"))}</textarea></label><div class="formfooter"><button class="btn primary">Lưu danh sách</button></div></form>`,
    true,
  );
}

function savePassengers(e, id) {
  e.preventDefault();
  if (!(can("bookings_manage") || can("operations_manage"))) return toast("Bạn không có quyền cập nhật danh sách khách.");
  const b = findBooking(id);
  const list = new FormData(e.target).get("list").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name, ...rest] = line.split("|");
    return { name: name.trim(), notes: rest.join("|").trim() };
  });
  if (list.length !== b.pax) return toast(`Danh sách phải đủ ${b.pax} khách (hiện ${list.length}).`);
  b.passengers = list;
  audit("booking", id, "PAX", `${id} cập nhật danh sách khách (${list.length})`);
  openBooking(id, "pax");
}

function noDepositForm(id) {
  modal(
    "Đề nghị miễn đặt cọc · " + id,
    `<form onsubmit="requestNoDeposit(event,'${id}')"><label>Lý do (khách quen, đối tác doanh nghiệp, công nợ được phép…)<textarea name="reason" required></textarea></label><p class="notice">Booking chuyển sang "Chờ phê duyệt". Sau khi CEO duyệt, booking tự động chuyển "Đã xác nhận" để bàn giao điều hành; công nợ vẫn được kế toán theo dõi.</p><div class="formfooter"><button class="btn primary">Gửi CEO phê duyệt</button></div></form>`,
    true,
  );
}

function requestNoDeposit(e, id) {
  e.preventDefault();
  if (!requireCapability("bookings_manage")) return;
  const b = findBooking(id),
    reason = new FormData(e.target).get("reason").trim();
  requestApproval({ type: "NO_DEPOSIT", ref: id, amount: b.revenue, reason });
  setBookingStatus(b, "PendingApproval", "Đề nghị miễn cọc: " + reason);
  openBooking(id);
  render();
  toast("Đã gửi CEO phê duyệt.");
}

function cancelForm(id) {
  const b = findBooking(id);
  const ceo = can("approvals_manage");
  const code = fxLedgerCode();
  const refundDefault = Math.min(refundSuggestion(b).amount, b.received || 0);
  modal(
    (ceo ? "Hủy booking · " : "Đề nghị hủy tour · ") + id,
    `<form onsubmit="submitCancel(event,'${id}')"><label>Lý do hủy<textarea name="reason" required></textarea></label><label>Số tiền hoàn lại cho khách (${code}) — tối đa ${fxLedgerMoney(b, b.received || 0)}<input name="refund" type="number" min="0" max="${fxLedgerInput(b, b.received || 0)}" step="any" value="${fxLedgerInput(b, refundDefault)}" required><small class="sub">Gợi ý theo chính sách: hủy trước khởi hành ${refundSuggestion(b).days} ngày → hoàn ${refundSuggestion(b).pct}% số đã thu.</small></label><p class="notice">${ceo ? "Booking sẽ bị hủy ngay, dịch vụ NCC được hủy và HDV được giải phóng. Khoản hoàn tiền (nếu có) chuyển sang Kế toán để chi." : "Yêu cầu hủy và hoàn tiền phải được CEO phê duyệt trước khi có hiệu lực."}</p><div class="formfooter"><button class="btn danger">${ceo ? "Hủy booking" : "Gửi CEO phê duyệt"}</button></div></form>`,
    true,
  );
}

function submitCancel(e, id) {
  e.preventDefault();
  const b = findBooking(id),
    f = new FormData(e.target),
    reason = f.get("reason").trim(),
    refund = fxLedgerInputVnd(b, f.get("refund") || 0, b.received || 0);
  if (refund < 0 || refund > (b.received || 0)) return toast("Số tiền hoàn không hợp lệ.");
  if (can("approvals_manage")) {
    cancelBooking(b, refund, reason);
    audit("booking", id, "CANCEL", `CEO hủy ${id}: ${reason}`);
    closeModal();
    render();
    return openBooking(id);
  }
  if (!requireCapability("bookings_manage")) return;
  requestApproval({ type: "CANCEL", ref: id, amount: refund, reason, data: { refund } });
  openBooking(id);
  toast("Đã gửi CEO phê duyệt hủy tour.");
}

function printContract(id) {
  const b = findBooking(id);
  if (!b) return;
  const p = policy();
  printable(
    "Hợp đồng dịch vụ tour " + b.id,
    `<h2>Bên A: Typic Travel — Bên B: ${esc(b.client)}</h2><p>Chương trình: <b>${esc(b.tour)}</b><br>Thời gian: ${fmt(b.start)} – ${fmt(b.end)} · ${b.pax} khách</p><table><tr><th>Điều khoản</th><th>Nội dung</th></tr><tr><td>Giá trị hợp đồng</td><td>${fxDual(b.revenue, fxEntryOf(b))}</td></tr><tr><td>Đặt cọc</td><td>${p.requireDeposit ? fxDual(depositRequired(b) || Math.round((b.revenue * p.depositPct) / 100), fxEntryOf(b)) + ` (${p.depositPct}%)` : "Không yêu cầu"}</td></tr><tr><td>Thanh toán còn lại</td><td>Theo hóa đơn quyết toán trước ngày khởi hành</td></tr></table><h2>Lịch trình</h2>${(b.program || []).map((x, i) => `<p><b>Ngày ${i + 1}</b> · ${esc(x)}</p>`).join("")}<p>Điều kiện hoàn hủy và trách nhiệm hai bên được áp dụng theo quy định của Typic Travel.</p>`,
  );
}

function passengerDetail(id) {
  const b = findBooking(id);
  if (!b) return;
  if (isGuideRole() && b.guide !== activeGuideId()) return toast("Bạn không có quyền xem hành khách của tour này.");
  if (!isGuideRole() && !can("operations_manage") && !can("bookings_manage") && !can("documents_manage")) return toast("Bạn không có quyền xem danh sách hành khách này.");
  modal("Danh sách phân phòng & hành khách · " + id, bookingPaxTab(b));
}
