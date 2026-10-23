/* MODULE mod-quotes — báo giá nhiều phiên bản, phê duyệt giá và chuyển thành Booking. */

let quoteSearch = "";
let quoteStatusFilter = "all";

const quoteMargin = (q) => (q.amount ? ((q.amount - q.cost) / q.amount) * 100 : 0);

function quoteDiscountPct(q) {
  const prev = (q.history || [])[0];
  if (!prev || !prev.amount || q.amount >= prev.amount) return 0;
  return ((prev.amount - q.amount) / prev.amount) * 100;
}

function quoteApprovalReasons(q) {
  const p = policy();
  const reasons = [];
  if (quoteMargin(q) < p.minMarginPct) reasons.push(`biên lợi nhuận ${quoteMargin(q).toFixed(1)}% thấp hơn ngưỡng ${p.minMarginPct}%`);
  if (quoteDiscountPct(q) > p.maxDiscountPct) reasons.push(`giảm giá ${quoteDiscountPct(q).toFixed(1)}% so với phiên bản trước, vượt ngưỡng ${p.maxDiscountPct}%`);
  return reasons;
}

const quoteValidDays = () => policy().quoteValidDays || 14;
const addDaysISO = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const quoteExpired = (q) => q.status === "Sent" && q.validUntil && q.validUntil < todayISO();
const quoteDaysLeft = (q) => (q.validUntil ? Math.ceil((new Date(q.validUntil) - new Date(todayISO())) / 864e5) : null);
function quoteValidityBadge(q) {
  if (q.status !== "Sent" || !q.validUntil) return "";
  const left = quoteDaysLeft(q);
  return `<span class="sub">${left < 0 ? badge("Hết hạn " + fmt(q.validUntil), "red") : left <= 3 ? badge("Còn " + left + " ngày", "amber") : "Hiệu lực đến " + fmt(q.validUntil)}</span>`;
}
function extendQuote(id) {
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id);
  q.validUntil = addDaysISO(todayISO(), 7);
  audit("quote", id, "EXTEND", `Gia hạn ${id} đến ${q.validUntil}`);
  closeModal(); render(); quoteDetail(id); toast("Đã gia hạn báo giá thêm 7 ngày.");
}

const quoteApproved = (q) => q.approval?.status === "APPROVED" && q.approval.version === q.version;

