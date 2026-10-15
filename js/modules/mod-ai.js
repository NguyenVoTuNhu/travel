/* MODULE mod-ai — giao diện và nghiệp vụ của phân hệ Travel. */

views.ai = () =>
  title(
    "AI Automation · Phase 4",
    "AI chương trình tour · Quotation · Dịch Pháp–Anh–Việt · Guide · Profit",
    badge("Mô phỏng · Chưa gọi OpenAI API", "amber"),
  ) +
  card(
    "AI viết chương trình và tạo quotation",
    "<p>Chọn khách và mẫu chương trình, nhập Country, Pax, Budget, Duration, chỉnh Draft Program rồi chuyển sang Quotation.</p>" +
      btn("AI Itinerary Builder", "go('design')", "primary"),
  ) +
  card(
    "AI dịch Pháp–Anh–Việt",
    "<p>Trong Thiết kế tour, chọn ngôn ngữ Việt / Anh / Pháp để thử chương trình mẫu. Dịch thuật tự do và nội dung cá nhân hóa cần kết nối OpenAI API.</p>",
  ) +
  card(
    "AI phân công guide · Gợi ý mẫu",
    `<label>Tour<select id="aibooking">${state.bookings
      .filter((b) => b.status === "Preparing")
      .map(
        (b) =>
          '<option value="' +
          b.id +
          '">' +
          b.id +
          " · " +
          esc(b.tour) +
          "</option>",
      )
      .join(
        "",
      )}</select></label>${btn("Gợi ý HDV còn lịch", "suggestGuide()", "primary")}<div id="guideai" style="margin-top:15px"></div>`,
  ) +
  card(
    "AI phân tích lợi nhuận · Phân tích quy tắc mẫu",
    btn("Phân tích danh sách booking", "analyseProfit()") +
      '<div id="profitai" style="margin-top:15px"></div>',
  ) +
  '<div class="alert">Các đề xuất dựa trên lịch trống, rating và phép tính chi phí trong demo. Chưa có mô hình AI thật, chưa tự gửi hay tự phân công mà không qua người duyệt.</div>';

function suggestGuide() {
  let b = state.bookings.find(
    (b) => b.id === document.getElementById("aibooking").value,
  );
  if (!b) return toast("Chưa có booking cần chuẩn bị.");
  let list = state.guides
    .filter((g) => available(g, b))
    .sort((a, b) => b.rating - a.rating);
  document.getElementById("guideai").innerHTML = table(
    ["GUIDE", "LANGUAGE", "AREA", "RATING", "THAO TÁC"],
    list
      .slice(0, 5)
      .map(
        (g) =>
          "<tr><td>" +
          esc(g.name) +
          "</td><td>" +
          esc(g.lang) +
          "</td><td>" +
          esc(g.area) +
          "</td><td>" +
          g.rating.toFixed(1) +
          "</td><td>" +
          btn("Điều hành kiểm tra", "openBooking('" + b.id + "')", "small") +
          "</td></tr>",
      ),
  );
}

function analyseProfit() {
  document.getElementById("profitai").innerHTML = table(
    ["BOOKING", "REVENUE", "COST", "PROFIT", "MARGIN", "NHẬN XÉT MẪU"],
    state.bookings.map(
      (b) =>
        "<tr><td>" +
        b.id +
        "</td><td>" +
        money(b.revenue) +
        "</td><td>" +
        money(b.cost) +
        "</td><td>" +
        money(b.revenue - b.cost) +
        "</td><td>" +
        (((b.revenue - b.cost) / b.revenue) * 100).toFixed(1) +
        "%</td><td>" +
        (b.cost > b.revenue
          ? "Chi phí vượt giá bán, cần kiểm tra dự toán."
          : "Theo dõi chi phí thực tế và đối soát sau tour.") +
        "</td></tr>",
    ),
  );
}
