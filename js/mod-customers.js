/* MODULE mod-customers — quản lý và hồ sơ khách hàng. */

const customerInitials = (name) => String(name || "KH").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();

function customerIcon(name) {
  const icons = { handshake:"handshake",user:"user-plus",pause:"circle-pause",debt:"file-invoice-dollar",search:"magnifying-glass",eye:"eye",edit:"pen",care:"headset" };
  return systemIcon(icons[name] || icons.user);
}

function customerRelations(customer) {
  const bookings = state.bookings.filter((item) => item.customerId === customer.id || item.client === customer.name);
  const leads = state.leads.filter((item) => item.name === customer.name || (customer.email && item.email === customer.email));
  const quotes = state.quotes.filter((item) => item.client === customer.name || leads.some((lead) => lead.id === item.lead));
  const care = (state.customerServiceCases || []).filter((item) => item.customer === customer.name);
  const revenue = bookings.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const received = bookings.reduce((sum, item) => sum + (item.received || 0), 0);
  /* revenue/received giữ VND cho các phép so sánh; revenueU/receivedU là số theo tiền của sổ (USD) để hiển thị. */
  const revenueU = fxLedgerTotal(bookings, (item) => item, (item) => item.revenue || 0);
  const receivedU = fxLedgerTotal(bookings, (item) => item, (item) => item.received || 0);
  return { bookings, leads, quotes, care, revenue, received, revenueU, receivedU };
}

function customerStatus(customer, relation = customerRelations(customer)) {
  return customer.status || (relation.bookings.length ? "active" : "prospect");
}

function customerStatusLabel(status) {
  return status === "active" ? "Đang hợp tác" : status === "paused" ? "Tạm dừng" : "Tiềm năng";
}

/* Hạng khách: VIP (>=3 tour hoặc doanh số >=150tr), Quay lại (>=2 tour), Mới (1 tour). */
function customerTier(customer, relation = customerRelations(customer)) {
  const done = relation.bookings.filter((b) => b.status !== "Cancelled");
  if (done.length >= 3 || relation.revenue >= 150000000) return { code: "vip", label: "VIP", tone: "amber" };
  if (done.length >= 2) return { code: "return", label: "Quay lại", tone: "green" };
  if (done.length === 1) return { code: "new", label: "Mới", tone: "blue" };
  return { code: "none", label: "Chưa mua", tone: "" };
}

/* Sự kiện sắp tới: sinh nhật và kỷ niệm tour (trong N ngày). */
function customerEvents(days = 30) {
  const today = new Date(todayISO()), out = [];
  const upcoming = (iso) => {
    const d = new Date(iso); if (isNaN(d)) return null;
    let n = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (n < today) n = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
    return { date: n, left: Math.round((n - today) / 864e5), years: n.getFullYear() - d.getFullYear() };
  };
  state.customers.forEach((c) => {
    if (c.birthday) { const u = upcoming(c.birthday); if (u && u.left <= days) out.push({ customer: c, kind: "Sinh nhật", left: u.left, note: `${u.years} tuổi` }); }
    customerRelations(c).bookings.filter((b) => b.status === "Completed" && b.end).forEach((b) => {
      const u = upcoming(b.end); if (u && u.years > 0 && u.left <= days) out.push({ customer: c, kind: "Kỷ niệm tour", left: u.left, note: `${u.years} năm · ${b.tour}` });
    });
  });
  return out.sort((a, b) => a.left - b.left);
}

function customerAction(label, icon, action) {
  return `<button class="customer-action" type="button" onclick="${action}" aria-label="${label}" title="${label}">${buttonActionIcon(label) || customerIcon(icon)}</button>`;
}