views.quotes = () => {
  const all = scopedQuotes();
  const count = (s) => all.filter((q) => q.status === s).length;
  const filtered = all.filter((q) => {
    const matchSearch = !quoteSearch || [q.id, q.client, q.tour].join(" ").toLowerCase().includes(quoteSearch.toLowerCase());
    return matchSearch && (quoteStatusFilter === "all" || q.status === quoteStatusFilter);
  });
  const open = all.filter((q) => ["Draft", "PendingApproval", "Sent"].includes(q.status));
  return (
    title(
      "Báo giá",
      "Mỗi lần khách yêu cầu sửa là một phiên bản mới; phiên bản cũ luôn được giữ lại.",
      can("tour_design_manage") ? btn("+ Thiết kế báo giá mới", "go('design')", "primary") : "",
    ) +
    `<div class="stats">
      ${stat("TỔNG BÁO GIÁ", all.length, "Trong phạm vi của bạn")}
      ${stat("CHỜ KHÁCH PHẢN HỒI", count("Sent"), count("Draft") + " bản nháp · " + count("PendingApproval") + " chờ CEO duyệt")}
      ${stat("ĐÃ CHẤP NHẬN", count("Accepted"), "Đã chuyển thành Booking")}
      ${stat("GIÁ TRỊ ĐANG MỞ", fxSumMoney(open, (q) => q.amount), open.length + " báo giá còn hiệu lực")}
    </div>` +
    card(
      "Danh sách báo giá",
      `<div class="filters">
        <input placeholder="Tìm theo mã báo giá, khách hàng, chương trình…" value="${esc(quoteSearch)}" aria-label="Tìm báo giá" oninput="quoteSearch=this.value;render()" />
        <select aria-label="Lọc trạng thái báo giá" onchange="quoteStatusFilter=this.value;render()">
          <option value="all">Tất cả trạng thái</option>
          ${Object.entries(quoteLabels).map(([v, l]) => `<option value="${v}" ${quoteStatusFilter === v ? "selected" : ""}>${l} (${count(v)})</option>`).join("")}
        </select>
        <span class="sub" style="margin-left: auto; font-weight: 600;">${filtered.length} / ${all.length} báo giá</span>
      </div>` +
        (filtered.length
          ? table(
              ["MÃ BÁO GIÁ", "KHÁCH HÀNG & HÀNH TRÌNH", "GIÁ BÁN", "DỰ TOÁN CHI PHÍ", "BIÊN LỢI NHUẬN", "TRẠNG THÁI", "LIÊN KẾT", "THAO TÁC"],
              filtered.map((q) => {
                const margin = quoteMargin(q).toFixed(1);
                const booking = state.bookings.find((b) => b.quote === q.id);
                return `<tr><td><strong>${q.id}</strong><span class="sub">Phiên bản v${q.version}</span></td><td><strong>${customerLink(q.client)}</strong><span class="sub">${esc(q.tour)}</span></td><td><b class="moneypositive">${fxMoneyOf(q, q.amount)}</b></td><td>${fxMoneyOf(q, q.cost)}</td><td>${badge(margin + "%", Number(margin) >= policy().minMarginPct ? "green" : "amber")}</td><td>${quoteBadge(q.status)}${quoteValidityBadge(q)}</td><td>${entityLink("lead", q.lead)}${booking ? `<span class="sub">${entityLink("booking", booking.id)}</span>` : ""}</td><td>${btn("Xem chi tiết", "quoteDetail('" + q.id + "')", "small")}</td></tr>`;
              }),
            )
          : '<div class="empty">Không tìm thấy báo giá phù hợp.</div>'),
    ) +
    `<div class="alert green"><b>Quy trình:</b> Bản nháp → (CEO duyệt nếu giá thấp) → Gửi khách → Khách chấp nhận → tự tạo Booking ở trạng thái <i>Chờ đặt cọc</i> và bàn giao cho Kế toán thu cọc. Điều hành chỉ nhận booking sau khi cọc được xác nhận.</div>`
  );
};

