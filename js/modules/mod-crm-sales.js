/* MODULE mod-crm-sales — giao diện và nghiệp vụ riêng của CRM Sales. */

let salesOwner = "all",
  crmStatus = "all",
  crmSource = "all",
  crmOwner = "all";

function injectCRMFrontendStyles() {
  if (
    typeof document === "undefined" ||
    document.getElementById("crm-sales-ui")
  )
    return;
  let style = document.createElement("style");
  style.id = "crm-sales-ui";
  style.textContent = `
        body main #crm-sales{--crm-shadow:0 8px 24px rgba(20,43,43,.055)}
        body main #crm-sales .pagetop{margin-bottom:16px}
        body main #crm-sales .pagetop h1{font-size:26px;margin:3px 0}
        body main #crm-sales .pagetop p{max-width:680px}
        body main #crm-sales>.stats{gap:12px;margin-bottom:14px}
        body main #crm-sales>.stats .stat{padding:14px 16px;border-color:#dfe7df;box-shadow:var(--crm-shadow)}
        body main #crm-sales>.stats .stat strong{font-size:22px;margin:4px 0}
        body main #crm-sales .crmsection{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;box-shadow:var(--crm-shadow)}
        body main #crm-sales .crmsectionhead{align-items:center;margin-bottom:12px}
        body main #crm-sales .crmsectionhead h2{font-size:16px;letter-spacing:-.15px}
        body main #crm-sales .crmsectionhead p{font-size:11px;margin-top:2px}
        body main #crm-sales .crmflow{gap:8px;margin:0}
        body main #crm-sales .crmstep{min-height:74px;padding:11px 13px;border-radius:8px;background:#f8faf7}
        body main #crm-sales .crmstep:not(:last-child):after{top:25px}
        body main #crm-sales .crmstep small{font-size:9px;margin-bottom:4px;letter-spacing:.45px}
        body main #crm-sales .crmstep b{font-size:12px}
        body main #crm-sales .crmstatus{font-size:10px;margin-top:3px}
        body main #crm-sales .filters{padding:10px;background:#f7f9f5;border:1px solid #e6ebe4;border-radius:9px;margin-bottom:10px;gap:8px}
        body main #crm-sales .filters input,body main #crm-sales .filters select{padding:8px 10px;background:#fff}
        body main #crm-sales .crmsection>.card,body main #crm-sales #crmtable>.card,body main #crm-sales #crmtasks>.card{padding:0;border:0;border-radius:0;margin:0;box-shadow:none}
        body main #crm-sales .cardhead:has(+.tablewrap):has(h3:empty){display:none}
        body main #crm-sales .tablewrap{border:1px solid #e7ece5;border-radius:9px}
        body main #crm-sales table{table-layout:auto}
        body main #crm-sales th{padding:9px 10px;background:#f5f8f3;color:#5f7166}
        body main #crm-sales td{padding:10px;font-size:11px;vertical-align:middle}
        body main #crm-sales tbody tr{transition:background-color .15s ease}
        body main #crm-sales tbody tr:hover{background:#f8fbf7}
        body main #crm-sales td .btn.small{min-height:30px;white-space:nowrap}
        body main #crm-sales .kanban{gap:9px;padding:2px 0 5px}
        body main #crm-sales .column{min-height:235px;padding:9px;border:1px solid #e3e9e1;background:#f1f4ee}
        body main #crm-sales .columnhead{margin-bottom:8px}
        body main #crm-sales .lead{padding:11px;margin-bottom:7px;box-shadow:0 2px 8px rgba(20,43,43,.035)}
        body main #crm-sales .lead p{margin:5px 0;line-height:1.45}
        body main #crm-sales .lead select{margin-top:7px}
        body main #crm-sales>.notice{margin:12px 2px 0}
        body .modal:has(form[onsubmit^="addLead"]),body .modal:has(form[onsubmit^="saveFollowup"]){width:min(680px,100%)}
        body .modal form[onsubmit^="addLead"] .formgrid{gap:11px 14px}
        body .modal form[onsubmit^="addLead"] label{margin-bottom:0}
        body .modal form[onsubmit^="addLead"] input,body .modal form[onsubmit^="addLead"] select,body .modal form[onsubmit^="addLead"] textarea{padding:9px 10px;margin-top:4px}
        body .modalback:has(.crm-profile){align-items:stretch;padding:0}
        body .modal:has(.crm-profile){position:relative;width:min(680px,calc(100% - 24px));height:100%;max-height:none;padding:0;background:#fff;border-radius:0;overflow:auto}
        body .modal:has(.crm-profile) .modalhead{position:sticky;top:0;z-index:5;margin:0;padding:18px 24px;background:#fff;border-bottom:1px solid var(--line);align-items:center}
        body .modal:has(.crm-profile) .modalhead .eyebrow{display:none}
        body .modal:has(.crm-profile) .modalhead h2{display:flex;align-items:center;gap:12px;margin:0;font-size:18px}
        body .modal:has(.crm-profile) .close{width:40px;height:40px;border-radius:10px}
        body .crm-profile-title{display:flex;align-items:center;gap:12px}
        body .crm-profile-avatar{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#226d53,#4a9274);color:#fff;font-size:15px;font-weight:800;box-shadow:0 7px 18px rgba(34,109,83,.22)}
        body .crm-profile-title>span:last-child{display:flex;flex-direction:column;gap:2px}
        body .crm-profile-title small{font-size:11px;color:var(--muted);font-weight:550}
        body .crm-profile{padding:18px 20px 80px}
        body .crm-profile-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:18px}
        body .crm-profile-summary>div{border:1px solid #dfe7df;border-radius:9px;padding:10px 11px;background:#fbfcfa}
        body .crm-profile-summary small{display:block;color:var(--muted);font-size:10px;margin-bottom:4px}
        body .crm-profile-summary strong{font-size:14px;color:var(--ink)}
        body .crm-profile-content{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(245px,.92fr);gap:18px}
        body .crm-profile-section{margin-bottom:22px}
        body .crm-profile-section h3{margin:0;padding:0 0 9px;border-bottom:1px solid var(--line);font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:#718277}
        body .crm-profile-fields{display:grid;grid-template-columns:1fr 1fr;column-gap:28px}
        body .crm-profile-field{padding:10px 0;border-bottom:1px solid #edf0ea}
        body .crm-profile-field small{display:block;color:#88958e;font-size:9px;text-transform:uppercase;letter-spacing:.55px;margin-bottom:3px}
        body .crm-profile-field b{font-size:12px;overflow-wrap:anywhere}
        body .crm-profile-note{margin:12px 0 0;padding:11px 13px;background:#f5f8f3;border-left:3px solid var(--green);border-radius:0 7px 7px 0;font-size:12px}
        body .crm-profile .metricline{padding:9px 0}
        body .crm-profile .metricline span,body .crm-profile .metricline b{font-size:11px}
        body .crm-profile-footer{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:13px 24px;background:#f8faf7;border-top:1px solid var(--line)}
        body .crm-profile-footer .btn{min-height:38px}
        body #overlay:has(.crm-profile)+#toast .toast{left:auto;right:24px;bottom:82px;transform:none;max-width:min(420px,calc(100vw - 48px))}
        @media(max-width:1100px){body main #crm-sales .crmflow{grid-template-columns:repeat(3,1fr)}body main #crm-sales .crmstep:after{display:none}}
        @media(max-width:760px){body main #crm-sales .pagetop{gap:10px}body main #crm-sales .pagetop .actions{width:100%}body main #crm-sales .pagetop .btn{flex:1}body main #crm-sales>.stats{grid-template-columns:repeat(2,1fr)}body main #crm-sales .crmsection{padding:13px;margin-top:11px}body main #crm-sales .crmsectionhead{align-items:flex-start}body main #crm-sales .crmflow{grid-template-columns:1fr 1fr}body main #crm-sales #crmtable th:nth-child(2),body main #crm-sales #crmtable td:nth-child(2),body main #crm-sales #crmtable th:nth-child(5),body main #crm-sales #crmtable td:nth-child(5),body main #crm-sales #crmtable th:nth-child(7),body main #crm-sales #crmtable td:nth-child(7){display:none}body .modalback:has(.crm-profile){align-items:stretch;padding:0}body .modal:has(.crm-profile){width:100%;height:100%;max-height:none;border-radius:0}body .crm-profile{padding:16px 16px 96px}body .crm-profile-content{grid-template-columns:1fr;gap:0}body .crm-profile-summary{grid-template-columns:1fr 1fr}body .crm-profile-footer{padding:10px 16px}body .crm-profile-footer .btn{flex:1}body #overlay:has(.crm-profile)+#toast .toast{right:16px;bottom:118px;max-width:calc(100vw - 32px)}}
        @media(max-width:480px){body main #crm-sales .crmflow{grid-template-columns:1fr}body main #crm-sales>.stats{grid-template-columns:1fr 1fr}body main #crm-sales .filters>*{width:100%;max-width:none}body main #crm-sales #crmtable th:nth-child(4),body main #crm-sales #crmtable td:nth-child(4){display:none}}
        @media(min-width:561px) and (max-width:760px){body .modal:has(.crm-profile){width:min(680px,calc(100% - 24px))}}
        @media(prefers-reduced-motion:reduce){body main #crm-sales tbody tr{transition:none}}
    `;
  document.head.appendChild(style);
}

