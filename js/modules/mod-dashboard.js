/* MODULE mod-dashboard — giao diện và nghiệp vụ của phân hệ Travel. */

const renderDashboardOverview = () => {
  let bs = state.bookings,
    rev = bs.reduce((n, b) => n + b.revenue, 0),
    cost = bs.reduce((n, b) => n + b.cost, 0),
    run = bs.filter((b) => b.status === "Running"),
    pending = bs.filter((b) => b.status === "Preparing"),
    debt = bs.reduce((n, b) => n + balance(b), 0),
    ap = state.payables
      .filter((p) => p.status !== "Paid")
      .reduce((n, p) => n + p.amount, 0);
  const salesOwners = [
    ...new Set(bs.map((booking) => booking.sales).filter(Boolean)),
  ];
  return (
    title(
      "Toàn cảnh hoạt động",
      "Theo dõi dữ liệu database từ bán tour đến hoàn tất dịch vụ.",
      btn("Hướng dẫn trình bày demo", "go('help')"),
    ) +
    `<section class="hero"><div><div class="eyebrow">HÀNH TRÌNH TIẾP THEO, ĐƯỢC QUẢN LÝ TRỌN VẸN</div><h2>Mỗi hành trình.<br>Một nơi để điều hành.</h2><p>${run.length} tour đang vận hành, ${pending.length} tour cần chuẩn bị. Tập trung vào dịch vụ còn thiếu và những khoản thu cần theo dõi.</p>${btn("Mở trung tâm điều hành ↗", "go('operations')", "primary")}</div><div class="heroart"><div class="orbit"></div><div class="orbit two"></div><div class="plane">✈</div><div class="triptag">ĐIỀU HÀNH TOUR TRỰC TIẾP</div></div></section><div class="stats">${stat("GIÁ TRỊ ĐẶT CHỖ THÁNG", short(rev), bs.length + " đặt chỗ · Giá trị hợp đồng")}${stat("LỢI NHUẬN DỰ KIẾN", short(rev - cost), rev ? (((rev - cost) / rev) * 100).toFixed(1) + "% biên dự kiến · Chưa trừ chi phí chung" : "Chưa có đặt chỗ")}${stat("TOUR ĐANG CHẠY", run.length, run.reduce((n, b) => n + b.pax, 0) + " khách đang đi tour")}${stat("CÔNG NỢ KHÁCH HÀNG", short(debt), "Công nợ NCC: " + short(ap))}</div><div class="grid"><div>${card(
      "Tour cần chuẩn bị",
      table(
        ["BOOKING / HÀNH TRÌNH", "KHỞI HÀNH", "TIẾN ĐỘ", "ĐIỀU HÀNH"],
        pending.map(
          (b) =>
            "<tr><td>" +
            bkLink(b) +
            '<span class="sub">' +
            esc(b.tour) +
            "</span></td><td>" +
            fmt(b.start) +
            '</td><td><div class="barrow"><div class="bar"><i style="width:' +
            progress(b) +
            '%"></i></div><small>' +
            progress(b) +
            "%</small></div></td><td>" +
            esc(b.operator) +
            "</td></tr>",
        ),
      ),
      btn("Xem tất cả", "go('operations')", "small"),
    )}${card("Luồng trình bày với khách hàng", `<div class="journey"><button onclick="go('crm')"><span class="num">01 / KINH DOANH</span><b>Tiếp nhận khách hàng tiềm năng</b><small>Tư vấn · Theo dõi khách</small></button><button onclick="go('quotes')"><span class="num">02 / ĐẶT CHỖ</span><b>Chốt chương trình</b><small>Báo giá · Xác nhận tour</small></button><button onclick="go('operations')"><span class="num">03 / ĐIỀU HÀNH</span><b>Điều hành tour</b><small>NCC · HDV · Phiếu dịch vụ</small></button><button onclick="go('accounting')"><span class="num">04 / TÀI CHÍNH</span><b>Thu chi & công nợ</b><small>Thu tiền · Duyệt chi</small></button></div>`)}</div><div>${card(
      "Cần chú ý",
      pending
        .slice(0, 3)
        .map(
          (b) =>
            '<div class="alert"><b>' +
            b.id +
            " · " +
            fmt(b.start) +
            "</b>" +
            b.services.filter((s) => s.needed && !s.confirmed).length +
            " dịch vụ chờ xác nhận" +
            (!b.guide ? " · Chưa có HDV" : "") +
            "</div>",
        )
        .join("") +
        '<div class="alert red"><b>Công nợ nhà cung cấp</b>' +
        state.payables.filter(
          (p) =>
            p.status !== "Paid" &&
            p.due < new Date().toLocaleDateString("en-CA"),
        ).length +
        " khoản đã quá hạn.</div>",
    )}${card(
      "Giá trị booking theo Sales",
      `<div class="reportbars">${salesOwners
        .map((s, i) => {
          let v = bs
            .filter((b) => b.sales === s)
            .reduce((n, b) => n + b.revenue, 0);
          return (
            '<div class="reportbar" style="height:' +
            Math.max(25, (v / rev) * 210) +
            "px;background:" +
            (i ? "#b3c6a5" : "#598771") +
            '"><strong>' +
            short(v) +
            "</strong><span>" +
            s +
            "</span></div>"
          );
        })
        .join(
          "",
        )}</div><div class="notice">Tính từ dữ liệu database và cập nhật sau mỗi thao tác.</div>`,
    )}</div></div>`
  );
};

views.dashboard = () => {
  let bs = state.bookings,
    done = bs.filter((b) => b.feedback),
    open = state.issues.filter((i) => i.status === "Open");
  return (
    renderDashboardOverview() +
    `<div class="stats">${stat(
      "KHÁCH ĐANG ĐI TOUR",
      bs.filter((b) => b.status === "Running").reduce((n, b) => n + b.pax, 0),
      "Tổng pax của tour Running",
    )}${stat("CÔNG NỢ NCC", short(state.payables.filter((p) => p.status !== "Paid").reduce((n, p) => n + p.amount, 0)), "Hóa đơn chưa thanh toán")}${stat("SUPPLIER ISSUES", open.filter((i) => i.type === "Supplier").length, "Sự cố NCC đang mở")}${stat("GUIDE ISSUES", open.filter((i) => i.type === "Guide").length, "Sự cố HDV đang mở")}</div><div class="grid">${card(
      "Sales & Marketing KPI",
      line("Leads", state.leads.length) +
        line("Quotations", state.quotes.length) +
        line("Won", state.leads.filter((l) => l.status === "WON").length) +
        line(
          "Traffic",
          state.campaigns.reduce((n, c) => n + c.traffic, 0),
        ) +
        line(
          "Campaign Leads",
          state.campaigns.reduce((n, c) => n + c.leads, 0),
        ),
    )}${card(
      "Operations & Accounting KPI",
      line("Tours Running", bs.filter((b) => b.status === "Running").length) +
        line(
          "Pending Services",
          bs.reduce(
            (n, b) =>
              n + b.services.filter((s) => s.needed && !s.confirmed).length,
            0,
          ),
        ) +
        line(
          "CSAT",
          done.length
            ? (
                done.reduce((n, b) => n + b.feedback.score, 0) / done.length
              ).toFixed(1) + "/5"
            : "Chưa có",
        ) +
        line("Receivable", short(bs.reduce((n, b) => n + balance(b), 0))) +
        line(
          "Payable",
          short(
            state.payables
              .filter((p) => p.status !== "Paid")
              .reduce((n, p) => n + p.amount, 0),
          ),
        ),
    )}</div>`
  );
};