function quoteDetail(id) {
  const q = findQuote(id);
  if (!q) return;
  const lead = findLead(q.lead);
  const booking = state.bookings.find((b) => b.quote === q.id);
  const margin = quoteMargin(q);
  const approval = pendingApproval(q.id, "QUOTE_PRICE");
  const reasons = quoteApprovalReasons(q);
  const history = (q.history || [])
    .map((item) => `<div class="quote-history-row"><div><b>Phiên bản v${item.version}</b><small>${fxMoneyOf(item, item.amount)} · ${dateTimeVN(item.at)}${item.by ? " · " + esc(item.by) : ""}${item.note ? "<br>" + esc(item.note) : ""}</small></div><span><button class="entity-link" onclick="printQuote('${q.id}',${item.version})">In bản này</button></span></div>`)
    .join("");

  const canSell = can("quotes_manage");
  let actions = btn("In / Lưu PDF", `printQuote('${id}')`);
  if (canSell && ["Draft", "Rejected"].includes(q.status))
    actions += btn("Điều chỉnh giá (phiên bản mới)", `reviseQuote('${id}')`) + btn(approval ? "Đã gửi yêu cầu duyệt giá" : reasons.length && !quoteApproved(q) ? "Gửi CEO duyệt giá" : "Gửi báo giá cho khách", `sendQuote('${id}')`, "primary");
  if (canSell && q.status === "Sent" && quoteExpired(q)) actions += btn("Gia hạn 7 ngày", `extendQuote('${id}')`);
  if (canSell && q.status === "Sent")
    actions += btn("Gửi lại", `sendQuote('${id}')`) + btn("Khách yêu cầu sửa", `reviseQuote('${id}')`) + btn("Khách từ chối", `rejectQuoteForm('${id}')`) + btn("Khách chấp nhận → Tạo Booking", `acceptQuote('${id}')`, "primary");
  if (q.status === "PendingApproval" && can("approvals_manage") && approval)
    actions += btn("Từ chối giá", `approvalDecisionForm('${approval.id}',false)`) + btn("Duyệt giá", `approvalDecisionForm('${approval.id}',true)`, "primary");
  if (q.status === "Accepted" && booking) actions += btn("Mở Booking " + booking.id, `closeModal();openBooking('${booking.id}')`, "primary");

  modal(
    "Báo giá · " + q.id,
    `<div class="detail-panel quote-detail">
      ${journeyBar({ lead, quote: q, booking })}
      <section class="quote-identity">
        <div class="quote-mark">BG</div>
        <div>
          <div class="quote-identity-line"><h3>${q.id}</h3>${quoteBadge(q.status)}</div>
          <strong>Khách hàng: ${customerLink(q.client)}</strong>
          <p>${esc(q.tour)}</p>
        </div>
      </section>
      ${quoteExpired(q) ? `<div class="alert red"><b>Báo giá đã hết hạn ${fmt(q.validUntil)}.</b> Gia hạn hoặc tạo phiên bản mới trước khi ghi nhận khách chấp nhận.</div>` : ""}
      ${approval ? `<div class="alert"><b>Đang chờ CEO duyệt giá:</b> ${esc(approval.reason)}</div>` : ""}
      ${q.status === "Draft" && reasons.length && !quoteApproved(q) ? `<div class="alert red"><b>Cần CEO duyệt trước khi gửi:</b> ${reasons.join("; ")}.</div>` : ""}
      ${quoteApproved(q) && q.status === "Draft" ? `<div class="alert green"><b>CEO đã duyệt giá</b> ${q.approval.note ? "— " + esc(q.approval.note) : ""}. Có thể gửi khách.</div>` : ""}
      ${q.approval?.status === "REJECTED" && q.approval.version === q.version ? `<div class="alert red"><b>CEO từ chối giá này</b>${q.approval.note ? ": " + esc(q.approval.note) : ""}. Hãy điều chỉnh giá và tạo phiên bản mới.</div>` : ""}
      <div class="detail-summary">
        <div><small>Phiên bản</small><b>v${q.version}</b></div>
        <div><small>Khởi hành</small><b>${fmt(q.start)}</b></div>
        <div><small>Quy mô đoàn</small><b>${q.pax} khách</b></div>
        <div><small>Thị trường</small><b>${esc(q.country || lead?.country || "Quốc tế")}</b></div>
      </div>
      <section class="quote-finance">
        <div><small>Giá bán trọn gói</small><strong>${fxMoneyOf(q, q.amount)}</strong>${fxEntryOf(q) ? `<span>${money(q.amount)}</span>` : ""}</div>
        <div><small>Dự toán chi phí</small><strong>${fxMoneyOf(q, q.cost)}</strong></div>
        <div class="${margin >= policy().minMarginPct ? "positive" : "warning"}"><small>Lợi nhuận gộp dự kiến</small><strong>${fxMoneyOf(q, q.amount - q.cost)}</strong><span>Biên lợi nhuận ${margin.toFixed(1)}%</span></div>
      </section>
      <div class="quote-detail-grid">
        <section class="detail-section">
          <div class="detail-section-head"><h3>Chương trình tour</h3><span>${q.days || q.program?.length || 0} ngày</span></div>
          <div class="quote-itinerary">${q.program?.length ? q.program.map((item, index) => `<div class="quote-day"><b>Ngày ${index + 1}</b><p>${esc(item)}</p></div>`).join("") : '<p class="sub">Báo giá chưa có lịch trình chi tiết theo ngày.</p>'}</div>
        </section>
        <div class="quote-side">
          <section class="detail-section">
            <div class="detail-section-head"><h3>Thông tin liên kết</h3></div>
            ${line("Lead", q.lead ? entityLink("lead", q.lead) : "—")}
            ${line("Sales phụ trách", esc(lead?.sales || "—"))}
            ${line("Ngân sách khách", q.budgetNative ? esc(q.budgetNative) + " " + esc(q.currency) : "Báo giá VND")}
            ${line("Tỷ giá", fxRateLabel(q))}
            ${line("Ngôn ngữ", esc(q.language || "Tiếng Việt"))}
            ${q.sentAt ? line("Đã gửi lúc", dateTimeVN(q.sentAt)) : ""}
            ${q.validUntil ? line("Hiệu lực đến", fmt(q.validUntil)) : ""}
            ${booking ? line("Booking", entityLink("booking", booking.id)) : ""}
          </section>
          <section class="detail-section">
            <div class="detail-section-head"><h3>Các phiên bản trước</h3></div>
            ${history || '<div class="empty" style="padding: 16px;">Chưa có phiên bản trước.</div>'}
          </section>
        </div>
      </div>
      <footer class="detail-footer">${actions}</footer>
    </div>`,
  );
}