injectCRMFrontendStyles();
const crmToday = () => new Date().toLocaleDateString("en-CA");
const crmDateTime = () => new Date().toISOString();
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
function initializeCRMLead(l, index) {
  if (!l.createdAt) l.createdAt = crmDateTime();
  if (!l.whatsapp) l.whatsapp = "";
  l.followup = crmTask(l);
  if (!l.welcomeEmail) l.welcomeEmail = { status: "NOT_SENT", sentAt: "" };
  if (!l.statusHistory)
    l.statusHistory = [
      { status: l.status, at: l.createdAt, note: "Dữ liệu CRM ban đầu" },
    ];
  return l;
}
function initializeCRM() {
  let changed = false;
  state.leads.forEach((lead, index) => {
    let previous = JSON.stringify(lead);
    initializeCRMLead(lead, index);
    if (JSON.stringify(lead) !== previous) changed = true;
  });
  if (changed) save();
}

function crmFilteredLeads() {
  initializeCRM();
  let q = crmSearch.toLowerCase();
  return state.leads.filter(
    (l) =>
      (!q ||
        [l.name, l.id, l.sales, l.email, l.whatsapp]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (crmStatus === "all" || l.status === crmStatus) &&
      (crmSource === "all" || l.source === crmSource) &&
      (crmOwner === "all" || l.sales === crmOwner),
  );
}

views.crm = () => {
  let ls = crmFilteredLeads(),
    tasks = state.leads.map((l) => crmTask(l)),
    overdue = tasks.filter(
      (t) => t.status === "PENDING" && t.dueDate < crmToday(),
    ).length,
    today = tasks.filter(
      (t) => t.status === "PENDING" && t.dueDate === crmToday(),
    ).length,
    conversion = state.leads.length
      ? Math.round(
          (state.leads.filter((l) => l.status === "WON").length /
            state.leads.length) *
            100,
        )
      : 0;
  return `<div id="crm-sales"><style>#crm-sales .crmflow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:0 0 22px}#crm-sales .crmstep{background:#fff;border:1px solid #dbe6df;border-radius:12px;padding:16px;min-height:92px;position:relative}#crm-sales .crmstep:not(:last-child):after{content:'→';position:absolute;right:-10px;top:34px;z-index:2;color:#598771;font-weight:800}#crm-sales .crmstep small{display:block;color:#598771;font-weight:800;margin-bottom:7px}#crm-sales .crmstep b{font-size:14px}#crm-sales .crmstatus{display:block;margin-top:7px;color:#718275;font-size:12px}#crm-sales .crmsection{margin-top:22px}#crm-sales .crmsectionhead{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:12px}#crm-sales .crmsectionhead h2{margin:0;font-size:20px}#crm-sales .crmsectionhead p{margin:3px 0 0;color:#718275}#crm-sales .task-overdue{color:#a13b32;font-weight:700}@media(max-width:900px){#crm-sales .crmflow{grid-template-columns:1fr 1fr}#crm-sales .crmstep:after{display:none}}@media(max-width:560px){#crm-sales .crmflow{grid-template-columns:1fr}}</style>${title("CRM Sales Workspace", "Quản lý Lead, automation và công việc Sales trong một màn hình.", btn("+ Lead thủ công", "leadForm()") + btn("Nhận Lead Website", "websiteLeadForm()", "primary"))}<div class="stats">${stat("TỔNG LEADS", state.leads.length, "Tất cả nguồn")}${stat("ĐANG MỞ", state.leads.filter((l) => !["WON", "LOST"].includes(l.status)).length, "Cơ hội cần chăm sóc")}${stat("TỶ LỆ WON", conversion + "%", "Lead đã chốt")}${stat("FOLLOW-UP QUÁ HẠN", overdue, "Cần xử lý ngay")}</div>${crmAutomationPanel()}<section class="crmsection"><div class="crmsectionhead"><div><h2>Danh sách Leads</h2><p>Đủ 10 trường theo yêu cầu khách hàng · ${ls.length} kết quả</p></div>${btn("Xuất CSV", "exportCRMLeads()")}</div><div class="filters"><input placeholder="Tìm tên, mã, email, WhatsApp, Sales…" value="${esc(crmSearch)}" oninput="crmSearch=this.value;refreshLeads()" aria-label="Tìm lead"><select aria-label="Lọc trạng thái" onchange="crmStatus=this.value;refreshLeads()"><option value="all">Mọi trạng thái</option>${stages.map((x) => `<option ${crmStatus === x ? "selected" : ""}>${x}</option>`).join("")}</select><select aria-label="Lọc nguồn lead" onchange="crmSource=this.value;refreshLeads()"><option value="all">Mọi nguồn</option>${[...new Set(state.leads.map((l) => l.source))].map((x) => `<option ${crmSource === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select><select aria-label="Lọc Sales Owner" onchange="crmOwner=this.value;refreshLeads()"><option value="all">Mọi Sales</option>${crmOwners.map((x) => `<option ${crmOwner === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div id="crmtable">${crmLeadTable(ls)}</div></section><section class="crmsection"><div class="crmsectionhead"><div><h2>Pipeline bán hàng</h2><p>Workflow được kiểm soát theo đúng thứ tự</p></div></div><div id="leadboard">${leadboard(ls)}</div></section><section class="crmsection"><div class="crmsectionhead"><div><h2>Trung tâm Follow-up</h2><p>${today} task hôm nay · ${overdue} task quá hạn</p></div></div><div id="crmtasks">${crmFollowupTable(ls)}</div></section><div class="notice">Welcome Email đang được ghi nhận mô phỏng vì demo chưa có backend gửi thư. Các bước tạo Lead, chống trùng, phân Sales và Task Follow-up hoạt động trên dữ liệu CRM hiện tại.</div></div>`;
};

function crmAutomationPanel() {
  return `<section class="crmsection"><div class="crmsectionhead"><div><h2>Website Lead Automation</h2><p>Luồng tự động đang áp dụng khi nhận Lead từ Website</p></div>${badge("ACTIVE", "green")}</div><div class="crmflow"><div class="crmstep"><small>01 · INTAKE</small><b>Lead Website</b><span class="crmstatus">Form tiếp nhận riêng</span></div><div class="crmstep"><small>02 · VALIDATE</small><b>Auto Create Lead</b><span class="crmstatus">Chống trùng Email/WhatsApp</span></div><div class="crmstep"><small>03 · ROUTING</small><b>Assign Sales</b><span class="crmstatus">Phân luân phiên 2 Sales</span></div><div class="crmstep"><small>04 · ENGAGE</small><b>Email Welcome</b><span class="crmstatus">Ghi nhận trạng thái gửi</span></div><div class="crmstep"><small>05 · ACTION</small><b>Task Follow-up</b><span class="crmstatus">Hạn ngày làm việc tiếp theo</span></div></div></section>`;
}

function crmLeadTable(ls) {
  return card(
    "",
    table(
      [
        "LEAD ID / DATE",
        "SOURCE / COUNTRY",
        "NAME",
        "EMAIL / WHATSAPP",
        "BUDGET",
        "STATUS",
        "SALES OWNER",
        "THAO TÁC",
      ],
      ls.map(
        (l) =>
          `<tr><td><b>${l.id}</b><span class="sub">${fmt(l.createdAt.slice(0, 10))}</span></td><td>${esc(l.source)}<span class="sub">${esc(l.country)}</span></td><td><b>${esc(l.name)}</b></td><td>${esc(l.email)}<span class="sub">${esc(l.whatsapp)}</span></td><td>${money(l.budget)}</td><td>${badge(l.status, l.status === "WON" ? "green" : l.status === "LOST" ? "red" : "amber")}</td><td>${esc(l.sales)}</td><td>${btn("Mở hồ sơ", "leadDetail('" + l.id + "')", "small")}</td></tr>`,
      ),
    ),
  );
}

function crmFollowupTable(ls) {
  let pending = ls
    .filter((l) => crmTask(l).status === "PENDING")
    .sort((a, b) => crmTask(a).dueDate.localeCompare(crmTask(b).dueDate));
  return pending.length
    ? card(
        "",
        table(
          [
            "LEAD",
            "SALES OWNER",
            "NỘI DUNG TASK",
            "HẠN",
            "TRẠNG THÁI",
            "THAO TÁC",
          ],
          pending.map((l) => {
            let t = crmTask(l),
              late = t.dueDate < crmToday();
            return `<tr><td><b>${esc(l.name)}</b><span class="sub">${l.id}</span></td><td>${esc(l.sales)}</td><td style="white-space:normal">${esc(t.note)}</td><td class="${late ? "task-overdue" : ""}">${fmt(t.dueDate)}</td><td>${badge(late ? "QUÁ HẠN" : t.dueDate === crmToday() ? "HÔM NAY" : "SẮP TỚI", late ? "red" : "amber")}</td><td>${btn("Hoàn thành", "completeFollowup('" + l.id + "')", "small")}</td></tr>`;
          }),
        ),
      )
    : '<div class="empty">Không có task follow-up đang chờ.</div>';
}

function leadboard(ls) {
  let cols =
    can("crm_manage")
      ? stages.filter((s) => s !== "LOST")
      : ["NEW", "CONTACTED", "QUALIFIED"];
  return (
    '<div class="kanban">' +
    cols
      .map(
        (s) =>
          '<div class="column"><div class="columnhead">' +
          s +
          " <span>" +
          ls.filter((l) => l.status === s).length +
          "</span></div>" +
          ls
            .filter((l) => l.status === s)
            .map((l) => {
              let task = crmTask(l),
                taskLabel =
                  task.status === "DONE"
                    ? "Đã follow-up"
                    : task.dueDate < crmToday()
                      ? "Quá hạn " + fmt(task.dueDate)
                      : "Hẹn " + fmt(task.dueDate);
              return (
                '<div class="lead"><button class="link" onclick="leadDetail(\'' +
                l.id +
                "')\">" +
                esc(l.name) +
                "</button><p>" +
                l.id +
                " · " +
                fmt(l.createdAt.slice(0, 10)) +
                " · " +
                esc(l.country) +
                '</p><div class="price">' +
                short(l.budget) +
                "</div><p>" +
                esc(l.source) +
                "<br>" +
                esc(l.sales) +
                " · " +
                esc(taskLabel) +
                "</p>" +
                (can("crm_manage") ? leadStageSelect(l) : "") +
                "</div>"
              );
            })
            .join("") +
          "</div>",
      )
      .join("") +
    "</div>" +
    (ls.filter((l) => l.status === "LOST").length
      ? '<div class="notice">Đã mất: ' +
        ls
          .filter((l) => l.status === "LOST")
          .map(
            (l) =>
              esc(l.name) + (l.lostReason ? " — " + esc(l.lostReason) : ""),
          )
          .join(", ") +
        "</div>"
      : "")
  );
}
function leadStageSelect(l) {
  let next = {
      NEW: "CONTACTED",
      CONTACTED: "QUALIFIED",
      "QUOTE SENT": "NEGOTIATION",
    }[l.status],
    options = [l.status];
  if (next) options.push(next);
  if (!["WON", "LOST"].includes(l.status)) options.push("LOST");
  return (
    '<select aria-label="Trạng thái lead ' +
    l.id +
    '" onchange="setLeadStage(\'' +
    l.id +
    "',this.value)\">" +
    [...new Set(options)]
      .map(
        (x) =>
          "<option " +
          (l.status === x ? "selected" : "") +
          ">" +
          x +
          "</option>",
      )
      .join("") +
    "</select>"
  );
}
function refreshLeads() {
  let ls = crmFilteredLeads(),
    board = document.getElementById("leadboard"),
    leadTable = document.getElementById("crmtable"),
    tasks = document.getElementById("crmtasks");
  if (board) board.innerHTML = leadboard(ls);
  if (leadTable) leadTable.innerHTML = crmLeadTable(ls);
  if (tasks) tasks.innerHTML = crmFollowupTable(ls);
}

function setLeadStage(id, status) {
  let l = state.leads.find((x) => x.id === id),
    allowed =
      {
        NEW: ["CONTACTED", "LOST"],
        CONTACTED: ["QUALIFIED", "LOST"],
        QUALIFIED: ["LOST"],
        "QUOTE SENT": ["NEGOTIATION", "LOST"],
        NEGOTIATION: ["LOST"],
      }[l.status] || [];
  if (status === l.status) return;
  if (!allowed.includes(status)) {
    toast(
      status === "WON"
        ? "WON chỉ được tạo khi khách chấp nhận báo giá."
        : "Hãy thực hiện đúng thứ tự workflow.",
    );
    render();
    return;
  }
  if (status === "LOST") {
    lostLeadForm(id);
    return;
  }
  updateLeadStatus(l, status);
}
function updateLeadStatus(l, status, note = "") {
  l.status = status;
  l.statusHistory = l.statusHistory || [];
  l.statusHistory.unshift({ status, at: crmDateTime(), note });
  log(l.id + " chuyển sang " + status);
  render();
  toast("Đã chuyển " + l.id + " sang " + status + ".");
}
function lostLeadForm(id) {
  modal(
    "Đánh dấu Lead đã mất",
    `<form onsubmit="saveLostLead(event,'${id}')"><label>Lý do mất Lead<textarea name="reason" required maxlength="300" placeholder="Ví dụ: Ngân sách chưa phù hợp"></textarea></label><div class="formfooter">${btn("Hủy", "closeModal()")}<button class="btn danger" type="submit">Xác nhận LOST</button></div></form>`,
    true,
  );
}
function saveLostLead(e, id) {
  e.preventDefault();
  let l = state.leads.find((x) => x.id === id),
    reason = new FormData(e.target).get("reason").trim();
  l.lostReason = reason;
  closeModal();
  updateLeadStatus(l, "LOST", reason);
}

function leadForm() {
  leadEntryForm(false);
}
function websiteLeadForm() {
  leadEntryForm(true);
}
function leadEntryForm(website) {
  const options = (values) =>
    values.map((value) => `<option>${esc(value)}</option>`).join("");
  modal(
    website ? "Tiếp nhận Lead Website" : "Thêm Lead thủ công",
    `<form onsubmit="addLead(event,${website})"><div class="formgrid"><label>Ngày tạo<input name="date" type="date" value="${crmToday()}" required></label><label>Họ tên khách<input name="name" required maxlength="100"></label><label>Email<input name="email" type="email" required></label><label>WhatsApp<input name="whatsapp" type="tel" required maxlength="30"></label><label>Thị trường<select name="country" required><option value="">Chọn thị trường</option>${options(crmCountries)}</select></label><label>Nguồn lead<select name="source" ${website ? "disabled" : ""}>${options(website ? ["Website"] : crmLeadSources)}</select></label><label>Số khách<input name="pax" type="number" min="1" max="100" required></label><label>Ngân sách nhóm (VND)<input name="budget" type="number" min="1000000" step="1000000" required></label>${website ? '<label>Sales Owner<input value="Tự động phân luân phiên" disabled></label>' : '<label>Sales Owner<select name="sales">' + options(crmOwners) + "</select></label>"}<label>Ngày follow-up<input name="followup" type="date" value="${crmNextBusinessDay()}" required></label><label class="full">Nhu cầu khách<textarea name="note" placeholder="Sở thích, điểm đến, yêu cầu đặc biệt…"></textarea></label></div><div class="alert green" style="margin-top:18px">${website ? "Automation sẽ tạo Lead, phân Sales, ghi nhận Welcome Email và tạo Task Follow-up." : "Lead được tạo ở trạng thái NEW và có Task Follow-up."}</div><div class="formfooter">${btn("Hủy", "closeModal()")}<button class="btn primary" type="submit">${website ? "Chạy automation" : "Tạo Lead"}</button></div></form>`,
    true,
  );
}

function normalizeCRMValue(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[\s()-]/g, "");
}
function nextLeadId() {
  let max = state.leads.reduce(
    (n, l) => Math.max(n, parseInt(String(l.id).replace(/\D/g, "")) || 0),
    0,
  );
  return "LD-" + String(max + 1).padStart(3, "0");
}
function assignSales() {
  let counts = crmOwners.map(
      (owner) => state.leads.filter((l) => l.sales === owner).length,
    ),
    min = Math.min(...counts);
  return crmOwners[counts.indexOf(min)];
}
function addLead(e, website = false) {
  e.preventDefault();
  initializeCRM();
  let f = new FormData(e.target),
    email = normalizeCRMValue(f.get("email")),
    whatsapp = normalizeCRMValue(f.get("whatsapp")),
    duplicate = state.leads.find(
      (l) =>
        normalizeCRMValue(l.email) === email ||
        normalizeCRMValue(l.whatsapp) === whatsapp,
    );
  if (duplicate) {
    toast("Email hoặc WhatsApp đã tồn tại ở " + duplicate.id + ".");
    return;
  }
  let id = nextLeadId(),
    sales = website ? assignSales() : f.get("sales"),
    createdAt = f.get("date") + "T08:00:00.000Z",
    lead = {
      id,
      createdAt,
      name: f.get("name").trim(),
      email: f.get("email").trim(),
      whatsapp: f.get("whatsapp").trim(),
      country: f.get("country"),
      source: website ? "Website" : f.get("source"),
      pax: +f.get("pax"),
      budget: +f.get("budget"),
      sales,
      status: "NEW",
      note: f.get("note").trim(),
      tour: "",
      days: 0,
      start: "",
      followup: {
        dueDate: f.get("followup"),
        note: "Liên hệ lead mới qua Email/WhatsApp",
        status: "PENDING",
      },
      welcomeEmail: {
        status: website ? "SENT" : "NOT_SENT",
        sentAt: website ? crmDateTime() : "",
      },
      statusHistory: [
        {
          status: "NEW",
          at: createdAt,
          note: website ? "Tự động tạo từ Website" : "Tạo thủ công",
        },
      ],
    };
  state.leads.push(lead);
  if (!state.customers.some((c) => normalizeCRMValue(c.email) === email))
    state.customers.push({
      id: "CUS-" + id,
      name: lead.name,
      contact: lead.name,
      company: "",
      country: lead.country,
      email: lead.email,
      whatsapp: lead.whatsapp,
      phone: "Chưa nhập",
    });
  log(
    (website ? "Website tự động tạo " : "Tạo ") + id + " và giao cho " + sales,
  );
  closeModal();
  render();
  toast(
    (website ? "Automation hoàn tất: " : "Đã tạo ") +
      id +
      ", Sales " +
      sales +
      ".",
  );
}

function leadDetail(id) {
  initializeCRM();
  let l = state.leads.find((x) => x.id === id),
    task = crmTask(l),
    email = l.welcomeEmail || { status: "NOT_SENT" };
  let initials = l.name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  let quotes = state.quotes.filter((q) => q.lead === id);
  let footer =
    (email.status !== "SENT"
      ? btn("Ghi nhận gửi Welcome Email", "sendWelcomeEmail('" + id + "')")
      : "") +
    (task.status !== "DONE"
      ? btn("Hoàn thành Follow-up", "completeFollowup('" + id + "')", "primary")
      : btn("Mở lại Follow-up", "reopenFollowup('" + id + "')")) +
    btn("Đổi lịch", "followupForm('" + id + "')") +
    (can("crm_manage") && l.status !== "WON" && l.status !== "LOST"
      ? btn(
          "Thiết kế tour & tạo báo giá",
          "closeModal();go('design');selectLead('" + l.id + "')",
          "primary",
        )
      : "");
  let field = (label, value) =>
    `<div class="crm-profile-field"><small>${label}</small><b>${value}</b></div>`;
  modal(
    `<span class="crm-profile-title"><span class="crm-profile-avatar">${esc(initials)}</span><span>${esc(l.name)}<small>${l.id} · ${esc(l.source)} · ${esc(l.country)}</small></span></span>`,
    `<div class="crm-profile"><div class="crm-profile-summary"><div><small>Ngân sách</small><strong>${money(l.budget)}</strong></div><div><small>Trạng thái</small><strong>${badge(l.status, l.status === "WON" ? "green" : l.status === "LOST" ? "red" : "amber")}</strong></div><div><small>Sales Owner</small><strong>${esc(l.sales)}</strong></div><div><small>Follow-up</small><strong>${fmt(task.dueDate)}</strong></div></div><div class="crm-profile-content"><div><section class="crm-profile-section"><h3>Thông tin Lead</h3><div class="crm-profile-fields">${field("Lead ID", l.id)}${field("Ngày tạo", fmt(l.createdAt.slice(0, 10)))}${field("Email", esc(l.email))}${field("WhatsApp", esc(l.whatsapp))}${field("Nguồn", esc(l.source))}${field("Quốc gia", esc(l.country))}</div><p class="crm-profile-note">${esc(l.note || "Chưa có ghi chú.")}</p></section><section class="crm-profile-section"><h3>Lịch sử trạng thái</h3>${(l.statusHistory || []).map((h) => `<div class="metricline"><span>${badge(h.status)}${h.note ? " · " + esc(h.note) : ""}</span><small class="sub">${new Date(h.at).toLocaleString("vi-VN")}</small></div>`).join("")}</section></div><div><section class="crm-profile-section"><h3>Automation</h3>${line("Welcome Email", badge(email.status, email.status === "SENT" ? "green" : "amber"))}${line("Task Follow-up", badge(task.status, task.status === "DONE" ? "green" : "amber"))}${line("Ngày đến hạn", fmt(task.dueDate))}<p class="crm-profile-note">${esc(task.note)}</p></section><section class="crm-profile-section"><h3>Báo giá liên quan</h3>${quotes.map((q) => `<div class="metricline"><span>${q.id} · v${q.version}</span><b>${money(q.amount)}</b></div>`).join("") || '<p class="sub">Chưa có báo giá.</p>'}</section></div></div><div class="crm-profile-footer">${footer}</div></div>`,
  );
}

function sendWelcomeEmail(id) {
  let l = state.leads.find((x) => x.id === id);
  l.welcomeEmail = { status: "SENT", sentAt: crmDateTime() };
  log(id + " ghi nhận Welcome Email đã gửi (mô phỏng)");
  leadDetail(id);
  toast("Đã ghi nhận gửi Welcome Email. Không có email thật được gửi.");
}
function completeFollowup(id) {
  let l = state.leads.find((x) => x.id === id);
  l.followup.status = "DONE";
  l.followup.completedAt = crmDateTime();
  log(id + " hoàn thành Task Follow-up");
  leadDetail(id);
  toast("Đã hoàn thành Task Follow-up.");
}
function reopenFollowup(id) {
  let l = state.leads.find((x) => x.id === id);
  l.followup.status = "PENDING";
  delete l.followup.completedAt;
  log(id + " mở lại Task Follow-up");
  leadDetail(id);
}
function followupForm(id) {
  let l = state.leads.find((x) => x.id === id),
    task = crmTask(l);
  modal(
    "Đổi lịch Follow-up · " + id,
    `<form onsubmit="saveFollowup(event,'${id}')"><label>Ngày đến hạn<input name="date" type="date" value="${task.dueDate}" required></label><label>Nội dung<textarea name="note" required maxlength="300">${esc(task.note)}</textarea></label><div class="formfooter">${btn("Hủy", "leadDetail('" + id + "')")}<button class="btn primary" type="submit">Lưu task</button></div></form>`,
    true,
  );
}
function saveFollowup(e, id) {
  e.preventDefault();
  let l = state.leads.find((x) => x.id === id),
    f = new FormData(e.target);
  l.followup = {
    dueDate: f.get("date"),
    note: f.get("note").trim(),
    status: "PENDING",
  };
  log(id + " cập nhật Task Follow-up");
  leadDetail(id);
  toast("Đã cập nhật lịch Follow-up.");
}

function exportCRMLeads() {
  initializeCRM();
  let headers = [
      "Lead ID",
      "Date",
      "Source",
      "Country",
      "Name",
      "Email",
      "WhatsApp",
      "Budget",
      "Status",
      "Sales Owner",
    ],
    rows = crmFilteredLeads().map((l) => [
      l.id,
      l.createdAt.slice(0, 10),
      l.source,
      l.country,
      l.name,
      l.email,
      l.whatsapp,
      l.budget,
      l.status,
      l.sales,
    ]),
    cell = (x) =>
      '"' +
      String(x)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
  downloadFile(
    "TypicOne ERP_CRM_Leads.csv",
    "\ufeff" +
      [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất CSV Leads đúng 10 trường.");
}

views.sales = () => {
  initializeCRM();
  return (
    title(
      "Dashboard Sales",
      "Leads · Quotations · Won · Lost · Revenue · Profit",
      `<select id="salesowner" onchange="salesOwner=this.value;render()"><option value="all">Cả 2 Sales</option>${crmOwners.map((x) => `<option ${salesOwner === x ? "selected" : ""}>${x}</option>`).join("")}</select>`,
    ) + salesContent(salesOwner)
  );
};
function salesContent(owner) {
  let ls = state.leads.filter((l) => owner === "all" || l.sales === owner),
    bs = state.bookings.filter((b) => owner === "all" || b.sales === owner),
    qs = state.quotes.filter((q) => ls.some((l) => l.id === q.lead)),
    pending = ls.filter((l) => crmTask(l).status === "PENDING"),
    overdue = pending.filter((l) => crmTask(l).dueDate < crmToday());
  return (
    `<div class="stats">${stat("LEADS", ls.length, "Khách đang theo dõi")}${stat("QUOTATIONS", qs.length, "Báo giá liên quan")}${stat("WON / LOST", ls.filter((l) => l.status === "WON").length + " / " + ls.filter((l) => l.status === "LOST").length, "Kết quả bán hàng")}${stat("FOLLOW-UP QUÁ HẠN", overdue.length, "Cần xử lý")}${stat("REVENUE", short(bs.reduce((n, b) => n + b.revenue, 0)), "Giá trị booking")}${stat("PROFIT", short(bs.reduce((n, b) => n + b.revenue - b.cost, 0)), "Theo chi phí dự kiến")}</div>` +
    card(
      "Task Follow-up",
      table(
        ["LEAD", "SALES", "STATUS", "FOLLOW-UP", "TASK"],
        pending
          .sort((a, b) => crmTask(a).dueDate.localeCompare(crmTask(b).dueDate))
          .map((l) => {
            let t = crmTask(l);
            return (
              '<tr><td><button class="link" onclick="leadDetail(\'' +
              l.id +
              "')\">" +
              esc(l.name) +
              "</button></td><td>" +
              esc(l.sales) +
              "</td><td>" +
              badge(l.status) +
              "</td><td>" +
              fmt(t.dueDate) +
              "</td><td>" +
              badge(
                t.dueDate < crmToday() ? "QUÁ HẠN" : "PENDING",
                t.dueDate < crmToday() ? "red" : "amber",
              ) +
              "</td></tr>"
            );
          }),
      ),
    ) +
    card(
      "Tiến độ thanh toán sau WON",
      table(
        ["BOOKING", "KHÁCH", "WON → DEPOSIT → FINAL PAYMENT", "ĐÃ THU"],
        bs.map(
          (b) =>
            "<tr><td>" +
            b.id +
            "</td><td>" +
            esc(b.client) +
            "</td><td>" +
            badge(
              b.received >= b.revenue
                ? "FINAL PAYMENT"
                : b.received > 0
                  ? "DEPOSIT"
                  : "WON",
              b.received ? "green" : "amber",
            ) +
            "</td><td>" +
            money(b.received) +
            "</td></tr>",
        ),
      ),
    )
  );
}
