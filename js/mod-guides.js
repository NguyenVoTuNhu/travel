/* MODULE mod-guides — hồ sơ hướng dẫn viên, kiểm tra lịch trống, phân công và xác nhận / từ chối tour. */

let guidesTab = "team";

function guideBlocked(g, b) {
  return (g.blocks || []).some((x) => x.from <= b.end && x.to >= b.start);
}

function guideConflict(g, b) {
  return state.bookings.find(
    (x) => x.id !== b.id && !["Completed", "Cancelled"].includes(x.status) && x.guide === g.id && x.start <= b.end && x.end >= b.start,
  );
}

function available(g, b) {
  return g.status !== "INACTIVE" && !guideConflict(g, b) && !guideBlocked(g, b);
}

const guideInitials = (name = "") => name.trim().split(/\s+/).slice(-2).map((x) => x[0] || "").join("").toUpperCase();
const guideValue = (value, fallback = "Chưa cập nhật") => value ? esc(value) : `<span class="guide-empty">${fallback}</span>`;
const guideField = (label, value) => `<div class="guide-profile-field"><small>${label}</small><b>${value}</b></div>`;

function assignForm(id) {
  const b = findBooking(id);
  modal(
    "Phân công HDV · " + id,
    `<p class="sub">${esc(b.tour)} · ${fmt(b.start)} – ${fmt(b.end)}. HDV trùng tour hoặc đã báo bận không thể chọn.</p>
    <form onsubmit="saveGuide(event,'${id}')"><label>HDV phù hợp<select name="guide" required><option value="">Chọn HDV</option>${state.guides
      .map((g) => {
        const conflict = guideConflict(g, b);
        const reason = conflict ? "Trùng " + conflict.id : guideBlocked(g, b) ? "Báo bận" : "Trống lịch";
        return `<option value="${g.id}" ${!available(g, b) ? "disabled" : ""} ${b.guide === g.id ? "selected" : ""}>${esc(g.name)} · ${esc(g.lang)} · ${esc(g.area)} · ${g.rating.toFixed(1)}/5 · ${reason}</option>`;
      })
      .join("")}</select></label><div class="notice">HDV nhận thông báo trong mục "Tour của tôi" và phải xác nhận hoặc từ chối. Nếu từ chối, điều hành sẽ nhận cảnh báo để chọn người khác.</div><div class="formfooter"><button class="btn primary" type="submit">Xác nhận phân công</button></div></form>`,
    true,
  );
}

function saveGuide(e, id) {
  e.preventDefault();
  if (!requireCapability("guides_manage")) return;
  const b = findBooking(id),
    f = new FormData(e.target),
    g = findGuide(f.get("guide"));
  if (!["Preparing", "Running"].includes(b.status)) return toast("Hãy tiếp nhận booking trước khi phân công HDV.");
  if (!g || !available(g, b)) return toast("HDV có lịch trùng hoặc đã báo bận, hãy chọn người khác.");
  b.guide = g.id;
  b.guideConfirmed = false;
  b.guideHistory = b.guideHistory || [];
  b.guideHistory.unshift({ at: nowISO(), guide: g.id, action: "ASSIGNED", by: actor().name });
  const svc = b.services.find((s) => s.type === "Guide");
  if (svc) setServiceStatus(b, svc, "WAITING", "Chờ " + g.name + " xác nhận", { supplier: svc.supplier });
  audit("booking", id, "GUIDE", `${id} phân công ${g.name}`);
  render();
  openBooking(id, "services");
  toast("Đã phân công. Chờ HDV xác nhận nhận tour.");
}

