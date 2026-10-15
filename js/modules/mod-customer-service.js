/* MODULE mod-customer-service — chăm sóc khách hàng sau tour, đồng bộ database. */

let careSearch = "";
let careStatus = "all";
let careScore = "all";

const careStatuses = [
  "PENDING",
  "SENT",
  "RESPONDED",
  "RECOVERY",
  "REVIEW",
  "REFERRAL",
  "CLOSED",
];

const careStatusLabels = {
  PENDING: "Chờ gửi form",
  SENT: "Đã gửi form",
  RESPONDED: "Đã phản hồi",
  RECOVERY: "Cần xử lý",
  REVIEW: "Chờ Review",
  REFERRAL: "Chờ Referral",
  CLOSED: "Hoàn tất",
};

function injectCustomerServiceFrontendStyles() {
  if (
    typeof document === "undefined" ||
    document.getElementById("customer-service-ui")
  )
    return;
  let style = document.createElement("style");
  style.id = "customer-service-ui";
  style.textContent = `
    body main #customer-service{--care-shadow:0 8px 24px rgba(20,43,43,.055)}
    body main #customer-service .pagetop{margin-bottom:16px}
    body main #customer-service .pagetop h1{font-size:26px;margin:3px 0}
    body main #customer-service>.stats{gap:12px;margin-bottom:14px}
    body main #customer-service>.stats .stat{padding:14px 16px;border-color:#dfe7df;box-shadow:var(--care-shadow)}
    body main #customer-service>.stats .stat strong{font-size:22px;margin:4px 0}
    body main #customer-service .care-flow{gap:8px;margin-bottom:14px}
    body main #customer-service .care-step{min-height:74px;padding:11px 13px;border-radius:8px;background:#f8faf7}
    body main #customer-service .care-step:not(:last-child):after{top:25px}
    body main #customer-service .care-step small{font-size:9px;margin-bottom:4px;letter-spacing:.45px}
    body main #customer-service .care-step b{font-size:12px}
    body main #customer-service .care-step span{font-size:10px;margin-top:3px}
    body main #customer-service .care-section{margin-top:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;box-shadow:var(--care-shadow)}
    body main #customer-service .care-heading{align-items:center;margin-bottom:11px}
    body main #customer-service .care-heading h2{font-size:16px;letter-spacing:-.15px}
    body main #customer-service .care-heading p{font-size:11px;margin-top:2px}
    body main #customer-service .care-pipeline{gap:8px;padding-bottom:4px}
    body main #customer-service .care-column{min-height:165px;padding:8px;border:1px solid #e3e9e1;background:#f1f4ee}
    body main #customer-service .care-column-head{margin-bottom:7px;padding:0 2px}
    body main #customer-service .care-ticket{padding:10px;margin-bottom:6px;box-shadow:0 2px 8px rgba(20,43,43,.035)}
    body main #customer-service .care-ticket p{margin:4px 0;line-height:1.45}
    body main #customer-service .care-score{font-size:16px}
    body main #customer-service .filters{padding:10px;background:#f7f9f5;border:1px solid #e6ebe4;border-radius:9px;margin-bottom:10px;gap:8px}
    body main #customer-service .filters input,body main #customer-service .filters select{padding:8px 10px;background:#fff}
    body main #customer-service #care-table>.card{padding:0;border:0;border-radius:0;margin:0;box-shadow:none}
    body main #customer-service #care-table>.card>.cardhead{margin:2px 0 10px}
    body main #customer-service .tablewrap{border:1px solid #e7ece5;border-radius:9px}
    body main #customer-service th{padding:9px 10px;background:#f5f8f3;color:#5f7166}
    body main #customer-service td{padding:10px;font-size:11px;vertical-align:middle}
    body main #customer-service tbody tr{transition:background-color .15s ease}
    body main #customer-service tbody tr:hover{background:#f8fbf7}
    body main #customer-service td .btn.small{min-height:30px;white-space:nowrap}
    body .modal:has(form[onsubmit^="saveFeedback"]),body .modal:has(form[onsubmit^="saveReferral"]){width:min(720px,100%)}
    body .modal form[onsubmit^="saveFeedback"] .score-grid{gap:10px}
    body .modal form[onsubmit^="saveFeedback"] label,body .modal form[onsubmit^="saveReferral"] label{margin-bottom:0}
    body .modal form[onsubmit^="saveFeedback"] select,body .modal form[onsubmit^="saveFeedback"] textarea,body .modal form[onsubmit^="saveReferral"] input,body .modal form[onsubmit^="saveReferral"] textarea{padding:9px 10px;margin-top:4px}
    body .modalback:has(.care-profile){align-items:stretch;padding:0}
    body .modal:has(.care-profile){position:relative;width:min(720px,calc(100% - 24px));height:100%;max-height:none;padding:0;background:#fff;border-radius:0;overflow:auto}
    body .modal:has(.care-profile) .modalhead{position:sticky;top:0;z-index:5;margin:0;padding:18px 24px;background:#fff;border-bottom:1px solid var(--line);align-items:center}
    body .modal:has(.care-profile) .modalhead .eyebrow{display:none}
    body .modal:has(.care-profile) .modalhead h2{display:flex;align-items:center;gap:12px;margin:0;font-size:18px}
    body .modal:has(.care-profile) .close{width:40px;height:40px;border-radius:10px}
    body .care-profile-title{display:flex;align-items:center;gap:12px}
    body .care-profile-avatar{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#226d53,#4a9274);color:#fff;font-size:15px;font-weight:800;box-shadow:0 7px 18px rgba(34,109,83,.22)}
    body .care-profile-title>span:last-child{display:flex;flex-direction:column;gap:2px}
    body .care-profile-title small{font-size:11px;color:var(--muted);font-weight:550}
    body .care-profile{padding:16px 20px 80px}
    body .care-profile .flow{margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid var(--line);flex-wrap:nowrap;overflow:auto}
    body .care-profile .flow span{white-space:nowrap;padding:6px 10px}
    body .care-profile-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:18px}
    body .care-profile-summary>div{border:1px solid #dfe7df;border-radius:9px;padding:10px 11px;background:#fbfcfa}
    body .care-profile-summary small{display:block;color:var(--muted);font-size:10px;margin-bottom:4px}
    body .care-profile-summary strong{font-size:14px;color:var(--ink)}
    body .care-profile-content{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(260px,.92fr);gap:18px}
    body .care-profile .card{padding:0;border:0;border-radius:0;margin:0 0 22px;box-shadow:none;background:transparent}
    body .care-profile .cardhead{margin:0}
    body .care-profile .cardhead h3{width:100%;padding:0 0 9px;border-bottom:1px solid var(--line);font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:#718277}
    body .care-profile .metricline{padding:9px 0}
    body .care-profile .metricline span,body .care-profile .metricline b{font-size:11px}
    body .care-profile .card>p{font-size:12px;line-height:1.6}
    body .care-profile-footer{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:13px 24px;background:#f8faf7;border-top:1px solid var(--line)}
    body .care-profile-footer .btn{min-height:38px}
    body #overlay:has(.care-profile)+#toast .toast{left:auto;right:24px;bottom:82px;transform:none;max-width:min(420px,calc(100vw - 48px))}
    @media(max-width:1100px){body main #customer-service .care-flow{grid-template-columns:repeat(3,1fr)}body main #customer-service .care-step:after{display:none}}
    @media(max-width:760px){body main #customer-service .pagetop{gap:10px}body main #customer-service .pagetop .actions{width:100%}body main #customer-service .pagetop .btn{flex:1}body main #customer-service>.stats{grid-template-columns:repeat(2,1fr)}body main #customer-service .care-section{padding:13px;margin-top:10px}body main #customer-service .care-flow{grid-template-columns:1fr 1fr}body main #customer-service #care-table th:nth-child(3),body main #customer-service #care-table td:nth-child(3),body main #customer-service #care-table th:nth-child(4),body main #customer-service #care-table td:nth-child(4),body main #customer-service #care-table th:nth-child(6),body main #customer-service #care-table td:nth-child(6){display:none}body .modalback:has(.care-profile){align-items:stretch;padding:0}body .modal:has(.care-profile){width:100%;height:100%;max-height:none;border-radius:0}body .care-profile{padding:14px 16px 96px}body .care-profile-content{grid-template-columns:1fr;gap:0}body .care-profile-summary{grid-template-columns:1fr 1fr}body .care-profile-footer{padding:10px 16px}body .care-profile-footer .btn{flex:1}body #overlay:has(.care-profile)+#toast .toast{right:16px;bottom:118px;max-width:calc(100vw - 32px)}}
    @media(max-width:480px){body main #customer-service .care-flow{grid-template-columns:1fr}body main #customer-service>.stats{grid-template-columns:1fr 1fr}body main #customer-service .filters>*{width:100%;max-width:none}body main #customer-service #care-table th:nth-child(7),body main #customer-service #care-table td:nth-child(7){display:none}}
    @media(min-width:561px) and (max-width:760px){body .modal:has(.care-profile){width:min(720px,calc(100% - 24px))}}
    @media(prefers-reduced-motion:reduce){body main #customer-service tbody tr{transition:none}}
  `;
  document.head.appendChild(style);
}

