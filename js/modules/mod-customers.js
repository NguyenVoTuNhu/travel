/* MODULE mod-customers — hồ sơ khách hàng. */

function injectCustomerStyles() {
  if (document.getElementById("customer-ui")) return;
  const style = document.createElement("style");
  style.id = "customer-ui";
  style.textContent = `
    #customers-ui .customer-stats{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
    #customers-ui .customer-stat{display:flex;align-items:center;gap:12px;padding:15px 16px}
    #customers-ui .customer-stat-icon{width:42px;height:42px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;background:var(--mint);color:var(--green);font-size:17px;font-weight:800}
    #customers-ui .customer-stat:nth-child(2) .customer-stat-icon{background:#edf3fb;color:#3e6fa7}#customers-ui .customer-stat:nth-child(3) .customer-stat-icon{background:#fbf0dd;color:var(--amber)}#customers-ui .customer-stat:nth-child(4) .customer-stat-icon{background:#f0f2f6;color:#69768b}
    #customers-ui .customer-stat small{display:block;color:var(--muted);font-size:10px}#customers-ui .customer-stat strong{display:block;margin-top:2px;font-size:22px;letter-spacing:-.7px}
    #customers-ui .customer-list{padding:0;overflow:hidden;border-top:3px solid #6c9b7c}#customers-ui .customer-list>.cardhead{padding:15px 16px 0;margin-bottom:11px}
    #customers-ui .customer-toolbar{display:grid;grid-template-columns:minmax(240px,1fr) 210px auto;gap:9px;padding:0 14px 13px;border-bottom:1px solid var(--line)}
    #customers-ui .customer-toolbar input,#customers-ui .customer-toolbar select{width:100%}.customer-count{min-height:40px;display:flex;align-items:center;justify-content:center;padding:0 12px;border:1px solid var(--line);border-radius:8px;color:var(--muted);background:#f8faf7;font-size:11px;white-space:nowrap}
    #customers-ui .tablewrap{border:0;border-radius:0}#customers-ui th{padding:10px 14px;background:#f7f9f6}#customers-ui td{padding:12px 14px;vertical-align:middle}
    #customers-ui .customer-name{display:flex;align-items:center;gap:10px}.customer-avatar,.customer-profile-avatar{display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(145deg,#dceee2,#f0f7f1);color:var(--green);font-weight:800}#customers-ui .customer-avatar{width:34px;height:34px;border-radius:10px;font-size:11px}#customers-ui .customer-name b{display:block}.customer-id{color:var(--green);font-weight:750}
    body .modalback:has(.customer-profile){align-items:stretch;padding:0}body .modal:has(.customer-profile){position:relative;width:min(760px,calc(100% - 24px));height:100%;max-height:none;padding:0;background:#fff;border-radius:0;overflow:auto}body .modal:has(.customer-profile) .modalhead{top:0;margin:0;padding:15px 20px;background:#fff}body .modal:has(.customer-profile) .modalhead .eyebrow{display:none}body .modal:has(.customer-profile) .modalhead h2{margin:0;font-size:17px}
    .customer-profile-title{display:flex;align-items:center;gap:12px}.customer-profile-avatar{width:46px;height:46px;border-radius:50%;font-size:13px}.customer-profile-title>span:last-child{display:flex;flex-direction:column;gap:2px}.customer-profile-title small{color:var(--muted);font-size:10px;font-weight:550}
    .customer-profile{padding:0 20px 82px}.customer-tabs{position:sticky;top:77px;z-index:4;display:flex;gap:5px;overflow:auto;padding:12px 0 9px;border-bottom:1px solid var(--line);background:#fff;scrollbar-width:none}.customer-tabs .btn{min-height:34px;padding:7px 11px;border-color:transparent;color:#687a70;white-space:nowrap}.customer-tabs .btn.selected{border-color:#c9ded0;background:#edf6f0;color:var(--green)}
    .customer-profile-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:15px 0 18px}.customer-profile-stat{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #dfe7df;border-radius:10px;background:#fbfcfa}.customer-profile-stat>span{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:var(--mint);color:var(--green);font-weight:800}.customer-profile-stat small,.customer-profile-stat strong{display:block}.customer-profile-stat small{color:var(--muted);font-size:9px}.customer-profile-stat strong{font-size:15px;margin-top:2px}
    .customer-section{margin:0 0 19px}.customer-section h3{margin:0 0 11px;padding-bottom:8px;border-bottom:1px solid var(--line);font-size:11px;letter-spacing:.55px;text-transform:uppercase;color:#52665d}.customer-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 18px}.customer-info-grid small,.customer-info-grid b{display:block}.customer-info-grid small{margin-bottom:3px;color:var(--muted);font-size:9px;text-transform:uppercase}.customer-info-grid b{overflow-wrap:anywhere;font-size:11px}.customer-profile .empty{padding:35px 16px;border:1px dashed #dbe4dc;border-radius:10px;background:#fafcf9}
    .customer-profile-footer{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;justify-content:flex-end;gap:8px;padding:13px 20px;border-top:1px solid var(--line);background:rgba(255,255,255,.97);backdrop-filter:blur(8px)}
    @media(max-width:900px){#customers-ui .customer-stats{grid-template-columns:1fr 1fr}#customers-ui .customer-toolbar{grid-template-columns:1fr 180px}.customer-count{grid-column:1/-1}#customers-ui th:nth-child(4),#customers-ui td:nth-child(4){display:none}}
    @media(max-width:760px){#customers-ui .customer-toolbar{grid-template-columns:1fr}.customer-count{grid-column:auto}#customers-ui th:nth-child(3),#customers-ui td:nth-child(3),#customers-ui th:nth-child(5),#customers-ui td:nth-child(5){display:none}body .modal:has(.customer-profile){width:100%;height:100%}.customer-profile{padding-inline:16px}.customer-info-grid{grid-template-columns:1fr 1fr}.customer-profile-footer{padding:10px 16px}.customer-profile-footer .btn{flex:1}}
    @media(max-width:480px){#customers-ui .customer-stat{padding:12px;gap:8px}#customers-ui .customer-stat-icon{width:36px;height:36px}#customers-ui .customer-stat strong{font-size:18px}.customer-profile-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}
injectCustomerStyles();

const customerInitials = (name) => String(name || "KH").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();

function customerRelations(customer) {
  const bookings = state.bookings.filter((item) => item.client === customer.name);
  const leads = state.leads.filter((item) => item.name === customer.name || (customer.email && item.email === customer.email));
  const quotes = state.quotes.filter((item) => item.client === customer.name || leads.some((lead) => lead.id === item.lead));
  const care = (state.customerServiceCases || []).filter((item) => item.customer === customer.name);
  return {bookings, leads, quotes, care, revenue: bookings.reduce((sum, item) => sum + (item.revenue || 0), 0), received: bookings.reduce((sum, item) => sum + (item.received || 0), 0)};
}

views.customers = () => {
  const all = state.customers;
  const active = all.filter((customer) => customerRelations(customer).bookings.length).length;
  const outstanding = all.reduce((sum, customer) => { const relation = customerRelations(customer); return sum + Math.max(0, relation.revenue - relation.received); }, 0);
  const rows = all.map((customer) => {
    const relation = customerRelations(customer), status = relation.bookings.length ? "active" : "prospect";
    return `<tr class="customerrow" data-status="${status}" data-search="${esc([customer.id,customer.name,customer.company,customer.email,customer.phone,customer.whatsapp].join(" ").toLowerCase())}"><td><span class="customer-id">${esc(customer.id)}</span></td><td><div class="customer-name"><span class="customer-avatar">${esc(customerInitials(customer.name))}</span><div><b>${esc(customer.name)}</b><span class="sub">${esc(customer.company || "Khách cá nhân")}</span></div></div></td><td>${esc(customer.country || "—")}</td><td>${esc(customer.email || "—")}<span class="sub">${esc(customer.phone || customer.whatsapp || "Chưa có số điện thoại")}</span></td><td><b>${relation.bookings.length} đặt chỗ</b><span class="sub">${relation.quotes.length} báo giá · ${money(relation.revenue)}</span></td><td>${badge(status === "active" ? "Đang hợp tác" : "Tiềm năng",status === "active" ? "green" : "amber")}</td><td>${btn("Xem hồ sơ",`customerDetail('${customer.id}')`,"small")}</td></tr>`;
  });
  const list = card("Danh sách khách hàng",`<div class="customer-toolbar"><input id="customerSearch" placeholder="Tìm theo mã, tên, công ty, email…" oninput="filterCustomerRows()" aria-label="Tìm khách hàng"><select id="customerStatus" onchange="filterCustomerRows()" aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="active">Đang hợp tác</option><option value="prospect">Khách tiềm năng</option></select><span class="customer-count" id="customerCount">${all.length} kết quả</span></div>${table(["MÃ KH","KHÁCH HÀNG","QUỐC GIA","LIÊN HỆ","GIAO DỊCH","TRẠNG THÁI","THAO TÁC"],rows)}`).replace('<section class="card">','<section class="card customer-list">');
  return `<div id="customers-ui">${title("Quản lý khách hàng",`Tổng ${all.length} khách hàng · Hồ sơ, giao dịch và chăm sóc trên một màn hình`,btn("+ Thêm khách hàng","customerForm()","primary"))}<div class="stats customer-stats"><div class="stat customer-stat"><span class="customer-stat-icon">◆</span><div><small>ĐANG HỢP TÁC</small><strong>${active}</strong></div></div><div class="stat customer-stat"><span class="customer-stat-icon">＋</span><div><small>KHÁCH TIỀM NĂNG</small><strong>${all.length-active}</strong></div></div><div class="stat customer-stat"><span class="customer-stat-icon">◎</span><div><small>TỔNG KHÁCH HÀNG</small><strong>${all.length}</strong></div></div><div class="stat customer-stat"><span class="customer-stat-icon">₫</span><div><small>CÔNG NỢ PHẢI THU</small><strong>${short(outstanding)}</strong></div></div></div>${list}</div>`;
};

function filterCustomerRows() {
  const query = document.getElementById("customerSearch")?.value.trim().toLowerCase() || "", status = document.getElementById("customerStatus")?.value || "all";
  let visible = 0;
  const rows = document.querySelectorAll(".customerrow");
  rows.forEach((row) => { row.dataset.filteredOut = String(!row.dataset.search.includes(query) || (status !== "all" && row.dataset.status !== status)); if (row.dataset.filteredOut !== "true") visible++; });
  const wrapper = rows[0]?.closest(".tablewrap");
  if (wrapper?.dataset.paginated) updateTablePagination(wrapper, true);
  else rows.forEach((row) => (row.hidden = row.dataset.filteredOut === "true"));
  const count = document.getElementById("customerCount"); if (count) count.textContent = visible + " kết quả";
}

function customerForm() {
  modal("Thêm khách hàng",`<form onsubmit="saveCustomer(event)"><div class="formgrid"><label>Contact / Họ tên${field("name","text","",true)}</label><label>Company${field("company")}</label><label>Country<select name="country" required><option value="">Chọn thị trường</option>${crmCountries.map((value)=>`<option>${esc(value)}</option>`).join("")}</select></label><label>Email${field("email","email","",true)}</label><label>Phone${field("phone")}</label><label>WhatsApp${field("whatsapp")}</label></div><div class="formfooter"><button class="btn primary">Lưu khách hàng</button></div></form>`,true);
}

function saveCustomer(event) {
  event.preventDefault(); const form = new FormData(event.target);
  state.customers.push({id:"CUS-"+Date.now(),...Object.fromEntries(["name","company","country","email","phone","whatsapp"].map((key)=>[key,form.get(key)])),contact:form.get("name")});
  log("Thêm khách "+form.get("name")); closeModal(); render();
}

function customerProfileTable(tab, relation) {
  if (tab === "bookings") return relation.bookings.length ? table(["MÃ","CHƯƠNG TRÌNH","KHỞI HÀNH","GIÁ TRỊ","TRẠNG THÁI"],relation.bookings.map((item)=>`<tr><td><b>${item.id}</b></td><td>${esc(item.tour)}</td><td>${fmt(item.start)}</td><td>${money(item.revenue||0)}</td><td>${bookStatus(item)}</td></tr>`)) : '<div class="empty">Khách hàng chưa có đặt chỗ.</div>';
  if (tab === "quotes") return relation.quotes.length ? table(["MÃ","CHƯƠNG TRÌNH","PHIÊN BẢN","GIÁ BÁN","TRẠNG THÁI"],relation.quotes.map((item)=>`<tr><td><b>${item.id}</b></td><td>${esc(item.tour)}</td><td>v${item.version}</td><td>${money(item.amount)}</td><td>${badge(item.status,item.status==="Accepted"?"green":"amber")}</td></tr>`)) : '<div class="empty">Khách hàng chưa có báo giá.</div>';
  if (tab === "debt") return relation.bookings.length ? table(["BOOKING","GIÁ TRỊ","ĐÃ THU","CÒN PHẢI THU"],relation.bookings.map((item)=>`<tr><td><b>${item.id}</b></td><td>${money(item.revenue||0)}</td><td class="moneypositive">${money(item.received||0)}</td><td>${money(Math.max(0,(item.revenue||0)-(item.received||0)))}</td></tr>`)) : '<div class="empty">Khách hàng chưa phát sinh công nợ.</div>';
  return relation.care.length ? table(["CASE","BOOKING","PHỤ TRÁCH","CSAT","TRẠNG THÁI"],relation.care.map((item)=>`<tr><td><b>${item.id}</b></td><td>${item.bookingId}</td><td>${esc(item.owner)}</td><td>${item.feedback?item.feedback.overall+"/5":"—"}</td><td>${badge(item.status,item.status==="CLOSED"?"green":"amber")}</td></tr>`)) : '<div class="empty">Chưa có hồ sơ chăm sóc khách hàng.</div>';
}

function customerDetail(id, tab = "overview") {
  const customer = state.customers.find((item)=>item.id===id); if (!customer) return;
  const relation = customerRelations(customer), debt = Math.max(0,relation.revenue-relation.received);
  const tabs = [["overview","Tổng quan"],["bookings",`Đặt chỗ (${relation.bookings.length})`],["quotes",`Báo giá (${relation.quotes.length})`],["debt","Công nợ"],["care","Nhật ký CSKH"]];
  const overview = `<div class="customer-profile-stats"><div class="customer-profile-stat"><span>▣</span><div><small>Tổng đặt chỗ</small><strong>${relation.bookings.length}</strong></div></div><div class="customer-profile-stat"><span>₫</span><div><small>Doanh số lũy kế</small><strong>${short(relation.revenue)}</strong></div></div><div class="customer-profile-stat"><span>≋</span><div><small>Công nợ</small><strong>${short(debt)}</strong></div></div></div><section class="customer-section"><h3>Thông tin khách hàng</h3><div class="customer-info-grid"><div><small>Mã khách hàng</small><b class="customer-id">${esc(customer.id)}</b></div><div><small>Tên đầy đủ</small><b>${esc(customer.name)}</b></div><div><small>Công ty</small><b>${esc(customer.company||"Khách cá nhân")}</b></div><div><small>Quốc gia</small><b>${esc(customer.country||"—")}</b></div><div><small>Trạng thái</small><b>${relation.bookings.length?"Đang hợp tác":"Khách tiềm năng"}</b></div><div><small>Lead liên quan</small><b>${relation.leads.length}</b></div></div></section><section class="customer-section"><h3>Đầu mối liên hệ</h3><div class="customer-info-grid"><div><small>Người liên hệ</small><b>${esc(customer.contact||customer.name)}</b></div><div><small>Điện thoại</small><b>${esc(customer.phone||"—")}</b></div><div><small>WhatsApp</small><b>${esc(customer.whatsapp||"—")}</b></div><div><small>Email</small><b>${esc(customer.email||"—")}</b></div></div></section>`;
  modal(`<span class="customer-profile-title"><span class="customer-profile-avatar">${esc(customerInitials(customer.name))}</span><span>${esc(customer.name)}<small>${esc(customer.id)} · ${esc(customer.company||customer.country||"Khách cá nhân")}</small></span></span>`,`<div class="customer-profile"><nav class="customer-tabs" aria-label="Nội dung hồ sơ">${tabs.map(([value,label])=>`<button class="btn ${tab===value?"selected":""}" onclick="customerDetail('${id}','${value}')">${label}</button>`).join("")}</nav>${tab==="overview"?overview:`<section class="customer-section" style="margin-top:15px"><h3>${tabs.find(([value])=>value===tab)?.[1]||"Chi tiết"}</h3>${customerProfileTable(tab,relation)}</section>`}<footer class="customer-profile-footer">${btn("Đóng","closeModal()")}${btn("Tạo báo giá","closeModal();go('design')","primary")}</footer></div>`);
}