function confirmGuide(id) {
  const b = findBooking(id);
  if (isGuideRole() && b.guide !== activeGuideId()) return;
  if (!isGuideRole() && !requireCapability("guides_manage")) return;
  b.guideConfirmed = true;
  b.guideHistory.unshift({ at: nowISO(), guide: b.guide, action: "CONFIRMED", by: actor().name });
  const s = b.services.find((s) => s.type === "Guide");
  if (s) setServiceStatus(b, s, "CONFIRMED", "HDV xác nhận nhận tour");
  audit("booking", id, "GUIDE", `${id}: ${findGuide(b.guide)?.name} xác nhận nhận tour`);
  render();
  toast("Đã xác nhận nhận tour.");
  if (!isGuideRole() && document.querySelector(".booking360")) openBooking(id, "services");
}

function declineGuideForm(id) {
  modal(
    "Từ chối nhận tour · " + id,
    `<form onsubmit="declineGuide(event,'${id}')"><label>Lý do từ chối (bắt buộc)<textarea name="reason" required placeholder="Trùng lịch cá nhân, sức khỏe, không phù hợp ngôn ngữ…"></textarea></label><p class="notice">Điều hành sẽ nhận cảnh báo để chọn HDV khác. Lịch sử thay đổi được lưu lại.</p><div class="formfooter"><button class="btn danger">Từ chối tour</button></div></form>`,
    true,
  );
}

function declineGuide(e, id) {
  e.preventDefault();
  const b = findBooking(id);
  if (isGuideRole() && b.guide !== activeGuideId()) return;
  if (!isGuideRole() && !requireCapability("guides_manage")) return;
  const reason = new FormData(e.target).get("reason").trim();
  const g = findGuide(b.guide);
  b.guideHistory.unshift({ at: nowISO(), guide: b.guide, action: "DECLINED", reason, by: actor().name });
  const s = b.services.find((x) => x.type === "Guide");
  b.guide = "";
  b.guideConfirmed = false;
  if (s) setServiceStatus(b, s, "NOT_BOOKED", "HDV từ chối: " + reason);
  state.issues.push({ id: nextBusinessId("issues"), booking: id, type: "Guide", severity: daysUntil(b.start) <= 7 ? "HIGH" : "MEDIUM", note: `${g?.name || "HDV"} từ chối nhận tour: ${reason}`, status: "Open", reporter: actor().name, createdAt: nowISO() });
  audit("booking", id, "GUIDE", `${id}: ${g?.name} từ chối nhận tour — ${reason}`);
  closeModal();
  render();
  toast("Đã từ chối tour. Điều hành sẽ chọn HDV khác.");
}

