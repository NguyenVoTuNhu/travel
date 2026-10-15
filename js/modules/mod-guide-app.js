/* MODULE mod-guide-app — giao diện và nghiệp vụ của phân hệ Travel. */

let guideUser = "";

function activeGuideId() {
  if (can("guide_portal")) return currentUser?.guideId || "";
  return guideUser || state.guides[0]?.id || "";
}

const renderGuideMobileTours = () => {
  const selectedGuideId = activeGuideId();
  let g = state.guides.find((g) => g.id === selectedGuideId),
    bs = state.bookings.filter(
      (b) => b.guide === selectedGuideId && b.status !== "Completed",
    );
  if (!g) return title("Giao diện dành cho HDV", "Tài khoản chưa được liên kết hồ sơ hướng dẫn viên.");
  return (
    title(
      "Giao diện dành cho HDV",
      "Mô phỏng màn hình mobile · Chỉ xem tour được phân công.",
      can("guide_switch_profile")
        ? `<select class="role" aria-label="Chọn HDV để xem" onchange="guideUser=this.value;render()">${state.guides.map((guide) => '<option value="' + guide.id + '" ' + (guide.id === selectedGuideId ? "selected" : "") + ">" + guide.name + "</option>").join("")}</select>`
        : "",
    ) +
    `<div class="mobiletour"><div class="sub">TYPICONE ERP / GUIDE SPACE</div><h2>Xin chào, ${esc(g.name.split(" ").slice(-2).join(" "))}.</h2><p class="sub">Bạn có ${bs.length} tour được giao.</p>${bs.map((b) => `<section class="hero"><div><div class="eyebrow">${b.id} · ${b.pax} KHÁCH</div><h3>${esc(b.tour)}</h3><p>${fmt(b.start)} — ${fmt(b.end)}</p>${bookStatus(b)}</div></section>${btn("Khách & lịch trình", "guideTour('" + b.id + "')", "primary")} ${b.voucher ? btn("Voucher", "printVoucher('" + b.id + "')") : ""}<hr style="border:0;border-top:1px solid var(--line);margin:23px 0">`).join("") || '<div class="empty">Chưa có tour được phân công.</div>'}<div class="alert"><b>Liên hệ khẩn cấp</b>Điều hành: thông tin liên hệ demo<br>Thiết lập số hotline khi triển khai.</div></div>`
  );
};

function guideTour(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (can("guide_portal") && b.guide !== activeGuideId())
    return toast("Tour không được giao cho HDV này.");
  modal(
    "Tour được giao · " + id,
    card(
      "Danh sách khách",
      b.passengers
        .map(
          (p) =>
            '<div class="metricline">' +
            esc(p.name) +
            '<span class="sub">' +
            esc(p.notes) +
            "</span></div>",
        )
        .join(""),
    ) +
      card(
        "Lịch trình",
        b.program?.length
          ? b.program
              .map(
                (p, i) =>
                  '<div class="timeline"><b>Ngày ' +
                  (i + 1) +
                  "</b><p>" +
                  esc(p) +
                  "</p></div>",
              )
              .join("")
          : '<div class="timeline"><b>' +
              fmt(b.start) +
              ' · Đón khách</b><p>Kiểm tra danh sách khách, hướng dẫn nhận phòng.</p></div><div class="timeline"><b>Trong tour · Thực hiện chương trình</b><p>Lịch trình chi tiết cần được điều hành bổ sung trước khởi hành.</p></div><div class="timeline"><b>' +
              fmt(b.end) +
              " · Tiễn khách</b><p>Hoàn tất tour và báo cáo.</p></div>",
      ),
  );
}

views.guideapp = () =>
  renderGuideMobileTours() +
  card(
    "Assignment confirmation",
    state.bookings
      .filter(
        (b) =>
          b.guide === activeGuideId() &&
          b.status !== "Completed" &&
          !b.guideConfirmed,
      )
      .map(
        (b) =>
          '<div class="metricline">' +
          b.id +
          btn(
            "Xác nhận nhận tour",
            "confirmGuide('" + b.id + "')",
            "small primary",
          ) +
          "</div>",
      )
      .join("") || '<p class="sub">Không có tour chờ xác nhận.</p>',
  );
