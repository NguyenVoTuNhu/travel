/* MODULE mod-operations — giao diện và nghiệp vụ của phân hệ Travel. */

function progress(b) {
  let req = b.services.filter((s) => s.needed);
  return Math.round(
    ((req.filter((s) => s.confirmed).length + !!b.guide + !!b.voucher) /
      (req.length + 2)) *
      100,
  );
}

function bookStatus(b) {
  return badge(
    { Preparing: "Chuẩn bị", Running: "Đang chạy", Completed: "Hoàn tất" }[
      b.status
    ],
    b.status === "Preparing" ? "amber" : "green",
  );
}

function bkLink(b) {
  return (
    '<button class="link" onclick="openBooking(\'' +
    b.id +
    "')\">" +
    b.id +
    "</button>"
  );
}

const renderOperationTours = () => {
  let bs = state.bookings;
  return (
    title(
      "Trung tâm điều hành",
      "Kiểm soát dịch vụ, lịch HDV và mức độ sẵn sàng của từng tour.",
      btn("Quy trình demo", "go('help')"),
    ) +
    `<div class="stats">${stat("CHỜ CHUẨN BỊ", bs.filter((b) => b.status === "Preparing").length, "Booking đã chốt từ Sales")}${stat(
      "DỊCH VỤ CHỜ XÁC NHẬN",
      bs
        .filter((b) => b.status !== "Completed")
        .reduce(
          (n, b) =>
            n + b.services.filter((s) => s.needed && !s.confirmed).length,
          0,
        ),
      "Hotel · Xe · Nhà hàng · Vé…",
    )}${stat("TOUR ĐANG CHẠY", bs.filter((b) => b.status === "Running").length, "Theo dõi trong thời gian tour")}${stat("CHƯA PHÂN CÔNG HDV", bs.filter((b) => !b.guide).length, "Kiểm tra trùng lịch khi gán")}</div><div class="tabs">${[
      ["all", "Tất cả"],
      ["Preparing", "Chuẩn bị"],
      ["Running", "Đang chạy"],
      ["Completed", "Hoàn tất"],
    ]
      .map(([v, n]) =>
        btn(
          n,
          "bookingFilter='" + v + "';render()",
          bookingFilter === v ? "selected" : "",
        ),
      )
      .join("")}</div><div class="tourgrid">${bs
      .filter((b) => bookingFilter === "all" || b.status === bookingFilter)
      .map(
        (b) =>
          `<article class="tourcard"><div class="cardhead"><span class="toursymbol">${b.tour.includes("Luxury") ? "◇" : "⌁"}</span>${bookStatus(b)}</div><div class="eyebrow">${b.id} · ${b.pax} KHÁCH</div><h3>${esc(b.tour)}</h3><div class="sub">${esc(b.client)} · ${esc(b.operator)}</div><div class="dates">◷ ${fmt(b.start)} — ${fmt(b.end)}</div><div class="barrow"><div class="bar" style="flex:1"><i style="width:${progress(b)}%"></i></div><small>${progress(b)}%</small></div><div class="bottom"><div class="sub">${b.guide ? esc(state.guides.find((g) => g.id === b.guide)?.name) : "Chưa có HDV"}<br>${b.services.filter((s) => s.needed && !s.confirmed).length} dịch vụ chưa xác nhận</div>${btn("Điều hành →", "openBooking('" + b.id + "')", "small")}</div></article>`,
      )
      .join("")}</div>`
  );
};