injectCustomerServiceFrontendStyles();
const careNow = () => new Date().toISOString();
const careToday = () => new Date().toLocaleDateString("en-CA");

function careAddDays(date, days) {
  let value = new Date(date + "T00:00:00");
  value.setDate(value.getDate() + days);
  return value.toLocaleDateString("en-CA");
}

function initializeCustomerService() {
  if (!state.customerServiceCases) state.customerServiceCases = [];
  let previousCount = state.customerServiceCases.length;

  state.bookings
    .filter((booking) => booking.status === "Completed")
    .forEach((booking, index) => {
      if (
        state.customerServiceCases.some((item) => item.bookingId === booking.id)
      )
        return;

      let hasFeedback = !!booking.feedback;
      let score = booking.feedback?.score || null;
      state.customerServiceCases.push({
        id:
          "CS-" +
          String(state.customerServiceCases.length + 1).padStart(3, "0"),
        bookingId: booking.id,
        customer: booking.client,
        tour: booking.tour,
        tourEnd: booking.end,
        owner: careOwners[index % careOwners.length],
        status: hasFeedback ? (score < 4 ? "RECOVERY" : "REVIEW") : "PENDING",
        dueDate: careAddDays(booking.end, 1),
        feedbackRequest: {
          status: hasFeedback ? "RESPONDED" : "NOT_SENT",
          channel: "Email",
          sentAt: "",
          reminderCount: 0,
        },
        feedback: hasFeedback
          ? {
              overall: score,
              itinerary: score,
              guide: score,
              hotel: score,
              transport: score,
              support: score,
              comment: booking.feedback.note,
              allowContact: true,
              submittedAt: booking.end + "T08:00:00.000Z",
            }
          : null,
        recovery:
          score && score < 4
            ? {
                category: "Dịch vụ tour",
                priority: score <= 2 ? "HIGH" : "MEDIUM",
                description: booking.feedback.note,
                action: "",
                status: "OPEN",
                dueDate: careAddDays(booking.end, 2),
              }
            : null,
        review: booking.review
          ? { content: booking.review, consent: false, status: "RECEIVED" }
          : null,
        referral: booking.referral
          ? { name: booking.referral, email: "", whatsapp: "", status: "NEW" }
          : null,
        history: [
          {
            at: careNow(),
            text: hasFeedback
              ? "Khởi tạo từ feedback hiện có"
              : "Tự tạo sau khi tour hoàn tất",
          },
        ],
      });
    });

  if (state.customerServiceCases.length !== previousCount) save();
}