views.customers = () => {
  const all = state.customers;
  const summary = all.reduce((result, customer) => {
    const relation = customerRelations(customer), status = customerStatus(customer, relation);
    result[status] = (result[status] || 0) + 1;
    result.outstanding += Math.max(0, relation.revenue - relation.received);
    result.revenue += relation.revenue;
    result.revenueU += relation.revenueU;
    result.outstandingU += Math.max(0, relation.revenueU - relation.receivedU);
    return result;
  }, { active: 0, prospect: 0, paused: 0, outstanding: 0, revenue: 0, revenueU: 0, outstandingU: 0 });
  const segments = [...new Set(all.map((customer) => customer.segment || customer.company).filter(Boolean))].sort();
  const owners = [...new Set(all.map((customer) => customer.owner).filter(Boolean))].sort();
  const rows = all.map((customer) => {
    const relation = customerRelations(customer), status = customerStatus(customer, relation);
    const phone = customer.phone || customer.whatsapp || "—", segment = customer.segment || customer.company || "Khách cá nhân";
    return `<tr class="customerrow" data-status="${status}" data-segment="${esc(segment)}" data-owner="${esc(customer.owner || "")}" data-search="${esc([customer.id, customer.name, customer.contact, customer.company, customer.email, phone].join(" ").toLowerCase())}">
      <td><div class="customer-name"><span class="customer-avatar">${esc(customerInitials(customer.name))}</span><div><b>${esc(customer.name)}</b><span class="sub customer-id">${esc(customer.id)}</span><span class="sub">${esc(segment)} · ${esc(customer.country || "Chưa cập nhật")}</span></div></div></td>
      <td><b>${esc(customer.contact || customer.name)}</b></td><td>${esc(phone)}</td><td>${esc(customer.email || "—")}</td>
      <td class="number-cell"><b>${relation.bookings.length}</b></td><td class="number-cell"><b>${fxLedgerText(relation.revenueU)}</b></td>
      <td>${(customer.careLog || []).length + relation.care.length ? `<button class="care-pill" onclick="customerCareForm('${customer.id}')">${(customer.careLog || []).length + relation.care.length} lần CSKH</button>` : '<span class="sub">Chưa chăm sóc</span>'}</td>
      <td>${badge(customerStatusLabel(status), status === "active" ? "green" : status === "paused" ? "red" : "amber")}<span class="sub">${badge(customerTier(customer, relation).label, customerTier(customer, relation).tone)}</span></td>
      <td><div class="customer-actions">${customerAction("Xem hồ sơ", "eye", `customerDetail('${customer.id}')`)}${customerAction("Nhật ký chăm sóc", "care", `customerCareForm('${customer.id}')`)}${customerAction("Sửa thông tin", "edit", `customerForm('${customer.id}')`)}</div></td></tr>`;
  });
  return `<div id="customers-ui">
    <div class="customer-pagehead"><div><div class="eyebrow">KINH DOANH › KHÁCH HÀNG</div><h1>Quản lý khách hàng</h1><p>Tổng ${all.length} khách hàng · Doanh số lũy kế ${fxLedgerText(summary.revenueU)}</p></div><div class="customer-page-actions">${btn("Nhắc chăm sóc", "customerCareReminder()")}${btn("Export", "exportCustomers()")}${btn("+ Thêm khách hàng", "customerForm()", "primary")}</div></div>
    <div class="customer-stats"><div class="customer-stat is-active"><span class="customer-stat-icon">${customerIcon("handshake")}</span><div><small>Đang hợp tác</small><strong>${summary.active}</strong></div></div><div class="customer-stat is-prospect"><span class="customer-stat-icon">${customerIcon("user")}</span><div><small>Khách tiềm năng</small><strong>${summary.prospect}</strong></div></div><div class="customer-stat is-paused"><span class="customer-stat-icon">${customerIcon("pause")}</span><div><small>Tạm dừng</small><strong>${summary.paused}</strong></div></div><div class="customer-stat is-debt"><span class="customer-stat-icon">${customerIcon("debt")}</span><div><small>Công nợ phải thu</small><strong>${fxLedgerShort(summary.outstandingU)}</strong></div></div></div>
    <section class="customer-list"><div class="customer-toolbar"><label class="customer-search">${customerIcon("search")}<input id="customerSearch" placeholder="Tìm theo mã, tên, người liên hệ, SĐT…" oninput="filterCustomerRows()" aria-label="Tìm khách hàng"></label><select id="customerSegment" onchange="filterCustomerRows()" aria-label="Lọc nhóm ngành"><option value="all">Tất cả nhóm ngành</option>${segments.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select><select id="customerStatus" onchange="filterCustomerRows()" aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="active">Đang hợp tác</option><option value="prospect">Khách tiềm năng</option><option value="paused">Tạm dừng</option></select><select id="customerOwner" onchange="filterCustomerRows()" aria-label="Lọc nhân viên phụ trách"><option value="all">Tất cả nhân viên phụ trách</option>${owners.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select><span class="customer-count" id="customerCount">${all.length} kết quả</span></div>
      ${table(["KHÁCH HÀNG", "NGƯỜI LIÊN HỆ", "SỐ ĐIỆN THOẠI", "EMAIL", "ĐƠN HÀNG", "DOANH SỐ", "NHẬT KÝ CSKH", "TRẠNG THÁI", "THAO TÁC"], rows)}</section>
  </div>`;
};

