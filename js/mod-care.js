/* MODULE mod-care — chăm sóc khách hàng sau tour, đồng bộ database. */

let careSearch = "";
let careStatus = "all";
let careScore = "all";
let careView = "table";

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
        id: nextBusinessId("customerServiceCases", booking.end),
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

  return `<div id="customer-service">${title(
    "Customer Service",
    "Feedback Form → CSAT → Review → Referral",
    btn("Xuất CSV", "exportCustomerServiceCSV()") +
      (can("care_manage") ? btn("+ Ghi nhận khiếu nại", "complaintForm()") : "") +
      (can("care_manage") ? btn("Làm mới cases", "syncCustomerServiceCases()", "primary") : ""),
  )}<div class="stats">${stat("AFTER-TOUR CASES", all.length, "Tự tạo từ tour Completed")}${stat("TỶ LỆ PHẢN HỒI", responseRate + "%", responses.length + " khách đã trả lời")}${stat("CSAT TRUNG BÌNH", average ? average.toFixed(1) + "/5" : "—", "Điểm hài lòng tổng thể")}${stat("CẦN RECOVERY", recovery, "Phản hồi dưới 4 hoặc chưa xử lý")}</div>${careJourney()}<section class="care-section"><div class="care-heading"><div><h2>Hồ sơ chăm sóc khách hàng</h2><p>${cases.length} kết quả theo bộ lọc hiện tại</p></div><div class="care-view-switch" role="group" aria-label="Kiểu hiển thị"><button class="btn small ${careView === "table" ? "selected" : ""}" onclick="careView='table';render()">Dạng bảng</button><button class="btn small ${careView === "pipeline" ? "selected" : ""}" onclick="careView='pipeline';render()">Pipeline</button></div></div>${careFilters()}<div id="care-table">${careView === "pipeline" ? carePipeline(cases) : careCaseTable(cases)}</div></section></div>`;
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
  if (!requireCapability("care_manage")) return;
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
  if (can("care_manage") && ["PENDING", "SENT"].includes(item.status)) {
    actions.push(
      btn(
        item.status === "PENDING" ? "Gửi Feedback Form" : "Gửi nhắc",
        `sendFeedbackRequest('${id}')`,
        "primary",
      ),
    );
    actions.push(btn("Nhập phản hồi", `feedbackForm('${id}')`));
  }
  if (can("care_manage") && item.status === "RECOVERY")
    actions.push(btn("Xử lý Recovery", `recoveryForm('${id}')`, "danger"));
  if (can("care_manage") && ["RESPONDED", "REVIEW"].includes(item.status))
    actions.push(btn("Ghi nhận Review", `reviewForm('${id}')`, "primary"));
  if (can("care_manage") && ["REVIEW", "REFERRAL"].includes(item.status))
    actions.push(btn("Ghi nhận Referral", `referralForm('${id}')`));
  if (can("care_manage") && canCloseCareCase(item))
    actions.push(btn("Đóng case", `closeCareCase('${id}')`, "primary"));

  let initials = item.customer
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  modal(
    `<span class="care-profile-title"><span class="care-profile-avatar">${esc(initials)}</span><span>${esc(item.customer)}<small>${item.id} · ${item.bookingId} · ${esc(item.owner)}</small></span></span>`,
    `<div class="care-profile"><div class="flow">${careStatuses.map((status) => `<span class="${careStatuses.indexOf(status) <= careStatuses.indexOf(item.status) ? "on" : ""}">${careStatusLabels[status]}</span>`).join("")}</div><div class="care-profile-summary"><div><small>Booking</small><strong>${item.bookingId}</strong></div><div><small>CSAT</small><strong>${item.feedback ? item.feedback.overall + "/5" : "—"}</strong></div><div><small>Owner</small><strong>${esc(item.owner)}</strong></div><div><small>Hạn xử lý</small><strong>${fmt(item.dueDate)}</strong></div></div><div class="care-profile-content"><div>${careFeedbackCard(item)}${careRecoveryCard(item)}</div><div>${careReviewReferralCard(item)}${careNextTourCard(item)}${careHistoryCard(item)}</div></div><div class="care-profile-footer">${actions.join("")}</div></div>`,
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

/* SLA khiếu nại: HIGH 1 ngày, MEDIUM 3 ngày, LOW 7 ngày. */
const careSlaDays = { HIGH: 1, MEDIUM: 3, LOW: 7 };
function careSlaBadge(due) {
  const left = Math.ceil((new Date(due) - new Date(careToday())) / 864e5);
  return left < 0 ? badge("Quá SLA " + Math.abs(left) + " ngày", "red") : left === 0 ? badge("Hết hạn hôm nay", "amber") : badge("Còn " + left + " ngày", "green");
}
function complaintForm() {
  const bs = state.bookings.filter((b) => ["Running", "Completed"].includes(b.status));
  if (!bs.length) return toast("Chưa có tour đang chạy hoặc đã hoàn tất để ghi nhận khiếu nại.");
  modal("Ghi nhận khiếu nại", `<form onsubmit="saveComplaint(event)"><div class="formgrid"><label class="full">Booking<select name="booking">${bs.map((b) => `<option value="${b.id}">${b.id} · ${esc(b.client)} · ${esc(b.tour)}</option>`).join("")}</select></label><label>Mức độ<select name="priority"><option value="HIGH">Cao — xử lý trong 1 ngày</option><option value="MEDIUM" selected>Trung bình — 3 ngày</option><option value="LOW">Thấp — 7 ngày</option></select></label><label>Nhóm vấn đề<select name="category"><option>Trải nghiệm tour</option><option>Hướng dẫn viên</option><option>Khách sạn</option><option>Xe vận chuyển</option><option>Thanh toán</option><option>Khác</option></select></label><label class="full">Nội dung khiếu nại<textarea name="description" required></textarea></label></div><div class="formfooter"><button class="btn primary">Tạo hồ sơ khiếu nại</button></div></form>`, true);
}
function saveComplaint(event) {
  event.preventDefault();
  if (!requireCapability("care_manage")) return;
  const f = new FormData(event.target), b = findBooking(f.get("booking"));
  initializeCustomerService();
  let item = state.customerServiceCases.find((x) => x.bookingId === b.id);
  const due = careAddDays(careToday(), careSlaDays[f.get("priority")] || 3);
  const recovery = { category: f.get("category"), priority: f.get("priority"), description: f.get("description").trim(), action: "", status: "OPEN", dueDate: due };
  if (!item) {
    item = { id: nextBusinessId("customerServiceCases", careToday()), bookingId: b.id, customer: b.client, tour: b.tour, tourEnd: b.end, owner: careOwners[0] || actor().name, status: "RECOVERY", dueDate: due, feedbackRequest: { status: "NOT_SENT", channel: "Email", sentAt: "", reminderCount: 0 }, feedback: null, recovery, review: null, referral: null, history: [] };
    state.customerServiceCases.push(item);
  } else { item.recovery = recovery; item.status = "RECOVERY"; item.dueDate = due; }
  addCareHistory(item, `Ghi nhận khiếu nại (${f.get("priority")}) · hạn ${fmt(due)}`);
  audit("care", item.id, "COMPLAINT", `Khiếu nại ${b.id}: ${recovery.category}`);
  closeModal(); render(); openCareCase(item.id); toast("Đã tạo hồ sơ khiếu nại với hạn xử lý " + fmt(due) + ".");
}

/* Gợi ý tour kế tiếp: mẫu tour khách chưa đi, ưu tiên cùng thị trường; hiện khi khách đã hài lòng. */
function careNextTourCard(item) {
  if (!item.feedback || item.feedback.overall < 4) return "";
  const customer = findCustomerByName(item.customer);
  const done = state.bookings.filter((b) => b.client === item.customer).map((b) => b.tour);
  const sugg = (state.tourTemplates || []).filter((t) => !done.includes(t.name)).slice(0, 3);
  const lead = state.leads.find((l) => l.name === item.customer);
  return card("Đề xuất tour kế tiếp", sugg.length ? sugg.map((t) => `<div class="metricline"><span><b>${esc(t.name)}</b><span class="sub">${(t.itinerary || []).length} ngày${t.country ? " · " + esc(t.country) : ""}</span></span>${can("tour_design_manage") && lead ? btn("Thiết kế", `closeModal();go('design');selectLead('${lead.id}');designApplyTemplate('${t.id}')`, "small primary") : ""}</div>`).join("") : '<p class="sub">Chưa có mẫu tour mới để đề xuất.</p>', customer ? `<span class="sub">Khách đã đi ${done.length} tour · hạng ${esc(customerTier(customer).label)}</span>` : "");
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
      line("Hạn xử lý (SLA)", fmt(recovery.dueDate) + (recovery.status !== "RESOLVED" ? " " + careSlaBadge(recovery.dueDate) : "")) +
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
  if (!requireCapability("care_manage")) return;
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
      ? "Gửi nhắc Feedback Form"
      : "Gửi Feedback Form",
  );
  log(`${item.id} ${isReminder ? "gửi nhắc" : "gửi Feedback Form"}`);
  openCareCase(id);
  toast("Đã ghi nhận gửi form phản hồi cho khách.");
}

