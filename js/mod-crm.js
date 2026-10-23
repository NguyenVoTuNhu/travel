/* MODULE mod-crm — Lead, pipeline, follow-up và hiệu suất kinh doanh. */

let salesOwner = "all",
  crmTab = "overview",
  crmStatus = "all",
  crmSource = "all",
  crmOwner = "all",
  crmCampaign = "all";

const crmToday = todayISO;
const crmDateTime = nowISO;
const crmTask = (l) =>
  typeof l.followup === "object"
    ? l.followup
    : {
        dueDate: l.followup || crmToday(),
        note: "Liên hệ và xác nhận nhu cầu khách hàng",
        status: "PENDING",
      };

function crmNextBusinessDay(date = crmToday()) {
  let d = new Date(date + "T00:00:00");
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return d.toLocaleDateString("en-CA");
}

function initializeCRMLead(l) {
  if (!l.createdAt) l.createdAt = crmDateTime();
  if (!l.whatsapp) l.whatsapp = "";
  l.followup = crmTask(l);
  if (!l.welcomeEmail) l.welcomeEmail = { status: "NOT_SENT", sentAt: "" };
  if (!l.statusHistory)
    l.statusHistory = [{ status: l.status, at: l.createdAt, note: "Dữ liệu CRM ban đầu" }];
  return l;
}

function initializeCRM() {
  let changed = false;
  state.leads.forEach((lead) => {
    const previous = JSON.stringify(lead);
    initializeCRMLead(lead);
    if (JSON.stringify(lead) !== previous) changed = true;
  });
  if (changed) save();
}

function crmFilteredLeads() {
  initializeCRM();
  const q = crmSearch.toLowerCase();
  return scopedLeads().filter(
    (l) =>
      (!q || [l.name, l.id, l.sales, l.email, l.whatsapp, l.sourceDetail].join(" ").toLowerCase().includes(q)) &&
      (crmStatus === "all" || l.status === crmStatus) &&
      (crmSource === "all" || l.source === crmSource) &&
      (crmOwner === "all" || l.sales === crmOwner) &&
      (crmCampaign === "all" || l.campaign === crmCampaign),
  );
}

const leadIsOpen = (l) => !["WON", "LOST", "UNQUALIFIED"].includes(l.status);

