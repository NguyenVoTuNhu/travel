/* MODULE mod-guides — giao diện và nghiệp vụ của phân hệ Travel. */

function available(g, b) {
  return !state.bookings.some(
    (x) =>
      x.id !== b.id &&
      x.status !== "Completed" &&
      x.guide === g.id &&
      x.start <= b.end &&
      x.end >= b.start,
  );
}

function assignForm(id) {
  let b = state.bookings.find((b) => b.id === id);
  modal(
    "Phân công HDV · " + id,
    `<p class="sub">${fmt(b.start)} – ${fmt(b.end)}. HDV có lịch trùng không thể được chọn.</p><form onsubmit="saveGuide(event,'${id}')"><label>HDV phù hợp<select name="guide" required><option value="">Chọn HDV</option>${state.guides.map((g) => '<option value="' + g.id + '" ' + (!available(g, b) ? "disabled" : "") + " " + (b.guide === g.id ? "selected" : "") + ">" + esc(g.name) + " · " + esc(g.lang) + " · " + (available(g, b) ? "Trống lịch" : "Trùng lịch") + "</option>").join("")}</select></label><p class="notice">Ngôn ngữ và địa bàn hiển thị để điều hành chọn. Tự động tối ưu HDV chưa được kết nối trong demo.</p><div class="formfooter"><button class="btn primary" type="submit">Xác nhận phân công</button></div></form>`,
    true,
  );
}

function saveGuide(e, id) {
  e.preventDefault();
  let b = state.bookings.find((b) => b.id === id),
    f = new FormData(e.target),
    g = state.guides.find((g) => g.id === f.get("guide"));
  if (!g || !available(g, b))
    return toast("HDV có lịch trùng, hãy chọn người khác.");
  b.guide = g.id;
  b.guideConfirmed = false;
  let svc = b.services.find((s) => s.type === "Guide");
  if (svc) svc.confirmed = false;
  log(id + " phân công " + g.name);
  render();
  openBooking(id);
  toast("Đã phân công. HDV hoặc Điều hành cần xác nhận nhận tour.");
}

const renderGuideProfiles = () =>
  title(
    "Đội ngũ hướng dẫn viên",
    `${state.guides.length} HDV · Năng lực ngôn ngữ, địa bàn và lịch phân công.`,
    btn("Mở giao diện HDV", "go('guideapp')"),
  ) +
  `<div class="guidegrid">${state.guides
    .map((g) => {
      let bs = state.bookings.filter(
        (b) => b.guide === g.id && b.status !== "Completed",
      );
      return `<article class="guidecard"><div class="cardhead"><div class="guideavatar">${g.name
        .split(" ")
        .slice(-2)
        .map((x) => x[0])
        .join(
          "",
        )}</div>${badge(bs.length ? "Đã có lịch" : "Chưa có lịch", bs.length ? "amber" : "green")}</div><h3>${esc(g.name)}</h3><div class="sub">${g.id} · ${g.area}</div><div class="tagset" style="margin:15px 0">${g.lang
        .split(", ")
        .map((l) => badge(l))
        .join(
          "",
        )}</div>${line("Điểm đánh giá", g.rating.toFixed(1) + "/5")}${line("Đơn giá tham khảo", money(g.rate) + "/ngày")}<div style="margin-top:15px">${bs.map((b) => '<div class="sub">' + b.id + " · " + fmt(b.start) + " — " + fmt(b.end) + "</div>").join("") || '<div class="sub">Trống lịch trong các booking mẫu hiện có.</div>'}</div><div class="formfooter">${btn("Hồ sơ & lịch", "guideDetail('" + g.id + "')", "small")}</div></article>`;
    })
    .join(
      "",
    )}</div><p class="notice">Lịch được kiểm tra theo khoảng ngày booking; khi chạy thật cần lịch theo giờ, ngày nghỉ, địa bàn và trạng thái HDV nhận tour.</p>`;

function guideDetail(id) {
  let g = state.guides.find((g) => g.id === id),
    bs = state.bookings.filter((b) => b.guide === id);
  modal(
    "Hồ sơ " + esc(g.name),
    card(
      "Năng lực",
      line("Ngôn ngữ", g.lang) +
        line("Địa bàn", g.area) +
        line("Đơn giá", money(g.rate) + "/ngày") +
        line("Đánh giá", g.rating.toFixed(1) + "/5"),
    ) +
      card(
        "Lịch phân công",
        bs
          .map(
            (b) =>
              '<div class="timeline"><b>' +
              b.id +
              " · " +
              esc(b.tour) +
              "</b><p>" +
              fmt(b.start) +
              " – " +
              fmt(b.end) +
              " · " +
              b.pax +
              " khách</p>" +
              bookStatus(b) +
              "</div>",
          )
          .join("") || '<p class="sub">Chưa có phân công.</p>',
      ),
  );
}

function confirmGuide(id) {
  let b = state.bookings.find((b) => b.id === id);
  if (can("guide_portal") && b.guide !== activeGuideId()) return;
  b.guideConfirmed = true;
  let s = b.services.find((s) => s.type === "Guide");
  if (s) s.confirmed = true;
  log(id + " HDV xác nhận nhận tour");
  render();
  toast("Đã xác nhận HDV nhận tour.");
  if (!can("guide_portal")) openBooking(id);
}

views.guides = () =>
  renderGuideProfiles() +
  card(
    "Guide Calendar · Lịch phân công",
    table(
      ["GUIDE", "BOOKING", "START", "END", "ASSIGNMENT"],
      state.bookings
        .filter((b) => b.guide)
        .map(
          (b) =>
            "<tr><td>" +
            esc(state.guides.find((g) => g.id === b.guide)?.name) +
            "</td><td>" +
            b.id +
            "</td><td>" +
            fmt(b.start) +
            "</td><td>" +
            fmt(b.end) +
            "</td><td>" +
            badge(
              b.guideConfirmed ? "Confirmed" : "Assigned",
              b.guideConfirmed ? "green" : "amber",
            ) +
            "</td></tr>",
        ),
    ),
  );
