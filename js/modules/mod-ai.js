/* MODULE mod-ai — tự động hóa AI và thuật toán phân tích thông minh. */

views.ai = () =>
  title(
    "Tự động hóa thông minh (AI Automation)",
    "Hỗ trợ viết lịch trình tour, dịch thuật đa ngữ, gợi ý phân công hướng dẫn viên và tối ưu hóa biên lợi nhuận.",
    badge("Giai đoạn 4 · Thuật toán mô phỏng", "green"),
  ) +
  `<div class="stats">
    ${stat("CHỨC NĂNG AI TỰ ĐỘNG", "4 Module", "Lịch trình · Dịch thuật · Gán HDV · Lợi nhuận")}
    ${stat("TOUR SẴN SÀNG PHÂN TÍCH", state.bookings.length, "Dữ liệu hợp đồng trong hệ thống")}
    ${stat("HDV KHẢ DỤNG GỢI Ý", state.guides.length, "Thuật toán khớp ngôn ngữ & điểm rating")}
    ${stat("MÔ HÌNH XỬ LÝ", "OpenAI / Rules", "Chuẩn bị tích hợp API chìa khóa riêng")}
  </div>
  <div class="grid">
    <div>
      ${card(
        "🤖 Trợ lý AI viết chương trình & Báo giá tự động",
        "<p style='color: var(--muted); margin-bottom: 14px;'>Hệ thống tự động phân tích nhu cầu từ Lead CRM (ngân sách, thị trường, số khách, thời lượng) và đề xuất lịch trình tour mẫu tối ưu kèm dự toán chi phí.</p>" +
          btn("Mở công cụ Thiết kế tour AI →", "go('design')", "primary"),
      )}
      ${card(
        "🌐 AI Hỗ trợ biên dịch đa ngữ Pháp – Anh – Việt",
        "<p style='color: var(--muted); margin-bottom: 12px;'>Hỗ trợ tự động chuyển đổi ngôn ngữ lịch trình theo thị trường mục tiêu của khách đoàn (khách Pháp, khách Châu Âu hoặc nội địa) chuẩn văn phong lữ hành.</p>" +
          "<div class='alert green'>Được tích hợp sẵn trong phân hệ Thiết kế tour khi chọn ngôn ngữ chương trình.</div>",
      )}
    </div>
    <div>
      ${card(
        "🧭 Gợi ý phân công Hướng dẫn viên phù hợp nhất",
        `<label>Chọn Tour cần phân công HDV:
          <select id="aibooking" style="margin-top: 6px;">${state.bookings
            .filter((b) => b.status === "Preparing")
            .map(
              (b) =>
                '<option value="' +
                b.id +
                '">' +
                b.id +
                " · " +
                esc(b.tour) +
                " (" +
                b.pax +
                " khách)" +
                "</option>",
            )
            .join("")}</select>
        </label>
        <div style="margin-top: 10px;">
          ${btn("Chạy thuật toán gợi ý HDV", "suggestGuide()", "primary")}
        </div>
        <div id="guideai" style="margin-top: 14px;"></div>`,
      )}
      ${card(
        `${systemIcon("chart-line")} Phân tích thông minh biên lợi nhuận (Profit Analytics)`,
        `<p style='color: var(--muted); margin-bottom: 12px;'>Kiểm tra toàn bộ hợp đồng đặt chỗ, cảnh báo các tour có nguy cơ vượt chi phí dự toán hoặc biên lợi nhuận thấp hơn mức tiêu chuẩn.</p>` +
          btn("Phân tích danh sách booking", "analyseProfit()", "primary") +
          '<div id="profitai" style="margin-top: 14px;"></div>',
      )}
    </div>
  </div>
  <div class="alert green" style="margin-top: 14px;">
    <b>Ghi chú vận hành:</b> Các gợi ý phân công và phân tích chi phí dựa trên thuật toán tối ưu hóa lịch trống, điểm rating và biên an toàn ngân sách. Mọi quyết định cuối cùng đều qua kiểm duyệt của Trưởng bộ phận Điều hành.
  </div>`;

function suggestGuide() {
  let b = state.bookings.find(
    (b) => b.id === document.getElementById("aibooking").value,
  );
  if (!b) return toast("Hiện không có booking nào ở trạng thái Chờ chuẩn bị.");
  let list = state.guides
    .filter((g) => available(g, b))
    .sort((a, b) => b.rating - a.rating);
  document.getElementById("guideai").innerHTML = table(
    ["HƯỚNG DẪN VIÊN", "NGOẠI NGỮ", "ĐỊA BÀN", "ĐÁNH GIÁ", "THAO TÁC"],
    list
      .slice(0, 5)
      .map(
        (g) =>
          "<tr><td><strong>" +
          esc(g.name) +
          "</strong></td><td>" +
          esc(g.lang) +
          "</td><td>" +
          esc(g.area) +
          "</td><td><b>⭐ " +
          g.rating.toFixed(1) +
          "</b></td><td>" +
          btn("Chọn phân công", "openBooking('" + b.id + "')", "small primary") +
          "</td></tr>",
      ),
  );
}

function analyseProfit() {
  document.getElementById("profitai").innerHTML = table(
    ["MÃ TOUR", "DOANH THU", "DỰ TOÁN CHI PHÍ", "LỢI NHUẬN GỘP", "BIÊN LỢI NHUẬN", "ĐÁNH GIÁ TỰ ĐỘNG"],
    state.bookings.map((b) => {
      const margin = b.revenue ? (((b.revenue - b.cost) / b.revenue) * 100).toFixed(1) : "0";
      const isLow = Number(margin) < 15;
      return (
        "<tr><td><strong>" +
        b.id +
        "</strong></td><td>" +
        money(b.revenue) +
        "</td><td>" +
        money(b.cost) +
        "</td><td><b class='moneypositive'>" +
        money(b.revenue - b.cost) +
        "</b></td><td>" +
        badge(margin + "%", isLow ? "amber" : "green") +
        "</td><td>" +
        (b.cost > b.revenue
          ? "<span style='color: var(--red); font-weight: 600;'>Cần rà soát lại chi phí nhà cung cấp</span>"
          : isLow
            ? "<span style='color: var(--amber); font-weight: 600;'>Biên an toàn thấp, chú ý phát sinh</span>"
            : "<span style='color: var(--green); font-weight: 600;'>Biên lợi nhuận đạt tiêu chuẩn</span>") +
        "</td></tr>"
      );
    }),
  );
}