function renderBookingDetails(id) {
  let b = state.bookings.find((b) => b.id === id),
    canOp = can("operations_manage"),
    guide = state.guides.find((g) => g.id === b.guide),
    req = b.services.filter((s) => s.needed),
    ready = req.every((s) => s.confirmed) && b.guide && b.voucher;
  let tabs = `<div class="flow">${["Booking Confirmed", "Operation Assigned", "Book Services", "Supplier Confirmed", "Voucher Ready", "Guide Assigned", "Tour Running", "Completed"].map((x, i) => '<span class="' + (i === 0 || (i === 1 && req.every((s) => s.confirmed)) || (i === 2 && b.guide) || (i === 3 && b.voucher) || (i === 4 && b.status === "Running") || (i === 5 && b.status === "Completed") ? "on" : "") + '">' + x + "</span>").join("")}</div>`;
  modal(
    b.id + " · " + esc(b.tour),
    tabs +
      card(
        "Hồ sơ booking",
        `<div class="split"><div>${line("Khách", esc(b.client))}${line("Ngày đi", fmt(b.start) + " – " + fmt(b.end))}${line("Số khách", b.pax)}${line("Điều hành", esc(b.operator))}</div><div>${line("Trạng thái", bookStatus(b))}${can("booking_financials") ? line("Giá trị", money(b.revenue)) + line("Chi phí dự kiến", money(b.cost)) + line("Biên dự kiến", (((b.revenue - b.cost) / b.revenue) * 100).toFixed(1) + "%") : line("Chi phí dịch vụ", money(b.cost))}${can("booking_receipts") ? line("Đã thu", money(b.received)) : ""}</div></div>`,
      ) +
      card(
        "Checklist dịch vụ",
        req
          .map(
            (s) =>
              `<div class="checkitem"><span>${s.confirmed ? "●" : "○"}</span><div class="grow"><b>${typesVI[s.type]}</b><div class="sub">${esc(state.suppliers.find((n) => n.id === s.supplier)?.name || "Chưa chọn NCC")} · ${money(s.cost)}</div></div>${badge(s.confirmed ? "Đã xác nhận" : "Chờ xác nhận", s.confirmed ? "green" : "amber")}${canOp && b.status === "Preparing" ? btn("Cập nhật", "serviceForm('" + b.id + "','" + s.type + "')", "small") : ""}</div>`,
          )
          .join(""),
      ) +
      `<div class="split">${card("Hướng dẫn viên", guide ? "<b>" + esc(guide.name) + '</b><p class="sub">' + esc(guide.lang) + " · " + esc(guide.area) + "</p>" : '<p class="sub">Chưa phân công HDV cho tour.</p>')}${card("Voucher", b.voucher ? badge("Sẵn sàng", "green") : '<p class="sub">Tạo sau khi NCC xác nhận; thông tin HDV cập nhật sau phân công.</p>')}</div><div class="actions">${canOp && b.status === "Preparing" ? btn("Phân công HDV", "assignForm('" + id + "')") + btn("Tạo voucher", "makeVoucher('" + id + "')") + btn("Bắt đầu tour", "startTour('" + id + "')", "primary") : ""}${b.voucher ? btn("In voucher", "printVoucher('" + id + "')") : ""}${canOp && b.status === "Running" ? btn("Hoàn tất tour", "finishTour('" + id + "')", "primary") : ""}${btn("Danh sách khách", "passengerDetail('" + id + "')")}</div>${b.status === "Preparing" ? '<p class="notice">Điều kiện bắt đầu: mọi dịch vụ được xác nhận, có HDV và voucher. Tài liệu không quy định tỷ lệ cọc bắt buộc.</p>' : ""}`,
  );
}

function serviceForm(id, type) {
  let b = state.bookings.find((b) => b.id === id),
    s = b.services.find((s) => s.type === type),
    ncc = state.suppliers.filter((n) => n.type === type);
  modal(
    "Dịch vụ " + typesVI[type] + " · " + id,
    `<form onsubmit="saveService(event,'${id}','${type}')"><label>Nhà cung cấp<select name="supplier">${ncc.map((n) => '<option value="' + n.id + '" ' + (s.supplier === n.id ? "selected" : "") + ">" + esc(n.name) + " · " + score(n) + "/100</option>").join("")}</select></label><label>Chi phí dự kiến (VND)<input type="number" name="cost" min="0" step="1000" value="${s.cost}" required></label><label>Trạng thái<select name="confirmed"><option value="0" ${!s.confirmed ? "selected" : ""}>Chờ NCC xác nhận</option><option value="1" ${s.confirmed ? "selected" : ""}>NCC đã xác nhận</option></select></label><p class="notice">Thay đổi dịch vụ sẽ làm voucher cũ mất hiệu lực. Chi phí booking được cộng lại từ các dịch vụ.</p><div class="formfooter"><button class="btn primary" type="submit">Lưu dịch vụ</button></div></form>`,
    true,
  );
}