views.guides = () => {
  const all = state.guides;
  const busy = all.filter((g) => state.bookings.some((b) => b.guide === g.id && !["Completed", "Cancelled"].includes(b.status))).length;
  const awaiting = state.bookings.filter((b) => b.guide && !b.guideConfirmed && !["Completed", "Cancelled"].includes(b.status));
  const avgRating = all.length ? (all.reduce((sum, g) => sum + g.rating, 0) / all.length).toFixed(1) : "—";
  const tabs = [["team", `Đội ngũ (${all.length})`], ["assign", `Phân công & phản hồi (${awaiting.length} chờ)`]];
  let body = "";
  if (guidesTab === "assign") {
    const rows = state.bookings.filter((b) => b.guide || (["Preparing"].includes(b.status))).sort((a, b) => a.start.localeCompare(b.start)).map((b) => {
      const g = findGuide(b.guide);
      const last = (b.guideHistory || [])[0];
      return `<tr><td>${entityLink("booking", b.id)}<span class="sub">${esc(b.tour)}</span></td><td>${fmt(b.start)} – ${fmt(b.end)}</td><td>${g ? entityLink("guide", g.id, g.name) : '<span class="text-warn">Chưa phân công</span>'}</td><td>${g ? badge(b.guideConfirmed ? "Đã nhận tour" : "Chờ xác nhận", b.guideConfirmed ? "green" : "amber") : badge("Cần phân công", "red")}${last?.action === "DECLINED" && !g ? `<span class="sub">HDV trước từ chối: ${esc(last.reason)}</span>` : ""}</td><td>${can("guides_manage") && ["Preparing", "Running"].includes(b.status) ? btn(g ? "Đổi HDV" : "Phân công", `assignForm('${b.id}')`, "small") : ""}</td></tr>`;
    });
    body = card("Phân công hướng dẫn viên", rows.length ? table(["BOOKING", "THỜI GIAN", "HDV", "PHẢN HỒI", ""], rows) : '<div class="empty">Chưa có tour cần phân công.</div>');
  } else {
    body = `<div class="guidegrid">${all
      .map((g) => {
        const bs = state.bookings.filter((b) => b.guide === g.id && !["Completed", "Cancelled"].includes(b.status));
        return `<article class="guidecard"><div class="cardhead"><div class="guideavatar">${guideInitials(g.name)}</div>${badge(g.status === "INACTIVE" ? "Ngừng cộng tác" : bs.length ? "Đã có lịch" : "Sẵn sàng", g.status === "INACTIVE" ? "" : bs.length ? "amber" : "green")}</div><h3>${esc(g.name)}</h3><div class="sub">Mã: <b>${g.id}</b> · Địa bàn: <b>${esc(g.area || "—")}</b></div><div class="tagset" style="margin: 12px 0;">${String(g.lang || "").split(/,\s*/).filter(Boolean).map((l) => badge(l)).join("")}</div>${line("Đánh giá", systemIcon("star") + " " + Number(g.rating || 0).toFixed(1) + " / 5.0")}${can("operations_costs") || can("all") ? line("Đơn giá", money(g.rate) + " / ngày") : ""}<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line-light);">${bs.map((b) => `<div class="sub"><button class="entity-link" onclick="openBooking('${b.id}')">${b.id}</button> · ${fmt(b.start)} — ${fmt(b.end)} ${b.guideConfirmed ? "" : "(chờ xác nhận)"}</div>`).join("") || '<div class="sub">Trống lịch.</div>'}</div><div class="formfooter" style="margin-top: 14px; padding-top: 10px;">${btn("Hồ sơ & lịch →", `guideDetail('${g.id}')`, "small")}</div></article>`;
      })
      .join("")}</div>`;
  }
  return (
    title("Đội ngũ hướng dẫn viên", "Hồ sơ năng lực, lịch bận và phân công tour. Lịch trực quan nằm ở Trung tâm điều hành.", btn("Lịch điều hành", "navigate('operations',{opsTab:'schedule'})") + (can("guides_manage") ? btn("+ Thêm HDV", "guideProfileForm()", "primary") : "")) +
    `<div class="stats">${stat("HƯỚNG DẪN VIÊN", all.length, "Đội ngũ hiện có")}${stat("ĐANG CÓ TOUR", busy, "Trong các tour chưa hoàn tất")}${stat("CHỜ XÁC NHẬN", awaiting.length, "HDV chưa phản hồi phân công")}${stat("ĐIỂM ĐÁNH GIÁ", avgRating + " / 5.0", "Từ phản hồi của khách")}</div>
    <nav class="tabs">${tabs.map(([k, l]) => `<button class="btn ${guidesTab === k ? "selected" : ""}" onclick="guidesTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    body
  );
};

function guideDetail(id) {
  const g = findGuide(id);
  if (!g) return;
  const bs = state.bookings.filter((b) => b.guide === id).sort((a, b) => String(b.start).localeCompare(String(a.start)));
  const activeTours = bs.filter((b) => !["Completed", "Cancelled"].includes(b.status)).length;
  const completedTours = bs.filter((b) => b.status === "Completed").length;
  const languages = String(g.lang || "").split(/,\s*/).filter(Boolean);
  modal(
    `<span class="guide-modal-title">Hồ sơ hướng dẫn viên <small>${esc(g.id)}</small></span>`,
    `<div class="guide-profile">
      <section class="guide-profile-hero">
        <div class="guide-profile-avatar">${guideInitials(g.name)}</div>
        <div class="guide-profile-identity"><h2>${esc(g.name)}</h2><p>${guideValue(g.area)} · ${languages.length ? languages.map((l) => esc(l)).join(" · ") : "Chưa cập nhật ngôn ngữ"}</p><div>${badge(g.status === "INACTIVE" ? "Ngừng cộng tác" : "Đang cộng tác", g.status === "INACTIVE" ? "" : "green")}${g.licenseExpiry && g.licenseExpiry < todayISO() ? badge("Thẻ đã hết hạn", "red") : ""}</div></div>
        <div class="guide-profile-contact">${g.phone ? `<a href="tel:${esc(g.phone)}"><i class="fa-solid fa-phone"></i>${esc(g.phone)}</a>` : ""}${g.email ? `<a href="mailto:${esc(g.email)}"><i class="fa-regular fa-envelope"></i>${esc(g.email)}</a>` : ""}</div>
      </section>
      <section class="guide-profile-stats">
        <div><small>Đánh giá</small><strong>★ ${Number(g.rating || 0).toFixed(1)}</strong></div>
        <div><small>Tour đang phụ trách</small><strong>${activeTours}</strong></div>
        <div><small>Tour hoàn thành</small><strong>${completedTours}</strong></div>
        <div><small>Kinh nghiệm</small><strong>${Number(g.experienceYears || 0)} năm</strong></div>
      </section>
      <div class="guide-profile-layout"><div>
        <section class="guide-profile-section"><h3><i class="fa-regular fa-address-card"></i> Thông tin cá nhân</h3><div class="guide-profile-fields">
          ${guideField("Họ và tên", esc(g.name))}${guideField("Số điện thoại", guideValue(g.phone))}${guideField("Email", guideValue(g.email))}${guideField("Ngày sinh", g.dob ? fmt(g.dob) : guideValue(""))}${guideField("Giới tính", guideValue(g.gender))}${guideField("Quốc tịch", guideValue(g.nationality))}${guideField("Địa chỉ", guideValue(g.address))}${guideField("Liên hệ khẩn cấp", g.emergencyName || g.emergencyPhone ? `${esc(g.emergencyName || "")}${g.emergencyName && g.emergencyPhone ? " · " : ""}${esc(g.emergencyPhone || "")}` : guideValue(""))}
        </div></section>
        <section class="guide-profile-section"><h3><i class="fa-solid fa-award"></i> Năng lực & hành nghề</h3><div class="guide-profile-fields">
          ${guideField("Số thẻ HDV", guideValue(g.licenseNo))}${guideField("Ngày cấp", g.licenseIssued ? fmt(g.licenseIssued) : guideValue(""))}${guideField("Ngày hết hạn", g.licenseExpiry ? fmt(g.licenseExpiry) : guideValue(""))}${guideField("Địa bàn", guideValue(g.area))}${guideField("Ngôn ngữ", guideValue(g.lang))}${guideField("Chuyên môn", guideValue(g.specialties))}${can("operations_costs") || can("all") ? guideField("Đơn giá", money(g.rate) + " / ngày") : ""}
        </div>${g.note ? `<p class="guide-profile-note"><b>Ghi chú:</b> ${esc(g.note)}</p>` : ""}</section>
      </div><div class="guide-profile-side">
        <section class="guide-profile-section"><h3><i class="fa-regular fa-calendar-check"></i> Lịch phân công <span>${bs.length}</span></h3><div class="guide-schedule">${bs.slice(0, 8).map((b) => `<article><i></i><div><b>${entityLink("booking", b.id, b.id + " · " + b.tour)}</b><p>${fmt(b.start)} – ${fmt(b.end)} · ${b.pax} khách</p>${bookingBadge(b)}</div></article>`).join("") || '<p class="guide-empty-state">Chưa có tour được phân công.</p>'}</div></section>
        <section class="guide-profile-section"><h3><i class="fa-regular fa-calendar-xmark"></i> Lịch bận / nghỉ <span>${(g.blocks || []).length}</span></h3><div class="guide-blocks">${(g.blocks || []).map((x, i) => `<div><span><b>${fmt(x.from)} – ${fmt(x.to)}</b><small>${esc(x.reason || "Bận")}</small></span>${can("guides_manage") ? `<button class="guide-remove" onclick="removeGuideBlock('${id}',${i})" aria-label="Xóa lịch bận"><i class="fa-regular fa-trash-can"></i></button>` : ""}</div>`).join("") || '<p class="guide-empty-state">Chưa có lịch bận.</p>'}</div></section>
      </div></div>
      <footer class="guide-profile-footer"><button class="btn" onclick="closeModal()">Đóng</button>${can("guides_manage") ? btn("Báo bận / nghỉ", `guideBlockForm('${id}')`) + btn("Chỉnh sửa hồ sơ", `guideProfileForm('${id}')`, "primary") : ""}</footer>
    </div>`,
  );
}

function guideProfileForm(id = "") {
  if (!requireCapability("guides_manage")) return;
  const g = id ? findGuide(id) : { name: "", phone: "", email: "", dob: "", gender: "", nationality: "Việt Nam", address: "", licenseNo: "", licenseIssued: "", licenseExpiry: "", experienceYears: 0, specialties: "", emergencyName: "", emergencyPhone: "", status: "ACTIVE", lang: "", area: "", rate: 0, rating: 0, note: "" };
  if (!g) return;
  modal(id ? "Chỉnh sửa hồ sơ hướng dẫn viên" : "Thêm hướng dẫn viên", `<form class="guide-profile-form" onsubmit="saveGuideProfile(event,'${id}')">
    <section><h3>Thông tin cá nhân</h3><div class="formgrid"><label>Họ và tên *<input name="name" required value="${esc(g.name || "")}"></label><label>Số điện thoại *<input name="phone" required value="${esc(g.phone || "")}"></label><label>Email<input type="email" name="email" value="${esc(g.email || "")}"></label><label>Ngày sinh<input type="date" name="dob" value="${esc(g.dob || "")}"></label><label>Giới tính<select name="gender"><option value="">Chọn</option>${["Nam","Nữ","Khác"].map((v) => `<option ${g.gender === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Quốc tịch<input name="nationality" value="${esc(g.nationality || "")}"></label><label class="full">Địa chỉ<input name="address" value="${esc(g.address || "")}"></label></div></section>
    <section><h3>Năng lực & hành nghề</h3><div class="formgrid"><label>Ngôn ngữ *<input name="lang" required value="${esc(g.lang || "")}" placeholder="Anh, Pháp, Việt"></label><label>Địa bàn *<input name="area" required value="${esc(g.area || "")}" placeholder="Miền Bắc"></label><label>Số thẻ HDV<input name="licenseNo" value="${esc(g.licenseNo || "")}"></label><label>Năm kinh nghiệm<input type="number" min="0" name="experienceYears" value="${Number(g.experienceYears || 0)}"></label><label>Ngày cấp thẻ<input type="date" name="licenseIssued" value="${esc(g.licenseIssued || "")}"></label><label>Ngày hết hạn<input type="date" name="licenseExpiry" value="${esc(g.licenseExpiry || "")}"></label><label>Đơn giá / ngày<input type="number" min="0" name="rate" value="${Number(g.rate || 0)}"></label><label>Đánh giá<input type="number" min="0" max="5" step="0.1" name="rating" value="${Number(g.rating || 0)}"></label><label class="full">Chuyên môn<input name="specialties" value="${esc(g.specialties || "")}" placeholder="Văn hóa, trekking, ẩm thực..."></label></div></section>
    <section><h3>Liên hệ khẩn cấp & trạng thái</h3><div class="formgrid"><label>Người liên hệ<input name="emergencyName" value="${esc(g.emergencyName || "")}"></label><label>Số điện thoại<input name="emergencyPhone" value="${esc(g.emergencyPhone || "")}"></label><label>Trạng thái<select name="status"><option value="ACTIVE" ${g.status !== "INACTIVE" ? "selected" : ""}>Đang cộng tác</option><option value="INACTIVE" ${g.status === "INACTIVE" ? "selected" : ""}>Ngừng cộng tác</option></select></label><label class="full">Ghi chú<textarea name="note" rows="3">${esc(g.note || "")}</textarea></label></div></section>
    <div class="formfooter"><button type="button" class="btn" onclick="${id ? `guideDetail('${id}')` : "closeModal()"}">Hủy</button><button class="btn primary" type="submit">Lưu hồ sơ</button></div></form>`);
}

function saveGuideProfile(e, id) {
  e.preventDefault();
  if (!requireCapability("guides_manage")) return;
  const f = new FormData(e.target);
  const record = id ? findGuide(id) : { id: nextBusinessId("guides"), blocks: [] };
  if (!record) return;
  const licenseIssued = f.get("licenseIssued"), licenseExpiry = f.get("licenseExpiry");
  if (licenseIssued && licenseExpiry && licenseIssued > licenseExpiry) return toast("Ngày hết hạn thẻ phải sau ngày cấp.");
  const fields = ["name","phone","email","dob","gender","nationality","address","lang","area","licenseNo","licenseIssued","licenseExpiry","specialties","emergencyName","emergencyPhone","status","note"];
  fields.forEach((key) => record[key] = String(f.get(key) || "").trim());
  record.experienceYears = Number(f.get("experienceYears") || 0);
  record.rate = Number(f.get("rate") || 0);
  record.rating = Number(f.get("rating") || 0);
  if (!id) state.guides.push(record);
  audit("guide", record.id, id ? "UPDATE" : "CREATE", `${id ? "Cập nhật" : "Tạo"} hồ sơ HDV ${record.name}`);
  save();
  render();
  guideDetail(record.id);
  toast("Đã lưu hồ sơ hướng dẫn viên.");
}

function guideBlockForm(id = "") {
  modal(
    "Báo bận / nghỉ phép HDV",
    `<form onsubmit="addGuideBlock(event)"><div class="formgrid"><label class="full">Hướng dẫn viên<select name="guide">${state.guides.map((g) => `<option value="${g.id}" ${g.id === id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></label><label>Từ ngày<input name="from" type="date" required></label><label>Đến ngày<input name="to" type="date" required></label><label class="full">Lý do<input name="reason" placeholder="Nghỉ phép, ốm, việc riêng…"></label></div><div class="formfooter"><button class="btn primary">Lưu lịch bận</button></div></form>`,
    true,
  );
}

function addGuideBlock(e) {
  e.preventDefault();
  if (!requireCapability("guides_manage")) return;
  const f = new FormData(e.target),
    g = findGuide(f.get("guide"));
  if (f.get("from") > f.get("to")) return toast("Ngày bắt đầu phải trước ngày kết thúc.");
  const conflict = state.bookings.find((b) => b.guide === g.id && !["Completed", "Cancelled"].includes(b.status) && b.start <= f.get("to") && b.end >= f.get("from"));
  if (conflict) return toast(`${g.name} đang có tour ${conflict.id} trong thời gian này. Hãy đổi HDV trước.`);
  g.blocks = g.blocks || [];
  g.blocks.push({ from: f.get("from"), to: f.get("to"), reason: f.get("reason") });
  audit("guide", g.id, "BLOCK", `${g.name} báo bận ${fmt(f.get("from"))} – ${fmt(f.get("to"))}`);
  closeModal();
  render();
  toast("Đã lưu lịch bận.");
}

function removeGuideBlock(id, index) {
  if (!requireCapability("guides_manage")) return;
  findGuide(id).blocks.splice(index, 1);
  save();
  guideDetail(id);
}
