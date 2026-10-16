/* MODULE mod-guide-app — cổng dành cho Hướng dẫn viên (mobile-first). */

let guideUser = "";
let guideTab = "tours";

function activeGuideId() {
  if (isGuideRole()) return currentUser?.guideId || "";
  return guideUser || state.guides[0]?.id || "";
}

const guideTours = (gid, all = false) =>
  state.bookings
    .filter((b) => b.guide === gid && (all || ["Preparing", "Running", "Confirmed"].includes(b.status)))
    .sort((a, b) => a.start.localeCompare(b.start));

function guideTourCard(b) {
  const days = daysUntil(b.start);
  const when = b.status === "Running" ? "Đang diễn ra" : days > 0 ? `Còn ${days} ngày` : days === 0 ? "Khởi hành hôm nay" : "Đã qua ngày khởi hành";
  return `<section class="guide-tour">
    <div class="eyebrow">${b.id} · ${b.pax} KHÁCH · ${when}</div>
    <h3>${esc(b.tour)}</h3>
    <p class="sub">📅 ${fmt(b.start)} — ${fmt(b.end)}</p>
    <div class="guide-tour-state">${bookingBadge(b)} ${badge(b.guideConfirmed ? "Bạn đã nhận tour" : "Chờ bạn xác nhận", b.guideConfirmed ? "green" : "amber")}</div>
    <div class="guide-tour-actions">
      ${!b.guideConfirmed ? btn("✓ Nhận tour", `confirmGuide('${b.id}')`, "primary small") + btn("Từ chối", `declineGuideForm('${b.id}')`, "small") : ""}
      ${btn("Khách & lịch trình", `guideTour('${b.id}')`, "small")}
      ${b.guideConfirmed && b.status === "Running" ? btn("Kết thúc tour", `guideFinish('${b.id}')`, "small primary") : ""}
    </div>
  </section>`;
}

