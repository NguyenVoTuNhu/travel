# Typic Travel Demo

Source demo quản lý và điều hành travel theo tài liệu Ai Automation 2 của khách hàng. Bản này tổ chức thư mục dựa trên ERP_LENAM_organized_js_20261005.zip: HTML ở gốc, CSS tách riêng, JavaScript chia data, api, core và modules.

## Chạy bằng XAMPP như Lê Nam

1. Giải nén thư mục `typic-travel` vào `C:\xampp\htdocs\`.
2. Mở XAMPP, Start Apache.
3. Truy cập `http://localhost/typic-travel/`.
4. Dùng Ctrl + F5 sau khi thay code để bỏ cache.

Bản demo không cần MySQL hoặc PHP. Cũng có thể mở `index.html` trực tiếp bằng Chrome/Edge, hoặc dùng Live Server trong VS Code. Khi dùng file trực tiếp, khả năng lưu localStorage phụ thuộc trình duyệt.

## Vai trò từng thư mục

| Đường dẫn | Trách nhiệm |
| --- | --- |
| index.html | Khung trang và thứ tự tải CSS/JavaScript |
| css/style.css | Giao diện desktop, mobile và bản in |
| assets/images | Hình và dấu hiệu nhận diện dùng trong giao diện |
| js/data/data.js | Danh mục tĩnh, dữ liệu seed và khởi tạo các collection mẫu |
| js/api/travel-config.js | Cấu hình tên doanh nghiệp và persistence |
| js/api/travel-api.js | Nạp, lưu dữ liệu local và nhật ký |
| js/core/app.core.js | Router, menu theo role, modal, toast, bảng, định dạng và xuất file |
| js/modules/mod-*.js | Giao diện và nghiệp vụ theo từng phân hệ |
| js/modules/quote-engine.js | Thiết kế tour, chương trình theo ngày và tạo draft báo giá |
| js/app.js | Bootstrap; chạy một lần khi đã tải đủ các file |

`js` chỉ chứa file JavaScript, trong các thư mục phù hợp. Không có requirements.js, file HTML chứa toàn bộ JavaScript, bản backup code cũ hoặc thư mục legacy.

## Các phân hệ

- mod-dashboard.js: CEO và KPI tổng hợp.
- mod-crm-sales.js: CRM, pipeline, lead, follow-up và Dashboard Sales.
- mod-customers.js: hồ sơ khách hàng.
- quote-engine.js: thiết kế chương trình tour.
- mod-quotes.js: báo giá, phiên bản, email mẫu, bản in và chuyển booking.
- mod-bookings.js: danh sách bookings và danh sách khách.
- mod-operations.js: điều hành, checklist dịch vụ, voucher, tiến độ và sự cố.
- mod-suppliers.js: NCC, tìm kiếm, lọc, phân trang, rating trọng số.
- mod-guides.js: HDV, availability, lịch, phân công và xác nhận.
- mod-vehicles.js: nhà xe, từng xe, số chỗ và lịch booking.
- mod-accounting.js: invoices, payments, debt, VAT và cash flow.
- mod-marketing.js: campaigns, content và Website Lead mô phỏng.
- mod-documents.js: Contract, Invoice, Passport, Voucher, Rooming List.
- mod-customer-service.js: feedback, CSAT, review, referral.
- mod-guide-app.js: giao diện mobile dành cho HDV.
- mod-ai.js: AI Automation mô phỏng.
- mod-help.js: đối chiếu yêu cầu và hướng dẫn demo.

## Thứ tự tải

Data → API config → API local → Core → Modules → App bootstrap. Dùng script thông thường tương tự Lê Nam, không cần bundler hoặc npm install. Chỉ `js/app.js` khởi động giao diện; các modules được tải trước khi render.

## Những khác biệt với Lê Nam

Lê Nam hiện dùng KIO API cho nhiều phân hệ. Travel vẫn dùng localStorage vì chưa có API và bảng dữ liệu Travel. Không sao chép URL, token, bảng dữ liệu hoặc business logic sản xuất/kho của Lê Nam sang Travel. Có thể thay lớp persistence ở js/api khi có backend thật; các modules hiện dùng state chung cho demo, chưa phải bản tích hợp backend hoàn chỉnh.

## Yêu cầu khách hàng

Mục Hướng dẫn dự án trong app đối chiếu 12 phân hệ ERP V1, quy mô nhân sự và lộ trình. Tên hiển thị là Typic Travel. Luồng chính: CRM → Tour Design → Quotation → Booking → Operations → Accounting → Customer Service.

Không ép tỷ lệ cọc 30%; số tiền cọc do người dùng nhập theo hợp đồng. Booking chạy khi đủ dịch vụ, HDV và voucher. Demo không phát hành hóa đơn điện tử, không gửi email, không chuyển tiền và chưa kết nối OpenAI API, Google Login, Gmail Workspace, Google Drive API hoặc Make.com.

## Dữ liệu và kiểm tra

520 NCC mẫu, 10 HDV, 12 xe và 8 booking ban đầu. Dữ liệu lưu trên trình duyệt, không đồng bộ giữa thiết bị. Bản đổi cấu trúc giữ khóa lưu dữ liệu của v2 để có thể dùng lại dữ liệu khi chạy tại cùng origin.

Đã kiểm tra đường dẫn assets/scripts, cú pháp mọi JavaScript, khởi động theo thứ tự tải file và các luồng nghiệp vụ bằng Node VM: báo giá sang booking, chống thao tác lặp, xác nhận NCC, voucher trước phân công HDV, HDV xác nhận, chạy/hoàn tất tour, hóa đơn thu từng phần, VAT, sức chứa xe và feedback/review/referral. Chưa có kiểm tra trực quan trong trình duyệt.