function careCases() {
  initializeCustomerService();
  let query = careSearch.trim().toLowerCase();
  return state.customerServiceCases.filter((item) => {
    let booking = state.bookings.find((value) => value.id === item.bookingId);
    let matchesSearch =
      !query ||
      [
        item.id,
        item.bookingId,
        item.customer,
        item.tour,
        item.owner,
        booking?.client,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    let score = item.feedback?.overall;
    let matchesScore =
      careScore === "all" ||
      (careScore === "low" ? score && score < 4 : Number(careScore) === score);
    return (
      matchesSearch &&
      (careStatus === "all" || item.status === careStatus) &&
      matchesScore
    );
  });
}

function careBadge(status) {
  let color =
    status === "CLOSED" || status === "REVIEW" || status === "REFERRAL"
      ? "green"
      : status === "RECOVERY"
        ? "red"
        : "amber";
  return badge(careStatusLabels[status] || status, color);
}

views.care = () => {
  let cases = careCases();
  let all = state.customerServiceCases;
  let responses = all.filter((item) => item.feedback);
  let average = responses.length
    ? responses.reduce((sum, item) => sum + item.feedback.overall, 0) /
      responses.length
    : 0;
  let recovery = all.filter(
    (item) => item.recovery && item.recovery.status !== "RESOLVED",
  ).length;
  let responseRate = all.length
    ? Math.round((responses.length / all.length) * 100)
    : 0;

  return `<div id="customer-service"><style>
    #customer-service .care-flow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}
    #customer-service .care-step{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px;position:relative;min-height:92px}
    #customer-service .care-step:not(:last-child):after{content:'→';position:absolute;right:-10px;top:34px;color:var(--green);font-weight:800;z-index:2}
    #customer-service .care-step small{display:block;color:var(--green);font-weight:700;margin-bottom:7px}
    #customer-service .care-step span{display:block;color:var(--muted);font-size:11px;margin-top:6px}
    #customer-service .care-section{margin-top:24px}
    #customer-service .care-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px}
    #customer-service .care-heading h2{font-size:20px;margin:0}
    #customer-service .care-heading p{color:var(--muted);margin:4px 0 0}
    #customer-service .care-pipeline{display:grid;grid-template-columns:repeat(7,minmax(145px,1fr));gap:10px;overflow:auto;padding-bottom:8px}
    #customer-service .care-column{background:#edf0e9;border-radius:10px;padding:11px;min-height:210px}
    #customer-service .care-column-head{font-size:10px;font-weight:750;display:flex;justify-content:space-between;margin-bottom:10px}
    #customer-service .care-ticket{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:8px}
    #customer-service .care-ticket b{display:block;font-size:12px}
    #customer-service .care-ticket p{font-size:10px;color:var(--muted);margin:6px 0}
    #customer-service .care-score{font-size:18px;font-weight:750;color:var(--green)}
    #customer-service .care-score.low{color:var(--red)}
    #customer-service .overdue{color:var(--red);font-weight:700}
    #customer-service .score-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    @media(max-width:900px){#customer-service .care-flow{grid-template-columns:1fr 1fr}#customer-service .care-step:after{display:none}}
    @media(max-width:600px){#customer-service .care-flow,#customer-service .score-grid{grid-template-columns:1fr}}
  </style>${title(
    "Customer Service",
    "Feedback Form → CSAT → Review → Referral",
    btn("Xuất CSV", "exportCustomerServiceCSV()") +
      btn("Làm mới cases", "syncCustomerServiceCases()", "primary"),
  )}<div class="stats">${stat("AFTER-TOUR CASES", all.length, "Tự tạo từ tour Completed")}${stat("TỶ LỆ PHẢN HỒI", responseRate + "%", responses.length + " khách đã trả lời")}${stat("CSAT TRUNG BÌNH", average ? average.toFixed(1) + "/5" : "—", "Điểm hài lòng tổng thể")}${stat("CẦN RECOVERY", recovery, "Phản hồi dưới 4 hoặc chưa xử lý")}</div>${careJourney()}<section class="care-section"><div class="care-heading"><div><h2>Pipeline chăm sóc</h2><p>Theo dõi toàn bộ hành trình sau tour</p></div></div>${carePipeline(cases)}</section><section class="care-section"><div class="care-heading"><div><h2>Customer Service Cases</h2><p>${cases.length} kết quả theo bộ lọc hiện tại</p></div></div>${careFilters()}<div id="care-table">${careCaseTable(cases)}</div></section></div>`;
};

function careJourney() {
  return `<div class="care-flow"><div class="care-step"><small>01 · SAU TOUR</small><b>Tour Completed</b><span>Tự tạo Customer Service Case</span></div><div class="care-step"><small>02 · FEEDBACK</small><b>Feedback Form</b><span>Gửi và nhắc khách phản hồi</span></div><div class="care-step"><small>03 · MEASURE</small><b>CSAT</b><span>Chấm điểm dịch vụ 1–5</span></div><div class="care-step"><small>04 · ADVOCACY</small><b>Review</b><span>Ghi nhận nội dung và consent</span></div><div class="care-step"><small>05 · GROWTH</small><b>Referral</b><span>Lưu khách được giới thiệu</span></div></div>`;
}

function careFilters() {
  return `<div class="filters"><input aria-label="Tìm Customer Service Case" placeholder="Tìm Case ID, Booking, khách, tour, owner…" value="${esc(careSearch)}" oninput="careSearch=this.value;refreshCustomerService()"><select aria-label="Lọc trạng thái" onchange="careStatus=this.value;refreshCustomerService()"><option value="all">Mọi trạng thái</option>${careStatuses.map((status) => `<option value="${status}" ${careStatus === status ? "selected" : ""}>${careStatusLabels[status]}</option>`).join("")}</select><select aria-label="Lọc điểm CSAT" onchange="careScore=this.value;refreshCustomerService()"><option value="all">Mọi điểm CSAT</option><option value="low" ${careScore === "low" ? "selected" : ""}>Dưới 4 · Cần xử lý</option>${[5, 4, 3, 2, 1].map((score) => `<option value="${score}" ${careScore === String(score) ? "selected" : ""}>${score}/5</option>`).join("")}</select></div>`;
}

function carePipeline(cases) {
  return `<div class="care-pipeline">${careStatuses
    .map((status) => {
      let items = cases.filter((item) => item.status === status);
      return `<div class="care-column"><div class="care-column-head"><span>${careStatusLabels[status]}</span><span>${items.length}</span></div>${items
        .map(
          (item) =>
            `<div class="care-ticket"><button class="link" onclick="openCareCase('${item.id}')">${esc(item.customer)}</button><p>${item.id} · ${item.bookingId}<br>${esc(item.owner)}</p>${item.feedback ? `<span class="care-score ${item.feedback.overall < 4 ? "low" : ""}">${item.feedback.overall}/5</span>` : `<span class="sub">Hạn ${fmt(item.dueDate)}</span>`}</div>`,
        )
        .join("")}</div>`;
    })
    .join("")}</div>`;
}

function careCaseTable(cases) {
  return card(
    "Danh sách hồ sơ",
    table(
      [
        "CASE / BOOKING",
        "KHÁCH / TOUR",
        "OWNER",
        "FEEDBACK",
        "CSAT",
        "REVIEW / REFERRAL",
        "HẠN",
        "THAO TÁC",
      ],
      cases.map((item) => {
        let overdue = item.status !== "CLOSED" && item.dueDate < careToday();
        return `<tr><td><b>${item.id}</b><span class="sub">${item.bookingId}</span></td><td><b>${esc(item.customer)}</b><span class="sub">${esc(item.tour)}</span></td><td>${esc(item.owner)}</td><td>${badge(item.feedbackRequest.status, item.feedback ? "green" : "amber")}</td><td>${item.feedback ? badge(item.feedback.overall + "/5", item.feedback.overall < 4 ? "red" : "green") : "—"}</td><td>${item.review ? "Review ✓" : "Review —"}<span class="sub">${item.referral ? "Referral ✓" : "Referral —"}</span></td><td class="${overdue ? "overdue" : ""}">${fmt(item.dueDate)}</td><td>${btn("Mở case", `openCareCase('${item.id}')`, "small")}</td></tr>`;
      }),
    ),
  );
}

function refreshCustomerService() {
  render();
}

function syncCustomerServiceCases() {
  let before = state.customerServiceCases?.length || 0;
  initializeCustomerService();
  let created = state.customerServiceCases.length - before;
  save();
  render();
  toast(
    created
      ? `Đã tạo ${created} Customer Service Case mới.`
      : "Không có tour Completed mới.",
  );
}

function openCareCase(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  let booking = state.bookings.find((value) => value.id === item.bookingId);
  let actions = [];
  if (["PENDING", "SENT"].includes(item.status)) {
    actions.push(
      btn(
        item.status === "PENDING" ? "Gửi Feedback Form" : "Gửi nhắc",
        `sendFeedbackRequest('${id}')`,
        "primary",
      ),
    );
    actions.push(btn("Nhập phản hồi", `feedbackForm('${id}')`));
  }
  if (item.status === "RECOVERY")
    actions.push(btn("Xử lý Recovery", `recoveryForm('${id}')`, "danger"));
  if (["RESPONDED", "REVIEW"].includes(item.status))
    actions.push(btn("Ghi nhận Review", `reviewForm('${id}')`, "primary"));
  if (["REVIEW", "REFERRAL"].includes(item.status))
    actions.push(btn("Ghi nhận Referral", `referralForm('${id}')`));
  if (canCloseCareCase(item))
    actions.push(btn("Đóng case", `closeCareCase('${id}')`, "primary"));

  let initials = item.customer
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  modal(
    `<span class="care-profile-title"><span class="care-profile-avatar">${esc(initials)}</span><span>${esc(item.customer)}<small>${item.id} · ${item.bookingId} · ${esc(item.owner)}</small></span></span>`,
    `<div class="care-profile"><div class="flow">${careStatuses.map((status) => `<span class="${careStatuses.indexOf(status) <= careStatuses.indexOf(item.status) ? "on" : ""}">${careStatusLabels[status]}</span>`).join("")}</div><div class="care-profile-summary"><div><small>Booking</small><strong>${item.bookingId}</strong></div><div><small>CSAT</small><strong>${item.feedback ? item.feedback.overall + "/5" : "—"}</strong></div><div><small>Owner</small><strong>${esc(item.owner)}</strong></div><div><small>Hạn xử lý</small><strong>${fmt(item.dueDate)}</strong></div></div><div class="care-profile-content"><div>${careFeedbackCard(item)}${careRecoveryCard(item)}</div><div>${careReviewReferralCard(item)}${careHistoryCard(item)}</div></div><div class="care-profile-footer">${actions.join("")}</div></div>`,
  );
}

function careFeedbackCard(item) {
  let request = item.feedbackRequest;
  let feedback = item.feedback;
  return card(
    "Feedback & CSAT",
    line(
      "Trạng thái form",
      badge(request.status, feedback ? "green" : "amber"),
    ) +
      line("Kênh gửi", esc(request.channel)) +
      line("Số lần nhắc", request.reminderCount || 0) +
      (feedback
        ? line(
            "CSAT tổng",
            badge(
              feedback.overall + "/5",
              feedback.overall < 4 ? "red" : "green",
            ),
          ) +
          line("Lịch trình", feedback.itinerary + "/5") +
          line("Hướng dẫn viên", feedback.guide + "/5") +
          line("Khách sạn", feedback.hotel + "/5") +
          line("Phương tiện", feedback.transport + "/5") +
          line("Hỗ trợ", feedback.support + "/5") +
          `<p>${esc(feedback.comment)}</p>`
        : '<p class="sub">Chưa nhận được phản hồi từ khách.</p>'),
  );
}

function careRecoveryCard(item) {
  if (!item.recovery) return "";
  let recovery = item.recovery;
  return card(
    "Service Recovery",
    line(
      "Trạng thái",
      badge(recovery.status, recovery.status === "RESOLVED" ? "green" : "red"),
    ) +
      line("Mức độ", recovery.priority) +
      line("Hạn xử lý", fmt(recovery.dueDate)) +
      `<p>${esc(recovery.description)}</p>${recovery.action ? `<div class="alert green"><b>Hành động khắc phục</b>${esc(recovery.action)}</div>` : ""}`,
  );
}

function careReviewReferralCard(item) {
  return card(
    "Review & Referral",
    line(
      "Review",
      item.review
        ? badge(item.review.status, "green")
        : badge("Chưa có", "amber"),
    ) +
      (item.review
        ? `<p>${esc(item.review.content)}</p><p class="sub">Đồng ý công khai: ${item.review.consent ? "Có" : "Không"}</p>`
        : "") +
      line(
        "Referral",
        item.referral
          ? badge(item.referral.status, "green")
          : badge("Chưa có", "amber"),
      ) +
      (item.referral
        ? `<p>${esc(item.referral.name)} · ${esc(item.referral.email || item.referral.whatsapp || "Chưa có liên hệ")}</p>`
        : ""),
  );
}

function careHistoryCard(item) {
  return card(
    "Lịch sử xử lý",
    item.history
      .map(
        (entry) =>
          `<div class="metricline"><span>${esc(entry.text)}</span><small class="sub">${new Date(entry.at).toLocaleString("vi-VN")}</small></div>`,
      )
      .join(""),
  );
}

function addCareHistory(item, text) {
  item.history.unshift({ at: careNow(), text });
}

function sendFeedbackRequest(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  let isReminder = item.status === "SENT";
  item.feedbackRequest.status = "SENT";
  item.feedbackRequest.sentAt = careNow();
  if (isReminder) item.feedbackRequest.reminderCount++;
  item.status = "SENT";
  item.dueDate = careAddDays(careToday(), isReminder ? 3 : 5);
  addCareHistory(
    item,
    isReminder
      ? "Gửi nhắc Feedback Form (mô phỏng)"
      : "Gửi Feedback Form (mô phỏng)",
  );
  log(`${item.id} ${isReminder ? "gửi nhắc" : "gửi Feedback Form"}`);
  openCareCase(id);
  toast("Đã ghi nhận gửi form. Demo chưa gửi Email/WhatsApp thật.");
}

function feedbackForm(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  let current = item.feedback || {};
  let scoreField = (name, label) =>
    `<label>${label}<select name="${name}" required>${[5, 4, 3, 2, 1].map((score) => `<option value="${score}" ${current[name] === score ? "selected" : ""}>${score}/5</option>`).join("")}</select></label>`;
  modal(
    `Feedback Form · ${item.id}`,
    `<form onsubmit="saveFeedback(event,'${id}')"><div class="score-grid">${scoreField("overall", "Hài lòng tổng thể")}${scoreField("itinerary", "Lịch trình")}${scoreField("guide", "Hướng dẫn viên")}${scoreField("hotel", "Khách sạn")}${scoreField("transport", "Phương tiện")}${scoreField("support", "Dịch vụ hỗ trợ")}</div><label>Ý kiến của khách<textarea name="comment" required maxlength="1000" placeholder="Nhập phản hồi chi tiết…">${esc(current.comment || "")}</textarea></label><label><input name="allowContact" type="checkbox" value="1" ${current.allowContact === false ? "" : "checked"}> Khách đồng ý để Typic Travel liên hệ lại</label><div class="formfooter">${btn("Hủy", `openCareCase('${id}')`)}<button class="btn primary" type="submit">Lưu Feedback & CSAT</button></div></form>`,
    true,
  );
}

function saveFeedback(event, id) {
  event.preventDefault();
  let item = state.customerServiceCases.find((value) => value.id === id);
  let booking = state.bookings.find((value) => value.id === item.bookingId);
  let form = new FormData(event.target);
  let fields = [
    "overall",
    "itinerary",
    "guide",
    "hotel",
    "transport",
    "support",
  ];
  let values = Object.fromEntries(
    fields.map((field) => [field, Number(form.get(field))]),
  );
  if (Object.values(values).some((score) => score < 1 || score > 5))
    return toast("Điểm CSAT phải từ 1 đến 5.");

  item.feedback = {
    ...values,
    comment: form.get("comment").trim(),
    allowContact: form.get("allowContact") === "1",
    submittedAt: careNow(),
  };
  item.feedbackRequest.status = "RESPONDED";
  booking.feedback = { score: values.overall, note: item.feedback.comment };

  if (values.overall < 4) {
    item.status = "RECOVERY";
    item.recovery = item.recovery || {
      category: "Trải nghiệm tour",
      priority: values.overall <= 2 ? "HIGH" : "MEDIUM",
      description: item.feedback.comment,
      action: "",
      status: "OPEN",
      dueDate: careAddDays(careToday(), values.overall <= 2 ? 1 : 2),
    };
    item.dueDate = item.recovery.dueDate;
    addCareHistory(
      item,
      `Nhận CSAT ${values.overall}/5 · Tự mở Service Recovery`,
    );
  } else {
    item.status = "REVIEW";
    item.dueDate = careAddDays(careToday(), 3);
    addCareHistory(item, `Nhận CSAT ${values.overall}/5 · Chuyển bước Review`);
  }

  log(`${item.id} nhận CSAT ${values.overall}/5`);
  openCareCase(id);
  toast(
    values.overall < 4
      ? "Đã lưu CSAT và mở Service Recovery."
      : "Đã lưu CSAT và chuyển sang Review.",
  );
}

function recoveryForm(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  let recovery = item.recovery;
  modal(
    `Service Recovery · ${item.id}`,
    `<form onsubmit="saveRecovery(event,'${id}')"><label>Nhóm vấn đề<select name="category"><option>Trải nghiệm tour</option><option>Hướng dẫn viên</option><option>Khách sạn</option><option>Phương tiện</option><option>Hỗ trợ khách hàng</option></select></label><label>Mức độ<select name="priority"><option ${recovery.priority === "HIGH" ? "selected" : ""}>HIGH</option><option ${recovery.priority === "MEDIUM" ? "selected" : ""}>MEDIUM</option><option>LOW</option></select></label><label>Hạn xử lý<input name="dueDate" type="date" value="${recovery.dueDate}" required></label><label>Hành động khắc phục<textarea name="action" required maxlength="1000" placeholder="Mô tả cách xử lý với khách…">${esc(recovery.action || "")}</textarea></label><div class="formfooter">${btn("Hủy", `openCareCase('${id}')`)}<button class="btn primary" type="submit">Lưu và đánh dấu đã xử lý</button></div></form>`,
    true,
  );
}

function saveRecovery(event, id) {
  event.preventDefault();
  let item = state.customerServiceCases.find((value) => value.id === id);
  let form = new FormData(event.target);
  Object.assign(item.recovery, {
    category: form.get("category"),
    priority: form.get("priority"),
    dueDate: form.get("dueDate"),
    action: form.get("action").trim(),
    status: "RESOLVED",
    resolvedAt: careNow(),
  });
  item.status = "REVIEW";
  item.dueDate = careAddDays(careToday(), 3);
  addCareHistory(item, "Service Recovery đã được xử lý · Chuyển bước Review");
  log(`${item.id} xử lý Service Recovery`);
  openCareCase(id);
  toast("Đã xử lý Recovery và chuyển sang Review.");
}

function reviewForm(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  modal(
    `Review · ${item.id}`,
    `<form onsubmit="saveReview(event,'${id}')"><label>Nội dung Review<textarea name="content" required maxlength="1000" placeholder="Review của khách…">${esc(item.review?.content || item.feedback?.comment || "")}</textarea></label><label><input name="consent" type="checkbox" value="1" ${item.review?.consent ? "checked" : ""}> Khách đồng ý cho sử dụng Review công khai</label><div class="formfooter">${btn("Hủy", `openCareCase('${id}')`)}<button class="btn primary" type="submit">Lưu Review</button></div></form>`,
    true,
  );
}

function saveReview(event, id) {
  event.preventDefault();
  let item = state.customerServiceCases.find((value) => value.id === id);
  let booking = state.bookings.find((value) => value.id === item.bookingId);
  let form = new FormData(event.target);
  item.review = {
    content: form.get("content").trim(),
    consent: form.get("consent") === "1",
    status: "RECEIVED",
    receivedAt: careNow(),
  };
  booking.review = item.review.content;
  item.status = "REFERRAL";
  item.dueDate = careAddDays(careToday(), 5);
  addCareHistory(item, "Đã ghi nhận Review · Chuyển bước Referral");
  log(`${item.id} nhận Review`);
  openCareCase(id);
  toast("Đã lưu Review và chuyển sang Referral.");
}

function referralForm(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  modal(
    `Referral · ${item.id}`,
    `<form onsubmit="saveReferral(event,'${id}')"><div class="formgrid"><label>Người được giới thiệu<input name="name" required maxlength="100" value="${esc(item.referral?.name || "")}"></label><label>Quốc gia<input name="country" maxlength="80" value="${esc(item.referral?.country || "")}"></label><label>Email<input name="email" type="email" value="${esc(item.referral?.email || "")}"></label><label>WhatsApp<input name="whatsapp" type="tel" maxlength="30" value="${esc(item.referral?.whatsapp || "")}"></label><label class="full">Ghi chú<textarea name="note" maxlength="500">${esc(item.referral?.note || "")}</textarea></label></div><div class="alert">Cần có ít nhất Email hoặc WhatsApp. Referral chỉ được lưu trong Customer Service, chưa tự tạo Lead CRM.</div><div class="formfooter">${btn("Hủy", `openCareCase('${id}')`)}<button class="btn primary" type="submit">Lưu Referral</button></div></form>`,
    true,
  );
}

function saveReferral(event, id) {
  event.preventDefault();
  let item = state.customerServiceCases.find((value) => value.id === id);
  let booking = state.bookings.find((value) => value.id === item.bookingId);
  let form = new FormData(event.target);
  let email = form.get("email").trim();
  let whatsapp = form.get("whatsapp").trim();
  if (!email && !whatsapp) return toast("Referral cần có Email hoặc WhatsApp.");

  item.referral = {
    name: form.get("name").trim(),
    country: form.get("country").trim(),
    email,
    whatsapp,
    note: form.get("note").trim(),
    status: "NEW",
    createdAt: careNow(),
  };
  booking.referral = item.referral.name;
  item.status = "REFERRAL";
  addCareHistory(item, `Đã ghi nhận Referral: ${item.referral.name}`);
  log(`${item.id} nhận Referral`);
  openCareCase(id);
  toast("Đã lưu Referral trong Customer Service.");
}

function canCloseCareCase(item) {
  return (
    item.feedback &&
    (!item.recovery || item.recovery.status === "RESOLVED") &&
    (item.review || item.referral) &&
    item.status !== "CLOSED"
  );
}

function closeCareCase(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  if (!canCloseCareCase(item)) return toast("Case chưa đủ điều kiện đóng.");
  item.status = "CLOSED";
  item.closedAt = careNow();
  addCareHistory(item, "Đóng Customer Service Case");
  log(`${item.id} đã đóng`);
  closeModal();
  render();
  toast("Đã đóng Customer Service Case.");
}

function exportCustomerServiceCSV() {
  initializeCustomerService();
  let headers = [
    "Case ID",
    "Booking ID",
    "Customer",
    "Tour",
    "Tour End",
    "Owner",
    "Status",
    "CSAT",
    "Recovery",
    "Review",
    "Referral",
    "Due Date",
  ];
  let rows = careCases().map((item) => [
    item.id,
    item.bookingId,
    item.customer,
    item.tour,
    item.tourEnd,
    item.owner,
    item.status,
    item.feedback?.overall || "",
    item.recovery?.status || "",
    item.review?.status || "",
    item.referral?.name || "",
    item.dueDate,
  ]);
  let cell = (value) =>
    '"' +
    String(value)
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  downloadFile(
    "Typic Travel_Customer_Service.csv",
    "\ufeff" +
      [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất danh sách Customer Service Cases.");
}