function guideTabContent(gid) {
  const mine = guideTours(gid);
  const withVoucher = mine.filter((b) => b.voucher);
  if (guideTab === "itinerary") {
    return mine.length
      ? mine.map((b) => card(`${b.id} · ${esc(b.tour)}`, (b.program?.length ? b.program : ["Chương trình chi tiết sẽ được điều hành bổ sung trước ngày đi."]).map((p, i) => `<div class="timeline"><b>Ngày ${i + 1}</b><p>${esc(p)}</p></div>`).join(""))).join("")
      : '<div class="empty">Chưa có lịch trình.</div>';
  }
  if (guideTab === "guests") {
    return mine.length
      ? mine.map((b) => card(`${b.id} · ${b.pax} khách`, (b.passengers || []).map((p, i) => `<div class="metricline"><div><b>${i + 1}. ${esc(p.name)}</b><span class="sub" style="display:block">${esc(p.notes || "")}</span></div></div>`).join("") || '<p class="sub">Danh sách khách chưa được cập nhật.</p>')).join("")
      : '<div class="empty">Chưa có danh sách khách.</div>';
  }
  if (guideTab === "vouchers") {
    return withVoucher.length
      ? withVoucher.map((b) => card(`${b.id} · ${esc(b.tour)}`, bookingServices(b).map((s) => `<div class="metricline"><span>${typesVI[s.type]} · ${esc(findSupplier(s.supplier)?.name || "—")}</span>${serviceBadge(s)}</div>`).join(""), btn("In voucher", `printVoucher('${b.id}')`, "small"))).join("")
      : '<div class="empty">Điều hành sẽ phát phiếu dịch vụ sau khi các dịch vụ được xác nhận.</div>';
  }
  if (guideTab === "schedule") {
    const g = findGuide(gid);
    const rows = guideTours(gid, true).map((b) => `<tr><td>${b.id}</td><td>${esc(b.tour)}</td><td>${fmt(b.start)} – ${fmt(b.end)}</td><td>${bookingBadge(b)}</td></tr>`);
    const blocks = (g.blocks || []).map((x) => `<div class="metricline"><span>🚫 ${fmt(x.from)} – ${fmt(x.to)}</span><span class="sub">${esc(x.reason || "Bận")}</span></div>`).join("");
    return card("Lịch phân công", rows.length ? table(["MÃ", "TOUR", "THỜI GIAN", "TRẠNG THÁI"], rows) : '<div class="empty">Chưa có phân công.</div>') + card("Lịch bận của tôi", blocks || '<p class="sub">Chưa có lịch bận. Liên hệ điều hành để đăng ký nghỉ.</p>');
  }
  if (guideTab === "report") {
    const running = mine.filter((b) => ["Running", "Preparing"].includes(b.status));
    return card("Báo cáo tình trạng tour", running.length ? running.map((b) => `<div class="metricline"><div><b>${b.id}</b><span class="sub" style="display:block">${esc(b.tour)} · ${(b.guideReports || []).length} báo cáo</span></div>${btn("Gửi báo cáo", `guideReportForm('${b.id}')`, "small primary")}</div>`).join("") : '<div class="empty">Không có tour để báo cáo.</div>') +
      card("Báo cáo gần đây", mine.flatMap((b) => (b.guideReports || []).map((r) => ({ ...r, id: b.id }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((r) => `<div class="timeline"><b>${r.id} · ${esc(r.status)}</b><p>${esc(r.note)}</p><span class="sub">${dateTimeVN(r.at)}</span></div>`).join("") || '<p class="sub">Chưa có báo cáo.</p>');
  }
  if (guideTab === "expense") {
    const live = guideTours(gid, true).filter((b) => b.status !== "Cancelled");
    return live.length ? live.map((b) => {
      const adv = guideAdvanceList(b), exp = b.guideExpenses || [];
      const got = adv.filter((a) => a.status === "Paid").reduce((n, a) => n + a.amount, 0);
      const spent = exp.reduce((n, x) => n + Number(x.amount || 0), 0);
      const canAct = ["Preparing", "Running"].includes(b.status);
      return card(`${b.id} · ${esc(b.tour)}`,
        line("Đã nhận tạm ứng", money(got)) + line("Đã chi thực tế", money(spent)) + line(got - spent >= 0 ? "Còn phải hoàn ứng" : "Công ty cần hoàn cho bạn", `<b>${money(Math.abs(got - spent))}</b>`) +
        (adv.length ? `<h4>Yêu cầu tạm ứng</h4>` + adv.map((a) => `<div class="metricline"><span>${money(a.amount)} · ${esc(a.reason)}</span>${badge(a.status === "Paid" ? "Đã nhận" : a.status === "Approved" ? "Đã duyệt" : "Chờ kế toán", a.status === "Paid" ? "green" : "amber")}</div>`).join("") : "") +
        (exp.length ? `<h4>Khoản đã chi</h4>` + exp.map((x) => `<div class="metricline"><span>${fmt(x.date)} · ${esc(x.note)}</span><b>${money(x.amount)}</b></div>`).join("") : ""),
        canAct ? btn("Xin tạm ứng", `guideAdvanceForm('${b.id}')`, "small primary") + btn("Ghi khoản chi", `guideExpenseForm('${b.id}')`, "small") : "");
    }).join("") : '<div class="empty">Chưa có tour để tạm ứng hoặc ghi chi phí.</div>';
  }
  if (guideTab === "emergency") {
    return `<div class="alert red"><b>Khẩn cấp 24/7</b>Hotline điều hành: <b>0988.123.456</b></div>` +
      card("Gửi cảnh báo khẩn cấp", mine.length ? mine.map((b) => `<div class="metricline"><span>${b.id} · ${esc(b.tour)}</span>${btn("Báo khẩn cấp", `emergencyForm('${b.id}')`, "small danger")}</div>`).join("") : '<div class="empty">Bạn không có tour đang phụ trách.</div>');
  }
  return mine.length ? mine.map(guideTourCard).join("") : '<div class="empty" style="padding:24px 12px">Hiện bạn chưa có tour nào được phân công.</div>';
}

views.guideapp = () => {
  const gid = activeGuideId();
  const g = findGuide(gid);
  if (!g) return title("Tour của tôi", "Tài khoản chưa được liên kết hồ sơ hướng dẫn viên.");
  const tabs = [["tours", "Tour của tôi"], ["itinerary", "Lịch trình"], ["guests", "Danh sách khách"], ["vouchers", "Phiếu dịch vụ"], ["schedule", "Lịch phân công"], ["report", "Báo cáo"], ["expense", "Tạm ứng & chi phí"], ["emergency", "Khẩn cấp"]];
  return (
    title(`Xin chào, ${esc(g.name.split(" ").slice(-2).join(" "))}`, `Bạn đang phụ trách ${guideTours(gid).length} tour.`, can("guide_switch_profile") ? `<select class="role" aria-label="Xem theo HDV" onchange="guideUser=this.value;render()">${state.guides.map((x) => `<option value="${x.id}" ${x.id === gid ? "selected" : ""}>${esc(x.name)} (${x.id})</option>`).join("")}</select>` : "") +
    `<nav class="tabs guide-tabs">${tabs.map(([k, l]) => `<button class="btn ${guideTab === k ? "selected" : ""} ${k === "emergency" ? "danger" : ""}" onclick="guideTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    `<div class="guide-portal">${guideTabContent(gid)}</div>`
  );
};

function guideTour(id) {
  const b = findBooking(id);
  if (isGuideRole() && b.guide !== activeGuideId()) return toast("Tour không được giao cho HDV này.");
  modal(
    "Chi tiết tour · " + id,
    card(`Danh sách đoàn (${(b.passengers || []).length}/${b.pax} khách)`, (b.passengers || []).map((p, i) => `<div class="metricline"><div><b>${i + 1}. ${esc(p.name)}</b><span class="sub" style="display:block">${esc(p.notes || "")}</span></div></div>`).join("") || '<p class="sub">Chưa có danh sách khách.</p>') +
      card("Lịch trình", (b.program?.length ? b.program : ["Điều hành sẽ bổ sung lịch trình chi tiết trước ngày đi."]).map((p, i) => `<div class="timeline"><b>Ngày ${i + 1}</b><p>${esc(p)}</p></div>`).join("")),
  );
}

/* Kết thúc tour: HDV phải nộp báo cáo cuối tour (tóm tắt, điểm nổi bật, vấn đề, ảnh). */
function guideFinish(id) {
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  modal("Báo cáo cuối tour · " + id, `<form onsubmit="saveFinalReport(event,'${id}')"><div class="alert">Nộp báo cáo để kết thúc tour. Hệ thống sẽ mở hồ sơ chăm sóc sau tour và quyết toán.</div><label>Tóm tắt hành trình<textarea name="summary" required placeholder="Tour diễn ra thế nào, khách phản hồi ra sao…"></textarea></label><label>Điểm nổi bật<textarea name="highlight"></textarea></label><label>Vấn đề phát sinh / đề xuất cải thiện<textarea name="issues"></textarea></label><label>Ảnh hiện trường (tối đa 3 ảnh, mỗi ảnh ≤ 300 KB)<input name="photos" type="file" accept="image/*" multiple></label><div class="formfooter"><button class="btn primary">Nộp báo cáo & kết thúc tour</button></div></form>`, true);
}

function saveFinalReport(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  const f = new FormData(e.target), files = [...e.target.photos.files].slice(0, 3);
  if (files.some((x) => x.size > 300 * 1024)) return toast("Mỗi ảnh phải ≤ 300 KB.");
  const read = (file) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(file); });
  Promise.all(files.map(read)).then((photos) => {
    b.finalReport = { at: nowISO(), by: actor().name, summary: f.get("summary").trim(), highlight: f.get("highlight").trim(), issues: f.get("issues").trim(), photos };
    if (b.finalReport.issues) state.issues.push({ id: nextBusinessId("issues"), booking: id, type: "Customer", severity: "LOW", note: "HDV cuối tour: " + b.finalReport.issues, status: "Open", reporter: actor().name, createdAt: nowISO() });
    audit("booking", id, "FINAL_REPORT", `${id}: HDV nộp báo cáo cuối tour`);
    closeModal();
    finishTour(id, "HDV kết thúc tour");
  });
}

/* ---------- Tạm ứng & chi phí của HDV ---------- */
const guideAdvanceList = (b) => (state.payables || []).filter((p) => p.kind === "ADVANCE" && p.booking === b.id).map((p) => ({ amount: p.amount, reason: p.note, status: p.status }));

function guideAdvanceForm(id) {
  modal("Xin tạm ứng · " + id, `<form onsubmit="saveGuideAdvance(event,'${id}')"><label>Số tiền (VND)<input name="amount" type="number" min="100000" step="50000" required></label><label>Mục đích<input name="reason" required placeholder="Vé tham quan, ăn uống, phát sinh…"></label><p class="notice">Yêu cầu được chuyển cho Kế toán duyệt và chi tiền.</p><div class="formfooter"><button class="btn primary">Gửi yêu cầu</button></div></form>`, true);
}
function saveGuideAdvance(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  const f = new FormData(e.target), amount = Number(f.get("amount"));
  if (!(amount > 0)) return toast("Số tiền không hợp lệ.");
  state.payables.push({ id: nextBusinessId("payables"), kind: "ADVANCE", supplier: "", payee: findGuide(b.guide)?.name || actor().name, booking: id, amount, due: todayISO(), status: "Pending", note: f.get("reason").trim(), createdAt: nowISO() });
  audit("booking", id, "ADVANCE", `${id}: HDV xin tạm ứng ${money(amount)}`);
  closeModal(); render(); toast("Đã gửi yêu cầu tạm ứng cho Kế toán.");
}
function guideExpenseForm(id) {
  modal("Ghi khoản chi · " + id, `<form onsubmit="saveGuideExpense(event,'${id}')"><div class="formgrid"><label>Ngày<input name="date" type="date" value="${todayISO()}" required></label><label>Số tiền (VND)<input name="amount" type="number" min="1000" step="1000" required></label><label class="full">Nội dung<input name="note" required></label></div><div class="formfooter"><button class="btn primary">Lưu</button></div></form>`, true);
}
function saveGuideExpense(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  const f = new FormData(e.target);
  (b.guideExpenses ||= []).push({ date: f.get("date"), amount: Number(f.get("amount")), note: f.get("note").trim() });
  audit("booking", id, "GUIDE_EXPENSE", `${id}: HDV ghi chi ${money(Number(f.get("amount")))}`);
  closeModal(); render();
}

function guideReportForm(id) {
  modal(
    "Báo cáo tình trạng · " + id,
    `<form onsubmit="saveGuideReport(event,'${id}')"><label>Tình trạng<select name="status"><option>Bình thường</option><option>Chậm tiến độ</option><option>Có vấn đề cần hỗ trợ</option></select></label><label>Ghi chú<textarea name="note" required></textarea></label><div class="formfooter"><button class="btn primary">Gửi báo cáo</button></div></form>`,
    true,
  );
}

function saveGuideReport(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  const f = new FormData(e.target);
  b.guideReports = b.guideReports || [];
  b.guideReports.unshift({ at: nowISO(), status: f.get("status"), note: f.get("note").trim(), by: actor().name });
  if (f.get("status") === "Có vấn đề cần hỗ trợ")
    state.issues.push({ id: nextBusinessId("issues"), booking: id, type: "Customer", severity: "MEDIUM", note: "HDV báo: " + f.get("note").trim(), status: "Open", reporter: actor().name, createdAt: nowISO() });
  audit("booking", id, "GUIDE_REPORT", `${id}: HDV báo ${f.get("status")}`);
  closeModal();
  render();
  toast("Đã gửi báo cáo cho điều hành.");
}

function emergencyForm(id) {
  modal(
    "Báo khẩn cấp · " + id,
    `<form onsubmit="sendEmergency(event,'${id}')"><div class="alert red">Chỉ dùng cho tai nạn, y tế, thất lạc khách hoặc sự cố an toàn. Gọi ngay hotline 0988.123.456.</div><label>Mô tả<textarea name="note" required></textarea></label><div class="formfooter"><button class="btn danger">Gửi khẩn cấp</button></div></form>`,
    true,
  );
}

function sendEmergency(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (b.guide !== activeGuideId()) return;
  state.issues.push({ id: nextBusinessId("issues"), booking: id, type: "Customer", severity: "CRITICAL", note: "KHẨN CẤP: " + new FormData(e.target).get("note").trim(), status: "Open", reporter: actor().name, createdAt: nowISO() });
  audit("booking", id, "EMERGENCY", `${id}: HDV báo khẩn cấp`);
  closeModal();
  render();
  toast("Đã gửi báo cáo khẩn cấp tới điều hành.");
}