/* Tiền nhập ở form sửa báo giá: USD khi cả tỷ giá của báo giá và tỷ giá hôm nay đều có USD, không thì VND. */
function quoteInputCode(q) {
  const both = fxRate(fxDisplayCurrency, fxEntryOf(q)) && fxRate(fxDisplayCurrency);
  return both ? fxDisplayCurrency : "VND";
}

/* Số nhập (tiền `code`) → VND. Không sửa số thì giữ nguyên VND đã lưu; sửa thì quy đổi theo tỷ giá hôm nay. */
function quoteVndFromInput(input, storedVnd, code, oldEntry) {
  const value = Number(input);
  if (value === fxFromVnd(storedVnd, code, oldEntry)) return storedVnd;
  return fxToVnd(value, code, fxCurrent());
}

function reviseQuote(id) {
  const q = findQuote(id);
  const code = quoteInputCode(q);
  const entry = fxEntryOf(q);
  const step = code === "VND" ? "500000" : "any";
  const amount = fxFromVnd(q.amount, code, entry);
  const cost = fxFromVnd(q.cost, code, entry);
  modal(
    "Điều chỉnh giá · " + id,
    `<form onsubmit="saveRevision(event,'${id}')">
      <input type="hidden" name="code" value="${esc(code)}">
      <div class="formgrid">
        <label>Giá bán nhóm (${esc(code)})<input name="amount" type="number" min="0.01" step="${step}" value="${amount}" required></label>
        <label>Dự toán chi phí (${esc(code)})<input name="cost" type="number" min="0" step="${step}" value="${cost}" required></label>
        <label class="full">Lý do điều chỉnh<input name="note" placeholder="Ví dụ: Khách đề nghị giảm giá / đổi khách sạn" required></label>
      </div>
      <p class="notice">Hệ thống giữ nguyên phiên bản v${q.version} trong lịch sử và tạo phiên bản v${q.version + 1} ở trạng thái bản nháp.</p>
      <div class="formfooter"><button class="btn primary" type="submit">Lưu phiên bản v${q.version + 1}</button></div>
    </form>`,
    true,
  );
}

function saveRevision(e, id) {
  e.preventDefault();
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id),
    f = new FormData(e.target);
  if (q.status === "Accepted") return toast("Báo giá đã chấp nhận, không thể sửa.");
  q.history = q.history || [];
  q.history.unshift({
    version: q.version,
    amount: q.amount,
    cost: q.cost,
    program: q.program,
    status: q.status,
    sentAt: q.sentAt || "",
    at: nowISO(),
    by: actor().name,
    note: f.get("note"),
    fxDate: fxDocDate(q),
  });
  const wasSent = q.status === "Sent";
  const code = String(f.get("code") || "VND");
  const oldEntry = fxEntryOf(q);
  q.amount = quoteVndFromInput(f.get("amount"), q.amount, code, oldEntry);
  const newCost = quoteVndFromInput(f.get("cost"), q.cost, code, oldEntry);
  if (q.costBreakdown && q.cost > 0) {
    const ratio = newCost / q.cost;
    for (const k of Object.keys(q.costBreakdown)) q.costBreakdown[k] = Math.round(q.costBreakdown[k] * ratio);
  }
  q.cost = newCost;
  q.fxDate = todayISO();
  q.version++;
  q.status = "Draft";
  q.approval = null;
  q.sentAt = "";
  q.validUntil = "";
  const lead = findLead(q.lead);
  if (wasSent && lead?.status === "QUOTE SENT") updateLeadStatus(lead, "NEGOTIATION", "Khách yêu cầu điều chỉnh báo giá " + id);
  audit("quote", id, "REVISE", `${id} lưu phiên bản v${q.version} (${money(q.amount)})`);
  closeModal();
  render();
  quoteDetail(id);
  toast("Đã lưu phiên bản v" + q.version + ".");
}