function saveService(e, id, type) {
  e.preventDefault();
  let b = state.bookings.find((b) => b.id === id);
  if (b.status !== "Preparing")
    return toast("Tour này không còn trong trạng thái chuẩn bị.");
  let s = b.services.find((s) => s.type === type),
    f = new FormData(e.target);
  s.supplier = f.get("supplier");
  s.cost = +f.get("cost");
  s.confirmed = f.get("confirmed") === "1";
  b.cost = b.services.filter((s) => s.needed).reduce((n, s) => n + s.cost, 0);
  b.voucher = false;
  log(id + " cập nhật " + type);
  render();
  openBooking(id);
  toast("Đã cập nhật dịch vụ và dự toán.");
}

function makeVoucher(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (b.services.some((s) => s.needed && s.type !== "Guide" && !s.confirmed))
    return toast("Cần xác nhận các dịch vụ NCC trước khi tạo voucher.");
  b.voucher = true;
  state.docs = state.docs.filter(
    (d) => !(d.booking === id && d.type === "Voucher"),
  );
  state.docs.unshift({
    id: "DOC-" + Date.now(),
    booking: id,
    type: "Voucher",
    name: "Voucher " + id,
    date: new Date().toISOString().slice(0, 10),
    generated: true,
  });
  log("Tạo voucher " + id);
  render();
  openBooking(id);
  toast("Voucher đã sẵn sàng, có thể in / lưu PDF.");
}

function startTour(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (b.status !== "Preparing") return;
  if (
    !b.guide ||
    !b.voucher ||
    b.services.some((s) => s.needed && !s.confirmed)
  )
    return toast("Tour chưa đủ dịch vụ, HDV hoặc voucher.");
  b.status = "Running";
  log(id + " bắt đầu tour");
  render();
  openBooking(id);
  toast("Tour đã chuyển sang Đang chạy.");
}

function finishTour(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (b.status !== "Running") return;
  b.status = "Completed";
  log(id + " hoàn tất tour, mở chăm sóc sau tour");
  render();
  openBooking(id);
  toast("Tour hoàn tất. Có thể nhập feedback trong Chăm sóc khách hàng.");
}

function printVoucher(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (!b.voucher) return toast("Chưa có voucher hợp lệ.");
  let g = state.guides.find((g) => g.id === b.guide);
  printable(
    "Voucher " + id,
    "<h2>" +
      esc(b.tour) +
      "</h2><p>" +
      esc(b.client) +
      " · " +
      b.pax +
      " khách<br>" +
      fmt(b.start) +
      " — " +
      fmt(b.end) +
      "<br>HDV: " +
      esc(g?.name || "—") +
      "</p><table><tr><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Trạng thái</th></tr>" +
      b.services
        .filter((s) => s.needed)
        .map(
          (s) =>
            "<tr><td>" +
            typesVI[s.type] +
            "</td><td>" +
            esc(state.suppliers.find((n) => n.id === s.supplier)?.name) +
            "</td><td>" +
            (s.confirmed ? "Đã xác nhận" : "Chờ xác nhận") +
            "</td></tr>",
        )
        .join("") +
      "</table><p>Chi tiết phòng, giờ đón và mã xác nhận NCC cần được bổ sung trong triển khai.</p>",
  );
}
/* EXTENSIONS */

