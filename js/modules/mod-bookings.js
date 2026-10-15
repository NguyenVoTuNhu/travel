/* MODULE mod-bookings — giao diện và nghiệp vụ của phân hệ Travel. */

views.bookings = () =>
  title(
    "Quản lý bookings",
    "Hồ sơ thống nhất giữa Sales, điều hành và kế toán.",
    btn("Xuất CSV", "exportData('bookings')"),
  ) +
  card(
    "Danh sách booking",
    `<div class="filters"><input placeholder="Tìm booking, khách, hành trình…" aria-label="Tìm booking" oninput="filterBookingRows(this.value)"><select aria-label="Lọc trạng thái booking" onchange="bookingFilter=this.value;render()">${[
      ["all", "Tất cả trạng thái"],
      ["Preparing", "Chuẩn bị"],
      ["Running", "Đang chạy"],
      ["Completed", "Hoàn tất"],
    ]
      .map(
        ([v, l]) =>
          '<option value="' +
          v +
          '" ' +
          (bookingFilter === v ? "selected" : "") +
          ">" +
          l +
          "</option>",
      )
      .join("")}</select></div>` +
      table(
        [
          "BOOKING",
          "KHÁCH / CHƯƠNG TRÌNH",
          "THỜI GIAN",
          "PAX",
          "GIÁ TRỊ",
          "TIẾN ĐỘ",
          "TRẠNG THÁI",
        ],
        state.bookings
          .filter((b) => bookingFilter === "all" || b.status === bookingFilter)
          .map(
            (b) =>
              '<tr class="bookrow" data-search="' +
              esc([b.id, b.client, b.tour].join(" ").toLowerCase()) +
              '"><td>' +
              bkLink(b) +
              "</td><td><strong>" +
              esc(b.client) +
              '</strong><span class="sub">' +
              esc(b.tour) +
              "</span></td><td>" +
              fmt(b.start) +
              '<span class="sub">' +
              fmt(b.end) +
              "</span></td><td>" +
              b.pax +
              "</td><td>" +
              money(b.revenue) +
              "</td><td>" +
              progress(b) +
              "%</td><td>" +
              bookStatus(b) +
              "</td></tr>",
          ),
      ),
  );

function filterBookingRows(q) {
  document
    .querySelectorAll(".bookrow")
    .forEach((r) => (r.hidden = !r.dataset.search.includes(q.toLowerCase())));
}

function passengerDetail(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Danh sách khách · " + id,
    card(
      "Rooming list mẫu",
      table(
        ["STT", "HỌ TÊN", "GHI CHÚ"],
        b.passengers.map(
          (p, i) =>
            "<tr><td>" +
            (i + 1) +
            "</td><td>" +
            esc(p.name) +
            "</td><td>" +
            esc(p.notes) +
            "</td></tr>",
        ),
      ),
    ) +
      '<p class="notice">Tên khách mẫu; chưa lưu hộ chiếu hoặc dữ liệu nhạy cảm thật. Khi triển khai cần quản lý phòng, chế độ ăn và quyền truy cập dữ liệu khách.</p>',
  );
}