function sendQuote(id) {
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id);
  if (q.status === "Accepted") return;
  const reasons = quoteApprovalReasons(q);
  if (reasons.length && !quoteApproved(q) && !can("approvals_manage")) {
    if (pendingApproval(q.id, "QUOTE_PRICE")) return toast("Đang chờ CEO duyệt giá.");
    requestApproval({ type: "QUOTE_PRICE", refType: "quote", ref: q.id, amount: q.amount, reason: reasons.join("; ") });
    q.status = "PendingApproval";
    render();
    quoteDetail(id);
    return toast("Đã gửi yêu cầu CEO duyệt giá. Bạn sẽ nhận thông báo khi có quyết định.");
  }
  const lead = findLead(q.lead);
  modal(
    "Gửi báo giá cho khách · " + id,
    `<form onsubmit="composeQuoteEmail(event,'${id}')">
      <label>Email người nhận ${field("to", "email", lead?.email || "", true)}</label>
      <label>Tiêu đề ${field("subject", "text", "Typic Travel — Báo giá " + q.tour + " [" + id + " · v" + q.version + "]", true)}</label>
      <label>Nội dung<textarea name="body" style="min-height: 150px;">Kính gửi Quý khách ${q.client},\n\nTypic Travel xin gửi Quý khách chương trình "${q.tour}" khởi hành ${fmt(q.start)}, đoàn ${q.pax} khách.\nTổng giá trọn gói: ${fxDual(q.amount, fxEntryOf(q))}.\n\nChương trình chi tiết đính kèm theo bản PDF. Rất mong nhận được phản hồi của Quý khách.\n\nTrân trọng,\n${myName()}\nTypic Travel</textarea></label>
      <div class="notice">Bấm "Mở hộp thư để gửi" để soạn sẵn thư trong ứng dụng email của bạn. Báo giá sẽ được ghi nhận là <b>Đã gửi</b> và lead chuyển sang <b>Đã gửi báo giá</b>.</div>
      <div class="formfooter">${btn("In / lưu PDF để đính kèm", `printQuote('${id}')`)}<button class="btn primary" type="submit">Mở hộp thư để gửi</button></div>
    </form>`,
    true,
  );
}

function composeQuoteEmail(e, id) {
  e.preventDefault();
  const f = new FormData(e.target);
  const href = `mailto:${encodeURIComponent(f.get("to"))}?subject=${encodeURIComponent(f.get("subject"))}&body=${encodeURIComponent(f.get("body"))}`;
  markQuoteSent(id);
  window.open(href, "_self");
}

function markQuoteSent(id) {
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id);
  if (q.status === "Accepted") return;
  q.status = "Sent";
  q.sentAt = nowISO();
  q.validUntil = addDaysISO(todayISO(), quoteValidDays());
  const lead = findLead(q.lead);
  if (lead && ["NEW", "CONTACTED", "QUALIFIED"].includes(lead.status)) updateLeadStatus(lead, "QUOTE SENT", `Đã gửi ${q.id} v${q.version}`);
  audit("quote", id, "SEND", `Gửi ${id} v${q.version} cho ${q.client}`);
  closeModal();
  render();
  quoteDetail(id);
  toast("Đã ghi nhận gửi báo giá cho khách.");
}

function rejectQuoteForm(id) {
  modal(
    "Khách từ chối báo giá · " + id,
    `<form onsubmit="rejectQuote(event,'${id}')"><label>Lý do khách từ chối<textarea name="reason" required placeholder="Giá cao, đổi lịch trình, chọn đơn vị khác…"></textarea></label><div class="formfooter">${btn("Hủy", `quoteDetail('${id}')`)}<button class="btn danger" type="submit">Xác nhận</button></div></form>`,
    true,
  );
}