function openBooking(id) {
  renderBookingDetails(id);
  let b = state.bookings.find((b) => b.id === id),
    steps = [
      "Booking Confirmed",
      "Operation Assigned",
      "Book Services",
      "Supplier Confirmed",
      "Voucher Ready",
      "Guide Assigned",
      "Tour Running",
      "Completed",
    ];
  let checks = [
    true,
    !!b.operator,
    b.services.some((s) => s.needed),
    b.services
      .filter((s) => s.needed && s.type !== "Guide")
      .every((s) => s.confirmed),
    b.voucher,
    !!b.guide,
    b.status === "Running" || b.status === "Completed",
    b.status === "Completed",
  ];
  document.querySelector(".modal .flow").innerHTML = steps
    .map(
      (x, i) =>
        '<span class="' + (checks[i] ? "on" : "") + '">' + x + "</span>",
    )
    .join("");
  let actions = "";
  if (can("operations_manage")) {
    actions =
      btn("Giao điều hành", "operationForm('" + id + "')") +
      btn("Bảng chi phí & lợi nhuận", "costDetail('" + id + "')") +
      btn("Ghi nhận sự cố", "issueForm('" + id + "')");
    if (b.guide && !b.guideConfirmed)
      actions += btn(
        "Xác nhận HDV nhận tour",
        "confirmGuide('" + id + "')",
        "primary",
      );
  }
  document
    .querySelector(".modal")
    .insertAdjacentHTML(
      "beforeend",
      '<div class="actions" style="margin-top:18px">' + actions + "</div>",
    );
}

function operationForm(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Operation Assigned · " + id,
    `<form onsubmit="assignOperator(event,'${id}')"><label>Điều hành phụ trách<select name="operator">${operationOwners.map((owner) => `<option>${esc(owner)}</option>`).join("")}</select></label><div class="formfooter"><button class="btn primary">Bàn giao booking</button></div></form>`,
    true,
  );
}

function assignOperator(e, id) {
  e.preventDefault();
  let b = state.bookings.find((b) => b.id === id);
  b.operator = new FormData(e.target).get("operator");
  log(id + " bàn giao " + b.operator);
  openBooking(id);
  render();
}

function costDetail(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Cost & Profit · " + id,
    card(
      "Dự toán tour",
      line("Revenue", money(b.revenue)) +
        line("Cost", money(b.cost)) +
        line("Profit", money(b.revenue - b.cost)) +
        line(
          "Margin",
          (((b.revenue - b.cost) / b.revenue) * 100).toFixed(1) + "%",
        ),
    ) +
      card(
        "Chi phí dịch vụ",
        table(
          ["DỊCH VỤ", "COST"],
          b.services
            .filter((s) => s.needed)
            .map(
              (s) =>
                "<tr><td>" +
                typesVI[s.type] +
                "</td><td>" +
                money(s.cost) +
                "</td></tr>",
            ),
        ),
      ),
  );
}

views.operations = () =>
  renderOperationTours() +
  card(
    "Operations Dashboard · Supplier / Guide Issues",
    table(
      ["ISSUE", "BOOKING", "TYPE", "NỘI DUNG", "STATUS", "THAO TÁC"],
      state.issues.map(
        (i) =>
          "<tr><td>" +
          i.id +
          "</td><td>" +
          i.booking +
          "</td><td>" +
          i.type +
          '</td><td style="white-space:normal">' +
          esc(i.note) +
          "</td><td>" +
          badge(i.status, i.status === "Open" ? "amber" : "green") +
          "</td><td>" +
          (i.status === "Open"
            ? btn("Đã xử lý", "resolveIssue('" + i.id + "')", "small")
            : "—") +
          "</td></tr>",
      ),
    ),
  );

function issueForm(id) {
  modal(
    "Sự cố tour · " + id,
    `<form onsubmit="addIssue(event,'${id}')"><label>Loại<select name="type"><option>Supplier</option><option>Guide</option></select></label><label>Nội dung<textarea name="note" required></textarea></label><div class="formfooter"><button class="btn primary">Lưu sự cố</button></div></form>`,
    true,
  );
}

function addIssue(e, id) {
  e.preventDefault();
  let f = new FormData(e.target);
  state.issues.push({
    id: "IS-" + Date.now(),
    booking: id,
    type: f.get("type"),
    note: f.get("note"),
    status: "Open",
  });
  log(id + " có sự cố " + f.get("type"));
  closeModal();
  render();
}

function resolveIssue(id) {
  state.issues.find((i) => i.id === id).status = "Resolved";
  log("Xử lý " + id);
  render();
}