views.crm = () => {
  const mine = scopedLeads();
  const ls = crmFilteredLeads();
  const tasks = mine.filter(leadIsOpen).map((l) => crmTask(l));
  const overdue = tasks.filter((t) => t.status === "PENDING" && t.dueDate < crmToday()).length;
  const today = tasks.filter((t) => t.status === "PENDING" && t.dueDate === crmToday()).length;
  const won = mine.filter((l) => l.status === "WON").length;
  const decided = mine.filter((l) => ["WON", "LOST"].includes(l.status)).length;
  const conversion = mine.length ? Math.round((won / mine.length) * 100) : 0;
  const canSell = can("tour_design_manage");
  const summary = `<div class="stats">${stat("TỔNG LEAD", mine.length, "Trong phạm vi của bạn")}${stat("ĐANG CHĂM SÓC", mine.filter(leadIsOpen).length, "Cơ hội còn mở")}${stat("TỶ LỆ THÀNH CÔNG", conversion + "%", `${won} thành công / ${decided} đã có kết quả`)}${stat("FOLLOW-UP QUÁ HẠN", overdue, today + " việc đến hạn hôm nay")}</div>`;
  const tabs = [
    ["overview", "Tổng quan"],
    ["leads", "Danh sách Lead (" + mine.length + ")"],
    ["pipeline", "Pipeline"],
    ["followup", "Công việc chăm sóc" + (overdue + today ? " (" + (overdue + today) + ")" : "")],
    ["performance", "Hiệu suất"],
    ["ctv", "Cộng tác viên"],
  ];
  let content = summary + crmFunnel(mine) + crmAutomationPanel();
  if (crmTab === "leads")
    content = `<section class="crmsection"><div class="crmsectionhead"><div><h2>Danh sách Lead</h2><p>${ls.length} kết quả theo bộ lọc hiện tại</p></div>${btn("Xuất CSV", "exportCRMLeads()")}</div><div class="filters"><input placeholder="Tìm tên, mã, email, WhatsApp, Sales…" value="${esc(crmSearch)}" oninput="crmSearch=this.value;refreshLeads()" aria-label="Tìm lead"><select aria-label="Lọc trạng thái" onchange="crmStatus=this.value;refreshLeads()"><option value="all">Mọi trạng thái</option>${stages.map((x) => `<option value="${x}" ${crmStatus === x ? "selected" : ""}>${leadLabels[x] || x}</option>`).join("")}</select><select aria-label="Lọc nguồn lead" onchange="crmSource=this.value;refreshLeads()"><option value="all">Mọi nguồn</option>${[...new Set(mine.map((l) => l.source))].map((x) => `<option ${crmSource === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select><select aria-label="Lọc chiến dịch" onchange="crmCampaign=this.value;refreshLeads()"><option value="all">Mọi chiến dịch</option>${state.campaigns.map((c) => `<option value="${c.id}" ${crmCampaign === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>${can("sales_financials") || can("all") ? `<select aria-label="Lọc Sales" onchange="crmOwner=this.value;refreshLeads()"><option value="all">Mọi Sales</option>${crmOwners.map((x) => `<option ${crmOwner === x ? "selected" : ""}>${x}</option>`).join("")}</select>` : ""}</div><div id="crmtable">${crmLeadTable(ls)}</div></section>`;
  if (crmTab === "pipeline")
    content = `<section class="crmsection"><div class="crmsectionhead"><div><h2>Pipeline bán hàng</h2><p>Lead đi theo đúng thứ tự: Mới → Đã liên hệ → Đủ điều kiện → Đã gửi báo giá → Đàm phán → Thành công</p></div></div><div id="leadboard">${leadboard(ls)}</div></section>`;
  if (crmTab === "followup")
    content = `<section class="crmsection"><div class="crmsectionhead"><div><h2>Công việc chăm sóc tiếp theo</h2><p>${today} việc hôm nay · ${overdue} việc quá hạn</p></div></div><div id="crmtasks">${crmFollowupTable(ls)}</div></section>`;
  if (crmTab === "performance")
    content = `<div class="crm-performance-filter"><label>Nhân viên Sales<select onchange="salesOwner=this.value;render()">${["all", ...crmOwners].map((owner) => `<option value="${owner}" ${salesOwner === owner ? "selected" : ""}>${owner === "all" ? "Toàn bộ Sales" : esc(owner)}</option>`).join("")}</select></label></div>${salesContent(salesOwner)}`;
  if (crmTab === "ctv") content = crmCtvPanel(mine);
  return `<div id="crm-sales">${title("Khách hàng tiềm năng (CRM)", "Tiếp nhận lead, tư vấn, chăm sóc và chuyển sang báo giá.", btn("+ Lead thủ công", "leadForm()") + btn("Nhận Lead Website", "websiteLeadForm()", "primary"))}<nav class="crm-workspace-tabs" aria-label="CRM Workspace">${tabs.map(([value, label]) => `<button class="btn ${crmTab === value ? "selected" : ""}" onclick="crmTab='${value}';render()">${label}</button>`).join("")}</nav>${content}</div>`;
};

function crmFunnel(ls) {
  const rows = leadFlow.map((s) => ({ s, n: ls.filter((l) => l.status === s).length }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  const extra = ["UNQUALIFIED", "LOST"].map((s) => ({ s, n: ls.filter((l) => l.status === s).length }));
  return `<section class="crmsection"><div class="crmsectionhead"><div><h2>Phễu bán hàng</h2><p>Số lead theo từng giai đoạn</p></div></div><div class="funnel">${rows
    .map((r) => `<button type="button" class="funnel-row" onclick="crmStatus='${r.s}';crmTab='leads';render()"><span>${leadLabels[r.s]}</span><i style="--w:${(r.n / max) * 100}%"></i><b>${r.n}</b></button>`)
    .join("")}</div><p class="sub funnel-extra">${extra.map((r) => `${leadLabels[r.s]}: <b>${r.n}</b>`).join(" · ")}</p></section>`;
}

function crmAutomationPanel() {
  return `<section class="crmsection"><div class="crmsectionhead"><div><h2>Tự động hóa lead từ website</h2><p>Quy trình áp dụng mỗi khi nhận lead từ website hoặc chiến dịch</p></div>${badge("Đang bật", "green")}</div><div class="crmflow"><div class="crmstep"><small>01 · TIẾP NHẬN</small><b>Lead website</b><span class="crmstatus">Form tiếp nhận riêng</span></div><div class="crmstep"><small>02 · KIỂM TRA</small><b>Tạo lead & khách hàng</b><span class="crmstatus">Chống trùng Email/WhatsApp</span></div><div class="crmstep"><small>03 · PHÂN CÔNG</small><b>Chia Sales luân phiên</b><span class="crmstatus">Theo số lead đang giữ</span></div><div class="crmstep"><small>04 · TƯƠNG TÁC</small><b>Email chào mừng</b><span class="crmstatus">Ghi nhận trạng thái gửi</span></div><div class="crmstep"><small>05 · HÀNH ĐỘNG</small><b>Việc chăm sóc</b><span class="crmstatus">Hạn ngày làm việc tiếp theo</span></div></div></section>`;
}

/* Điểm lead 0-100: ngân sách/khách, quy mô đoàn, nguồn, giai đoạn, độ trễ chăm sóc. */
function leadScore(l) {
  if (["WON"].includes(l.status)) return { n: 100, label: "Đã chốt", tone: "green" };
  if (["LOST", "UNQUALIFIED"].includes(l.status)) return { n: 0, label: "Đóng", tone: "" };
  const pax = Math.max(1, l.pax || 1), per = (l.budget || 0) / pax;
  let n = per >= 20e6 ? 30 : per >= 10e6 ? 20 : per >= 5e6 ? 10 : 0;
  n += pax >= 6 ? 15 : pax >= 3 ? 8 : 0;
  const sourceText = `${l.source || ""} ${l.sourceDetail || ""}`;
  n += /gi[oó]i thi[eệ]u|referral|zalo|whatsapp|web|ctv/i.test(sourceText) ? 10 : 5;
  if (l.campaign) n += 5;
  n += Math.max(0, (typeof leadFlow !== "undefined" ? leadFlow.indexOf(l.status) : 0)) * 8;
  const t = crmTask(l);
  if (t.status === "PENDING" && t.dueDate < crmToday()) n -= 15;
  const age = (Date.now() - new Date(l.createdAt)) / 864e5;
  if (age > 14 && l.status === "NEW") n -= 10;
  n = Math.max(0, Math.min(99, n));
  return n >= 60 ? { n, label: "Nóng", tone: "red" } : n >= 35 ? { n, label: "Ấm", tone: "amber" } : { n, label: "Lạnh", tone: "blue" };
}
const leadScoreBadge = (l) => { const s = leadScore(l); return `${badge(s.label, s.tone)}<span class="sub">${s.n} điểm</span>`; };

function crmLeadRow(l) {
  const camp = findCampaign(l.campaign);
  const campaignLink = camp ? `<span class="sub">${entityLink("campaign", camp.id, camp.name)}</span>` : "";
  const open = btn("Mở hồ sơ", "leadDetail('" + l.id + "')", "small");
  return [
    "<tr>",
    `<td><b>${l.id}</b><span class="sub">${fmt(l.createdAt.slice(0, 10))}</span></td>`,
    `<td>${esc(l.source)}${leadSourceDetailHtml(l)}${campaignLink}<span class="sub">${esc(l.country)}</span></td>`,
    `<td><b>${esc(l.name)}</b></td>`,
    `<td>${esc(l.email)}<span class="sub">${esc(l.whatsapp)}</span></td>`,
    `<td>${money(l.budget)}</td>`,
    `<td>${leadScoreBadge(l)}</td>`,
    `<td>${leadBadge(l.status)}</td>`,
    `<td>${esc(l.sales)}</td>`,
    `<td>${open}</td>`,
    "</tr>",
  ].join("");
}

function crmLeadTable(ls) {
  const heads = [
    "MÃ LEAD / NGÀY",
    "NGUỒN / THỊ TRƯỜNG",
    "KHÁCH HÀNG",
    "EMAIL / WHATSAPP",
    "NGÂN SÁCH",
    "ĐIỂM LEAD",
    "TRẠNG THÁI",
    "SALES",
    "THAO TÁC",
  ];
  const body = ls.length
    ? table(heads, ls.map((l) => crmLeadRow(l)))
    : '<div class="empty">Không có lead phù hợp bộ lọc.</div>';
  return card("", body);
}

function crmFollowupTable(ls) {
  const pending = ls
    .filter((l) => leadIsOpen(l) && crmTask(l).status === "PENDING")
    .sort((a, b) => crmTask(a).dueDate.localeCompare(crmTask(b).dueDate));
  return pending.length
    ? card(
        "",
        table(
          ["LEAD", "SALES", "NỘI DUNG", "HẠN", "TÌNH TRẠNG", "THAO TÁC"],
          pending.map((l) => {
            const t = crmTask(l),
              late = t.dueDate < crmToday();
            return `<tr><td><b>${entityLink("lead", l.id, l.name)}</b><span class="sub">${l.id} · ${leadLabels[l.status]}</span></td><td>${esc(l.sales)}</td><td style="white-space:normal">${esc(t.note)}</td><td class="${late ? "task-overdue" : ""}">${fmt(t.dueDate)}</td><td>${badge(late ? "Quá hạn" : t.dueDate === crmToday() ? "Hôm nay" : "Sắp tới", late ? "red" : "amber")}</td><td>${btn("Hoàn thành", "completeFollowup('" + l.id + "')", "small")}</td></tr>`;
          }),
        ),
      )
    : '<div class="empty">Không có công việc chăm sóc đang chờ.</div>';
}

function leadboard(ls) {
  const cols = leadFlow;
  const canMove = can("crm_manage");
  return (
    '<div class="kanban">' +
    cols
      .map(
        (s) =>
          '<div class="column"><div class="columnhead">' + leadLabels[s] + " <span>" + ls.filter((l) => l.status === s).length + "</span></div>" +
          ls
            .filter((l) => l.status === s)
            .map((l) => {
              const task = crmTask(l);
              const taskLabel = task.status === "DONE" ? "Đã chăm sóc" : task.dueDate < crmToday() ? "Quá hạn " + fmt(task.dueDate) : "Hẹn " + fmt(task.dueDate);
              return `<div class="lead"><button class="link" onclick="leadDetail('${l.id}')">${esc(l.name)}</button><p>${l.id} · ${fmt(l.createdAt.slice(0, 10))} · ${esc(l.country)}</p><div class="price">${short(l.budget)}</div><p>${esc(l.source)}<br>${esc(l.sales)} · ${esc(taskLabel)}</p>${canMove ? leadStageSelect(l) : ""}</div>`;
            })
            .join("") +
          "</div>",
      )
      .join("") +
    "</div>" +
    (ls.filter((l) => ["LOST", "UNQUALIFIED"].includes(l.status)).length
      ? '<div class="notice">Đã loại: ' +
        ls
          .filter((l) => ["LOST", "UNQUALIFIED"].includes(l.status))
          .map((l) => `${entityLink("lead", l.id, l.name)} (${leadLabels[l.status]}${l.lostReason ? " — " + esc(l.lostReason) : ""})`)
          .join(", ") +
        "</div>"
      : "")
  );
}

function leadStageSelect(l) {
  const options = [l.status, ...(leadNextStates[l.status] || [])];
  return (
    `<select aria-label="Trạng thái lead ${l.id}" onchange="setLeadStage('${l.id}',this.value)">` +
    [...new Set(options)].map((x) => `<option value="${x}" ${l.status === x ? "selected" : ""}>${leadLabels[x]}</option>`).join("") +
    "</select>"
  );
}

function refreshLeads() {
  const ls = crmFilteredLeads();
  const board = document.getElementById("leadboard"),
    leadTable = document.getElementById("crmtable"),
    tasks = document.getElementById("crmtasks");
  if (board) board.innerHTML = leadboard(ls);
  if (leadTable) leadTable.innerHTML = crmLeadTable(ls);
  if (tasks) tasks.innerHTML = crmFollowupTable(ls);
}

function setLeadStage(id, status) {
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id);
  if (status === l.status) return;
  if (!(leadNextStates[l.status] || []).includes(status)) {
    toast(
      status === "WON"
        ? "Chỉ chuyển Thành công khi khách chấp nhận báo giá."
        : status === "QUOTE SENT"
          ? "Lead chuyển Đã gửi báo giá khi bạn gửi báo giá cho khách."
          : "Hãy thực hiện đúng thứ tự quy trình.",
    );
    render();
    return;
  }
  if (["LOST", "UNQUALIFIED"].includes(status)) return lostLeadForm(id, status);
  updateLeadStatus(l, status);
}

function updateLeadStatus(l, status, note = "") {
  const from = l.status;
  l.status = status;
  l.statusHistory = l.statusHistory || [];
  l.statusHistory.unshift({ status, at: crmDateTime(), by: actor().name, note });
  audit("lead", l.id, "STATUS", `${l.id}: ${leadLabels[from]} → ${leadLabels[status]}${note ? " · " + note : ""}`);
  render();
  toast(`Đã chuyển ${l.id} sang "${leadLabels[status]}".`);
}

function lostLeadForm(id, status = "LOST") {
  const unq = status === "UNQUALIFIED";
  modal(
    unq ? "Lead không đủ điều kiện" : "Đánh dấu lead thất bại",
    `<form onsubmit="saveLostLead(event,'${id}','${status}')"><label>${unq ? "Lý do không đủ điều kiện" : "Lý do mất lead"}<textarea name="reason" required maxlength="300" placeholder="${unq ? "Ví dụ: Ngân sách quá thấp, ngoài thị trường phục vụ" : "Ví dụ: Khách chọn công ty khác, giá chưa phù hợp"}"></textarea></label><div class="formfooter">${btn("Hủy", "closeModal();render()")}<button class="btn danger" type="submit">Xác nhận</button></div></form>`,
    true,
  );
}

function saveLostLead(e, id, status = "LOST") {
  e.preventDefault();
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id);
  const reason = new FormData(e.target).get("reason").trim();
  l.lostReason = reason;
  l.followup = { ...crmTask(l), status: "DONE" };
  closeModal();
  updateLeadStatus(l, status, reason);
}

function leadForm() {
  leadEntryForm(false);
}
function websiteLeadForm() {
  leadEntryForm(true);
}

/* NGUỒN LEAD CHUẨN (T2-01, mục 1.3): 9 nguồn; tên lưu ở lead.source, chi tiết theo nguồn lưu ở lead.sourceDetail.
   Tên viết tiếng Việt để localizeUI() không dịch lại. detailLabel rỗng = nguồn không cần chi tiết. */
const leadSourceCatalog = [
  { name: "Biểu mẫu trên trang web", detailLabel: "", detailRequired: false },
  { name: "WhatsApp", detailLabel: "", detailRequired: false },
  { name: "Fanpage", detailLabel: "", detailRequired: false },
  { name: "Instagram", detailLabel: "", detailRequired: false },
  { name: "CTV", detailLabel: "Tên CTV (HDV hoặc khách hàng cũ)", detailRequired: true },
  {
    name: "Sách báo – quảng cáo bên thứ 3",
    detailLabel: "Tên ấn phẩm (Petit Futé, Routard…)",
    detailRequired: true,
  },
  { name: "Đối tác B2B", detailLabel: "Tên đối tác B2B", detailRequired: true },
  { name: "Kênh hội chợ", detailLabel: "Tên hội chợ", detailRequired: true },
  { name: "Khác", detailLabel: "Ghi chú nguồn", detailRequired: false },
];

const leadSourceWebsite = leadSourceCatalog[0].name;

/* Nguồn cũ (nhập tự do trước T2-01) → nguồn chuẩn; không khớp thì vào "Khác" và giữ chữ cũ làm chi tiết. */
const leadSourceLegacyPatterns = [
  [/web/i, "Biểu mẫu trên trang web"],
  [/whatsapp/i, "WhatsApp"],
  [/fanpage|facebook/i, "Fanpage"],
  [/instagram/i, "Instagram"],
  [/ctv|cộng tác/i, "CTV"],
  [/petit|routard|sách|báo|quảng cáo/i, "Sách báo – quảng cáo bên thứ 3"],
  [/b2b|đối tác/i, "Đối tác B2B"],
  [/hội chợ|fair|expo/i, "Kênh hội chợ"],
];

function leadSourceInfo(name) {
  return leadSourceCatalog.find((s) => s.name === name) || null;
}

function leadSourceOptions() {
  if (crmLeadSources.length) return crmLeadSources;
  return leadSourceCatalog.map((s) => s.name);
}

function leadSourceText(l) {
  if (!l.sourceDetail) return l.source;
  return `${l.source} (${l.sourceDetail})`;
}

function leadSourceDetailHtml(l) {
  if (!l.sourceDetail) return "";
  return `<span class="sub">${esc(l.sourceDetail)}</span>`;
}

function leadSourceFromLegacy(text) {
  const found = leadSourceLegacyPatterns.find(([pattern]) => pattern.test(text));
  return found ? found[1] : "Khác";
}

/* Đưa settings[0].leadSources và nguồn của lead cũ về 9 nguồn chuẩn. Trả về true nếu có thay đổi cần lưu. */
function migrateLeadSources() {
  let changed = false;
  const names = leadSourceCatalog.map((s) => s.name);
  const settings = state.settings?.[0];
  if (settings && JSON.stringify(settings.leadSources) !== JSON.stringify(names)) {
    settings.leadSources = names;
    changed = true;
  }
  for (const lead of state.leads || []) {
    if (leadSourceInfo(lead.source)) continue;
    const legacy = String(lead.source || "").trim();
    const target = leadSourceFromLegacy(legacy);
    lead.source = target;
    if (leadSourceInfo(target).detailLabel && legacy && !lead.sourceDetail) {
      lead.sourceDetail = legacy;
    }
    changed = true;
  }
  return changed;
}

/* CTV — CỘNG TÁC VIÊN (T2-02): CTV là HDV hoặc khách hàng cũ; lead lưu ctvType + ctvId (mã HDV / mã khách).
   Hoa hồng CTV (%) nhập tay theo từng lead, mặc định 0. Chỉ CEO và Sales (sales_financials) xem và sửa hoa hồng. */
const leadSourceCtv = "CTV";

const ctvTypes = [
  { value: "GUIDE", label: "Hướng dẫn viên" },
  { value: "CUSTOMER", label: "Khách hàng cũ" },
];

function canManageCommission() {
  return can("sales_financials");
}

function ctvTypeLabel(type) {
  const found = ctvTypes.find((t) => t.value === type);
  return found ? found.label : "Chưa liên kết hồ sơ";
}

function ctvRecords(type) {
  const records = type === "GUIDE" ? state.guides : state.customers;
  return (records || []).map((r) => ({ id: r.id, name: r.name }));
}

function ctvRecordName(type, id) {
  const found = ctvRecords(type).find((r) => r.id === id);
  return found ? found.name : "";
}

function ctvTypeOptionsHtml(selected = "") {
  return ctvTypes
    .map((t) => `<option value="${t.value}" ${t.value === selected ? "selected" : ""}>${t.label}</option>`)
    .join("");
}

function ctvOptionsHtml(type, selected = "") {
  const items = ctvRecords(type).map((r) => {
    const mark = r.id === selected ? "selected" : "";
    return `<option value="${esc(r.id)}" ${mark}>${esc(r.name)} (${esc(r.id)})</option>`;
  });
  return `<option value="">Chọn CTV</option>${items.join("")}`;
}

function commissionRateOf(l) {
  const rate = Number(l.commissionRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

/* Đọc CTV và hoa hồng từ form. allowRate=false (không có quyền) thì hoa hồng luôn là 0. */
function ctvFromForm(f, allowRate) {
  const type = f.get("ctvType");
  const id = f.get("ctvId");
  const name = ctvRecordName(type, id);
  if (!name) return { error: "Chọn CTV (hướng dẫn viên hoặc khách hàng cũ)." };
  const rate = allowRate ? Number(f.get("commissionRate") || 0) : 0;
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { error: "Hoa hồng phải từ 0 đến 100%." };
  return { type, id, name, rate: Math.round(rate * 100) / 100 };
}

function ctvLeadFields(ctv) {
  if (!ctv) return {};
  return { ctvType: ctv.type, ctvId: ctv.id, commissionRate: ctv.rate };
}

function leadBookings(l) {
  return (state.bookings || []).filter((b) => b.lead === l.id && b.status !== "Cancelled");
}

/* Hoa hồng của một booking = giá trị hợp đồng × tỷ lệ của lead (lưu VND, hiển thị USD theo tỷ giá của booking). */
function ctvCommissionVnd(b, rate) {
  return Math.round(((b.revenue || 0) * rate) / 100);
}

function ctvCanEdit(l) {
  if (l.source !== leadSourceCtv || !canManageCommission()) return false;
  return scopedLeads().some((x) => x.id === l.id);
}

function ctvFooterButton(l) {
  if (!ctvCanEdit(l)) return "";
  return btn("CTV và hoa hồng", `ctvEditForm('${l.id}')`);
}

function ctvCommissionText(l) {
  const rate = commissionRateOf(l);
  const bookings = leadBookings(l);
  if (!bookings.length) return `${rate}%`;
  return `${rate}% · ${fxSumMoney(bookings, (b) => ctvCommissionVnd(b, rate))}`;
}

/* Các dòng thông tin CTV trong hồ sơ lead; hoa hồng chỉ hiện cho người có quyền. */
function crmCtvFields(l, field) {
  if (l.source !== leadSourceCtv) return "";
  const fields = [field("Cộng tác viên", `${ctvTypeLabel(l.ctvType)}: ${esc(l.sourceDetail || "—")}`)];
  if (canManageCommission()) fields.push(field("Hoa hồng CTV", ctvCommissionText(l)));
  return fields.join("");
}

function ctvEditForm(id) {
  const l = findLead(id);
  if (!l || !ctvCanEdit(l)) return;
  const type = l.ctvType || ctvTypes[0].value;
  const picker = `<select name="ctvId" required>${ctvOptionsHtml(type, l.ctvId || "")}</select>`;
  const input = `<input name="commissionRate" type="number" min="0" max="100" step="0.1" value="${commissionRateOf(l)}">`;
  const form = [
    `<form onsubmit="saveCtv(event,'${id}')">`,
    '<div class="formgrid">',
    `<label>Loại CTV<select name="ctvType" onchange="leadCtvTypeChanged(this)">${ctvTypeOptionsHtml(type)}</select></label>`,
    `<label id="leadCtvBox">CTV${picker}</label>`,
    `<label>Hoa hồng CTV (%)${input}</label>`,
    "</div>",
    '<div class="formfooter">',
    btn("Hủy", `leadDetail('${id}')`),
    '<button class="btn primary" type="submit">Lưu</button>',
    "</div>",
    "</form>",
  ].join("");
  modal(`CTV và hoa hồng · ${id}`, form, true);
}

function saveCtv(e, id) {
  e.preventDefault();
  if (!requireCapability("sales_financials")) return;
  const l = findLead(id);
  if (!l || !ctvCanEdit(l)) return toast("Không tìm thấy lead CTV hoặc bạn không có quyền sửa.");
  const ctv = ctvFromForm(new FormData(e.target), true);
  if (ctv.error) return toast(ctv.error);
  l.ctvType = ctv.type;
  l.ctvId = ctv.id;
  l.sourceDetail = ctv.name;
  l.commissionRate = ctv.rate;
  audit("lead", id, "UPDATE", `CTV ${ctv.name} (${ctv.id}), hoa hồng ${ctv.rate}%`);
  save();
  closeModal();
  render();
  leadDetail(id);
}

/* Thống kê theo CTV: gom lead nguồn CTV theo mã hồ sơ (lead chưa liên kết gom theo tên ghi tay). */
function ctvKey(l) {
  if (l.ctvId) return `${l.ctvType}:${l.ctvId}`;
  return `TEXT:${String(l.sourceDetail || "").trim().toLowerCase()}`;
}

function crmCtvGroups(ls) {
  const groups = new Map();
  for (const l of ls) {
    if (l.source !== leadSourceCtv) continue;
    const key = ctvKey(l);
    if (!groups.has(key)) {
      groups.set(key, {
        type: l.ctvType || "",
        id: l.ctvId || "",
        name: l.sourceDetail || "(chưa ghi tên)",
        leads: [],
      });
    }
    groups.get(key).leads.push(l);
  }
  return [...groups.values()].sort((a, b) => b.leads.length - a.leads.length);
}

function ctvFinance(leads) {
  const rates = new Map(leads.map((l) => [l.id, commissionRateOf(l)]));
  const bookings = leads.flatMap((l) => leadBookings(l));
  const revenue = fxSumMoney(bookings, (b) => b.revenue || 0);
  const commission = fxSumMoney(bookings, (b) => ctvCommissionVnd(b, rates.get(b.lead) || 0));
  const levels = [...new Set(rates.values())];
  const rateText = levels.length === 1 ? `${levels[0]}%` : "Nhiều mức";
  return { revenue, commission, rateText };
}

function crmCtvRow(group, finance) {
  const won = group.leads.filter((l) => l.status === "WON").length;
  const rate = Math.round((won / group.leads.length) * 100);
  const cells = [
    `<td><b>${esc(group.name)}</b><span class="sub">${esc(group.id)}</span></td>`,
    `<td>${esc(ctvTypeLabel(group.type))}</td>`,
    `<td>${group.leads.length}</td>`,
    `<td>${won}</td>`,
    `<td>${rate}%</td>`,
  ];
  if (finance) {
    const fin = ctvFinance(group.leads);
    cells.push(`<td>${fin.revenue}</td>`, `<td>${fin.rateText}</td>`, `<td>${fin.commission}</td>`);
  }
  return `<tr>${cells.join("")}</tr>`;
}

function crmCtvPanel(ls) {
  const groups = crmCtvGroups(ls);
  const finance = canManageCommission();
  const leads = groups.flatMap((g) => g.leads);
  const won = leads.filter((l) => l.status === "WON").length;
  const stats = [
    stat("CỘNG TÁC VIÊN", groups.length, "Có ít nhất một lead"),
    stat("LEAD TỪ CTV", leads.length, "Trong phạm vi của bạn"),
    stat("ĐÃ CHỐT", won, "Lead thành công"),
  ];
  const heads = ["CỘNG TÁC VIÊN", "LOẠI", "LEAD", "ĐÃ CHỐT", "TỶ LỆ CHỐT"];
  if (finance) {
    const total = ctvFinance(leads);
    stats.push(stat("DOANH THU TỪ CTV", total.revenue, "Booking chưa hủy"));
    stats.push(stat("HOA HỒNG CTV", total.commission, "Tính trên giá trị hợp đồng"));
    heads.push("DOANH THU", "HOA HỒNG (%)", "HOA HỒNG");
  }
  const rows = groups.map((g) => crmCtvRow(g, finance));
  const body = rows.length ? table(heads, rows) : '<div class="empty">Chưa có lead nào đến từ CTV.</div>';
  return [
    '<section class="crmsection">',
    '<div class="crmsectionhead"><div><h2>Cộng tác viên</h2>',
    "<p>Lead, tỷ lệ chốt, doanh thu và hoa hồng theo từng CTV (HDV hoặc khách hàng cũ)</p></div></div>",
    `<div class="stats">${stats.join("")}</div>`,
    card("", body),
    "</section>",
  ].join("");
}

/* Biểu mẫu thêm lead: chia thành các khối nhỏ. Mỗi <option> có value riêng để không bị localizeUI() đổi chữ. */
function leadFormOptions(values) {
  return values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("");
}

function leadFormSalesField() {
  const fixed = isScoped() && crmOwners.includes(myName()) && can("quotes_manage");
  if (fixed) {
    return `<label>Sales phụ trách<input name="sales" value="${esc(myName())}" readonly></label>`;
  }
  return `<label>Sales phụ trách<select name="sales">${leadFormOptions(crmOwners)}</select></label>`;
}

function leadFormCampaignField() {
  const none = '<option value="">Không thuộc chiến dịch</option>';
  const items = state.campaigns.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`);
  return `<label>Chiến dịch<select name="campaign">${none}${items.join("")}</select></label>`;
}

function leadFormSourceFields(website) {
  const names = website ? [leadSourceWebsite] : leadSourceOptions();
  const info = leadSourceInfo(names[0]);
  const label = info?.detailLabel || "";
  const required = label && info.detailRequired ? "required" : "";
  const hidden = label ? "" : 'style="display:none"';
  const select = `<select name="source" onchange="leadSourceChanged(this)" ${website ? "disabled" : ""}>`;
  return [
    `<label>Nguồn lead${select}${leadFormOptions(names)}</select></label>`,
    `<label id="leadSourceDetailBox" ${hidden}>`,
    `<span>${esc(label)}</span>`,
    `<input name="sourceDetail" maxlength="100" ${required}>`,
    "</label>",
  ].join("");
}

/* Khối CTV trong form thêm lead: chỉ hiện khi chọn nguồn CTV; hoa hồng chỉ hiện cho người có quyền (mặc định 0). */
function leadFormCtvFields() {
  const first = ctvTypes[0].value;
  const hide = 'style="display:none"';
  const input = '<input name="commissionRate" type="number" min="0" max="100" step="0.1" value="0">';
  const rate = canManageCommission() ? `<label id="leadCtvRateBox" ${hide}>Hoa hồng CTV (%)${input}</label>` : "";
  return [
    `<label id="leadCtvTypeBox" ${hide}>Loại CTV`,
    `<select name="ctvType" onchange="leadCtvTypeChanged(this)">${ctvTypeOptionsHtml(first)}</select></label>`,
    `<label id="leadCtvBox" ${hide}>CTV<select name="ctvId">${ctvOptionsHtml(first)}</select></label>`,
    rate,
  ].join("");
}

/* Đổi nguồn → hiện/ẩn ô chi tiết theo nguồn (tên đối tác, hội chợ, ấn phẩm); nguồn CTV chọn từ HDV/khách cũ. */
function leadSourceChanged(select) {
  const box = document.getElementById("leadSourceDetailBox");
  if (!box) return;
  const info = leadSourceInfo(select.value);
  const isCtv = select.value === leadSourceCtv;
  const label = isCtv ? "" : info?.detailLabel || "";
  const input = box.querySelector("input");
  box.style.display = label ? "" : "none";
  box.querySelector("span").textContent = label;
  input.required = Boolean(label) && Boolean(info.detailRequired);
  if (!label) input.value = "";
  leadCtvToggle(isCtv);
}

function leadCtvToggle(show) {
  for (const id of ["leadCtvTypeBox", "leadCtvBox", "leadCtvRateBox"]) {
    const box = document.getElementById(id);
    if (box) box.style.display = show ? "" : "none";
  }
  const picker = document.querySelector("#leadCtvBox select");
  if (!picker) return;
  picker.required = show;
  if (!show) picker.value = "";
}

function leadCtvTypeChanged(select) {
  const picker = document.querySelector("#leadCtvBox select");
  if (picker) picker.innerHTML = ctvOptionsHtml(select.value);
}

function leadEntryForm(website) {
  const countries = leadFormOptions(crmCountries);
  const country = `<select name="country" required><option value="">Chọn thị trường</option>${countries}</select>`;
  const salesField = website
    ? '<label>Sales phụ trách<input value="Tự động chia luân phiên" disabled></label>'
    : leadFormSalesField();
  const notice = website
    ? "Hệ thống tạo lead và hồ sơ khách hàng, chia Sales, ghi nhận email chào mừng và tạo việc chăm sóc."
    : "Lead được tạo ở trạng thái Mới kèm việc chăm sóc tiếp theo.";
  const fields = [
    `<label>Ngày tạo<input name="date" type="date" value="${crmToday()}" required></label>`,
    '<label>Họ tên khách<input name="name" required maxlength="100"></label>',
    '<label>Email<input name="email" type="email" required></label>',
    '<label>WhatsApp / điện thoại<input name="whatsapp" type="tel" required maxlength="30"></label>',
    `<label>Thị trường${country}</label>`,
    leadFormSourceFields(website),
    website ? "" : leadFormCtvFields(),
    leadFormCampaignField(),
    '<label>Số khách<input name="pax" type="number" min="1" max="100" required></label>',
    '<label>Ngân sách nhóm (VND)<input name="budget" type="number" min="1000000" step="1000000" required></label>',
    salesField,
    `<label>Ngày chăm sóc tiếp theo<input name="followup" type="date" value="${crmNextBusinessDay()}" required></label>`,
    '<label class="full">Nhu cầu khách<textarea name="note" placeholder="Sở thích, điểm đến, yêu cầu đặc biệt…"></textarea></label>',
  ];
  const form = [
    `<form onsubmit="addLead(event,${website})">`,
    `<div class="formgrid">${fields.join("")}</div>`,
    `<div class="alert green" style="margin-top:18px">${notice}</div>`,
    '<div class="formfooter">',
    btn("Hủy", "closeModal()"),
    `<button class="btn primary" type="submit">${website ? "Tiếp nhận lead" : "Tạo lead"}</button>`,
    "</div>",
    "</form>",
  ].join("");
  modal(website ? "Tiếp nhận lead từ website" : "Thêm lead thủ công", form, true);
}

function normalizeCRMValue(v) {
  return String(v || "").trim().toLowerCase().replace(/[\s()-]/g, "");
}

function assignSales() {
  const counts = crmOwners.map((owner) => state.leads.filter((l) => l.sales === owner && leadIsOpen(l)).length);
  return crmOwners[counts.indexOf(Math.min(...counts))];
}

function addLead(e, website = false) {
  e.preventDefault();
  if (!requireCapability("crm_manage")) return;
  initializeCRM();
  const f = new FormData(e.target);
  const email = normalizeCRMValue(f.get("email"));
  const whatsapp = normalizeCRMValue(f.get("whatsapp"));
  const duplicate = state.leads.find(
    (l) => normalizeCRMValue(l.email) === email || normalizeCRMValue(l.whatsapp) === whatsapp,
  );
  if (duplicate) return toast(`Email hoặc WhatsApp đã tồn tại ở ${duplicate.id} (${duplicate.name}).`);
  const source = website ? leadSourceWebsite : f.get("source");
  const sourceInfo = leadSourceInfo(source);
  if (!sourceInfo) return toast("Nguồn lead không hợp lệ.");
  const isCtv = source === leadSourceCtv;
  const ctv = isCtv ? ctvFromForm(f, canManageCommission()) : null;
  if (ctv?.error) return toast(ctv.error);
  let sourceDetail = sourceInfo.detailLabel ? String(f.get("sourceDetail") || "").trim() : "";
  if (isCtv) sourceDetail = ctv.name;
  if (!isCtv && sourceInfo.detailRequired && !sourceDetail) {
    return toast(`Nhập ${sourceInfo.detailLabel.toLowerCase()}.`);
  }
  const id = nextBusinessId("leads");
  const sales = website ? assignSales() : f.get("sales");
  const createdAt = f.get("date") + "T08:00:00.000Z";
  const lead = {
      id,
      createdAt,
      name: f.get("name").trim(),
      email: f.get("email").trim(),
      whatsapp: f.get("whatsapp").trim(),
      country: f.get("country"),
      source,
      sourceDetail,
      ...ctvLeadFields(ctv),
      campaign: f.get("campaign") || "",
      pax: +f.get("pax"),
      budget: +f.get("budget"),
      sales,
      status: "NEW",
      note: f.get("note").trim(),
      tour: "",
      days: 0,
      start: "",
      followup: { dueDate: f.get("followup"), note: "Liên hệ lead mới qua Email/WhatsApp", status: "PENDING" },
      welcomeEmail: { status: website ? "SENT" : "NOT_SENT", sentAt: website ? crmDateTime() : "" },
      statusHistory: [{ status: "NEW", at: createdAt, by: actor().name, note: website ? "Tự động tạo từ website" : "Tạo thủ công" }],
    };
  state.leads.push(lead);
  if (!state.customers.some((c) => normalizeCRMValue(c.email) === email))
    state.customers.push({
      id: nextBusinessId("customers"),
      name: lead.name,
      contact: lead.name,
      company: "",
      country: lead.country,
      email: lead.email,
      whatsapp: lead.whatsapp,
      phone: lead.whatsapp,
      owner: sales,
      careLog: [],
    });
  audit("lead", id, "CREATE", `${website ? "Website tự động tạo" : "Tạo"} ${id} (${lead.name}), giao cho ${sales}`);
  closeModal();
  render();
  toast(`${website ? "Đã tiếp nhận" : "Đã tạo"} ${id}, giao cho ${sales}.`);
}

/* Tiêu đề hồ sơ lead: mã · nguồn (chi tiết) · thị trường. */
function crmProfileTitle(l, initials) {
  const avatar = `<span class="crm-profile-avatar">${esc(initials)}</span>`;
  const info = `${l.id} · ${esc(leadSourceText(l))} · ${esc(l.country)}`;
  return `<span class="crm-profile-title">${avatar}<span>${esc(l.name)}<small>${info}</small></span></span>`;
}

function leadDetail(id) {
  initializeCRM();
  const l = findLead(id);
  if (!l) return;
  const task = crmTask(l),
    email = l.welcomeEmail || { status: "NOT_SENT" };
  const initials = l.name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
  const quotes = state.quotes.filter((q) => q.lead === id);
  const bookings = state.bookings.filter((b) => b.lead === id);
  const customer = (state.customers || []).find((c) => normalizeCRMValue(c.email) === normalizeCRMValue(l.email) || c.name === l.name);
  const camp = findCampaign(l.campaign);
  const open = leadIsOpen(l);
  const footer =
    (can("crm_manage") && email.status !== "SENT" ? btn("Ghi nhận gửi email chào mừng", "sendWelcomeEmail('" + id + "')") : "") +
    (can("crm_manage") && open ? (task.status !== "DONE" ? btn("Hoàn thành việc chăm sóc", "completeFollowup('" + id + "')", "primary") : btn("Mở lại", "reopenFollowup('" + id + "')")) + btn("Đổi lịch", "followupForm('" + id + "')") : "") +
    (can("tour_design_manage") && open ? btn("Thiết kế tour & báo giá", `closeModal();go('design');selectLead('${l.id}')`, "primary") : "") +
    ctvFooterButton(l);
  const field = (label, value) => `<div class="crm-profile-field"><small>${label}</small><b>${value}</b></div>`;
  modal(
    crmProfileTitle(l, initials),
    `<div class="crm-profile">${journeyBar({ lead: l, quote: quotes[quotes.length - 1], booking: bookings[bookings.length - 1] })}<div class="crm-profile-summary"><div><small>Ngân sách</small><strong>${money(l.budget)}</strong></div><div><small>Trạng thái · điểm lead</small><strong>${leadBadge(l.status)} ${leadScoreBadge(l)}</strong></div><div><small>Sales phụ trách</small><strong>${esc(l.sales)}</strong></div><div><small>Chăm sóc tiếp theo</small><strong>${fmt(task.dueDate)}</strong></div></div><div class="crm-profile-content"><div><section class="crm-profile-section"><h3>Thông tin lead</h3><div class="crm-profile-fields">${field("Mã lead", l.id)}${crmCtvFields(l, field)}${field("Ngày tạo", fmt(l.createdAt.slice(0, 10)))}${field("Email", esc(l.email))}${field("WhatsApp", esc(l.whatsapp))}${field("Nguồn", esc(l.source))}${field("Chiến dịch", camp ? entityLink("campaign", camp.id, camp.name) : "—")}${field("Quốc gia", esc(l.country))}${field("Số khách", l.pax || "—")}${field("Khách hàng", customer ? entityLink("customer", customer.id, customer.name) : "—")}</div><p class="crm-profile-note">${esc(l.note || "Chưa có ghi chú.")}</p></section><section class="crm-profile-section"><h3>Lịch sử trạng thái</h3>${(l.statusHistory || []).map((h) => `<div class="metricline"><span>${leadBadge(h.status)}${h.note ? " · " + esc(h.note) : ""}${h.by ? ` <small class="sub">(${esc(h.by)})</small>` : ""}</span><small class="sub">${dateTimeVN(h.at)}</small></div>`).join("")}</section></div><div><section class="crm-profile-section"><h3>Chăm sóc</h3>${line("Email chào mừng", badge(email.status === "SENT" ? "Đã gửi" : "Chưa gửi", email.status === "SENT" ? "green" : "amber"))}${line("Việc chăm sóc", badge(task.status === "DONE" ? "Hoàn thành" : "Đang chờ", task.status === "DONE" ? "green" : "amber"))}${line("Hạn", fmt(task.dueDate))}<p class="crm-profile-note">${esc(task.note)}</p></section><section class="crm-profile-section"><h3>Báo giá & booking</h3>${quotes.map((q) => `<div class="metricline"><span>${entityLink("quote", q.id)} · v${q.version} ${quoteBadge(q.status)}</span><b>${fxMoneyOf(q, q.amount)}</b></div>`).join("") || '<p class="sub">Chưa có báo giá.</p>'}${bookings.map((b) => `<div class="metricline"><span>${entityLink("booking", b.id)} ${bookingBadge(b)}</span><b>${fmt(b.start)}</b></div>`).join("")}</section></div></div><div class="crm-profile-footer">${footer}</div></div>`,
  );
}

function sendWelcomeEmail(id) {
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id);
  l.welcomeEmail = { status: "SENT", sentAt: crmDateTime() };
  audit("lead", id, "EMAIL", `${id} ghi nhận đã gửi email chào mừng`);
  leadDetail(id);
  toast("Đã ghi nhận gửi email chào mừng.");
}

function completeFollowup(id) {
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id);
  l.followup = { ...crmTask(l), status: "DONE", completedAt: crmDateTime() };
  audit("lead", id, "FOLLOWUP", `${id} hoàn thành việc chăm sóc`);
  if (document.querySelector(".modal .crm-profile")) leadDetail(id);
  else render();
  toast("Đã hoàn thành việc chăm sóc. Hãy đặt lịch tiếp theo nếu cần.");
}

function reopenFollowup(id) {
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id);
  l.followup = { ...crmTask(l), status: "PENDING" };
  delete l.followup.completedAt;
  audit("lead", id, "FOLLOWUP", `${id} mở lại việc chăm sóc`);
  leadDetail(id);
}

function followupForm(id) {
  const l = findLead(id),
    task = crmTask(l);
  modal(
    "Đổi lịch chăm sóc · " + id,
    `<form onsubmit="saveFollowup(event,'${id}')"><label>Ngày đến hạn<input name="date" type="date" value="${task.dueDate}" required></label><label>Nội dung<textarea name="note" required maxlength="300">${esc(task.note)}</textarea></label><div class="formfooter">${btn("Hủy", "leadDetail('" + id + "')")}<button class="btn primary" type="submit">Lưu</button></div></form>`,
    true,
  );
}

function saveFollowup(e, id) {
  e.preventDefault();
  if (!requireCapability("crm_manage")) return;
  const l = findLead(id),
    f = new FormData(e.target);
  l.followup = { dueDate: f.get("date"), note: f.get("note").trim(), status: "PENDING" };
  audit("lead", id, "FOLLOWUP", `${id} đặt lịch chăm sóc ${fmt(f.get("date"))}`);
  leadDetail(id);
  toast("Đã cập nhật lịch chăm sóc.");
}

function exportCRMLeads() {
  initializeCRM();
  const headers = [
    "Mã lead",
    "Ngày",
    "Nguồn",
    "Chi tiết nguồn",
    "Chiến dịch",
    "Quốc gia",
    "Họ tên",
    "Email",
    "WhatsApp",
    "Ngân sách",
    "Trạng thái",
    "Sales",
  ];
  const rows = crmFilteredLeads().map((l) => [
    l.id,
    l.createdAt.slice(0, 10),
    l.source,
    l.sourceDetail || "",
    findCampaign(l.campaign)?.name || "",
    l.country,
    l.name,
    l.email,
    l.whatsapp,
    l.budget,
    leadLabels[l.status],
    l.sales,
  ]);
  const cell = (x) => '"' + String(x).replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
  const lines = [headers, ...rows].map((r) => r.map(cell).join(","));
  downloadFile("TypicOne_Leads.csv", "\ufeff" + lines.join("\r\n"), "text/csv;charset=utf-8");
  toast("Đã xuất danh sách lead.");
}

function salesContent(owner) {
  const ls = scopedLeads().filter((l) => owner === "all" || l.sales === owner),
    bs = state.bookings.filter((b) => b.status !== "Cancelled" && (owner === "all" || b.sales === owner)),
    qs = state.quotes.filter((q) => ls.some((l) => l.id === q.lead)),
    pending = ls.filter((l) => leadIsOpen(l) && crmTask(l).status === "PENDING"),
    overdue = pending.filter((l) => crmTask(l).dueDate < crmToday());
  const showMoney = can("sales_financials") || can("all");
  return (
    `<div class="stats">${stat("LEAD", ls.length, "Khách đang theo dõi")}${stat("BÁO GIÁ", qs.length, qs.filter((q) => q.status === "Accepted").length + " được chấp nhận")}${stat("THÀNH CÔNG / THẤT BẠI", ls.filter((l) => l.status === "WON").length + " / " + ls.filter((l) => l.status === "LOST").length, "Kết quả bán hàng")}${stat("QUÁ HẠN CHĂM SÓC", overdue.length, "Cần xử lý")}${showMoney ? stat("DOANH THU BOOKING", fxLedgerShort(fxLedgerTotal(bs, (b) => b, (b) => b.revenue)), "Giá trị hợp đồng") + stat("LỢI NHUẬN DỰ KIẾN", fxLedgerShort(fxLedgerTotal(bs, (b) => b, (b) => b.revenue - b.cost)), "Theo chi phí dự toán") : ""}</div>` +
    card(
      "Việc chăm sóc đang chờ",
      pending.length
        ? table(
            ["LEAD", "SALES", "TRẠNG THÁI", "HẠN", "TÌNH TRẠNG"],
            pending.sort((a, b) => crmTask(a).dueDate.localeCompare(crmTask(b).dueDate)).map((l) => {
              const t = crmTask(l);
              return `<tr><td>${entityLink("lead", l.id, l.name)}</td><td>${esc(l.sales)}</td><td>${leadBadge(l.status)}</td><td>${fmt(t.dueDate)}</td><td>${badge(t.dueDate < crmToday() ? "Quá hạn" : "Đang chờ", t.dueDate < crmToday() ? "red" : "amber")}</td></tr>`;
            }),
          )
        : '<div class="empty">Không có việc chăm sóc nào đang chờ.</div>',
    ) +
    card(
      "Tiến độ thu tiền sau khi chốt",
      bs.length
        ? table(
            ["BOOKING", "KHÁCH", "TRẠNG THÁI", "THANH TOÁN", ...(showMoney ? ["ĐÃ THU / GIÁ TRỊ"] : [])],
            bs.map((b) => `<tr><td>${entityLink("booking", b.id)}</td><td>${customerLink(b.client)}</td><td>${bookingBadge(b)}</td><td>${paymentBadge(b)}</td>${showMoney ? `<td>${fxLedgerMoney(b, b.received || 0)} / ${fxLedgerMoney(b, b.revenue)}</td>` : ""}</tr>`),
          )
        : '<div class="empty">Chưa có booking.</div>',
    )
  );
}