function rejectQuote(e, id) {
  e.preventDefault();
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id),
    reason = new FormData(e.target).get("reason").trim();
  q.status = "Rejected";
  q.rejectReason = reason;
  const lead = findLead(q.lead);
  if (lead?.status === "QUOTE SENT") updateLeadStatus(lead, "NEGOTIATION", `Khách từ chối ${id}: ${reason}`);
  audit("quote", id, "REJECT", `Khách từ chối ${id}: ${reason}`);
  closeModal();
  render();
  quoteDetail(id);
}

function acceptQuote(id) {
  if (!requireCapability("quotes_manage")) return;
  const q = findQuote(id);
  if (q.status === "Accepted") return;
  if (q.status !== "Sent") return toast("Hãy gửi báo giá cho khách trước khi ghi nhận khách chấp nhận.");
  if (quoteExpired(q)) return toast("Báo giá đã hết hạn — hãy gia hạn hoặc tạo phiên bản mới.");
  const lead = findLead(q.lead);
  const bid = nextBusinessId("bookings");
  const p = policy();
  const services = serviceTypes.map((t, k) => ({
    type: t,
    needed: true,
    supplier: state.suppliers.find((supplier) => supplier.type === t)?.id || "",
    cost: q.costBreakdown ? Math.round((q.costBreakdown[t] || 0) + (k === 0 ? q.costBreakdown.Other || 0 : 0)) : Math.round(q.cost * (serviceCostWeights[k] || 0)),
    confirmed: false,
    status: "NOT_BOOKED",
    history: [],
  }));
  if (services.length && !q.costBreakdown) services[services.length - 1].cost = q.cost - services.slice(0, -1).reduce((n, s) => n + s.cost, 0);
  let customer = lead && (state.customers || []).find((c) => (c.email && c.email === lead.email) || c.name === lead.name);
  if (!customer) {
    customer = { id: nextBusinessId("customers"), name: q.client, contact: q.client, country: q.country || "", email: lead?.email || "", whatsapp: lead?.whatsapp || "", phone: lead?.whatsapp || "", owner: lead?.sales || myName(), careLog: [] };
    state.customers.push(customer);
  }
  customer.status = "active";
  const booking = {
    id: bid,
    lead: q.lead,
    quote: q.id,
    customerId: customer.id,
    client: q.client,
    tour: q.tour,
    start: q.start,
    end: addDays(q.start, q.days - 1),
    pax: q.pax,
    revenue: q.amount,
    cost: q.cost,
    quoteCost: q.cost,
    fxDate: fxDocDate(q),
    sales: lead ? lead.sales : myName(),
    operator: "",
    status: p.requireDeposit ? "PendingDeposit" : "Confirmed",
    depositAmount: p.requireDeposit ? Math.round((q.amount * p.depositPct) / 100) : 0,
    guide: "",
    guideConfirmed: false,
    voucher: false,
    received: 0,
    services,
    program: q.program || [],
    passengers: Array.from({ length: q.pax }, (_, i) => ({ name: i === 0 ? q.client : "Khách đi kèm " + (i + 1), notes: i === 0 ? "Khách liên hệ chính" : "Chờ bổ sung thông tin hộ chiếu" })),
    feedback: null,
    guideHistory: [],
    guideReports: [],
    statusHistory: [{ at: nowISO(), by: actor().name, from: "", to: p.requireDeposit ? "PendingDeposit" : "Confirmed", note: "Khách chấp nhận " + q.id }],
    createdAt: nowISO(),
  };
  state.bookings.push(booking);
  if (booking.status === "Confirmed") ensureBookingContract(booking);
  q.status = "Accepted";
  q.acceptedAt = nowISO();
  if (lead) {
    lead.status = "WON";
    lead.statusHistory.unshift({ status: "WON", at: nowISO(), by: actor().name, note: `Khách chấp nhận ${q.id} → ${bid}` });
  }
  audit("booking", bid, "CREATE", `${q.id} → tạo ${bid} (${money(q.amount)}), chờ đặt cọc ${money(booking.depositAmount)}`);
  closeModal();
  go("bookings");
  openBooking(bid);
  toast(`Đã tạo ${bid}. Kế toán sẽ phát hành yêu cầu đặt cọc; sau khi cọc được xác nhận, điều hành sẽ tiếp nhận.`);
}