function feedbackForm(id) {
  let item = state.customerServiceCases.find((value) => value.id === id);
  let current = item.feedback || {};
  let scoreField = (name, label) =>
    `<label>${label}<select name="${name}" required>${[5, 4, 3, 2, 1].map((score) => `<option value="${score}" ${current[name] === score ? "selected" : ""}>${score}/5</option>`).join("")}</select></label>`;
  modal(
    `Feedback Form · ${item.id}`,
    `<form onsubmit="saveFeedback(event,'${id}')"><div class="score-grid">${scoreField("overall", "Hài lòng tổng thể")}${scoreField("itinerary", "Lịch trình")}${scoreField("guide", "Hướng dẫn viên")}${scoreField("hotel", "Khách sạn")}${scoreField("transport", "Phương tiện")}${scoreField("support", "Dịch vụ hỗ trợ")}</div><label>Ý kiến của khách<textarea name="comment" required maxlength="1000" placeholder="Nhập phản hồi chi tiết…">${esc(current.comment || "")}</textarea></label><label><input name="allowContact" type="checkbox" value="1" ${current.allowContact === false ? "" : "checked"}> Khách đồng ý để TypicOne ERP liên hệ lại</label><div class="formfooter">${btn("Hủy", `openCareCase('${id}')`)}<button class="btn primary" type="submit">Lưu Feedback & CSAT</button></div></form>`,
    true,
  );
}

function saveFeedback(event, id) {
  event.preventDefault();
  if (!requireCapability("care_manage")) return;
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
  if (!requireCapability("care_manage")) return;
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
  if (!requireCapability("care_manage")) return;
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
  if (!requireCapability("care_manage")) return;
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
  if (!requireCapability("care_manage")) return;
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
    "TypicOne ERP_Customer_Service.csv",
    "\ufeff" +
      [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất danh sách Customer Service Cases.");
}