function filterCustomerRows() {
  const query = document.getElementById("customerSearch")?.value.trim().toLowerCase() || "", status = document.getElementById("customerStatus")?.value || "all", segment = document.getElementById("customerSegment")?.value || "all", owner = document.getElementById("customerOwner")?.value || "all";
  let visible = 0; const rows = document.querySelectorAll(".customerrow");
  rows.forEach((row) => { const hidden = !row.dataset.search.includes(query) || (status !== "all" && row.dataset.status !== status) || (segment !== "all" && row.dataset.segment !== segment) || (owner !== "all" && row.dataset.owner !== owner); row.dataset.filteredOut = String(hidden); if (!hidden) visible += 1; });
  const wrapper = rows[0]?.closest(".tablewrap"); if (wrapper?.dataset.paginated) updateTablePagination(wrapper, true); else rows.forEach((row) => (row.hidden = row.dataset.filteredOut === "true"));
  const count = document.getElementById("customerCount"); if (count) count.textContent = `${visible} kết quả`;
}

function customerForm(id = "") {
  const customer = state.customers.find((item) => item.id === id) || {};
  modal(id ? "Cập nhật thông tin khách hàng" : "Thêm khách hàng", `<form class="customer-form" onsubmit="saveCustomer(event,'${id}')">${id ? `<p class="customer-form-code">Mã khách hàng: <b>${esc(id)}</b></p>` : ""}<h3>Thông tin khách hàng</h3><div class="formgrid"><label class="full">Tên khách hàng / Công ty${field("name", "text", customer.name || "", true)}</label><label>Nhóm ngành / Dịch vụ${field("segment", "text", customer.segment || customer.company || "")}</label><label>Tỉnh / Thành phố${field("country", "text", customer.country || "")}</label><label class="full">Địa chỉ${field("address", "text", customer.address || "")}</label></div><h3>Đầu mối liên hệ & phụ trách</h3><div class="formgrid"><label>Người liên hệ${field("contact", "text", customer.contact || customer.name || "", true)}</label><label>Số điện thoại${field("phone", "tel", customer.phone || "", true)}</label><label>Email${field("email", "email", customer.email || "")}</label><label>WhatsApp${field("whatsapp", "text", customer.whatsapp || "")}</label><label>Ngày sinh<input name="birthday" type="date" value="${esc(customer.birthday || "")}"></label><label>Nhân viên phụ trách<select name="owner"><option value="">Chưa phân công</option>${crmOwners.map((value) => `<option ${customer.owner === value ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label><label>Trạng thái<select name="status"><option value="prospect" ${customerStatus(customer) === "prospect" ? "selected" : ""}>Khách tiềm năng</option><option value="active" ${customerStatus(customer) === "active" ? "selected" : ""}>Đang hợp tác</option><option value="paused" ${customerStatus(customer) === "paused" ? "selected" : ""}>Tạm dừng</option></select></label></div><div class="formfooter"><button class="btn" type="button" onclick="closeModal()">Hủy</button><button class="btn primary">${id ? "Lưu thay đổi" : "Lưu khách hàng"}</button></div></form>`, false);
}

function saveCustomer(event, id = "") {
  event.preventDefault(); if (!requireCapability("customers_manage")) return;
  const form = new FormData(event.target), values = Object.fromEntries(["name", "segment", "country", "address", "contact", "phone", "email", "whatsapp", "birthday", "owner", "status"].map((key) => [key, String(form.get(key) || "").trim()]));
  const duplicate = state.customers.find((item) => item.id !== id && values.email && String(item.email).toLowerCase() === values.email.toLowerCase());
  if (duplicate) return toast(`Email đã tồn tại ở ${duplicate.id}.`);
  if (id) Object.assign(state.customers.find((item) => item.id === id), values); else state.customers.push({ id: nextBusinessId("customers"), careLog: [], ...values });
  log(`${id ? "Cập nhật" : "Thêm"} khách hàng ${values.name}`); save(); closeModal(); render(); toast(id ? "Đã cập nhật khách hàng." : "Đã thêm khách hàng mới.");
}

function customerProfileTable(tab, relation, customer) {
  if (tab === "bookings") return relation.bookings.length ? table(["MÃ", "CHƯƠNG TRÌNH", "KHỞI HÀNH", "GIÁ TRỊ", "TRẠNG THÁI"], relation.bookings.map((item) => `<tr><td>${entityLink("booking", item.id)}</td><td>${esc(item.tour)}</td><td>${fmt(item.start)}</td><td>${fxLedgerMoney(item, item.revenue || 0)}</td><td>${bookingBadge(item)}</td></tr>`)) : '<div class="empty">Khách hàng chưa có đặt chỗ.</div>';
  if (tab === "quotes") return relation.quotes.length ? table(["MÃ", "CHƯƠNG TRÌNH", "PHIÊN BẢN", "GIÁ BÁN", "TRẠNG THÁI"], relation.quotes.map((item) => `<tr><td>${entityLink("quote", item.id)}</td><td>${esc(item.tour)}</td><td>v${item.version}</td><td>${fxMoneyOf(item, item.amount)}</td><td>${quoteBadge(item.status)}</td></tr>`)) : '<div class="empty">Khách hàng chưa có báo giá.</div>';
  if (tab === "debt") return relation.bookings.length ? table(["BOOKING", "GIÁ TRỊ", "ĐÃ THU", "CÒN PHẢI THU"], relation.bookings.map((item) => `<tr><td>${entityLink("booking", item.id)}</td><td>${fxLedgerMoney(item, item.revenue || 0)}</td><td class="moneypositive">${fxLedgerMoney(item, item.received || 0)}</td><td>${fxLedgerMoney(item, Math.max(0, (item.revenue || 0) - (item.received || 0)))}</td></tr>`)) : '<div class="empty">Khách hàng chưa phát sinh công nợ.</div>';
  const logs = customer.careLog || [];
  return logs.length ? `<div class="customer-care-timeline">${logs.slice().reverse().map((item) => `<article><span>${customerIcon("care")}</span><div><b>${esc(item.method)} · ${fmt(item.date)}</b><p>${esc(item.note)}</p><small>${esc(item.owner || "Chưa phân công")}</small></div></article>`).join("")}</div>` : '<div class="empty">Chưa có nhật ký chăm sóc khách hàng.</div>';
}

function customerDetail(id, tab = "overview") {
  const customer = state.customers.find((item) => item.id === id); if (!customer) return;
  const relation = customerRelations(customer), debt = Math.max(0, relation.revenueU - relation.receivedU), tabs = [["overview", "Tổng quan"], ["bookings", "Đơn hàng"], ["quotes", "Báo giá"], ["debt", "Công nợ"], ["care", "Nhật ký CSKH"]];
  const overview = `<div class="customer-profile-stats"><div class="customer-profile-stat"><span>${customerIcon("debt")}</span><div><small>Tổng đơn hàng</small><strong>${relation.bookings.length}</strong></div></div><div class="customer-profile-stat"><span>${fxLedgerReady() ? "$" : "₫"}</span><div><small>Doanh số lũy kế</small><strong>${fxLedgerShort(relation.revenueU)}</strong></div></div><div class="customer-profile-stat"><span>${customerIcon("debt")}</span><div><small>Công nợ</small><strong>${fxLedgerShort(debt)}</strong></div></div><div class="customer-profile-stat"><span>★</span><div><small>Hạng khách</small><strong>${esc(customerTier(customer, relation).label)}</strong></div></div></div><section class="customer-section"><h3>Thông tin doanh nghiệp / khách hàng</h3><div class="customer-info-grid"><div><small>Mã khách hàng</small><b class="customer-id">${esc(customer.id)}</b></div><div><small>Tên đầy đủ</small><b>${esc(customer.name)}</b></div><div><small>Nhóm ngành</small><b>${esc(customer.segment || customer.company || "Khách cá nhân")}</b></div><div><small>Địa chỉ</small><b>${esc(customer.address || customer.country || "—")}</b></div></div></section><section class="customer-section"><h3>Đầu mối liên hệ</h3><div class="customer-info-grid"><div><small>Người liên hệ</small><b>${esc(customer.contact || customer.name)}</b></div><div><small>Số điện thoại</small><b>${esc(customer.phone || "—")}</b></div><div><small>Email</small><b>${esc(customer.email || "—")}</b></div><div><small>NV phụ trách</small><b>${esc(customer.owner || "Chưa phân công")}</b></div><div><small>Ngày sinh</small><b>${customer.birthday ? fmt(customer.birthday) : "—"}</b></div></div></section><section class="customer-section"><h3>Lịch sử tour</h3>${relation.bookings.length ? `<div class="customer-care-timeline">${relation.bookings.slice().sort((a, b) => String(b.start).localeCompare(String(a.start))).map((b) => `<article><span>${customerIcon("handshake")}</span><div><b>${entityLink("booking", b.id)} · ${esc(b.tour)}</b><p>${fmt(b.start)} – ${fmt(b.end)} · ${fxLedgerMoney(b, b.revenue || 0)}${b.feedback?.score ? " · hài lòng " + b.feedback.score + "/5" : ""}</p></div></article>`).join("")}</div>` : '<div class="empty">Chưa có tour nào.</div>'}</section>`;
  const lead = relation.leads[0];
  modal(`<span class="customer-profile-title"><span class="customer-profile-avatar">${esc(customerInitials(customer.name))}</span><span>${esc(customer.name)}<small>${esc(customer.id)} · ${esc(customer.segment || customer.company || customer.country || "Khách cá nhân")}</small></span></span>`, `<div class="customer-profile"><nav class="customer-tabs" aria-label="Nội dung hồ sơ">${tabs.map(([value, label]) => `<button class="btn ${tab === value ? "selected" : ""}" onclick="customerDetail('${id}','${value}')">${label}</button>`).join("")}</nav>${tab === "overview" ? overview : `<section class="customer-section customer-tab-content"><h3>${tabs.find(([value]) => value === tab)?.[1]}</h3>${customerProfileTable(tab, relation, customer)}</section>`}<footer class="customer-profile-footer">${btn("Đóng", "closeModal()")}${btn("Sửa thông tin", `customerForm('${id}')`)}${btn("Nhật ký CSKH", `customerCareForm('${id}')`)}${btn("Tạo báo giá", `closeModal();go('design')${lead ? `;selectLead('${lead.id}')` : ""}`, "primary")}</footer></div>`);
}

function customerCareForm(id) {
  const customer = state.customers.find((item) => item.id === id); if (!customer) return; const logs = customer.careLog || [];
  modal("Nhật ký chăm sóc khách hàng", `<div class="customer-care-modal"><p>${esc(customer.name)} · Mã KH: ${esc(customer.id)} · SĐT: ${esc(customer.phone || customer.whatsapp || "—")}</p><form onsubmit="saveCustomerCare(event,'${id}')"><h3>Thêm nội dung chăm sóc mới</h3><div class="formgrid"><label>Ngày thực hiện<input name="date" type="date" value="${new Date().toLocaleDateString("en-CA")}" required></label><label>Hình thức chăm sóc<select name="method"><option>Gọi điện</option><option>Gặp trực tiếp</option><option>Email</option><option>WhatsApp</option></select></label><label class="full">Nội dung ghi chú<textarea name="note" required placeholder="Nhập chi tiết cuộc gọi, tư vấn báo giá, yêu cầu của khách hàng…"></textarea></label></div><div class="formfooter"><button class="btn primary">Lưu nhật ký chăm sóc</button></div></form><section><h3>Lịch sử chăm sóc (${logs.length})</h3>${customerProfileTable("care", customerRelations(customer), customer)}</section></div>`, false);
}

function saveCustomerCare(event, id) {
  event.preventDefault(); if (!requireCapability("customers_manage")) return;
  const customer = state.customers.find((item) => item.id === id), form = new FormData(event.target); customer.careLog ||= [];
  customer.careLog.push({ date: form.get("date"), method: form.get("method"), note: form.get("note").trim(), owner: customer.owner || currentUser?.fullName || "" });
  log(`Chăm sóc khách hàng ${id}: ${form.get("method")}`); save(); customerCareForm(id); toast("Đã lưu nhật ký chăm sóc.");
}

function customerCareReminder() {
  const due = state.customers.filter((customer) => !(customer.careLog || []).length || customerStatus(customer) === "prospect");
  const events = customerEvents(30);
  const eventHtml = events.length ? `<h3>Sinh nhật & kỷ niệm trong 30 ngày tới</h3><div class="customer-reminder-list">${events.map((e) => `<button onclick="customerCareForm('${e.customer.id}')"><span class="customer-avatar">${esc(customerInitials(e.customer.name))}</span><span><b>${esc(e.customer.name)}</b><small>${e.kind} · ${e.left ? "còn " + e.left + " ngày" : "hôm nay"} · ${esc(e.note)}</small></span><i>›</i></button>`).join("")}</div><h3>Chưa được chăm sóc</h3>` : "";
  modal("Khách hàng cần chăm sóc", eventHtml + (due.length ? `<div class="customer-reminder-list">${due.map((customer) => `<button onclick="customerCareForm('${customer.id}')"><span class="customer-avatar">${esc(customerInitials(customer.name))}</span><span><b>${esc(customer.name)}</b><small>${esc(customer.id)} · ${esc(customer.phone || customer.email || "Chưa có liên hệ")}</small></span><i>›</i></button>`).join("")}</div>` : '<div class="empty">Không có khách hàng cần nhắc chăm sóc.</div>'), true);
}

function exportCustomers() {
  const rows = [["Mã khách hàng", "Tên khách hàng", "Người liên hệ", "Điện thoại", "Email", "Nhóm ngành", "Trạng thái"]].concat(state.customers.map((customer) => [customer.id, customer.name, customer.contact || customer.name, customer.phone || customer.whatsapp || "", customer.email || "", customer.segment || customer.company || "", customerStatusLabel(customerStatus(customer))]));
  const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadFile(`khach-hang-${new Date().toLocaleDateString("en-CA")}.csv`, "\uFEFF" + csv, "text/csv;charset=utf-8");
}