/* Dòng "Tỷ giá" ở chi tiết báo giá: 1 tiền của khách = x ₫ theo tỷ giá VCB của ngày tạo báo giá. */
function fxRateLabel(q) {
  const code = q.currency;
  const entry = fxEntryOf(q);
  const rate = fxRate(code, entry) || Number(q.rate) || 0;
  if (!code || !rate) return "—";
  const date = entry?.date ? ` (VCB ${fxDateVN(entry.date)})` : "";
  return `1 ${esc(code)} = ${new Intl.NumberFormat("vi-VN").format(rate)} ₫${date}`;
}

/* Các dòng phụ của bản in: tiền của khách (nếu khác USD/VND) và tỷ giá áp dụng. */
function quotePrintRefRows(q, data, entry) {
  const rows = [];
  const code = q.currency;
  const rate = code && code !== "VND" && code !== fxDisplayCurrency ? fxRate(code, entry) : null;
  if (rate) {
    const value = new Intl.NumberFormat("vi-VN").format(Math.round(data.amount / rate));
    rows.push(`<tr><td>Tham khảo (${esc(code)})</td><td>${value} ${esc(code)}</td></tr>`);
  }
  const usdRate = fxRate(fxDisplayCurrency, entry);
  if (usdRate) {
    const text = `Vietcombank (giá bán) ngày ${fxDateVN(entry.date)}: 1 ${fxDisplayCurrency} = ${new Intl.NumberFormat("vi-VN").format(usdRate)} ₫`;
    rows.push(`<tr><td>Tỷ giá áp dụng</td><td>${text}</td></tr>`);
  }
  return rows.join("");
}

function printQuote(id, version) {
  const q = findQuote(id);
  const snap = version && version !== q.version ? (q.history || []).find((h) => h.version === version) : null;
  const data = snap ? { ...q, ...snap } : q;
  const entry = fxEntryOf(data);
  const program = data.program || q.program || [];
  const logo = `<img src="${new URL("assets/images/dichvuquanhta.jpg", location.href).href}" alt="" width="56" height="56" style="border-radius:10px;vertical-align:middle;margin-right:12px">`;
  printable(
    `Báo giá ${q.id} · v${data.version}`,
    `<div style="display:flex;align-items:center;margin-bottom:8px">${logo}<div><b style="font-size:18px">Typic Travel</b><br><span style="color:#64748b">Báo giá ${q.id} · phiên bản v${data.version}</span></div></div>
    <h2>${esc(q.client)}</h2><p>${esc(q.tour)}<br>${q.pax} khách · khởi hành ${fmt(q.start)} · ${q.days} ngày${q.validUntil ? `<br>Báo giá có hiệu lực đến <b>${fmt(q.validUntil)}</b>` : ""}</p>
    <table><tr><th>Hạng mục</th><th>Giá trị</th></tr><tr><td>Giá bán nhóm</td><td>${fxDual(data.amount, entry)}</td></tr><tr><td>Giá bình quân / khách</td><td>${fxDual(Math.round(data.amount / q.pax), entry)}</td></tr>${quotePrintRefRows(q, data, entry)}</table>
    <h2>Chương trình chi tiết</h2>${program.length ? program.map((p, i) => `<p><b>Ngày ${i + 1}</b> · ${esc(p)}</p>`).join("") : "<p>Chương trình chi tiết sẽ được bổ sung.</p>"}
    <h2>Giá bao gồm</h2><p>${serviceTypes.map((t) => typesVI[t] || t).join(", ") || "Theo chương trình"}.</p>
    <h2>Giá không bao gồm</h2><p>Chi phí cá nhân, đồ uống ngoài chương trình, tip, bảo hiểm du lịch (nếu khách không đăng ký).</p>
    <h2>Thanh toán & hoàn hủy</h2><p>Đặt cọc ${policy().depositPct || 30}% để giữ chỗ; thanh toán phần còn lại trước ngày khởi hành. Chính sách hoàn hủy áp dụng theo quy định của Typic Travel.</p>`,
  );
}
