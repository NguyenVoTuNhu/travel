/* MODULE mod-help — tài liệu hướng dẫn và đối chiếu phân hệ TypicOne ERP. */

let helpActiveTab = "scenarios";

views.help = () => {
  const auditLogs = (state.logs || []).slice(0, 30);

  let tabContent = "";
  if (helpActiveTab === "scenarios") {
    tabContent =
      card(
        "Kịch bản trình diễn 1 · Điều hành một tour du lịch đã có",
        `<div class="timeline">
          <b>01 · Mở Tổng quan hoạt động (Dashboard Giám đốc)</b>
          <p>Kiểm tra các chỉ số doanh thu, biên lợi nhuận dự kiến, công nợ phải thu và các cảnh báo thiếu dịch vụ được đồng bộ trực tiếp từ database.</p>
        </div>
        <div class="timeline">
          <b>02 · Mở hồ sơ Booking cần chuẩn bị (Trung tâm Điều hành)</b>
          <p>Mở checklist dịch vụ, lựa chọn nhà cung cấp đúng loại hình dịch vụ (khách sạn, nhà hàng, xe...) và chốt trạng thái xác nhận. Cập nhật chi phí thực tế để hệ thống tự động tính lại biên lợi nhuận.</p>
        </div>
        <div class="timeline">
          <b>03 · Phân công Hướng dẫn viên (Guide Assignment)</b>
          <p>Lựa chọn HDV còn lịch trống. Hệ thống tự động khóa và cảnh báo nếu HDV bị trùng lịch dẫn đoàn với tour khác trong cùng khoảng thời gian.</p>
        </div>
        <div class="timeline">
          <b>04 · Xuất Phiếu dịch vụ (Voucher) → Bắt đầu tour (Running)</b>
          <p>Sau khi toàn bộ dịch vụ NCC được xác nhận, voucher được khởi tạo và HDV được gán, điều hành bắt đầu chuyển tour sang trạng thái <i>Đang chạy</i>.</p>
        </div>
        <div class="timeline">
          <b>05 · Hoàn tất tour → Thu tiền quyết toán → Nhập đánh giá (CSAT)</b>
          <p>Chuyển tour sang <i>Hoàn tất</i>, sang phân hệ Kế toán để ghi nhận số tiền còn lại và mở Chăm sóc khách hàng để thu thập phản hồi của đoàn.</p>
        </div>`,
      ) +
      card(
        "Kịch bản trình diễn 2 · Quy trình từ Khách tiềm năng (Lead) đến Hợp đồng mới",
        `<div class="timeline">
          <b>01 · Tiếp nhận Lead (CRM Sales)</b>
          <p>Nhập thông tin khách, thị trường, ngân sách, số lượng khách và phân công cho nhân viên kinh doanh. Hệ thống tự động kích hoạt luồng follow-up và tính toán ngày hẹn kế tiếp.</p>
        </div>
        <div class="timeline">
          <b>02 · Thiết kế chương trình & dự toán (Tour Design)</b>
          <p>Nạp template tour từ database, tùy chỉnh chi tiết từng ngày, nhập giá bán nhóm và dự toán chi phí. Hệ thống hỗ trợ đa ngôn ngữ (Việt - Anh - Pháp) và quy đổi ngoại tệ.</p>
        </div>
        <div class="timeline">
          <b>03 · Phát hành báo giá có phiên bản (Quotation Management)</b>
          <p>Tạo báo giá, lưu phiên bản (v1, v2...), xem và in bản PDF chính thức gửi khách. Khi khách đồng ý, nhấn <i>Khách chấp nhận</i> để tự động chuyển thành Booking mới.</p>
        </div>
        <div class="timeline">
          <b>04 · Quản lý tài chính & Đặt cọc (Accounting)</b>
          <p>Tạo hóa đơn đặt cọc, ghi nhận thu tiền thực tế từ khách hàng, phát hành voucher và chuyển giao hồ sơ đoàn sang bộ phận Điều hành tour.</p>
        </div>`,
      );
  } else if (helpActiveTab === "modules") {
    tabContent =
      card(
        "Bảng đối chiếu 12 phân hệ ERP Typic Travel (Demo vs Thực tế)",
        table(
          ["PHÂN HỆ HỆ THỐNG", "MỨC ĐỘ THỂ HIỆN TRÊN BẢN DEMO", "TÍCH HỢP TRÊN PRODUCTION"],
          [
            [
              "1. Dashboard Giám đốc",
              "Chỉ số hợp đồng, doanh thu, lợi nhuận, tour running, công nợ, cảnh báo khẩn cấp",
              "Tích hợp BI đa chiều, lọc kỳ tài chính tùy biến, phân tích P&L chi tiết",
            ],
            [
              "2. CRM Sales",
              "Pipeline 6 giai đoạn, phân bổ Sales, tự động hóa đón lead, follow-up, hồ sơ khách",
              "Kết nối Form Website, tích hợp Gmail Workspace, chống trùng đa kênh",
            ],
            [
              "3. Thiết kế Tour",
              "Template database, dựng lịch trình theo ngày, quy đổi tỷ giá, tính toán dự toán",
              "AI tạo lịch trình cá nhân hóa, tự động dịch thuật Pháp - Anh - Việt, snapshot",
            ],
            [
              "4. Báo giá đa phiên bản",
              "Quản lý phiên bản v1/v2, in PDF, gửi email mô phỏng, chuyển thành Booking",
              "Ký số điện tử, cổng thanh toán trực tuyến, theo dõi thời gian khách xem báo giá",
            ],
            [
              "5. Quản lý Booking",
              "Hồ sơ tour tập trung, theo dõi tiến độ chuẩn bị, danh sách phân phòng (Rooming list)",
              "Cổng tương tác dành cho đối tác B2B, quản lý lịch sử thay đổi dịch vụ",
            ],
            [
              "6. Trung tâm Điều hành",
              "Checklist dịch vụ NCC, cảnh báo trùng lịch, phát hành voucher, xử lý sự cố",
              "Cổng gửi yêu cầu dịch vụ trực tiếp cho NCC, SLA xác nhận dịch vụ tự động",
            ],
            [
              "7. Quản lý Nhà cung cấp",
              "Danh mục 520 NCC, lọc theo loại dịch vụ, chấm điểm trọng số chất lượng/giá",
              "Bảng giá theo mùa, hợp đồng điện tử đính kèm, đối soát công nợ tự động",
            ],
            [
              "8. Đội ngũ Hướng dẫn viên",
              "Danh bạ HDV, ngôn ngữ, địa bàn, chống trùng lịch tự động, đơn giá hợp đồng",
              "Lịch làm việc chi tiết theo giờ, đánh giá sau tour, ứng dụng di động cho HDV",
            ],
            [
              "9. Quản lý Phương tiện",
              "Đội xe đối tác, kiểm tra sức chứa phù hợp số khách, phân xe cho từng tour",
              "GPS hành trình, thông tin lái xe, thông báo lệnh điều xe qua SMS/Zalo",
            ],
            [
              "10. Kế toán & Công nợ",
              "Công nợ khách (Receivable), Hóa đơn NCC (Payable), duyệt chi, dòng tiền, VAT",
              "Kết nối Hóa đơn điện tử, tự động đối soát ngân hàng (Bank Reconciliation)",
            ],
            [
              "11. Kho tài liệu tour",
              "Số hóa hợp đồng, voucher, rooming list liên kết trực tiếp với mã Booking",
              "Tích hợp Google Drive API doanh nghiệp, lưu trữ đám mây theo tenant an toàn",
            ],
            [
              "12. Chăm sóc khách hàng",
              "Quy trình sau tour 7 bước, chấm điểm CSAT, xử lý khiếu nại (Recovery), Review",
              "Khảo sát tự động qua Email/Zalo, gửi thư cảm ơn, tích điểm thưởng khách quen",
            ],
          ],
        ),
      );
  } else {
    tabContent = card(
      "Nhật ký hoạt động hệ thống trong phiên làm việc (Audit Trail)",
      auditLogs.length
        ? auditLogs
            .map(
              (a) =>
                '<div class="metricline"><span>' +
                esc(a.text) +
                '</span><small class="sub">' +
                esc(a.time) +
                "</small></div>",
            )
            .join("")
        : '<p class="sub">Chưa có thao tác mới trong phiên làm việc hiện tại.</p>',
    );
  }

  return (
    title(
      "Hướng dẫn sử dụng & Kiến trúc hệ thống TypicOne ERP",
      "Tài liệu vận hành, kịch bản trình diễn tương tác và đối chiếu kiến trúc 12 phân hệ.",
      btn("In tài liệu / Lưu PDF", "window.print()"),
    ) +
    `<section class="hero">
      <div>
        <div class="eyebrow">TOMS · TOUR OPERATOR MANAGEMENT SYSTEM</div>
        <h2>TypicOne ERP — Giải pháp điều hành lữ hành toàn diện</h2>
        <p>Hệ thống được thiết kế chuẩn mực phục vụ đội ngũ gồm <b>Giám đốc, 2 Sales, 2 Điều hành, 1 Kế toán, 3 Marketing, 10 Hướng dẫn viên</b> và mạng lưới <b>500+ Nhà cung cấp</b> dịch vụ. Hồ sơ Booking là dữ liệu trung tâm xuyên suốt chu trình kinh doanh.</p>
      </div>
      <div class="heroart">
        <div class="orbit"></div>
        <div class="plane">${systemIcon("plane-departure")}</div>
      </div>
    </section>
    <div class="tabs">
      <button class="btn ${helpActiveTab === 'scenarios' ? 'selected' : ''}" onclick="helpActiveTab='scenarios';render()">
        ${systemIcon("bullseye")} Kịch bản trình diễn tương tác
      </button>
      <button class="btn ${helpActiveTab === 'modules' ? 'selected' : ''}" onclick="helpActiveTab='modules';render()">
        ${systemIcon("clipboard-list")} Bảng đối chiếu 12 phân hệ ERP
      </button>
      <button class="btn ${helpActiveTab === 'audit' ? 'selected' : ''}" onclick="helpActiveTab='audit';render()">
        ${systemIcon("clock")} Nhật ký thao tác phiên làm việc
      </button>
    </div>` +
    tabContent
  );
};

function resetForm() {
  reloadDatabase();
}
