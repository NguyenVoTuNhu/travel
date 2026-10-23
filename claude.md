# claude.md — TypicOne ERP (Typic Travel)

> **Đọc file này TRƯỚC KHI làm bất cứ việc gì.** File này là bản chuyển ngữ và tổng hợp của file yêu cầu `.docx` của khách (`Ai_Automation (2) (1).docx`, được cung cấp lại ngày 22/10/2026). Mọi yêu cầu nghiệp vụ, kiến trúc hiện tại, quy định làm việc và danh sách việc cần làm đều nằm ở đây. **Nếu claude.md mâu thuẫn với docx thì docx là nguồn gốc**: sửa claude.md cho đúng docx rồi ghi vào mục 4.2 và Nhật ký (quy trình ở mục 5.11).
> Sau mỗi lần làm việc: **tick checkbox, ghi Nhật ký (mục 9), trả lại file claude.md đã cập nhật** cùng bản zip.

- Lập ngày: 21/10/2026 — dựa trên yêu cầu khách (docx) + đọc code demo `travel.zip` (nhánh `main`, commit `a0e448a`).
- **Rà soát lại 22/10/2026** — nhánh `main`, commit `71f2b33` ("update 9h30 22/10/2026"): đã đối chiếu docx ↔ claude.md ↔ code. Kết quả ở mục 3.5.1–3.5.3 (tài khoản, vai trò, menu), mục 4.1 (demo đúng/sai/thiếu), mục 4.2 (điểm claude.md từng lệch yêu cầu).
- Hiện trạng ở mục 4 dựa trên việc đọc code, **chưa chạy thử trên trình duyệt và chưa xem dữ liệu thật trong database KIO**. Khi bắt tay làm từng mục, hãy kiểm tra lại đoạn code liên quan trước khi tin vào ghi chú.

---

## 0. TÓM TẮT 30 GIÂY

- **Là gì:** hệ thống quản lý & điều hành tour (Tour Operator Management System) cho **Typic Travel**, tên sản phẩm trong code là **TypicOne ERP**. Giao diện **tiếng Việt**.
- **Quy mô khách:** **5 Sales** (khách đổi từ 2 → 5 ngày 22/10/2026, docx chưa sửa), 2 Điều hành, 1 Kế toán, 3 Marketing, 1 Giám đốc, 10 HDV, 500+ nhà cung cấp (NCC), hàng chục tour/tháng.
- **Công nghệ (CHỐT, không đổi):** web tĩnh thuần **HTML + CSS + JavaScript không build** (không React/Next/Laravel/Node), dữ liệu lưu qua **KIO (KRUD)** tại `https://kio.dvqt.vn`. Chi tiết mục 3.
- **Stack khách đề xuất trong docx (NextJS, Laravel, PostgreSQL, Make.com…) KHÔNG dùng** (quyết định 21/10). **Nhưng docx cũng chứa các *năng lực* khách có thể mong đợi — Google Login, lưu tệp trên Google Drive, gửi email Gmail, AI (OpenAI), app mobile cho HDV — các năng lực này KHÔNG bị bỏ**, chỉ là chưa chọn cách thực hiện (T0-03, mục 8.1).
- **Cây mã nguồn hiện hành là PHẲNG:** `js/*.js` và `css/mod-*.css` (đúng như `index.html` nạp). Các thư mục `js/core/`, `js/modules/`, `js/api/`, `js/data/`, `css/modules/` là **bản cũ trùng lặp, KHÔNG được nạp — đừng sửa ở đó** (T0-10).
- **Tài khoản / vai trò / menu:** 22 tài khoản mẫu, 6 vai trò, CEO có 17 menu — xem bảng ở mục 3.5.1–3.5.3 (không cần đọc lại code để biết).
- **Luật viết code (mục 5.12):** mỗi dòng một câu lệnh, định dạng giống các file mẫu trong demo, không nén nhiều lệnh trên một dòng.
- **Việc tiếp theo:** mục 6 (checkbox). Thứ tự ưu tiên đề xuất ở mục 7.
- **Có những việc đang CHỜ khách / chờ quyết định** (mục 8) — đừng tự bịa, hãy hỏi lại.

---

## 1. YÊU CẦU NGHIỆP VỤ CỦA KHÁCH (nguồn gốc — đã chuyển từ docx)

> Đây là nội dung yêu cầu khách, đã bỏ phần đề xuất công nghệ và sửa lỗi chính tả. Những câu khách ghi chú trực tiếp được giữ lại ý.

### 1.1 Luồng tổng thể

`Lead → Khách hàng → Báo giá/Thiết kế tour → Booking → Hóa đơn/Thanh toán → Đặt dịch vụ NCC → Phân công HDV/Xe → Chạy tour → Quyết toán → Chăm sóc khách hàng sau tour`

Các phân hệ: CEO Dashboard · Marketing · Sales CRM · Tour Operations (Điều hành) · Accounting · Guide Management · Supplier Management · Reporting & KPI · Document Center · Customer Service.

### 1.2 Phân quyền

| Vai trò | Chỉ được thấy | Ghi chú của khách |
|---|---|---|
| **CEO** | Toàn quyền | Làm giao diện khác cho dễ nhìn, **có biểu đồ là tốt nhất**. Làm theo **form khách gửi mẫu trên Zalo**, theo từng phân quyền, từ tổng quan đến từng vai trò. |
| **Marketing** | Leads, Campaign, Content, KPI | Xem mục 1.3 |
| **Sales** | Leads, Khách hàng, Quotes, Booking | **Không thấy Kế toán.** Xem mục 1.4 |
| **Điều hành** | Booking đã xác nhận, Supplier, Guide, Xe | Chia 3 phân hệ — mục 1.5 |
| **Kế toán** | Invoice, Payments, VAT, Debt | Mục 1.6 |
| **HDV / Xe** | Tour được giao, Khách, Lịch trình (+ Voucher, Liên hệ khẩn cấp) | Dạng **app mobile**; nhận lịch tour và theo dõi kế hoạch được giao |

> **Cập nhật quy mô 22/10/2026 (khách báo, chưa có trong docx):** Sales **5 người** (docx ghi 2). Các chỗ docx nói "Sales 1, Sales 2" (dashboard, pipeline) hiểu là *từng Sales trong danh mục*, không cố định 2.

### 1.3 Marketing

- Chỉ thấy: Leads, Campaign, Content, KPI.
- **Bổ sung các nguồn Lead** (nhiều người nhập về), gồm:
  1. Form website
  2. WhatsApp
  3. Fanpage
  4. Instagram
  5. CTV (cộng tác viên: **HDV**, **khách hàng cũ**)
  6. Sách báo – quảng cáo bên thứ 3 (ví dụ **Petit Futé, Routard**)
  7. Đối tác B2B
  8. Kênh hội chợ
  9. Khác
- **Kết hợp AI** để: chạy quảng cáo, đăng bài Fanpage, viết Email tự động.
- KPI cần có: Traffic, Leads, CPL (chi phí / lead).

### 1.4 Sales — quy trình làm chương trình tour

1. Nhận lead → phân tích nhu cầu → tạo chương trình (CT) tour.
2. Tạo CT tour mới, **hoặc dùng tour mẫu đã upload**.
3. **Điều chỉnh linh hoạt các ngày bằng nút kéo–thả** (đảo thứ tự ngày).
4. **Tạo bộ data tour sẵn** để thiết lập tour theo yêu cầu: chỉ cần **nhặt (gắp) các ngày tour hoặc các tour mẫu** ghép thành 1 tour có độ dài mong muốn.
5. **AI dịch tour đã thiết kế** sang đa ngôn ngữ (ví dụ tour gốc tiếng Pháp → dịch sang ngôn ngữ khách chọn). Có **cài đặt ngôn ngữ**.
6. Sau khi thiết kế → **tính giá theo từng ngày hoặc theo tổng tour**, với **lựa chọn giá theo số khách (pax) từ 1 đến 30**.
7. **Tiền chung hiển thị là USD**: các ngoại tệ khác quy đổi sang USD theo **tỷ giá cố định của Vietcombank (VCB), giá bán**. Có thể linh hoạt chuyển hiển thị sang **EUR, VND, CAD…**
8. **Chế độ Tour ghép (SIC / "Sictour")**: ngày khởi hành cố định, ghép tour với các đơn vị khác.
9. **AI nhập danh sách khách từ ảnh hộ chiếu**, các trường chính: **họ tên đầy đủ, ngày tháng năm sinh, số hộ chiếu (CCCD), ngày cấp hộ chiếu, ngày hết hạn, quốc tịch**.
10. Thiết kế tour **theo form mẫu — khách sẽ gửi sau** (CHƯA CÓ).
11. Các tùy biến khác: **tạo hợp đồng cho khách ngay sau khi thanh toán cọc tour**.

Pipeline lead: `NEW → CONTACTED → QUALIFIED → QUOTE SENT → NEGOTIATION → WON → (LOST)`; sau WON: `DEPOSIT → FINAL PAYMENT`.
Sales xem: Lead, Quote, Revenue, Profit, Follow-up.
Tự động hóa lead website: `Lead từ website → tự tạo lead → phân công sales → email chào mừng → task follow-up`.

### 1.5 Điều hành — 3 phân hệ

**(1) Đặt dịch vụ với nhà cung cấp**
- Lưu trú: Homestay · Khách sạn · Junk/Boat (du thuyền/tàu) · Night Train
- Vận chuyển: Hàng không (VNA, VietJet, hãng khác) · Xe (từ **7 chỗ đến 47 chỗ**) · Thuyền, tàu
- HDV các vùng **Bắc – Trung – Nam, Laos, Cambodia, Thailand**…
- Nhà hàng
- **Landtour đối tác**
- Dịch vụ khác: Visa, lệ phí, tham quan

**(2) Theo dõi dịch vụ đã đặt / chưa đặt** của từng tour (đối chiếu với phân hệ 1).

**(3) Nhập liệu nhà cung cấp** (lưu trú, vận chuyển, HDV, ăn uống, tham quan, khác); **lưu hợp đồng online hoặc offline**.
Dùng **AI hỗ trợ nhập liệu** các trường: phân loại NCC; địa chỉ, SĐT người phụ trách, email; các loại dịch vụ; **các loại phòng + giá theo mùa, tính theo phòng/đêm**; **các chương trình khuyến mại**.

Workflow điều hành: `Sales Won → Operation tiếp nhận → Đặt khách sạn → Đặt xe → Đặt HDV → Xác nhận → Voucher → Tour chạy → Hoàn tất`.
Checklist dịch vụ: Hotel, Vehicle, Guide, Restaurant, Flights, Cruise, Train, Insurance.
Tour Dashboard: Booking, Status, Operation, Cost, Profit, Progress.

### 1.6 Kế toán

Chỉ thấy Invoice, Payments, VAT, Debt. Cần theo dõi:
- Từ lúc Sales tạo Invoice → dòng tiền về công ty qua: **chuyển khoản quốc tế, nội địa**, bằng **USD / EUR / VND**, qua **cổng thanh toán OnePay hoặc VNPAY**, hoặc **tiền mặt**.
- Dịch vụ do Điều hành đặt: **hạn thanh toán cọc** và **thanh quyết toán cho NCC**.
- Theo dõi các khoản tiền về TK công ty **đã xuất VAT đầu ra** tương ứng.
- Theo dõi các khoản thanh toán NCC **để lấy VAT đầu vào**.
- **Báo cáo lãi/lỗ cho từng tour, từng dịch vụ.**
- Flow thu: `Booking → Hóa đơn cọc → Nhận tiền → Hóa đơn quyết toán → Tour hoàn tất`. Flow chi NCC: `NCC → Invoice → Duyệt → Thanh toán`.
- Cash flow theo ngày / tuần / tháng. Phải thu (khách), phải trả (NCC), VAT đầu vào/đầu ra.

### 1.7 Nhà cung cấp

- Loại: Hotel, Homestay, Cruise, Restaurant, Vehicle, Guide, Flight, Train, Others.
- Thông tin: tên, loại, quốc gia, hợp đồng, rating, điều khoản thanh toán.
- **Điểm NCC tự động (0–100)** = Quality 40% + Price 30% + Response 20% + Complaint 10%.
- Quy mô: **khách ghi "500+ NCC" ở đầu, "1000 NCC" ở một đoạn, "500 NCC" ở ERP V1** → thiết kế chịu được **≥ 1000**. Không thể quản lý bằng Excel.

### 1.8 Hướng dẫn viên (10 HDV)

Hồ sơ: ngôn ngữ, khu vực, giá/ngày, rating. Lịch trống (calendar). Phân công: `Tour → HDV rảnh → Assign → Confirm`. App mobile: HDV thấy Tour, Khách, Voucher, Emergency.

### 1.9 Phương tiện

Đơn vị vận chuyển, xe, sức chứa. Đặt: `Tour → Xe → Confirm`.

### 1.10 Dashboard CEO (màn hình quan trọng nhất)

- Thẻ tổng: doanh thu tháng, lợi nhuận, tour đang chạy, khách đang đi tour, công nợ khách, công nợ NCC.
- Sales: Leads, Quotations, Won, Lost, Revenue, Profit.
- Marketing: Traffic, Leads, CPL.
- Operations: Tours Running, Pending Services, Supplier Issues, Guide Issues, Error Rate, Cost Control, CSAT.
- Accounting: Receivable, Payable, Cash Flow.

### 1.11 Các module khác trong "ERP V1"

- **Tour Design:** tour mẫu (Vietnam 10 Days, Vietnam–Cambodia, Luxury Vietnam, Family Vietnam…). **AI Itinerary Builder**: Sales nhập Country / Pax / Budget / Duration (vd France, 4 pax, 3500 EUR, 14 ngày) → AI sinh bản nháp → Sales chỉnh sửa.
- **Quotation:** Quote No, Version, Client, Amount, Profit. **PDF 1 click → Email khách.**
- **Bookings:** khi khách đồng ý, Quote → Booking. Booking ID, Client, Arrival, Departure, Pax, Revenue, Profit.
- **Document Center:** lưu Contract, Invoice, Passport, Voucher, Rooming List.
- **Customer Service:** sau tour → Feedback Form → CSAT → Review → Referral.
- **Giai đoạn 4 – AI:** viết chương trình tour, tạo quotation, dịch Pháp–Anh–Việt, phân công guide, phân tích lợi nhuận.

### 1.12 Thông tin còn thiếu từ khách

Xem mục 8 (Câu hỏi mở).

---

## 2. TỪ ĐIỂN NHANH

| Thuật ngữ | Nghĩa |
|---|---|
| NCC | Nhà cung cấp (supplier) |
| HDV | Hướng dẫn viên (guide) |
| Pax | Số khách |
| SIC / Sictour / Tour ghép | Tour khởi hành cố định, ghép khách nhiều đơn vị |
| Landtour | Đối tác tổ chức tour mặt đất |
| Voucher | Phiếu dịch vụ gửi cho NCC/HDV |
| Rooming list | Danh sách phân phòng |
| VCB | Vietcombank (nguồn tỷ giá cố định khách yêu cầu) |
| KIO / KRUD | Dịch vụ database multi-tenant `kio.dvqt.vn` mà demo dùng |
| CPL | Cost per lead |

---

## 3. KIẾN TRÚC & CÔNG NGHỆ HIỆN TẠI (DEMO) — CÁCH LÀM CHUẨN

### 3.1 Stack

- **Frontend only**, tĩnh: `index.html` + `css/` + `js/` + `assets/`. **Không có bước build, không npm, không module ES.** Chạy bằng cách mở qua web server tĩnh bất kỳ. **Ngoại lệ phía máy chủ (2 file PHP): `upload.php`** (nhận tệp tải lên vào `uploads/` — mục 3.4a, T0-05) và **`fx-vcb.php`** (đọc tỷ giá VCB — mục 3.4b, T1-01). Thiếu PHP thì chỉ tải tệp / tự lấy tỷ giá lỗi (tỷ giá vẫn nhập tay được), phần còn lại vẫn hoạt động.
- Toàn bộ script là **global** (`<script src>` thường), phụ thuộc **thứ tự nạp** trong `index.html`.
- UI dựng bằng **chuỗi template HTML** (template literal) rồi gán vào `#app.innerHTML`. Sự kiện dùng `onclick="tenHam(...)"` inline gọi hàm global.
- Font: Plus Jakarta Sans (Google Fonts, cần internet). Icon: Font Awesome (nội bộ `assets/fa/`).
- Database: **KIO** — SDK `krud.js`, `list.js` được nạp động từ `https://kio.dvqt.vn` (xem `js/travel-config.js`).
- Repo git: `https://github.com/NguyenVoTuNhu/travel.git`, nhánh `main` (và `hoang`). Commit hiện chỉ ghi "update".

### 3.2 Cấu trúc thư mục (cây PHẲNG — đúng với commit `71f2b33`)

```
travel/
├─ index.html                  # khung trang, đăng nhập, sidebar, nạp CSS/JS
├─ upload.php                  # nhận tệp tải lên → lưu vào uploads/, trả đường dẫn (T0-05)
├─ fx-vcb.php                  # đọc XML tỷ giá VCB phía máy chủ, cache 5 phút, trả JSON (T1-01)
├─ cache/                      # cache của fx-vcb.php (không vào git; .htaccess chặn truy cập trực tiếp)
├─ uploads/                    # tệp người dùng tải lên (không đưa vào git; có .htaccess chặn chạy mã)
├─ .gitignore, .gitattributes  # bỏ qua uploads/, zip…; repo lưu LF, checkout CRLF (T0-07)
├─ assets/
│  ├─ fa/                      # Font Awesome (css + webfonts)
│  ├─ images/                  # logo, avatar
│  ├─ chart.js, tailwind.js, vendor/jszip.min.js   # CÓ trong thư mục nhưng KHÔNG được nạp ở index.html
├─ css/
│  ├─ style.css                # nền tảng (mẫu định dạng CSS chuẩn — mục 5.12)
│  ├─ mod-dashboard.css, mod-crm.css, mod-customers.css, mod-care.css, mod-quotes.css,
│  │  mod-guideapp.css, mod-guides.css, mod-operations.css, mod-admin.css, mod-auth.css   # CSS theo phân hệ
│  ├─ overlays.css, theme-polish.css, erp-ui.css, compact-density.css,
│  │  system-upgrades.css, erp-modern.css, erp-v4.css   # lớp ghi đè, nạp sau cùng — file nào nạp sau thì thắng
│  └─ modules/*.css            # BẢN CŨ TRÙNG — không nạp (T0-10)
└─ js/
   ├─ data.js                  # emptyState(), danh sách collection, tiền tố mã, nextBusinessId, normalizeBusinessIds, applyDatabaseSettings
   ├─ travel-config.js         # cấu hình KIO (apiBaseUrl, tablePrefix, chunkSize), databaseErrorMessage()
   ├─ travel-api.js            # nạp/lưu state qua KIO, cache, phát hiện xung đột, save(), log()
   ├─ travel-auth.js           # đăng nhập, phiên, PBKDF2, requiredTeamAccounts (22 tài khoản mẫu)
   ├─ app.core.js              # router go(), nav, pages/navGroups, phân quyền (businessRolePolicies, can()), modal, toast, btn/card/table/stat, phân trang, xuất CSV, in
   ├─ workflow.js              # nghiệp vụ dùng chung: trạng thái, phê duyệt, audit, phạm vi dữ liệu, thanh toán, hủy/hoàn tiền, workQueue (thông báo), migrateWorkflowData, ensureBookingContract
   ├─ mod-*.js                 # mỗi phân hệ một file (xem 3.8); thiết kế tour 5 bước nằm ở mod-design.js
   ├─ mod-fx.js                # bảng tỷ giá VCB: dữ liệu, lịch sử (collection `fxHistory`), tự cập nhật, nhập tay, giao diện (T1-01)
   ├─ app.js                   # khởi động: đăng nhập → enterApplication → loadDatabase → render
   └─ core/, modules/, api/, data/   # BẢN CŨ TRÙNG — không nạp (T0-10)
```

**Tên file đã đổi so với bản cũ** (các ghi chú/lịch sử cũ có thể còn nhắc tên cũ):

| Bản cũ (không nạp) | Bản hiện hành |
|---|---|
| `js/core/app.core.js`, `js/core/workflow.js` | `js/app.core.js`, `js/workflow.js` |
| `js/api/travel-*.js`, `js/data/data.js` | `js/travel-*.js`, `js/data.js` |
| `js/modules/quote-engine.js` | `js/mod-design.js` |
| `js/modules/mod-crm-sales.js` | `js/mod-crm.js` |
| `js/modules/mod-customer-service.js` | `js/mod-care.js` |
| `js/modules/mod-guide-app.js` | `js/mod-guideapp.js` |
| `css/modules/crm-sales.css`, `customer-service.css`, `guide-app.css`, … | `css/mod-crm.css`, `mod-care.css`, `mod-guideapp.css`, … |

> Hai cây này đang cùng nằm trong git (do hai nhánh làm việc: commit `71f2b33` tạo cây phẳng, cây cũ không bị xóa). Bản phẳng là bản mới hơn (nhiều thay đổi ở đăng nhập, quản trị, cổng HDV, hợp đồng). Đã so từng cặp file: mọi khác biệt còn lại ở cây cũ chỉ là phiên bản cũ hơn (emoji thay icon, nhãn cũ, nhóm menu theo vai trò…); **không có tính năng nào chỉ nằm ở cây cũ**, ngoại trừ thông báo trong `travel-api.js` trỏ về claude.md (T0-02b).
> Thay đổi lớn nhất của `71f2b33` so với cây cũ: (1) tài khoản mẫu tự tạo — lúc đó 19, nay 22 (3.5.1); (2) đổi nhãn màn hình và gộp thanh điều hướng thành một danh sách chung lọc theo `rights[role]`; (3) cổng HDV có menu 6 chức năng riêng; (4) tự tạo bản ghi hợp đồng khi booking đủ điều kiện xác nhận; (5) quản trị người dùng có tìm kiếm/lọc, liên kết hồ sơ HDV, chặn khóa quản trị cuối cùng; (6) mật khẩu mặc định không còn bắt đổi.

### 3.3 Thứ tự nạp trong index.html (PHẢI giữ)

**JS** (thẻ `<script src>` thường, không `defer`):

`data.js → travel-config → travel-api → travel-auth → app.core → workflow → mod-dashboard → mod-crm → mod-customers → mod-design → mod-quotes → mod-bookings → mod-operations → mod-suppliers → mod-guides → mod-vehicles → mod-accounting → mod-marketing → mod-documents → mod-care → mod-guideapp → mod-approvals → **mod-fx** → mod-admin → app.js`

**CSS:** `assets/fa/css/all.min.css → style.css → mod-dashboard → mod-crm → mod-customers → mod-care → mod-quotes → mod-guideapp → mod-guides → mod-operations → mod-admin → overlays → theme-polish → erp-ui → compact-density → mod-auth → system-upgrades → erp-modern → erp-v4`

> `mod-ai.js` và `mod-help.js` **tồn tại nhưng không được nạp** và không có trong danh sách `pages` → màn hình `ai`/`help` không truy cập được. Xem task T0-06.
> `?v=` (22/10, sau T1-01): các thẻ JS `travel-config` (`20261022.2`), `travel-api`, `travel-auth`, `app.core`, `mod-accounting`, `mod-documents`, `mod-guideapp`, `mod-fx`, `mod-admin`, `app.js` (`20261022.1`) đã theo quy ước 5.3; `mod-guideapp.css?v=2` còn số nguyên; các thẻ còn lại chưa có `?v=` (T0-01).

### 3.4 Lưu trữ dữ liệu — KIO

**Mô hình:** mỗi *collection* của `state` được lưu thành **một mảng JSON**, cắt thành các **chunk 30.000 ký tự**, mỗi chunk là **một dòng** trong bảng KIO.

- Tên bảng = `typicone_` + tên collection đổi sang snake_case. Ví dụ `customerServiceCases` → `typicone_customer_service_cases`.
- Mỗi bảng có các cột: `state_key` (string), `chunk_index` (int), `payload_text` (text), `updated_at` (string ISO). Đọc: `getKrudList({table, page:1, limit:1000, sort:{id:'ASC'}})`, ghép `payload_text` theo thứ tự rồi `JSON.parse`. Ghi: `krud('insert'|'update'|'delete', table, fields, id)`.
- **Bảng cần tồn tại trên KIO** (24 bảng):
  `typicone_guides, suppliers, bookings, leads, quotes, payables, transactions, drafts, docs, activities, campaigns, customers, invoices, vat, contents, vehicles, issues, customer_service_cases, settings, tour_templates` + `approvals`, `audit_logs`, **`fx_history`** (lịch sử tỷ giá, T1-01d) (ba bảng này *optional*: thiếu thì dùng bộ nhớ phiên và báo toast) + **`typicone_users`**, **`typicone_roles`** (bảng đăng nhập, cùng định dạng chunk).
- **Thêm collection mới:** thêm vào `emptyState()` trong `data.js` (+ `businessIdSchemas` nếu cần mã nghiệp vụ) và **tạo bảng KIO tương ứng**; nếu chưa chắc bảng đã có thì thêm vào `optionalCollections`.
- **Ghi:** gọi `save()` (debounce 200 ms) → `flushDatabase()`. Chỉ collection nào có JSON thay đổi mới được ghi lại, và **trong collection đó chỉ chunk nào đổi nội dung mới bị `update`** (`syncDatabaseCollection` so với `databaseChunks`, nội dung chunk đang lưu trên KIO; 23/10) — thêm bản ở cuối mảng chỉ ghi chunk cuối.
- **Xung đột:** trước khi ghi, đọc lại bản server của từng collection đã đổi; khác bản snapshot → ném lỗi `DATA_CONFLICT` ("hãy tải lại trang"). `auditLogs` được gộp theo id thay vì chặn. Chưa có compare-and-swap thật (comment `shortcut` trong `travel-api.js`).
- **Cache:** `sessionStorage` (`typicone_database_cache_<userId>`), bỏ `data` base64 (tài liệu cũ) của `docs`. Cache đăng nhập: `typicone_auth_cache`; phiên: `typicone_auth_session` (session hoặc local nếu "duy trì đăng nhập"). Thu gọn sidebar: `localStorage typicone_sidebar_collapsed`.
- **Cài đặt & danh mục nằm TRONG DATABASE, không nằm trong code:** `state.settings[0]` chứa `serviceTypes, serviceLabels, leadStages, crmOwners, careOwners, operationOwners, countries, leadSources, contentChannels, marketingOwners, currencies, languages, translations, serviceCostWeights`, `policy` và **`fxRates`** (chỉ còn `{source, rateType}`; lịch sử tỷ giá nằm ở collection riêng `fxHistory` — mục 3.4b). `applyDatabaseSettings()` nạp chúng vào biến global (`serviceTypes`, `crmLeadSources`, `travelCurrencies`, …). **Repo không có dữ liệu mẫu (seed)**; muốn xem dữ liệu thật hãy nhờ người dùng xuất bản sao ở *Cài đặt hệ thống → Sao lưu* (hàm `downloadBackup()`, file JSON).
- File README_NGHIEP_VU.md (hướng dẫn tạo bảng) **đã bị xóa khỏi repo** nhưng `travel-api.js` dòng ~193 vẫn nhắc tới → nội dung đó nay nằm ở mục này. *(Thông báo trong `travel-api.js` đã sửa trỏ về claude.md mục 3.4 — T0-02b, 22/10.)*

### 3.4a Tệp tải lên (T0-05) — tệp ở `uploads/`, database chỉ lưu đường dẫn

- **Luồng:** trình duyệt gọi `uploadFile(file, nhóm)` (`js/travel-api.js`) → `POST upload.php` (multipart: `file`, `category`) → máy chủ lưu `uploads/<nhóm>/<năm>/<tháng>/<32 ký tự ngẫu nhiên>.<đuôi>` → trả `{ok, path, mime, size}` → code lưu **`path`** vào bản ghi (collection `docs`; `bookings[].finalReport.photos`). Hiển thị/tải bằng chính `path` (`openDocument`, thẻ `<img src>`).
- **Cấu hình:** `TRAVEL_CONFIG.uploadEndpoint` (`"upload.php"`) và `uploadMaxBytes` (10 MB) trong `js/travel-config.js`.
- **Nhóm (`category`)** hiện có: `docs` (Kho tài liệu), `guide-reports` (ảnh báo cáo cuối tour của HDV). Thêm nhóm mới phải thêm vào `ALLOWED_CATEGORIES` trong `upload.php`.
- **`upload.php` kiểm tra:** chỉ POST; cùng nguồn (`Origin` trùng `Host`); ≤ 10 MB; đuôi thuộc `pdf, jpg, jpeg, png, webp, docx, xlsx` **và** MIME thật (`finfo`) khớp đuôi; tên lưu ngẫu nhiên (không dùng tên người dùng đặt).
- **`uploads/.htaccess`** (Apache): không liệt kê thư mục, không chạy `php`, chặn `php/phtml/phar/html/js/svg`. Nếu chạy Nginx phải cấu hình tương đương (không thực thi PHP trong `uploads/`).
- **Yêu cầu máy chủ:** PHP ≥ 7.4; `upload_max_filesize` và `post_max_size` ≥ 10M (mặc định PHP thường chỉ 2M); thư mục `uploads/` cho phép PHP ghi. Chạy thử local: `php -S 127.0.0.1:8080` ở thư mục gốc (Python `http.server`/Live Server **không** nhận upload).
- **Khi nhận zip bản vá:** `uploads/` chứa dữ liệu thật trên máy chủ — **giải nén đè không được xóa** thư mục này; không đưa nội dung `uploads/` vào git/zip (đã có `.gitignore`).
- **Chưa làm / rủi ro:** chưa thử trên máy chủ PHP thật (T0-05c); `upload.php` **chưa xác thực người dùng** và tệp phục vụ bằng URL tĩnh (chỉ che bằng tên ngẫu nhiên) — hộ chiếu/hợp đồng nhạy cảm cần cơ chế tốt hơn (T0-05e); tài liệu cũ base64 chưa chuyển (T0-05d).

### 3.4b Tỷ giá VCB (T1-01) — `state.fxHistory`, `settings[0].fxRates`, `js/mod-fx.js`, `fx-vcb.php`

- **Nguồn:** XML chính thức của VCB `https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx` (trang tỷ giá VCB tự ghi link này). Mỗi dòng có `Buy` (mua tiền mặt), `Transfer` (mua chuyển khoản), `Sell` (bán). **VCB chỉ có MỘT cột bán** (không tách tiền mặt/chuyển khoản) nên "giá bán" = cột `Sell`. Số dạng `17,701.51`, `-` = không có. **VCB ghi: tối đa 1 request / 5 phút.** XML có 19 loại tiền (AUD CAD CHF CNY DKK EUR GBP HKD INR JPY KRW KWD MYR NOK RUB SAR SEK SGD THB USD), không có VND (hệ thống tự thêm `VND: 1`). Trang web VCB dựng bảng bằng JS (không scrape được) → dùng XML. *Lưu ý: lúc thử, giờ trong XML (6:52 AM) sớm hơn giờ "cập nhật" trên trang (08:55) → lưu nguyên `vcbTime` để đối chiếu, không dùng làm ngày hiệu lực.*
- **Luồng:** trình duyệt gọi `TRAVEL_CONFIG.fxEndpoint` (`fx-vcb.php`) → PHP tải XML (curl hoặc `file_get_contents`, timeout 10 giây), phân tích, ghi `cache/vcb-fx.json` (dùng lại trong 5 phút), trả JSON `{ok, vcbTime, fetchedAt, cached, stale, rates:{USD:{buy,transfer,sell}}}`. VCB lỗi mà còn cache cũ → trả `stale:true` (JS **không** ghi bản `stale`); không có cache → HTTP 502. Chỉ nhận GET cùng nguồn (như `upload.php`). Trình duyệt gọi thẳng VCB không chắc được vì CORS.
- **Dữ liệu (tách riêng từ 23/10/2026, T1-01d):** lịch sử nằm ở **collection riêng `state.fxHistory`** (bảng KIO **`typicone_fx_history`**), **không còn trong `settings`** (trước đây `settings[0].fxRates.history`, làm bản `settings` phình tới ~300–400 KB và mỗi lần đổi một danh mục là ghi lại cả đống tỷ giá). `settings[0].fxRates` chỉ còn `{ source:"VCB", rateType:"sell" }`. `fxHistory` là mảng xếp **cũ → mới** (đổi hướng so với trước), **KHÔNG giới hạn số bản** (đã bỏ giới hạn 800; chứng từ cũ luôn tra được tỷ giá đúng ngày), **mỗi ngày hiệu lực một bản** (lưu lại cùng ngày thì thay). Mỗi bản: `{ date:"YYYY-MM-DD", mode:"auto"|"manual", by, at, vcbTime, rates:{USD:26050, EUR:29771.25, CAD:18697.77, VND:1, …} }`; số = **VND cho 1 đơn vị ngoại tệ, giá bán**. Vì thêm bản mới ở cuối mảng nên mỗi ngày chỉ ghi lại chunk cuối của bảng (xem 3.4 *Ghi*). Mỗi bản ~0,5 KB (10 năm ≈ 2 MB ≈ 70 chunk); bản này cũng nằm trong cache `sessionStorage` (lỗi quota chỉ `console.warn`, app vẫn chạy). **Cần tạo bảng `typicone_fx_history`** (cột `state_key, chunk_index, payload_text, updated_at` như các bảng khác) — bảng *optional* nên thiếu bảng thì app vẫn chạy.
- **Chuyển dữ liệu cũ (tự động, `fxMigrateLegacy()`):** khi CEO/Kế toán (`fx_manage`) vào hệ thống, nếu `settings[0].fxRates.history` còn bản cũ thì chép (đảo thứ tự) sang `fxHistory`, ghi lên KIO, và **chỉ xóa `history` trong settings sau khi ghi thành công**. Bảng `typicone_fx_history` chưa tạo thì **giữ nguyên lịch sử ở settings** (không mất dữ liệu) và `console.warn`. Trước khi chuyển xong, `fxHistory()` vẫn đọc tạm bản cũ trong settings nên Sales/Điều hành… không bị mất tỷ giá.
- **Hàm dùng chung (`mod-fx.js`):** `fxCurrent()` (bản có hiệu lực hôm nay), `fxEntryOn("YYYY-MM-DD")` (bản có hiệu lực vào ngày đó — dùng cho snapshot T1-03), `fxRate(code, entry?)`, `fxConvert(amount, from, to, entry?)` (đổi qua VND, trả `null` nếu thiếu tỷ giá), `fxRatesPanel()` (giao diện), **`fxDisplayCurrency`** (= `"USD"`, tiền hiển thị chung — T1-02), **`fxMoney(vnd, code?, entry?)`** (hiển thị số VND ở tiền tệ `code`, mặc định USD; thiếu tỷ giá thì rơi về VND; tối đa 2 số lẻ, không thừa số 0: `555,56 USD`, `1.000 USD`), `fxViewCurrencies(extra)` (USD, tiền của khách nếu có tỷ giá, VND — cho nút chuyển hiển thị).
- **Tỷ giá theo ngày tạo chứng từ (T1-03):** chứng từ **không lưu tỷ giá**, chỉ có **ngày tạo**; khi cần chuyển sang tiền nào thì tra bản tỷ giá của ngày đó trong `fxHistory` (`fxEntryOn(ngày)` = bản mới nhất có `date` ≤ ngày đó; sớm hơn mọi bản đã lưu thì dùng bản cũ nhất). Ngày tạo của từng loại: **báo giá / phiên bản báo giá / booking** → trường **`fxDate`** (`YYYY-MM-DD`; sửa báo giá đặt `fxDate` = hôm nay cho phiên bản mới, phiên bản cũ giữ `fxDate` cũ; booking thừa hưởng `fxDate` của báo giá được chấp nhận vì giá khách đã chốt theo tỷ giá ngày đó) · **hóa đơn** → `issuedAt` · **giao dịch thu/chi** → `date` · báo giá cũ chưa có `fxDate` → ngày của `createdAt`. Hàm: `fxDocDate(doc)`, `fxEntryOf(doc)` (bản tỷ giá của ngày tạo; không có ngày thì tỷ giá hiện hành), `fxMoneyOf(doc, vnd, code?)`, `fxSumMoney(docs, amountOf, code?)` (mỗi chứng từ theo ngày riêng rồi cộng; thiếu một cái thì cả tổng hiện VND), `fxDual(vnd, entry)` ("1.000 USD (26.050.000 ₫)"), `fxFormat(value, code)`. Hệ quả: **sửa/ghi đè bản tỷ giá của một ngày (nhập tay, hoặc "Cập nhật từ VCB" lại trong ngày) sẽ đổi số quy đổi của mọi chứng từ tạo ngày đó**; và **`fxHistory` là dữ liệu tham chiếu của chứng từ nên giữ đầy đủ, không giới hạn số bản** (trước là 180, rồi 800; bỏ giới hạn 23/10/2026).
- **Nhập tiền mặc định bằng USD (T1-02b):** số tiền **vẫn lưu bằng VND**; ô nhập giá bán/chi phí hiển thị và nhận theo tiền đang chọn (mặc định USD), rồi quy đổi sang VND theo tỷ giá. Hàm: `fxInputCode(code?)` (USD nếu có tỷ giá, không thì VND), `fxToVnd(amount, code, entry?)`, `fxFromVnd(vnd, code, entry?)` (làm tròn 2 số lẻ). Thiết kế tour: ô giá bán (2 chỗ) + chi phí từng mục dịch vụ theo `d.cur`, đổi nút USD/tiền khách/VND thì các ô nhập tự đổi theo; quy đổi bằng tỷ giá **hiện hành** (bản nháp đang làm hôm nay). Form *Điều chỉnh giá* của báo giá: nhập USD, hiện sẵn theo tỷ giá của ngày tạo báo giá; cả giá bán và chi phí **luôn quy đổi theo tỷ giá hôm nay** (phiên bản mới có `fxDate` = hôm nay), nên **giá USD không đổi khi không sửa số** còn VND trôi theo tỷ giá (từ 23/10; trước đó giữ VND cũ nhưng đổi `fxDate` làm giá USD bị lệch). **Chưa đổi (vẫn VND):** hóa đơn, thu/chi, khoản phải trả, VAT, duyệt giá, booking (mục 8.1).
- **Sổ kế toán ghi bằng USD (T1-04):** hóa đơn và thu tiền nhập/hiển thị bằng USD; **dữ liệu vẫn lưu VND**. Quy tắc: mọi số tiền của **một booking** (giá trị hợp đồng, hóa đơn, thu, công nợ) quy đổi USD theo tỷ giá của **ngày chốt báo giá** (`booking.fxDate`, tra bằng `fxEntryOf(booking)`), nên một khoản thu USD luôn khớp đúng hóa đơn USD, không phát sinh chênh lệch tỷ giá. **Thu tiền** (`receiveForm`/`receiveMoney`): khách trả bằng USD / EUR / CAD / VND (theo bảng tỷ giá hôm nay); EUR/CAD/VND đổi sang USD theo tỷ giá hôm nay rồi sang VND theo tỷ giá của booking (`receiptVnd`); giao dịch `transactions` thêm **`currency`** (tiền khách trả) và **`original`** (số khách trả), `amount` vẫn là VND ghi sổ. **Hóa đơn** (`invoiceForm`/`createInvoice`): nhập USD (`invoiceVnd`), chỉ một loại tiền ghi sổ là USD; bản in hóa đơn hiện `USD (VND)`. Số thu/hóa đơn **lệch ≤ 1 VND hoặc dưới 1 xu USD (0,0099) so với công nợ thì coi là thu đủ** (`nearBalance`): công nợ còn lẻ vài trăm VND do làm tròn vẫn hiện "0,01 USD", nhập 0,01 USD phải đưa công nợ về 0; ô số tiền mặc định không thấp hơn 0,01 USD khi còn công nợ. Chưa có tỷ giá thì form và sổ quay về VND như cũ. Hàm dùng chung (`mod-fx.js`): `fxLedgerReady()`, `fxLedgerMoney(booking, vnd)`, `fxTxMoney(booking, tx)`. **Đã chuyển sang USD (T1-04 và T1-04b, 23/10):** màn Kế toán (Hóa đơn, Phải thu, **Phải trả NCC**, **Chi phí & quyết toán**, **Lãi/lỗ theo tháng và theo tour**, **Dòng tiền**, Tổng quan, các thẻ KPI), tab Tài chính và danh sách booking, **booking 360 (chi phí điều hành, quyết toán)**, **Điều hành (chi phí dịch vụ, form dịch vụ)**, **Phê duyệt (giá trị, chi tiết, lý do mới)**, **hàng chờ việc (`workQueue`)**, **dashboard CEO/Sales/Kế toán**, **CRM (doanh thu/lợi nhuận, danh sách booking, báo giá)**, **Khách hàng (doanh số, công nợ, đơn hàng)**, **công nợ NCC trong chi tiết NCC**, **hợp đồng in (`USD (VND)`)**. **Vẫn VND (có chủ ý):** **VAT** (khai theo VND — chờ quyết định, T1-04d), tạm ứng/chi tiêu HDV ở app HDV, đơn giá HDV, nhiên liệu xe, bảng giá NCC, **Marketing** (ngân sách/chi phí/CPL/CAC/doanh thu chiến dịch), **ngân sách lead**, **mục tiêu doanh thu tháng** (nhập VND trong Cài đặt, dashboard quy đổi theo tỷ giá hiện hành), xuất CSV giao dịch (`exportData('transactions')`, VND thô). Lý do ghi lại ở Nhật ký 23/10 (T1-04b).
- **Quy tắc quy đổi cho màn kế toán còn lại (T1-04b):** dữ liệu **vẫn lưu VND**; mọi khoản gắn với một booking (phải trả NCC `payables[].booking`, giao dịch `transactions[].ref`, quyết toán, chi phí dịch vụ, hoàn tiền, đề xuất phê duyệt) quy đổi USD theo **tỷ giá ngày chốt báo giá của booking đó** (`fxEntryOf(booking)`), như hóa đơn/thu tiền. Các tổng (`accountingTotals()`, lãi/lỗ, dòng tiền, dashboard, khách hàng, NCC) **cộng từng khoản theo tỷ giá riêng rồi mới cộng** (`fxLedgerTotal`), không nhân tổng VND với một tỷ giá. Hàm dùng chung (`mod-fx.js`): `fxLedgerCode()`, `fxLedgerRate(booking)`, `fxLedgerNumber(booking, vnd)`, `fxLedgerTotal(items, bookingOf, amountOf)`, `fxLedgerText(n)`, `fxLedgerShort(n)` (1,25M USD / 12,5K USD), `fxLedgerSum(...)`, `fxLedgerInput(booking, vnd)` (số hiện trong ô nhập), `fxLedgerInputVnd(booking, input, currentVnd?)` (ô nhập → VND; nếu bằng số đang hiển thị của `currentVnd` thì giữ nguyên VND cũ để làm tròn 2 số lẻ không làm trôi). **Ô nhập chuyển sang USD:** số tiền hóa đơn NCC (`payableForm`/`createPayable`), chi phí thực tế quyết toán (`settlementForm`/`saveSettlement`), chi phí dự kiến dịch vụ (`serviceForm`/`saveService`), số tiền hoàn khi hủy booking (`cancelForm`/`submitCancel`). Chưa có tỷ giá thì tất cả quay về VND. Duyệt giá: `approvalMoney(a, vnd)` (booking → `fxDate`; báo giá → `fxDate`/`createdAt`); các câu `reason` của đề xuất **tạo từ 23/10 trở đi** ghi bằng USD, đề xuất cũ giữ chữ VND đã lưu.
- **Tự cập nhật mỗi ngày 1 lần:** `fxAutoUpdate()` chạy sau `loadDatabase()` trong `enterApplication` (`app.js`) **chỉ khi người dùng có quyền `fx_manage`** (CEO, Kế toán) và bản mới nhất chưa là của hôm nay. Lỗi chỉ `console.warn`. Không có cron phía máy chủ: ngày nào CEO/Kế toán không đăng nhập thì tỷ giá không tự cập nhật (T1-01c). Nút **Cập nhật từ VCB** lấy lại ngay (ghi đè bản hôm nay, hỏi xác nhận nếu bản đó nhập tay); nút **Nhập tay** có ngày hiệu lực (không được ở tương lai), USD bắt buộc, ô trống = bỏ loại tiền đó.
- **Chỗ hiển thị / quyền:** tab **Tỷ giá** trong *Cài đặt hệ thống* (CEO) và tab **Tỷ giá** trong *Kế toán* (khi `can("fx_manage")`: CEO + Kế toán). Quyền `fx_manage` mới thêm cho Kế toán ở `businessRolePolicies.accounting`. Sales/Điều hành/Marketing không có tab tỷ giá nhưng thấy giá tour/báo giá đã quy đổi USD (T1-02, đọc từ `fxRates` đã lưu).
- **Yêu cầu máy chủ:** PHP ≥ 7.4, ra được HTTPS tới `portal.vietcombank.com.vn`, thư mục `cache/` cho PHP ghi, Apache đọc `cache/.htaccess` (Nginx: chặn truy cập trực tiếp `cache/`). Chạy thử local: `php -S 127.0.0.1:8080` ở thư mục gốc. Kiểm tra nhanh: mở `/fx-vcb.php` phải thấy JSON `"ok":true`.

### 3.5 Xác thực & phân quyền

- Người dùng ở `typicone_users`: `{id, username, fullName, role, guideId, active, salt, iterations, passwordHash, mustChangePassword}`. Băm **PBKDF2-SHA256** ngay trên trình duyệt (`crypto.subtle`); so khớp ở client.
- Mật khẩu mặc định khi tạo/đặt lại: **`123456`**. **Từ commit `71f2b33` cờ `mustChangePassword` được đặt `false`** (tài khoản mẫu, tạo mới và đặt lại đều KHÔNG bị bắt đổi mật khẩu; trước đó là `true`). Màn hình đăng nhập có **nút chọn nhanh vai trò (mỗi vai trò một nút) tự điền `123456`** (`selectLoginRole`) — chỉ phù hợp demo (T0-04).
- Vai trò ở `typicone_roles`. **Quyền thực tế do CODE quyết định**: `businessRolePolicies` trong `js/app.core.js` ghép với vai trò trong DB theo `aliases`; nếu khớp thì **menus/capabilities/features lấy từ code, ghi đè DB**. → *Muốn đổi quyền hãy sửa `businessRolePolicies`, đừng sửa bảng roles.* Không có vai trò "admin" riêng: alias `admin`, `director`, `giam doc` đều ghép về **CEO**.
- `can(capability)` kiểm tra quyền; `requireCapability(cap, msg)` chặn thao tác. Vai trò có `all` (CEO) qua mọi kiểm tra.
- Menu hiển thị: `pages` (danh sách màn hình: id, icon Font Awesome, nhãn), `navGroups` (**một danh sách nhóm chung cho mọi vai trò**; `navigationGroups()` chỉ trả về danh sách này), menu được phép = `rights[role]` (lọc từ `businessRolePolicies.menus`). Riêng HDV có thanh điều hướng riêng gồm 6 chức năng (`guidePortalMenus` trong `mod-guideapp.js`).
- Phạm vi dữ liệu (`workflow.js`): `scopedLeads/Bookings/Quotes/CareCases`. Cách ghép là **so tên**: `myName()` = `currentUser.fullName`, so với danh mục `crmOwners` / `operationOwners` / `marketingOwners` trong `settings[0]`. Sales chỉ thấy lead/booking có `sales === fullName` **khi fullName nằm trong `crmOwners`** (không thì thấy tất cả); Điều hành chỉ thấy booking trạng thái `Confirmed/Preparing/Running/Completed` (`bookingOpsStatuses`); Marketing chỉ thấy lead từ chiến dịch của mình (không thì mọi lead có chiến dịch); HDV chỉ thấy tour có `guide === activeGuideId()`; Kế toán thấy tất cả booking. → *22 tài khoản mẫu có `fullName` kiểu "Nhân viên Sales 01" — nếu danh mục owners trong DB chưa chứa đúng tên đó thì phạm vi bị bỏ qua mà không có cảnh báo (T0-12).*
- Lưu ý: kiểm tra quyền hiện **chỉ ở phía giao diện**; code cũng ghi chú "API/database vẫn phải kiểm tra lại quyền ở phía máy chủ" (T0-04).

#### 3.5.1 Tài khoản (nguồn: `requiredTeamAccounts` trong `js/travel-auth.js`)

Hàm `ensureRequiredTeamAccounts()` chạy khi đọc bảng người dùng lúc đăng nhập: **tự tạo tài khoản còn thiếu** (mật khẩu `123456`), **xóa các tài khoản demo cũ** (`legacyDemoUsernames`: `giamdoc`, `tiep thi`, `kinh doanh`, `dieuhanh`, `ketoan`, `huongdanvien`, `kinhdoanh-001`, `kinhdoanh-002`) và gỡ cờ bắt đổi mật khẩu của tài khoản chuẩn. Chỉ chạy khi bảng `typicone_roles` có đủ 6 vai trò nghiệp vụ (khớp theo `aliases`); nếu thiếu thì chỉ `console.warn`.

| Vai trò (id) | Số TK | Tên đăng nhập | Họ tên mặc định | So với quy mô khách |
|---|---|---|---|---|
| CEO (`ceo`) | 1 | `GD-001` | Giám đốc Điều hành | 1 Giám đốc ✅ |
| Sales (`sales`) | 5 | `SALES-001` … `SALES-005` | Nhân viên Sales 01 … 05 | 5 Sales ✅ (khách đổi 2 → 5 ngày 22/10) |
| Điều hành (`operations`) | 2 | `DH-001`, `DH-002` | Nhân viên Điều hành 01 / 02 | 2 Điều hành ✅ |
| Marketing (`marketing`) | 3 | `MKT-001`, `MKT-002`, `MKT-003` | Nhân viên Marketing 01 / 02 / 03 | 3 Marketing ✅ |
| Kế toán (`accounting`) | 1 | `KT-001` | Nhân viên Kế toán 01 | 1 Kế toán ✅ |
| HDV (`guide`) | 10 | `HDV-001` … `HDV-010` | Hướng dẫn viên 01 … 10 | 10 HDV ✅ |
| Xe / Tài xế | 0 | — | — | **Chưa có vai trò** (T6-01; hỏi khách mục 8.1) |
| **Tổng** | **22** | | | Tài khoản tạo tay thêm ở *Người dùng & phân quyền* không tính |

- Tài khoản HDV tạo ra có `guideId: ""` → **chưa gắn với hồ sơ trong `guides`**; cổng HDV sẽ báo "chưa liên kết" cho tới khi CEO bấm *Liên kết hồ sơ HDV* (`linkUserGuideForm` trong `mod-admin.js`) (T0-12).
- Tên đăng nhập không phân biệt hoa/thường khi đăng nhập; mã chuẩn viết HOA.
- **Khách đổi quy mô Sales 2 → 5 (22/10/2026):** đã thêm `SALES-003…005` vào `requiredTeamAccounts`; `ensureRequiredTeamAccounts()` tự tạo ở lần đăng nhập kế tiếp (mật khẩu `123456`). **Phải thêm 3 tên mới vào `crmOwners` trong `settings[0]`** (T0-12), nếu không 3 Sales mới thấy toàn bộ lead/booking. Đã `grep`: không có chỗ nào trong code cố định số lượng 2 Sales (dashboard/hiệu suất lấy theo `crmOwners`).

#### 3.5.2 Ma trận vai trò ↔ menu (nguồn: `pages` và `businessRolePolicies.menus` trong `js/app.core.js`)

Có **18 màn hình** trong `pages`. **CEO có 17** (tất cả trừ `guideapp`). Cột cuối là nhãn hiện tại trên giao diện.

| id | CEO | Marketing | Sales | Điều hành | Kế toán | HDV | Nhãn trên giao diện |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| `dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | | Bảng điều khiển |
| `marketing` | ✓ | ✓ | | | | | Tiếp thị |
| `crm` | ✓ | ✓ | ✓ | | | | Khách hàng tiềm năng |
| `customers` | ✓ | | ✓ | | | | Khách hàng |
| `design` | ✓ | | ✓ | | | | Mẫu và thiết kế tour |
| `quotes` | ✓ | | ✓ | | | | Danh sách báo giá |
| `bookings` | ✓ | | ✓ | ✓ | | | Danh sách đặt tour |
| `operations` | ✓ | | | ✓ | | | Bảng điều hành tour |
| `suppliers` | ✓ | | | ✓ | | | Danh mục nhà cung cấp |
| `guides` | ✓ | | | ✓ | | | Hồ sơ và phân công |
| `vehicles` | ✓ | | | ✓ | | | Đội xe và điều phối |
| `accounting` | ✓ | | | | ✓ | | Tổng quan kế toán |
| `documents` | ✓ | | ✓ | ✓ | ✓ | | Kho tài liệu |
| `care` | ✓ | | ✓ | ✓ | | | Hồ sơ sau tour |
| `approvals` | ✓ | | | | | | Phê duyệt |
| `users` | ✓ | | | | | | Người dùng & phân quyền |
| `settings` | ✓ | | | | | | Cài đặt hệ thống |
| `guideapp` | | | | | | ✓ | Tour được giao |
| **Tổng menu** | **17** | **3** | **8** | **8** | **3** | **1** | |

**Nhóm trên thanh điều hướng** (`navGroups`, lọc theo menu được phép): TỔNG QUAN (dashboard) · CRM VÀ KINH DOANH (marketing, crm, customers) · THIẾT KẾ CHƯƠNG TRÌNH TOUR (design) · BÁO GIÁ (quotes) · ĐẶT TOUR (bookings) · TRUNG TÂM ĐIỀU HÀNH (operations) · NHÀ CUNG CẤP (suppliers) · HƯỚNG DẪN VIÊN (guides) · PHƯƠNG TIỆN (vehicles) · KẾ TOÁN (accounting) · TRUNG TÂM TÀI LIỆU (documents) · CHĂM SÓC KHÁCH HÀNG (care) · QUẢN TRỊ HỆ THỐNG (approvals, users, settings).

**CEO (quản trị) có đủ 17 menu:** dashboard, marketing, crm, customers, design, quotes, bookings, operations, suppliers, guides, vehicles, accounting, documents, care, approvals, users, settings. Ngoài ra CEO là vai trò duy nhất có `approvals`, `users`, `settings` (người dùng, vai trò & menu, chính sách, nhật ký, sao lưu). CEO **không** có menu `guideapp`.

**Tab bên trong từng màn hình** (đọc từ code; CEO thấy đủ, vai trò khác có thể bị ẩn một số mục theo capability):

| Màn hình | Tab / chức năng chính |
|---|---|
| `dashboard` | Tự chọn bản theo vai trò: CEO → `dashboardCeo`; Kế toán → `dashboardAccounting`; Điều hành → `dashboardOps`; Sales → `dashboardSales`; Marketing → `dashboardMarketing` |
| `marketing` | KPI tổng quan · Chiến dịch · Nội dung |
| `crm` | Tổng quan · Danh sách Lead · Pipeline · Công việc chăm sóc · Hiệu suất |
| `customers` | Danh sách; chi tiết khách: Tổng quan · Đơn hàng · Báo giá · Công nợ · Nhật ký CSKH |
| `design` | Thiết kế tour 5 bước; chi tiết: Lịch trình chi tiết · Tổng quan · Ghi chú |
| `quotes` | Danh sách báo giá, phiên bản, duyệt giá, gửi mail, in PDF, chuyển Booking (không chia tab) |
| `bookings` | Danh sách; chi tiết: Tổng quan · Dịch vụ & điều hành · Khách đoàn · Tài chính (chỉ khi có `booking_financials`/`sales_financials` hoặc `operations_costs`) · Tài liệu · Lịch sử |
| `operations` | Bảng điều hành · Dịch vụ NCC · Lịch điều hành · Sự cố |
| `suppliers` | Danh sách NCC, điểm 40/30/20/10, bảng giá theo mùa, công nợ NCC (không chia tab) |
| `guides` | Đội ngũ · Phân công & phản hồi |
| `vehicles` | Danh sách xe, giấy tờ, nhiên liệu, phân xe (không chia tab) |
| `accounting` | Tổng quan · Hóa đơn & thanh toán · Phải thu · Phải trả NCC · VAT · Chi phí & quyết toán · Lãi / lỗ theo tour · Dòng tiền · Chứng từ · **Tỷ giá** (chỉ vai trò có `fx_manage`: CEO, Kế toán) |
| `documents` | Kho tài liệu có bộ lọc (không chia tab) |
| `care` | Phản hồi, CSAT, phục hồi, review, referral |
| `approvals` | Chờ duyệt · Đã xử lý |
| `users` | Danh sách tài khoản (tìm kiếm, lọc vai trò/trạng thái, thêm, đổi vai trò, đặt lại mật khẩu, khóa/mở, liên kết HDV) |
| `settings` | Chính sách · **Tỷ giá** · Nhật ký · Vai trò & menu · Sao lưu |
| `guideapp` (HDV) | 6 chức năng: Tour được phân công · Thông tin khách hàng · Lịch trình tour · Phiếu dịch vụ · Thông tin khẩn cấp · Xác nhận phân công |

> Cổng HDV còn 3 tab nữa trong code (Lịch phân công · Báo cáo · Tạm ứng & chi phí) nhưng chỉ hiện với vai trò *không phải* HDV, mà không vai trò nào khác có menu `guideapp` → hiện **không truy cập được** (T6-04).

**Capabilities theo vai trò** (nguồn `businessRolePolicies.capabilities`):

| Vai trò (id) | Capabilities |
|---|---|
| ceo | `all` |
| marketing | marketing_manage, crm_manage, crm_scope_assigned |
| sales | crm_manage, customers_manage, tour_design_manage, quotes_manage, bookings_manage, care_manage, documents_manage, sales_financials, crm_scope_assigned |
| operations | operations_manage, suppliers_manage, guides_manage, vehicles_manage, documents_manage, operations_costs, guide_switch_profile, care_manage |
| accounting | accounting_manage, documents_manage, document_sensitive, booking_financials, booking_receipts |
| guide | guide_portal |

> Capability `approvals_manage`, `users_manage` được code kiểm tra nhưng không gán cho vai trò nào ngoài `all` → thực tế chỉ CEO.

#### 3.5.3 Đối chiếu vai trò với yêu cầu khách (mục 1.2)

| Vai trò | Khách yêu cầu "chỉ thấy" | Code cho thấy | Kết luận |
|---|---|---|---|
| CEO | Toàn quyền | 17 menu + `all` | ✅ |
| Marketing | Leads, Campaign, Content, KPI | Dashboard + Tiếp thị (KPI/Chiến dịch/Nội dung) + CRM (Leads); không có tài chính | ✅ khớp |
| Sales | Leads, Khách hàng, Quotes, Booking; **không thấy Kế toán** | CRM, Khách hàng, Báo giá, Booking, **Thiết kế tour** + **Dashboard, Tài liệu, CSKH**; không có menu Kế toán | ✅ phần chính, không thấy Kế toán. 🟡 Dashboard/Tài liệu/CSKH nằm ngoài danh sách (Thiết kế tour là bước của quy trình Sales nên hợp lý) → hỏi khách (T12-02) |
| Điều hành | Booking Confirmed, Supplier, Guide, Xe | Booking **đã lọc** Confirmed→Completed, Điều hành tour, NCC, HDV, Xe + **Dashboard, Tài liệu, CSKH** | ✅ lọc booking đúng. 🟡 Tài liệu/CSKH ngoài danh sách (T12-02) |
| Kế toán | Invoice, Payments, VAT, Debt | Kế toán (Hóa đơn & thanh toán, Phải thu, Phải trả, VAT…) + Dashboard + Tài liệu | ✅ khớp |
| HDV / Xe | Tour được giao, Khách, Lịch trình (+ Voucher, Emergency) | Cổng HDV 6 chức năng | ✅ cho HDV · ❌ **chưa có vai trò Xe/Tài xế** (T6-01) |

### 3.6 Mô hình dữ liệu (collections trong `state`)

| Collection | Mã | Nội dung |
|---|---|---|
| customers | `KH-2026-0001` | khách hàng/công ty |
| leads | `TN-` | khách tiềm năng, nguồn (`source` ∈ 9 nguồn chuẩn) + `sourceDetail` (tên CTV / ấn phẩm / đối tác B2B / hội chợ / ghi chú), nguồn CTV thêm `ctvType`/`ctvId`/`commissionRate` (%, mặc định 0), sales phụ trách, follow-up, welcomeEmail |
| quotes | `BG-` | báo giá nhiều phiên bản |
| bookings | `BK-` | đặt tour, `services[]` (dịch vụ NCC), `passengers[]`, hóa đơn/thu chi, `statusHistory` |
| suppliers | `NCC-` | NCC, điểm 4 tiêu chí, `prices[]` (bảng giá theo mùa) |
| guides | `HDV-` | hồ sơ HDV, lịch bận |
| vehicles | `XE-` | xe, sức chứa, giấy tờ, nhiên liệu |
| payables | `PC-` | công nợ phải trả NCC |
| transactions | `GD-` | giao dịch thu/chi |
| invoices | `HD-` | hóa đơn |
| vat | `VAT-` | chứng từ VAT vào/ra |
| docs | `TL-` | tài liệu: tệp mới chỉ lưu `path` (+ `size`, `mime`) trỏ vào `uploads/…`; tài liệu cũ còn `data` base64 (T0-05d) |
| issues | `SC-` | sự cố vận hành |
| customerServiceCases | `CS-` | hồ sơ chăm sóc sau tour |
| campaigns | `CD-` | chiến dịch marketing |
| contents | `ND-` | nội dung marketing |
| tourTemplates | `CT-` | tour mẫu (hiện `itinerary` chỉ là mảng **tiêu đề ngày**) |
| drafts | — | bản nháp thiết kế tour |
| approvals | `PD-2026-0001` (ổn định) | yêu cầu phê duyệt |
| auditLogs | `NK-2026-0001` (ổn định, tối đa 600) | nhật ký thao tác |
| activities | — | hoạt động gần đây (tối đa 80) |
| settings | — | `[0]` = danh mục + chính sách |

- Mã nghiệp vụ dạng `TIỀNTỐ-NĂM-4SỐ`, sinh bằng `nextBusinessId(collection, date)`; `normalizeBusinessIds()` đánh lại mã và cập nhật tham chiếu chéo khi tải dữ liệu — **thêm collection có tham chiếu tới collection khác thì phải bổ sung phần remap ở hàm này**.
- Tiền trong dữ liệu **hiện là số nguyên VND** (`money()` định dạng `vi-VN` + " ₫"; `short()` rút gọn tr/tỷ). *Đây là hiện trạng, KHÔNG phải quy ước cố định: yêu cầu khách là USD làm tiền chung + tỷ giá VCB (mục 1.4 điểm 7, EPIC 1) nên cách lưu tiền sẽ phải đổi — đừng viết thêm code giả định mãi là VND.* Ngày: chuỗi `YYYY-MM-DD` (`fmt()` hiển thị `dd/mm/yyyy`).

### 3.7 Máy trạng thái & chính sách (trong `workflow.js`)

- **Lead:** `NEW → CONTACTED → QUALIFIED → QUOTE SENT → NEGOTIATION → WON`, nhánh `LOST`, `UNQUALIFIED`.
- **Quote:** `Draft → PendingApproval → Sent → Accepted | Rejected`.
- **Booking:** `PendingDeposit → PendingApproval → Confirmed → Preparing → Running → Completed | Cancelled`.
- **Dịch vụ NCC:** `NOT_BOOKED → WAITING → CONFIRMED | REJECTED | CANCELLED`.
- **Phê duyệt (CEO):** `QUOTE_PRICE, NO_DEPOSIT, COST_OVERRUN, CANCEL, REFUND`; trạng thái `PENDING/APPROVED/REJECTED`.
- **Chính sách mặc định** (CEO chỉnh trong *Cài đặt*): biên lợi nhuận tối thiểu 15%, chiết khấu tối đa 10%, cọc 30%, vượt dự toán 5%, quyết toán trong 7 ngày, báo giá hiệu lực 14 ngày, hoàn tiền 90%/50%/20% (trước 30/15/7 ngày).
- `workQueue()` tạo "Hộp việc"/thông báo theo vai trò.

### 3.8 Bản đồ phân hệ ↔ file

| Màn hình (`id`) | File | Ghi chú |
|---|---|---|
| dashboard | mod-dashboard.js | khác nhau theo vai trò (CEO/Marketing/Sales/Điều hành/Kế toán); biểu đồ tự vẽ bằng SVG/HTML, **không dùng Chart.js** |
| marketing | mod-marketing.js | chiến dịch, nội dung, KPI |
| crm | mod-crm.js | lead, funnel, follow-up, email chào mừng (ghi nhận thủ công) |
| customers | mod-customers.js | hồ sơ, hạng khách, nhắc chăm sóc |
| design | mod-design.js | thiết kế tour 5 bước |
| quotes | mod-quotes.js | phiên bản, duyệt giá, gửi mail (mailto), in PDF (cửa sổ in), chuyển Booking |
| bookings | mod-bookings.js | Booking 360°, khách đi tour, in hợp đồng, miễn cọc, hủy |
| operations | mod-operations.js | tiếp nhận, đặt dịch vụ NCC, lịch, voucher, bắt đầu/kết thúc tour, sự cố |
| suppliers | mod-suppliers.js | danh sách, điểm NCC, bảng giá theo mùa, công nợ NCC |
| guides | mod-guides.js | hồ sơ, lịch trống, phân công, xác nhận/từ chối |
| vehicles | mod-vehicles.js | xe, giấy tờ, nhiên liệu, phân xe |
| accounting | mod-accounting.js | hóa đơn, thu tiền, công nợ, VAT, dòng tiền, quyết toán, lãi/lỗ, khóa kỳ |
| documents | mod-documents.js | kho tài liệu, voucher/rooming; tải tệp qua `uploadFile()` |
| care | mod-care.js | phản hồi, CSAT, phục hồi, review, referral |
| approvals | mod-approvals.js | hàng chờ CEO |
| users / settings | mod-admin.js | người dùng, chính sách, nhật ký, vai trò, sao lưu (tab Tỷ giá gọi `fxRatesPanel()`) |
| (dùng chung) tỷ giá | mod-fx.js | tỷ giá VCB: dữ liệu (lịch sử ở collection riêng `fxHistory`), chuyển dữ liệu cũ, tự cập nhật, nhập tay, bảng + lịch sử; hiển thị ở Cài đặt và Kế toán |
| guideapp | mod-guideapp.js | cổng HDV (mobile-first) |
| (không nạp) ai, help | mod-ai.js, mod-help.js | xem T0-06 |

### 3.9 Hàm/UI dùng chung (tái sử dụng, đừng viết lại)

- Khung: `title(h1, mô tả, nút)`, `card(tiêu đề, body, extra)`, `table(headers, rows)` (tự phân trang 10 dòng), `stat(label, value, meta)`, `badge(text, tone)`, `btn(text, onclick, cls)`, `field(name,type,value,required)`, `line(label, value)`.
- Hộp thoại/thông báo: `modal(title, html, narrow)`, `closeModal()`, `toast(text)`.
- Điều hướng: `go(pageId)`, `goTo/entityLink/navigate` (liên kết tới bản ghi), `render()`.
- Dữ liệu: `findLead/findQuote/findBooking/findSupplier/findGuide/findInvoice/findCampaign`, `nextBusinessId`, `nextStableId`.
- Ghi vết: **`audit(entity, id, action, summary)`** (ghi nhật ký + hoạt động), `pushHistory(record, entry)`.
- Xuất: `exportData(kind)` (CSV, có chống CSV injection), `printable(title, bodyHtml)` (mở cửa sổ in/lưu PDF), `downloadFile`.
- An toàn: **luôn dùng `esc()` khi chèn dữ liệu vào HTML.**
- Mẫu viết một màn hình: `views.tên = () => title(...) + ...;` rồi đăng ký trong `pages` (+ `navGroups`, `businessRolePolicies`). Mẫu form: `modal("Tiêu đề", '<form onsubmit="saveX(event)">…</form>')`, hàm `saveX(e){ e.preventDefault(); const f=new FormData(e.target); …; audit(...); save(); closeModal(); render(); }`.

### 3.10 Cạm bẫy đã biết (đọc trước khi sửa)

1. **`localizeUI()` tự dịch chữ tiếng Anh sang tiếng Việt trên toàn DOM** (bảng `uiTranslations` trong `app.core.js`), kể cả dữ liệu người dùng nhập (ví dụ chữ "Guide", "Final", "Name" có thể bị đổi). Khi thêm nhãn mới: viết tiếng Việt luôn; khi dữ liệu hiển thị lạ, nghi ngờ bảng này.
2. **Quyền do code ghi đè DB** (mục 3.5).
3. **Tên có dấu trong `cut`/shell:** khi dùng công cụ dòng lệnh để cắt dòng, đừng cắt theo byte với UTF-8.
4. **CRLF:** toàn bộ file nguồn dùng CRLF (`\r\n`). Giữ nguyên khi sửa. `git status` có thể báo hàng loạt file "modified" chỉ vì khác kiểu xuống dòng — không phải thay đổi thật.
5. `chart.js`, `tailwind.js`, `jszip.min.js` nằm trong `assets/` nhưng chưa được nạp; Tailwind và JSZip chưa được code nào dùng. Đừng giả định chúng có sẵn trên trang.
6. Tên cột/trường lưu trong JSON dùng tên tiếng Anh viết liền (camelCase) — giữ nhất quán.
7. Hiệu năng: mỗi lần đổi dữ liệu ghi lại **cả collection**. Tệp mới đã lưu ra `uploads/` (không còn base64); tài liệu cũ còn base64 sẽ làm phình cho tới khi chuyển (T0-05d).
8. **Hai cây mã nguồn trong git** (mục 3.2): chỉ cây phẳng (`js/*.js`, `css/mod-*.css`) được nạp. Sửa nhầm vào `js/modules/…`, `js/core/…` thì giao diện không đổi. Trước khi sửa luôn kiểm tra file đó có trong thẻ `<script>`/`<link>` của `index.html` không.
9. **Phạm vi dữ liệu theo tên** (mục 3.5): đổi `fullName` của một tài khoản sẽ làm mất liên kết với lead/booking cũ (`sales`, `operator` lưu bằng tên) và phạm vi giới hạn. Đổi tên người dùng → đổi cả danh mục owners.
10. **Nhiều lệnh trên một dòng và dòng rất dài:** demo có nhiều chỗ như vậy (ví dụ `workflow.js` dòng ~322 và ~662; hàng trăm dòng JS dài hơn 200 ký tự). Đó là nợ cũ, **không bắt chước** — luật ở mục 5.12.

---

## 4. HIỆN TRẠNG DEMO SO VỚI YÊU CẦU

Ký hiệu: ✅ đã có · 🟡 có một phần · ❌ chưa có · ⏳ chờ khách.

| # | Yêu cầu | Trạng thái | Hiện có / thiếu gì |
|---|---|---|---|
| 1 | Phân quyền 6 vai trò | ✅ | 6 vai trò khớp bảng 1.2 (CEO, Marketing, Sales, Điều hành, Kế toán, HDV) + 22 tài khoản mẫu khớp quy mô khách (mục 3.5.1–3.5.3). Chưa có vai trò **Xe/Tài xế** (T6-01) |
| 2 | CEO dashboard có biểu đồ | 🟡 | Có dashboard theo vai trò, biểu đồ SVG tự vẽ. Chưa theo **form mẫu khách gửi Zalo** ⏳ (T7-01) |
| 3 | Nguồn lead đa kênh (9 nguồn) | ✅ | Xong T2-01 (23/10): 9 nguồn chuẩn + chi tiết theo nguồn (`sourceDetail`), tự chuẩn hóa dữ liệu cũ. Chưa chạy thử trên trình duyệt (T2-01b). CTV liên kết HDV/khách cũ + hoa hồng + thống kê theo CTV: xong T2-02 (23/10, chưa chạy thử → T2-02b); báo cáo theo nguồn → T2-03 |
| 4 | Lead từ web tự động | ❌ | Chỉ có form nhập tay mô phỏng "lead website"; email chào mừng chỉ **ghi nhận đã gửi**, không gửi thật (T10-01) |
| 5 | Tour mẫu | 🟡 | Có "lưu thành mẫu" & nhập mẫu, mẫu chỉ gồm **tiêu đề các ngày** (T3-02, T3-03) |
| 6 | Kéo–thả đổi thứ tự ngày | 🟡 | Có chế độ "Sắp xếp" với nút lên/xuống (`designMoveDay`), chưa kéo–thả (T3-01) |
| 7 | Ngân hàng ngày tour, nhặt ghép | ❌ | (T3-02) |
| 8 | AI dịch tour đa ngôn ngữ | 🟡 | Có chọn ngôn ngữ; bản dịch là dữ liệu tĩnh `translations` trong settings, **không có AI** (T3-06, T9-02) |
| 9 | Giá theo pax 1–30, theo ngày/tổng | 🟡 | Giá NCC có đơn vị `/khách /đêm /ngày /đoàn`, tính theo **một** số pax và số ngày. Chưa có ma trận pax (T3-04) |
| 10 | Tiền chung USD, tỷ giá VCB, đổi EUR/VND/CAD | 🟡 | Hệ thống tính bằng **VND**; thiết kế tour có nút VND/ngoại tệ với `rate` **nhập tay**, mặc định 26000. **Đã có bảng tỷ giá VCB (T1-01), hiển thị + nhập USD mặc định ở thiết kế tour/báo giá (T1-02, T1-02b), tra tỷ giá theo ngày tạo chứng từ + bản in/email USD (T1-03, 22/10)**; **hóa đơn USD + thu tiền đa tiền tệ (T1-04, 23/10)**; **phải trả/quyết toán/lãi lỗ/dòng tiền/dashboard/duyệt giá/CRM/hợp đồng in (T1-04b, 23/10)**; còn: VAT (T1-04d) |
| 11 | Tour ghép (SIC) | ❌ | (T3-07) |
| 12 | AI nhập khách từ ảnh hộ chiếu | ❌ | Khách đi tour nhập tay (`passengerForm`) (T3-08) |
| 13 | Form tour theo mẫu | ⏳ | Khách sẽ gửi sau (T3-09) |
| 14 | Hợp đồng sau khi cọc | 🟡 | Từ 22/10: khi booking đủ điều kiện xác nhận (nhận đủ cọc hoặc CEO miễn cọc) hệ thống tự tạo **bản ghi** Contract trong Tài liệu (`ensureBookingContract`, `workflow.js`). Bản ghi chỉ có tên + ngày (`generated: true`) — **chưa có nội dung, mẫu, số hợp đồng, tệp**. Vẫn còn nút "In hợp đồng" thủ công (`printContract`) (T3-10) |
| 15 | Báo giá nhiều phiên bản, duyệt, PDF, email | ✅/🟡 | Có đủ; PDF qua hộp thoại in, email qua `mailto:` (không đính kèm) (T3-11) |
| 16 | Quy trình Won → Điều hành → Voucher → Chạy → Hoàn tất | ✅ | Có (operations + bookings) |
| 17 | Điều hành phân hệ 1: đặt dịch vụ | 🟡 | Có đặt/xác nhận/từ chối NCC. Loại dịch vụ phụ thuộc `serviceTypes` trong DB — cần đối chiếu với danh sách khách (T4-01) |
| 18 | Phân hệ 2: theo dõi đã đặt/chưa | 🟡 | Có checklist & tab dịch vụ theo tour; chưa có bảng nhìn chung mọi tour (T4-03) |
| 19 | Phân hệ 3: nhập liệu NCC | 🟡 | Có hồ sơ NCC, điểm, bảng giá theo mùa (Quanh năm/Cao điểm/Thấp điểm + khoảng ngày). **Thiếu:** nhiều người liên hệ, loại phòng có cấu trúc, khuyến mại, file hợp đồng, nhập hàng loạt (T4-04…T4-09) |
| 20 | Điểm NCC 40/30/20/10 | ✅ | `score()` trong `mod-suppliers.js` |
| 21 | AI hỗ trợ nhập liệu NCC | ❌ | (T9-04) |
| 22 | HDV: hồ sơ, lịch, phân công, xác nhận | ✅ | Có, kèm thẻ HDV, ngôn ngữ, địa bàn, giá/ngày |
| 23 | App HDV | 🟡 | Có cổng **web mobile-first** với đúng 6 chức năng khách yêu cầu (Tour được phân công, Khách, Lịch trình, Voucher/Phiếu dịch vụ, Khẩn cấp, Xác nhận phân công). Không phải app native/PWA. 3 tab Lịch phân công / Báo cáo / Tạm ứng & chi phí có trong code nhưng HDV không thấy (T6-04) |
| 24 | Xe 7–47 chỗ | 🟡 | Có xe + sức chứa + kiểm tra lịch/giấy tờ; loại xe/hãng chưa tách |
| 25 | Kế toán: hóa đơn, thu, VAT, công nợ, dòng tiền, quyết toán | ✅ | Có (mod-accounting) |
| 26 | Thu đa tiền tệ USD/EUR/VND | ❌ | Ô "Số tiền thu" là VND (T5-01) |
| 27 | OnePay / VNPAY / quốc tế / nội địa / tiền mặt | 🟡 | Có chọn phương thức thu (Chuyển khoản, Tiền mặt, …); chưa phân loại đủ, chưa tích hợp cổng (T5-02) |
| 28 | VAT đầu ra ↔ tiền về; VAT đầu vào ↔ trả NCC | 🟡 | Có nhập VAT vào/ra; chưa đối soát liên kết (T5-03, T5-04) |
| 29 | Hạn cọc & quyết toán NCC | ✅/🟡 | Có `payables.due`, duyệt, trả; cần xem nhắc hạn (T5-05) |
| 30 | Lãi/lỗ từng tour, từng dịch vụ | 🟡 | Có theo tour và theo tháng; **chưa theo dịch vụ** (T5-06) |
| 31 | Document Center | 🟡 | Có kho tài liệu, voucher, rooming list; từ 22/10 tệp tải lên lưu ở `uploads/`, database chỉ giữ đường dẫn (T0-05; còn T0-05c/d/e, EPIC 11) |
| 32 | CSKH: feedback, CSAT, review, referral | ✅ | Có (mod-care) |
| 33 | Phê duyệt CEO, nhật ký, người dùng, chính sách | ✅ | Có (ngoài yêu cầu khách, nhưng đã làm) |
| 34 | AI: itinerary builder, quotation, dịch, phân công, phân tích lợi nhuận, marketing | ❌ | `mod-ai.js` là thuật toán mô phỏng, **chưa nạp** (EPIC 9) |
| 35 | KPI Marketing: Traffic, CPL | 🟡 | Có lead/CPL theo chiến dịch; Traffic cần nguồn dữ liệu (T2-06) |

### 4.1 Đối chiếu demo ↔ yêu cầu (rà soát 22/10/2026, commit `71f2b33`)

> Dựa trên đọc code + `grep` từ khóa. **Chưa chạy thử trên trình duyệt, chưa xem dữ liệu thật trong KIO.** Mã `L…` là mã lỗi/lệch để tham chiếu trong task.

**A. Đã làm và ĐÚNG so với yêu cầu**

1. Phân quyền: 6 vai trò, menu từng vai trò khớp danh sách "chỉ thấy" của khách (bảng 3.5.3). Sales **không có** menu Kế toán; Marketing không có quyền tài chính.
2. Số tài khoản khớp quy mô khách: 1 CEO + 5 Sales + 2 Điều hành + 3 Marketing + 1 Kế toán + 10 HDV = 22 (`travel-auth.js`).
3. Điều hành chỉ thấy booking đã xác nhận trở đi (`bookingOpsStatuses` = Confirmed/Preparing/Running/Completed).
4. HDV chỉ thấy tour được giao cho mình; cổng HDV có đủ Tour · Khách · Lịch trình · Phiếu dịch vụ · Khẩn cấp · Xác nhận phân công.
5. Marketing có đủ KPI · Chiến dịch · Nội dung + Leads (qua CRM). Kế toán có Hóa đơn & thanh toán · Phải thu · Phải trả NCC · VAT · Quyết toán · Lãi/lỗ theo tour · Dòng tiền · Chứng từ.
6. Pipeline lead; luồng Booking (chờ cọc → xác nhận → bàn giao điều hành → chạy → hoàn tất); trạng thái dịch vụ NCC; điểm NCC 40/30/20/10 (`mod-suppliers.js`).
7. Dashboard riêng theo vai trò (CEO / Kế toán / Điều hành / Sales / Marketing), biểu đồ tự vẽ bằng SVG.
8. Ngoài yêu cầu nhưng hợp lý: phê duyệt CEO, nhật ký thao tác, chính sách nghiệp vụ, sao lưu JSON, chặn khóa/đổi vai trò tài khoản quản trị cuối cùng.

**B. LỆCH hoặc SAI so với yêu cầu / so với claude.md cũ**

| Mã | Vấn đề | Bằng chứng | Xử lý |
|---|---|---|---|
| L1 | **Tiền tệ sai hướng:** hệ thống tính VND; đổi sang ngoại tệ bằng `rate` **nhập tay** (mặc định 26000); không có USD chung; *(đã xử lý ở T1-01…T1-03: bảng tỷ giá VCB, USD chung cho hiển thị và nhập, bỏ `rate` nhập tay, tra tỷ giá theo ngày; hóa đơn USD + thu tiền đa tiền tệ T1-04; phải trả/quyết toán/lãi lỗ/dòng tiền… T1-04b; còn VAT T1-04d)* | `mod-design.js` dòng ~27, ~37 | EPIC 1 (T1-01…T1-04) |
| L2 | **Mật khẩu:** 22 tài khoản mẫu dùng `123456` và **không bắt đổi** (`mustChangePassword: false`); nút chọn nhanh vai trò tự điền `123456` | `travel-auth.js` (`ensureRequiredTeamAccounts`, `selectLoginRole`), `mod-admin.js` | T0-04, T0-11 |
| L3 | **Phạm vi dữ liệu so tên:** tài khoản mẫu tên "Nhân viên Sales 01"… — nếu danh mục `crmOwners`/`operationOwners`/`marketingOwners` trong DB chưa có đúng tên, Sales/Điều hành/Marketing thấy rộng hơn dự định và **không có cảnh báo** | `workflow.js` `scopedLeads/Bookings`, `myName()` | T0-12 |
| L4 | **HDV chưa gắn hồ sơ:** 10 tài khoản HDV có `guideId` rỗng → cổng HDV báo "chưa liên kết" cho tới khi liên kết tay | `travel-auth.js`, `mod-guideapp.js` `guidePortalEmpty` | T0-12 |
| L5 | **Menu ngoài danh sách khách:** Sales và Điều hành có thêm Dashboard, Tài liệu, CSKH (Sales còn có Thiết kế tour) | `businessRolePolicies.menus` | T12-02 (hỏi khách) |
| L6 | **Tab HDV không truy cập được:** Lịch phân công / Báo cáo / Tạm ứng & chi phí (docx không yêu cầu) | `mod-guideapp.js` dòng ~116 + không vai trò nào khác có menu `guideapp` | T6-04 |
| L7 | **Hai cây mã nguồn trùng trong git;** thông báo trong `travel-api.js` trỏ về README đã xóa (đã sửa ở T0-02b ngày 22/10) | `git ls-files`, `travel-api.js` ~193 | T0-10 |
| L8 | `?v=` trong `index.html` chỉ có 5 thẻ, dạng số nguyên, sai quy ước | `index.html` | T0-01 |
| L9 | `mod-ai.js`, `mod-help.js` vẫn không được nạp | `index.html` | T0-06 |
| L10 | Hợp đồng chỉ là bản ghi rỗng (không nội dung/mẫu/tệp) | `workflow.js` `ensureBookingContract` | T3-10 |
| L11 | Mã nguồn có nhiều dòng quá dài / nhiều lệnh một dòng, CSS nén một dòng — khó đọc, khó review | thống kê mục 5.12 | Luật 5.12 + T0-13 |

**C. THIẾU hẳn (đã `grep` không thấy trong code)**

Kéo–thả đổi thứ tự ngày (chỉ có nút lên/xuống) · ma trận giá theo pax 1–30 · Tour ghép SIC · AI/OCR nhập khách từ hộ chiếu · USD chung + tỷ giá VCB + thu nhiều tiền tệ · OnePay/VNPAY · Landtour đối tác · khuyến mại NCC · loại phòng có cấu trúc · đăng nhập Google / lưu Google Drive / email Gmail thật · gọi AI thật · form web tự tạo lead · vai trò Xe/Tài xế. (Chi tiết và mã task: bảng mục 4 phía trên và mục 6.)

### 4.2 Điểm trong claude.md từng đi ngược / lệch yêu cầu (đã rà 22/10/2026 và đã sửa tại chỗ)

| # | Nội dung cũ trong claude.md | Vấn đề | Đã xử lý |
|---|---|---|---|
| 1 | Mục 0, 5.1.1: "Mọi công nghệ docx bị BỎ QUA, chỉ giữ nghiệp vụ" | docx mục 3 và "ERP V1" có **năng lực** khách có thể mong đợi: Google Login + Role Permission, Google Drive (Document Center), Gmail Workspace, OpenAI, Make.com, app mobile HDV. Bỏ cả khối dễ làm mất yêu cầu ngầm | Sửa câu chữ mục 0: bỏ **stack**, giữ **năng lực**. Quyết định "giữ web tĩnh + KIO" **không đổi**. Hỏi khách ở mục 8.1 |
| 2 | Đầu file: "thay thế hoàn toàn file docx (đã không còn)" | docx đã có lại; nếu hai bên khác nhau thì docx là gốc | Sửa đầu file |
| 3 | 3.6: "Tiền trong dữ liệu: số nguyên VND" như quy ước | Trái yêu cầu USD là tiền chung (1.4 điểm 7) | Đổi thành "hiện trạng, sẽ đổi" |
| 4 | 3.5: "`mustChangePassword` bắt đổi ở lần đầu" | Code mới đặt `false` | Sửa mô tả đúng hiện trạng; thêm T0-11 |
| 5 | 3.2 / 3.3 / 3.8: cây `js/core`, `js/modules`, `mod-crm-sales`, `quote-engine`… | Cây đó không còn được nạp | Viết lại theo cây phẳng, thêm bảng đổi tên |
| 6 | 5.3, T0-01, 8.2: "`index.html` chưa có `?v=`" | Thực tế có 5 thẻ, sai dạng | Sửa mô tả, viết lại T0-01 |
| 7 | Dòng 23 của mục 4: cổng HDV có "báo cáo, tạm ứng/chi phí" | HDV không thấy 3 tab đó | Sửa dòng 23, thêm T6-04 |
| 8 | T0-02b ghi `[x]` | Sửa đổi nằm ở cây cũ, bản `main` mới không có | Mở lại `[ ]` |
| 9 | 5.1.4: "không tiện tay format lại" | Xung đột nhẹ với luật định dạng mới | Thống nhất ở 5.12: luật áp dụng cho code **viết mới / đoạn đang sửa** |
| 10 | Chưa ghi số tài khoản, menu theo vai trò, menu của CEO | Người dùng cần để làm nhanh | Thêm 3.5.1–3.5.3 |
| 11 | Chưa ghi chỗ docx **tự mâu thuẫn**: (a) Điều hành "chỉ thấy Booking Confirmed, Supplier, Guide, Xe" nhưng Tour Dashboard của Điều hành lại có **Cost, Profit**; (b) hai phiên bản trạng thái lead | (a) chưa rõ Điều hành có xem lợi nhuận không; (b) claude.md đã gộp đúng | Thêm câu hỏi (a) vào 8.1 |
| 12 | 3.3: "`?v=` chỉ có ở 5 thẻ, số nguyên" | `index.html` đã có thêm thẻ `?v=20261022.N` | Viết lại ghi chú 3.3 theo hiện trạng |

---

## 5. QUY ĐỊNH LÀM VIỆC (BẮT BUỘC)

### 5.1 Nguyên tắc chung

1. **Không đổi công nghệ.** Giữ web tĩnh thuần + KIO. Không thêm framework, không thêm bước build, không chuyển sang NextJS/Laravel/PostgreSQL/Make.com. Muốn thêm thư viện: chỉ khi thật cần, đặt file nội bộ vào `assets/vendor/` (không tải từ CDN lúc chạy), nạp bằng `<script>` thường, ghi vào Nhật ký.
2. **Làm theo cách đang có:** dùng lại hàm dùng chung ở mục 3.9, đặt tên/camelCase/kiểu viết như file xung quanh, mỗi phân hệ một file `mod-*.js`.
3. **Giao diện tiếng Việt**, văn phong ngắn gọn. Không để chữ tiếng Anh lẫn lộn (xem cạm bẫy `localizeUI`).
4. **Sửa tối thiểu, đúng phạm vi:** chỉ động vào file cần thiết cho task. Không "tiện tay" format lại, đổi tên, dọn code ngoài yêu cầu. **Nhưng** code mình viết mới và đoạn/hàm mình đang sửa phải theo luật định dạng ở mục 5.12.
5. **Mọi chuỗi chèn vào HTML phải qua `esc()`.**
6. **Mọi thao tác ghi dữ liệu:** kiểm tra quyền (`requireCapability`/`can`) → thay đổi `state` → `audit(...)` → `save()` → cập nhật giao diện (`render()` hoặc hàm refresh của màn hình).
7. **Không tự thêm tính năng ngoài yêu cầu.** Nếu thấy cần, ghi vào mục 6 dưới dạng task mới để người dùng quyết.
8. **Không bịa dữ liệu khách chưa cung cấp** (mẫu form, tỷ giá, danh mục). Đánh dấu ⏳ và hỏi (mục 8).
9. **Phải đọc code liên quan trước khi sửa** — bảng mục 4 là ghi chú, không thay được việc đọc code.

### 5.2 Mã hóa ký tự & xuống dòng

- File **UTF-8**, xuống dòng **CRLF** (như hiện tại). Khi tạo/sửa file bằng công cụ, kiểm tra lại bằng `file <tên>`; file mới phải là CRLF cho đồng nhất.
- Không thêm BOM.
- Riêng `claude.md` dùng LF (như hiện tại).
- **`.gitattributes` (T0-07):** git lưu LF, checkout ra `.html/.css/.js/.svg` là CRLF; `.php`, `.htaccess`, `.md` giữ LF. Nhờ đó `git status` không còn báo "modified" hàng loạt do EOL. File mới thuộc các loại trên cứ viết đúng EOL như quy định; không cần cấu hình `core.autocrlf`.

### 5.3 Cache-busting `?v=` trong index.html

**Hiện trạng (22/10):** chỉ 5 thẻ trong `index.html` có `?v=` và dùng số nguyên (`mod-guideapp.css?v=2`, `travel-config.js?v=3`, `travel-auth.js?v=2`, `app.core.js?v=2`, `app.js?v=2`); các thẻ khác chưa có (việc đầu tiên: T0-01). Trình duyệt sẽ giữ bản cũ của JS/CSS nếu không đổi URL, nên quy ước dưới đây là bắt buộc.

- Mọi thẻ `<link rel="stylesheet">` và `<script src>` **nội bộ** (css/…, js/…) phải có dạng: `...file.js?v=YYYYMMDD.N`
  (ví dụ `js/mod-quotes.js?v=20261022.1`). `N` bắt đầu từ 1 và tăng trong cùng một ngày.
- **Sửa file nào thì tăng `?v=` của đúng thẻ đó** trong `index.html`. Không tăng cho file không đổi. (Nếu người dùng yêu cầu "tăng đồng loạt", mới tăng toàn bộ.)
- **Thêm file CSS/JS mới:** thêm thẻ vào `index.html` đúng vị trí thứ tự nạp (mục 3.3), kèm `?v=`.
- **Không** gắn `?v=` cho tài nguyên bên ngoài (Google Fonts, `kio.dvqt.vn/krud.js`).
- Sửa `index.html` thì file này luôn nằm trong gói zip giao.
- Nếu một thay đổi chỉ nằm trong `assets/` (ảnh, font) và tên file giữ nguyên, tăng `?v=` ở thẻ tham chiếu tới nó (nếu có thẻ).

### 5.4 Cách giao file (zip)

- **Chỉ zip các file có thay đổi hoặc mới**, **giữ nguyên đường dẫn thư mục** bên trong zip (để người dùng giải nén đè lên thư mục dự án), **kèm `claude.md` đã cập nhật** và **`index.html` nếu có tăng `?v=`**.
- **Không** đưa vào zip: `.git/`, file không đổi, `assets/` không đổi (chart.js, tailwind.js, fa/, vendor/…).
- Tên zip: `travel_patch_YYYYMMDD_NN.zip` (NN = số thứ tự trong ngày, 01, 02…).
- **Không** đưa vào zip nội dung thư mục `uploads/` (dữ liệu thật trên máy chủ) và khi giải nén đè **không xóa** `uploads/`.
- Xóa file: nếu task yêu cầu xóa file, **ghi rõ danh sách file cần xóa** trong câu trả lời và trong Nhật ký (zip không thể xóa file giúp).
- Khi trả lời, **liệt kê danh sách file trong zip** (đường dẫn + 1 dòng mô tả thay đổi) và các bước người dùng cần làm thêm (ví dụ tạo bảng KIO mới).
- Nếu task đụng tới **dữ liệu/bảng KIO** (collection mới, trường mới cần migrate): nêu rõ trong câu trả lời, vì code không tự tạo bảng.

### 5.5 Nhật ký (log) công việc

- **Nơi ghi: mục 9 của chính file này (`claude.md`)**, không tạo file log riêng.
- Mỗi lần làm xong một nhóm việc: thêm **một dòng** vào bảng Nhật ký (ngày, mã task, tóm tắt, danh sách file đổi, ghi chú), và **tick `[x]`** các checkbox liên quan ở mục 6. Task làm dở: để `[ ]` và ghi "đang dở" trong Nhật ký kèm điều còn thiếu.
- Mục 6 chỉ **thêm** task mới (đánh số tiếp), không xóa task cũ; task bỏ thì gạch bằng `~~...~~` và ghi lý do.
- Quyết định quan trọng (đổi cách làm, chọn phương án) ghi vào mục 8 → chuyển thành "Đã quyết định" kèm ngày.

### 5.6 Thêm một phân hệ/màn hình mới — checklist

1. `js/mod-<tên>.js` (hoặc thêm vào module cùng nhóm nếu nhỏ), định nghĩa `views.<id> = () => ...`.
2. `js/app.core.js`: thêm vào `pages` (`[id, ký hiệu, nhãn]`), vào `navGroups`/`navigationGroups()`, thêm icon trong `sidebarIcon()`, và gán `menus` + `capabilities` trong `businessRolePolicies` cho đúng vai trò.
3. `index.html`: thêm `<script>`/`<link>` (đúng thứ tự, có `?v=`).
4. CSS riêng: `css/mod-<tên>.css` (thêm trước nhóm file ghi đè `overlays.css`…, tránh sửa các file ghi đè sau cùng trừ khi bắt buộc).
5. Dữ liệu mới: `emptyState()` + `businessIdSchemas` (nếu có mã) + `normalizeBusinessIds()` (nếu tham chiếu chéo) + **bảng KIO** + `migrateWorkflowData()` nếu cần bù dữ liệu cũ.
6. Thông báo/hộp việc: nếu có việc cần xử lý, thêm vào `workQueue()` (workflow.js).
7. Thêm bước kiểm tra thủ công cho vai trò liên quan (5.8).

### 5.7 Đổi cấu trúc dữ liệu đang có

- Dữ liệu thật nằm trong KIO → **không được phá dữ liệu cũ**. Thêm trường mới thì code phải chịu được bản ghi chưa có trường đó (`x.field ?? mặc định`) và, nếu cần, bù trong `migrateWorkflowData()`.
- Không đổi tên trường/collection đang dùng trừ khi có kế hoạch migrate được ghi trong Nhật ký.

### 5.8 Kiểm tra trước khi giao (không có test tự động)

1. Chạy kiểm tra cú pháp từng file JS đã sửa: `node --check <file>` (không lỗi mới).
2. Tự rà luồng bằng cách đọc code; nếu có trình duyệt thì mở thử.
3. Kiểm tra theo vai trò bị ảnh hưởng: CEO, Sales, Điều hành, Kế toán, Marketing, HDV — vai trò **không được phép** không thấy màn hình/số liệu mới (đặc biệt: Sales không thấy kế toán; Marketing không thấy lợi nhuận/chi phí tour; HDV chỉ thấy tour của mình).
4. Kiểm tra dữ liệu rỗng (chưa có bản ghi) không làm vỡ màn hình.
5. Nếu không chạy thử được, **nói rõ "chưa chạy thử trên trình duyệt"** trong câu trả lời, đừng khẳng định đã test.
6. **Kiểm tra định dạng (5.12)** trên phần đã sửa: không có dòng nhiều lệnh, không có dòng mới > 160 ký tự; nêu kết quả trong câu trả lời.

### 5.9 Git

- Người dùng tự commit/push. Claude không chạy git push.
- Gợi ý thông điệp commit: `[T3-01] kéo thả ngày tour` (mã task + mô tả ngắn).

### 5.10 Khi nào phải hỏi lại người dùng

Hỏi trước khi làm nếu: (a) task phụ thuộc mục ⏳/mục 8; (b) có hai cách làm khác nhau rõ rệt về dữ liệu/quyền; (c) cần tạo/đổi bảng KIO; (d) cần gọi dịch vụ bên ngoài (AI, email, cổng thanh toán, tỷ giá) — vì demo là web tĩnh, **không giữ được khóa bí mật phía trình duyệt**.

### 5.11 Quy trình cập nhật claude.md (phát hiện thiếu / sai thì ghi vào đâu)

Mục tiêu: claude.md luôn khớp với **docx của khách** và với **code đang chạy**, để phiên sau không phải đọc lại toàn bộ.

**A. Khi có yêu cầu mới từ khách** (docx mới, tin Zalo, ảnh, mẫu form…)

1. Ghi vào **mục 1**, đúng phân hệ, kèm ngày và nguồn. Không xóa ý cũ: nếu hai bên khác nhau, ghi cả hai và đưa câu hỏi vào mục 8.1.
2. Với từng ý mới, tìm dòng tương ứng ở **bảng mục 4**; chưa có thì thêm dòng cuối bảng (đánh số tiếp) với ký hiệu ✅ 🟡 ❌ ⏳.
3. Mỗi dòng 🟡 / ❌ / ⏳ phải có **ít nhất một task ở mục 6** (đánh số tiếp trong EPIC phù hợp). Ghi mã task vào cột "Hiện có / thiếu gì" của mục 4; mô tả task nhắc ngược dòng mục 4.
4. Có điều chưa rõ hoặc đang chờ khách → mục 8.1 (checkbox) và gắn 🔒 / ⏳ cho task liên quan.
5. Ghi một dòng vào **Nhật ký (mục 9)**.

**B. Khi nhận bản code mới (zip/commit mới) hoặc đầu mỗi phiên**

1. Chạy `git log --oneline -5` và so với commit ghi ở đầu file; chạy `git diff --stat <commit cũ>` để biết file nào đổi. **Cấu trúc thư mục đổi → sửa 3.2, 3.3, 3.8 trước tiên.**
2. Nếu `requiredTeamAccounts`, `businessRolePolicies`, `pages` hoặc `navGroups` đổi → **cập nhật ngay 3.5.1–3.5.3** (số tài khoản, ma trận menu, đối chiếu yêu cầu). Lệnh trích nhanh (chạy ở thư mục gốc dự án):

```bash
# 22 tài khoản mẫu
sed -n '/requiredTeamAccounts = \[/,/^\];/p' js/travel-auth.js
# menu của từng vai trò
grep -n 'menus:' js/app.core.js
# danh sách màn hình + nhãn
sed -n '/^const pages = \[/,/^\];/p' js/app.core.js
# file nào thực sự được nạp
grep -oE '(src|href)="(js|css)/[^"]+"' index.html
```

3. Đối chiếu từng dòng mục 4 với code (dùng `grep` từ khóa nghiệp vụ, ví dụ `draggable`, `pax`, `SIC`, `USD`, `OnePay`) → sửa ký hiệu. Nếu code làm **sai ý khách** thì ghi vào mục 4.1-B (mã `L…`) kèm task sửa.
4. Task đã xong → tick `[x]`. Task dở → để `[ ]` và ghi "đang dở" trong Nhật ký. Task bị code khác làm mất → **bỏ tick** và ghi lý do (ví dụ T0-02b).
5. Cập nhật dòng **"Rà soát lại"** ở đầu file (ngày + commit).

**C. Khi chính claude.md trái yêu cầu hoặc trái code**

1. Sửa tại chỗ rồi thêm một dòng vào **mục 4.2** (cũ → mới).
2. Nếu sửa cần **quyết định của người dùng/khách** (đổi công nghệ, đổi quyền, xóa file) thì **không tự đổi**: ghi vào mục 8.1 và nêu trong câu trả lời.

**D. Cách viết:** ngắn gọn, có mã task, không xóa lịch sử (gạch `~~...~~`), mỗi thông tin ghi **một chỗ** rồi dẫn "xem mục X" ở chỗ khác. Mỗi lần xong luôn trả lại claude.md đã cập nhật.

### 5.12 Quy tắc viết code & định dạng (BẮT BUỘC)

**Mục đích:** code dễ đọc, dễ review, diff nhỏ. **Nguyên tắc cốt lõi: mỗi dòng một câu lệnh — tuyệt đối không nhồi nhiều lệnh trên cùng một dòng.** Định dạng theo cách các file mẫu trong demo đang làm.

**File mẫu để bắt chước:** `js/travel-api.js`, `js/travel-auth.js`, `js/mod-crm.js` (dòng 61–102: `leadIsOpen`, `views.crm`, `crmFunnel`), phần mới trong `js/mod-admin.js` (`isLastActiveAdministrator`, `saveUserGuideLink`), `css/style.css`.

**Phạm vi:** áp dụng cho code **viết mới** và **đoạn/hàm đang sửa**. Không format lại phần không đụng tới (giữ diff nhỏ, mục 5.1.4). Muốn dọn cả file → làm bằng task riêng (T0-13) và báo trước người dùng.

**JavaScript**

1. **Một câu lệnh một dòng.** Cấm nối lệnh bằng `;` trên cùng dòng, cấm khai báo nhiều biến bằng dấu phẩy trên cùng dòng.
2. Thụt lề **2 dấu cách** (không tab); chuỗi dùng `"..."`; template literal `` `...` `` khi có `${}` hoặc HTML; **luôn có `;`**; có dấu cách sau `,` và `:`; có dấu cách quanh toán tử và `=>`; tham số arrow luôn có ngoặc `(x) => ...`.
3. `const` mặc định, `let` khi phải gán lại, **không `var`**; tên `camelCase`; hàm `function tenHam() {` với `{` cùng dòng; một dòng trống giữa các hàm; chú thích ngắn tiếng Việt `/* ... */` trước mỗi nhóm hàm.
4. **Mảng/đối tượng nhiều phần tử** (hơn 3 phần tử hoặc dài quá 100 ký tự): **mỗi phần tử một dòng**, có dấu phẩy cuối (mẫu: `tabs` ở `mod-crm.js` dòng 74–81; `requiredTeamAccounts` ở `travel-auth.js`). Cấm kiểu nén `dashboard:"a",crm:"b",customers:"c",`.
5. `if`: guard ngắn một dòng được (`if (!user) return;`) như demo. Còn lại dùng `{ }` và xuống dòng. **Cấm** `if (a) b(); else c();` và hai lệnh sau `if` trên cùng dòng. Không lồng toán tử ba ngôi quá 1 cấp.
6. Chuỗi gọi nối (`.filter().map().join()`) dài quá 100 ký tự: **mỗi `.phươngThức()` một dòng** (mẫu `crmFunnel`, `mod-crm.js` dòng 99–101).
7. **Độ dài dòng:** logic JS ≤ 100 ký tự (tối đa 120). **Chuỗi HTML dài** phải ngắt: tách thành hàm nhỏ trả về từng khối (`xxxCard()`, `xxxRow()`) hoặc template nhiều dòng, mỗi thẻ khối (`<section>`, `<div class="...">`, `<tr>`) một dòng. **Không dòng mới nào > 160 ký tự.**
8. **Sự kiện inline** `onclick="..."` chỉ gọi **một hàm**; cần nhiều bước thì viết hàm riêng (không `onclick="a=1;b=2;render()"`).
9. Không minify, không dán code đã nén, không gộp nhiều dòng thành một để "cho ngắn".

Ví dụ:

```js
// SAI — nhiều lệnh một dòng (kiểu workflow.js dòng ~322)
function addDaysSafe(iso, n) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
let a = 1, b = 2, c = 3;
const tabs = [["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"], ["e", "E"]];
if (!b.guideReports) { b.guideReports = []; changed = true; }

// ĐÚNG
function addDaysSafe(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const a = 1;
const b = 2;
const c = 3;

const tabs = [
  ["a", "A"],
  ["b", "B"],
  ["c", "C"],
  ["d", "D"],
  ["e", "E"],
];

if (!b.guideReports) {
  b.guideReports = [];
  changed = true;
}
```

**CSS** — theo `css/style.css`: mỗi selector một dòng, **mỗi khai báo một dòng**, thụt 2 dấu cách, có dấu cách sau `:`, thuộc tính đặt trong `{ }` xuống dòng. Cấm nén `.a{color:red;margin:0;padding:0}` trên một dòng (nhiều file `css/mod-*.css`, `erp-ui.css` đang như vậy — không bắt chước ở code mới, không tự giãn lại file cũ).

```css
/* ĐÚNG */
.crm-workspace-tabs .btn.selected {
  color: var(--green);
  background: var(--mint);
  border-color: #c9ded0;
}
```

**HTML (`index.html`)** — thụt 2 dấu cách; thẻ có nhiều thuộc tính (hơn 3 hoặc dòng > 100 ký tự) thì **mỗi thuộc tính một dòng**, như các thẻ `<input>`, `<button>` đang có trong file.

**Tệp:** UTF-8, **CRLF** cho `.js/.css/.html` (mục 5.2), cuối file có xuống dòng.

**Kiểm tra trước khi giao** (chạy trên file đã sửa, thay `<file>`):

```bash
node --check <file>                                    # cú pháp
awk 'length > 160 {print FILENAME": dòng "FNR": "length" byte"}' <file>   # dòng quá dài (ước lượng theo byte)
grep -nE ';[[:space:]]+[A-Za-z_$][A-Za-z0-9_$.]*[[:space:]]*(\(|=[^=>])' <file> | grep -v 'for ('   # nhiều lệnh một dòng
```

Hai lệnh sau chỉ là **gợi ý nhanh** (có thể báo nhầm ở chuỗi HTML dài hoặc vòng `for`); chỉ cần chắc chắn **đoạn mình viết/sửa** sạch. Nêu kết quả trong câu trả lời. Hiện trạng demo (để biết nợ cũ): khoảng 390 dòng JS dài hơn 200 ký tự (nhiều nhất ở `mod-design.js`, `mod-accounting.js`, `mod-bookings.js`, `mod-operations.js`, `app.core.js`) và hàng trăm quy tắc CSS nén một dòng.

---

## 6. DANH SÁCH VIỆC CẦN LÀM

Ưu tiên: **P0** nền tảng/chặn việc khác · **P1** lõi theo yêu cầu khách · **P2** quan trọng · **P3** nâng cao/AI.
`[x]` xong · `[ ]` chưa làm · 🔒 bị chặn bởi quyết định/khách (mục 8).

### EPIC 0 — Nền tảng & nợ kỹ thuật

- [ ] **T0-01 (P0)** Chuẩn hóa `?v=` trong `index.html`: hiện chỉ 5 thẻ có `?v=` kiểu số nguyên (`mod-guideapp.css?v=2`, `travel-config.js?v=3`, `travel-auth.js?v=2`, `app.core.js?v=2`, `app.js?v=2`). Đổi **mọi** thẻ `<link>`/`<script>` nội bộ sang `?v=YYYYMMDD.N` (mục 5.3). *Nghiệm thu: không còn thẻ nội bộ nào thiếu `?v=` hoặc sai dạng.*
- [x] **T0-02 (P0)** Ghi lại cấu trúc bảng KIO thay cho README_NGHIEP_VU.md đã xóa → mục 3.4 của file này.
- [x] **T0-02b (P2)** Sửa thông báo trong `js/travel-api.js` (~dòng 193) đang trỏ "README_NGHIEP_VU.md" cho đúng nguồn mới (claude.md mục 3.4) hoặc bỏ tham chiếu file. *Mở lại 22/10: bản sửa từng làm nằm ở `js/api/travel-api.js` (cây cũ), bản phẳng đang chạy vẫn trỏ README đã xóa.* **Xong 22/10:** đã sửa trong `js/travel-api.js` (cây phẳng) — thông báo nay trỏ "claude.md mục 3.4". Bản ở `js/api/` (cây cũ) vốn đã đúng, sẽ bị xóa ở T0-10.
- [ ] **T0-03 (P0) 🔒** Quyết định **nơi chạy AI và tự động hóa** (gọi mô hình AI, gửi email thật, nhận form web, OCR hộ chiếu): web tĩnh không giữ được khóa API. Cần xác nhận KIO có hỗ trợ chức năng phía server/proxy/webhook không, hoặc người dùng chọn cách khác. Ghi quyết định vào mục 8. *Chặn: EPIC 9, EPIC 10, T3-06, T3-08.*
- [ ] **T0-04 (P1)** Bảo mật đăng nhập trước khi dùng thật: (a) bỏ tự điền mật khẩu `123456` ở `selectLoginRole` (`travel-auth.js`) và cân nhắc ẩn các nút chọn nhanh vai trò; (b) lưu ý bảng `typicone_users` (salt + hash) đọc được từ trình duyệt, kiểm tra quyền chỉ ở giao diện → xác định với KIO cách chặn phía máy chủ; (c) ghi rủi ro còn lại vào mục 8; (d) xem T0-11 (mật khẩu mặc định không còn bắt đổi).
- [x] **T0-05 (P1)** Lưu tệp ra thư mục `uploads/` trong source, database chỉ lưu đường dẫn — **người dùng chọn phương án này 22/10**. *Đã làm (code):* `upload.php`, `uploads/.htaccess`, `uploadFile()` trong `travel-api.js`, cấu hình trong `travel-config.js`; `mod-documents.js` (`uploadDoc` lưu `path/size/mime`, `openDocument` mở theo `path`, vẫn đọc được tài liệu cũ base64); `mod-guideapp.js` (ảnh báo cáo cuối tour lưu `uploads/guide-reports/`, báo cáo chỉ giữ đường dẫn; lỗi tải thì không kết thúc tour và báo toast). Chi tiết mục 3.4a. **Chưa thử trên máy chủ PHP thật — xem T0-05c.**
- [ ] **T0-05c (P1)** Triển khai và **thử `upload.php` trên máy chủ thật**: PHP ≥ 7.4, `upload_max_filesize`/`post_max_size` ≥ 10M, quyền ghi `uploads/`, Apache đọc được `.htaccess` (hoặc cấu hình Nginx tương đương). Thử: tải PDF/ảnh ở Kho tài liệu, nộp báo cáo cuối tour có ảnh; thử tệp .php đổi đuôi .pdf (phải bị từ chối); thử tệp > 10 MB. *Hỏi người dùng: máy chủ chạy thật là gì (mục 8.1).*
- [ ] **T0-05d (P2)** Chuyển **tài liệu cũ** đang lưu base64 (`docs[].data`) và ảnh cũ (`finalReport.photos` dạng `data:`) sang `uploads/` rồi xóa `data` khỏi database (viết hàm chuyển một lần, CEO bấm; sao lưu JSON trước).
- [ ] **T0-05e (P1) 🔒** Bảo mật tệp tải lên: `upload.php` chưa xác thực người dùng (chỉ chặn khác nguồn) và tệp phục vụ qua URL tĩnh, chỉ che bằng tên ngẫu nhiên 128 bit. Hộ chiếu/hợp đồng là dữ liệu nhạy cảm → cần phương án xác thực phía máy chủ (liên quan T0-04). Hỏi người dùng/khách.
- [ ] **T0-05b (P2)** Đo thời gian tải/lưu với dữ liệu lớn (1000+ NCC, hàng trăm booking) và quyết định có cần tách collection `suppliers` (blob lớn) hoặc phân trang phía server.
- [ ] **T0-06 (P2)** Xử lý `mod-ai.js` và `mod-help.js` (đang không nạp, không có trong `pages`): hoặc nạp + đăng ký màn hình, hoặc xóa. `mod-ai.js` chỉ là thuật toán mô phỏng.
- [x] **T0-07 (P2)** Thêm `.gitignore` (bỏ qua `uploads/*`, `*.zip`, `backup*.json`, rác hệ điều hành/trình soạn thảo) và `.gitattributes` (repo LF, checkout CRLF cho `.html/.css/.js/.svg`; `.php/.htaccess/.md` LF; ảnh/font nhị phân). *Đã kiểm chứng 22/10 trên bản giải nén: `git status` từ ~80 file "modified" do EOL còn đúng các file thật sự đổi. Người dùng chỉ cần chép 2 file này vào thư mục gốc, không cần `git add --renormalize`.*
- [ ] **T0-08 (P2)** Rà `localizeUI()`/`uiTranslations`: giới hạn phạm vi hoặc loại trừ vùng dữ liệu người dùng để không đổi nhầm tên khách/tour.
- [ ] **T0-09 (P3)** Đối chiếu dữ liệu thật: lấy bản Sao lưu JSON từ người dùng, ghi nội dung `settings[0]` (`serviceTypes`, `leadSources`, `currencies`, `languages`, `countries`…) vào mục 3.4 để lần sau không phải đoán.

- [x] **T0-10 (P0) 🔒** Dọn **cây mã nguồn trùng**: các thư mục `js/core/`, `js/modules/`, `js/api/`, `js/data/`, `css/modules/` không được `index.html` nạp (bản phẳng `js/*.js`, `css/mod-*.css` mới hơn). Trước khi xóa: hỏi đồng đội/người dùng (cây phẳng do commit `71f2b33` tạo), làm xong T0-02b, đối chiếu lần cuối bằng `diff`. Người dùng tự chạy: `git rm -r js/core js/modules js/api js/data css/modules`. *Nghiệm thu: `git ls-files` chỉ còn một bản của mỗi file; mở trang vẫn chạy.*
- [ ] **T0-11 (P1)** Khôi phục **bắt đổi mật khẩu lần đầu** (`mustChangePassword: true`) cho tài khoản tạo mới/đặt lại (`mod-admin.js`) và tài khoản mẫu (`travel-auth.js` `ensureRequiredTeamAccounts`), hoặc đặt mật khẩu riêng từng tài khoản trước khi giao khách. *Hỏi người dùng: demo có cần giữ "đăng nhập nhanh không đổi mật khẩu" không.*
- [ ] **T0-12 (P1)** Đồng bộ **người phụ trách ↔ 22 tài khoản mẫu**: (a) `settings[0].crmOwners/operationOwners/marketingOwners/careOwners` phải chứa đúng `fullName` của từng tài khoản (hoặc đổi cách ghép sang `username`/id để không vỡ khi đổi tên); (b) liên kết `guideId` của `HDV-001…HDV-010` với hồ sơ trong `guides`. *Nghiệm thu: đăng nhập `SALES-001` chỉ thấy lead/booking của mình; `HDV-001` thấy tour được giao. Cần xem dữ liệu thật (T0-09).*
- [ ] **T0-13 (P3) 🔒** Chuẩn hóa **định dạng code cũ** theo mục 5.12: khoảng 390 dòng JS dài hơn 200 ký tự, các dòng nhiều lệnh (`workflow.js` ~322, ~662…), CSS nén một dòng. Làm **từng file**, mỗi lần giao một file, kiểm tra `node --check`, nêu trước với người dùng vì diff sẽ rất lớn.

### EPIC 1 — Tiền tệ & tỷ giá (USD là tiền chung)

- [x] **T1-01 (P1)** Bảng tỷ giá theo VCB (giá bán): USD, EUR, CAD, VND và các tiền khác; ngày hiệu lực; lịch sử; CEO/Kế toán chỉnh; lưu ở `settings[0].fxRates`; tự lấy từ XML của VCB mỗi ngày 1 lần. *Xong 22/10 — chi tiết mục 3.4b. Chưa chạy thử trên trình duyệt và chưa thử `fx-vcb.php` với VCB thật từ máy chủ → T1-01b.*
- [ ] **T1-01b (P1)** Triển khai và **thử `fx-vcb.php` trên máy chủ thật**: mở `/fx-vcb.php` thấy `"ok":true`; thư mục `cache/` ghi được; máy chủ ra được `portal.vietcombank.com.vn`. Thử trên trình duyệt: CEO đăng nhập → *Cài đặt → Tỷ giá* có bản của hôm nay (Tự động VCB); Kế toán thấy tab *Kế toán → Tỷ giá*; Sales không thấy; thử nhập tay/ghi đè; bảng `settings` trên KIO vẫn ghi được khi thêm lịch sử.
- [x] **T1-01d (P1)** Tách lịch sử tỷ giá khỏi `settings` sang collection riêng `fxHistory` (bảng KIO `typicone_fx_history`), bỏ giới hạn 800 bản, ghi chỉ chunk có đổi. *Xong 23/10 — chi tiết mục 3.4b. Chưa chạy thử trên trình duyệt/KIO thật.*
- [ ] **T1-01e (P1)** **Tạo bảng `typicone_fx_history` trên KIO TRƯỚC khi triển khai bản này** (cột `state_key` string, `chunk_index` int, `payload_text` text, `updated_at` string). Sau đó: CEO/Kế toán đăng nhập một lần → lịch sử tự chuyển khỏi `settings` (kiểm tra `settings[0].fxRates` không còn `history`, bảng mới có dữ liệu, tab *Tỷ giá* vẫn đủ số bản). Chưa có bảng thì lịch sử vẫn nằm ở settings, không mất.
- [ ] **T1-01c (P2) 🔒** Tỷ giá tự cập nhật **kể cả khi CEO/Kế toán không đăng nhập** (hiện chỉ cập nhật khi họ vào hệ thống). Cần cron/tác vụ phía máy chủ ghi KIO (🔒 T0-03) hoặc cho mọi vai trò văn phòng kích hoạt (rủi ro xung đột ghi `settings`). Hỏi người dùng.
- [x] **T1-02 (P1)** Chốt USD làm tiền hiển thị chung cho giá tour/báo giá; chuyển đổi hiển thị USD/EUR/VND/CAD… bằng bảng tỷ giá thay cho ô `rate` nhập tay ở `mod-design.js`. *Xong 22/10, dữ liệu vẫn **lưu** bằng VND; phần **nhập** USD làm ở T1-02b (mục 3.4b). Thiết kế tour: mặc định USD, nút USD / tiền của khách (nếu có tỷ giá) / VND, ô "Tỷ giá VCB" chỉ đọc (bỏ `rate` 26000 và ô nhập tay); báo giá không còn lưu `rate`, chỉ lưu `fxDate`. Báo giá: danh sách, KPI, chi tiết, lịch sử hiển thị USD (chi tiết kèm số VND). **Chưa đổi:** duyệt giá, booking, kế toán → T1-04.*
- [x] **T1-03 (P1)** Mỗi báo giá/booking/hóa đơn/giao dịch lưu **tiền tệ + tỷ giá tại thời điểm** để không đổi khi tỷ giá thay đổi. *Làm lại 22/10 theo yêu cầu: **không lưu tỷ giá trên chứng từ**, chỉ lưu ngày tạo (`fxDate` / `issuedAt` / `date`) và tra tỷ giá của ngày đó trong lịch sử — chi tiết mục 3.4b. Màn báo giá (danh sách, KPI, chi tiết, lịch sử), **bản in báo giá** và **email gửi khách** hiển thị USD (kèm VND) theo tỷ giá của ngày tạo, in lại bản cũ không đổi số. Booking/hóa đơn/giao dịch mới chưa hiển thị USD (sẽ dùng ở T1-04). Chưa migrate: báo giá cũ dùng ngày `createdAt`.*
- [x] **T1-02b (P1)** Thống nhất **nhập** số tiền mặc định bằng USD (cùng với hiển thị): ô giá bán, chi phí mục dịch vụ (thiết kế tour), form *Điều chỉnh giá* báo giá; lưu vẫn VND. *Xong 22/10 — mục 3.4b. Chưa làm cho hóa đơn / thu chi / phải trả / VAT (thuộc T1-04 🔒).*
- [x] **T1-04 (P1)** Thu tiền & hóa đơn nhiều tiền tệ (USD/EUR/VND). *Xong 23/10 theo quyết định "ghi sổ bằng USD" của người dùng — chi tiết mục 3.4b. Thu tiền: khách trả USD/EUR/CAD/VND; hóa đơn: nhập USD; sổ lưu VND, quy đổi theo tỷ giá ngày chốt báo giá. Chưa chạy trên trình duyệt.*
- [x] **T1-04b (P1)** Chuyển nốt sang USD các màn còn VND: phải trả NCC và chi NCC, quyết toán, lãi/lỗ theo tour và tháng, dòng tiền, dashboard, duyệt giá, hàng chờ việc, CRM–khách hàng, công nợ NCC, hợp đồng in, chi phí dịch vụ ở Điều hành, hoàn tiền khi hủy. *Xong 23/10, **trừ VAT** (giữ VND, chờ quyết định — T1-04d) — chi tiết mục 3.4b. Kiểm tra bằng node; chưa chạy trên trình duyệt (T1-04c).*
- [ ] **T1-04d (P1) 🔒** VAT: giữ VND (khai thuế theo quy định Việt Nam, như đang làm) hay quy đổi USD? Hiện VAT, `vat[].base` và VAT đầu vào khi nhập hóa đơn NCC đều **VND**; hóa đơn NCC nhập USD rồi quy ra VND theo tỷ giá booking nên `base` đúng VND. *Hỏi người dùng.* Khi chốt, cũng chốt luôn Marketing/HDV/mục tiêu tháng/CSV giao dịch có chuyển USD không.
- [ ] **T1-04c (P1)** Thử trên trình duyệt: tạo booking từ báo giá → xuất hóa đơn USD → thu đủ bằng USD → công nợ đúng 0; thu bằng EUR và VND; đổi tỷ giá hôm nay rồi thu tiếp; in hóa đơn.

### EPIC 2 — Marketing & nguồn Lead

- [x] **T2-01 (P1)** Chuẩn hóa danh sách nguồn lead theo 9 nguồn ở mục 1.3 (`settings[0].leadSources`); thêm trường chi tiết theo nguồn (tên CTV, đối tác B2B, hội chợ, tên ấn phẩm như Petit Futé/Routard). *Xong 23/10 — 9 nguồn chuẩn nằm ở `leadSourceCatalog` (`mod-crm.js`), lead lưu `source` + `sourceDetail`; `migrateLeadSources()` (gọi từ `migrateWorkflowData`) tự đưa `settings[0].leadSources` và nguồn của lead cũ về 9 nguồn chuẩn (không khớp → "Khác", chữ cũ giữ ở `sourceDetail`). Chưa chạy thử trên trình duyệt/KIO thật → T2-01b.*
- [ ] **T2-01b (P1)** Thử trên trình duyệt với dữ liệu KIO thật: (1) đăng nhập một lần → `settings[0].leadSources` thành đúng 9 nguồn, lead cũ có nguồn thuộc 9 nguồn (xem lead nào rơi vào "Khác" và sửa tay nếu cần); (2) *Thêm lead thủ công*: chọn CTV / Sách báo / Đối tác B2B / Hội chợ thì hiện ô chi tiết bắt buộc, các nguồn còn lại ẩn ô; (3) bảng Leads, hồ sơ lead, bộ lọc nguồn, tìm theo chi tiết nguồn, xuất CSV (cột *Chi tiết nguồn*); (4) *Tiếp nhận lead từ website* ra nguồn "Biểu mẫu trên trang web"; (5) Marketing (MKT-001) và Sales (SALES-001) thấy đúng; (6) dữ liệu rỗng không vỡ màn.
- [x] **T2-02 (P2)** CTV: liên kết CTV là HDV hoặc khách cũ (tham chiếu `guides`/`customers`); thống kê lead/doanh thu theo CTV. *Xong 23/10 theo yêu cầu người dùng "cho phép nhập hoa hồng, mặc định 0%": lead nguồn CTV lưu `ctvType` (`GUIDE`/`CUSTOMER`), `ctvId` (mã HDV/KH), `commissionRate` (%, mặc định 0); form *Thêm lead* chọn CTV từ danh sách HDV/khách; nút *CTV và hoa hồng* trong hồ sơ lead để sửa sau; tab *Cộng tác viên* ở CRM thống kê lead, đã chốt, tỷ lệ chốt, doanh thu, hoa hồng theo từng CTV. Hoa hồng = giá trị hợp đồng booking chưa hủy × tỷ lệ; chỉ CEO/Sales (`sales_financials`) thấy và sửa doanh thu/hoa hồng. Chưa chạy thử trên trình duyệt → T2-02b.*
- [ ] **T2-02b (P1)** Thử trên trình duyệt: (1) CEO/SALES-001 *+ Lead thủ công* chọn nguồn CTV → hiện *Loại CTV*, *CTV*, *Hoa hồng (%)* (mặc định 0), ẩn ô tên tự gõ; đổi sang nguồn khác thì ẩn lại; (2) chọn HDV rồi khách hàng cũ → danh sách CTV đổi theo loại; (3) hồ sơ lead CTV hiện CTV + hoa hồng, nút *CTV và hoa hồng* sửa được và ghi nhật ký; (4) tạo booking từ lead CTV → tab *Cộng tác viên* ra doanh thu/hoa hồng USD đúng (booking hủy không tính); (5) MKT-001 nhập được lead CTV nhưng **không** thấy hoa hồng/doanh thu, không có nút sửa; (6) SALES-001 chỉ thấy CTV của lead mình; (7) lead CTV cũ (T2-01, chưa có `ctvId`) hiện "Chưa liên kết hồ sơ" và liên kết được bằng nút sửa; (8) dữ liệu rỗng không vỡ.
- [x] **T2-03 (P2)** Báo cáo theo nguồn: số lead, tỷ lệ chốt, doanh thu, CPL theo kênh. Hoàn thành 23/10/2026; báo cáo nằm trong *Marketing → KPI tổng quan*, gồm số lead, lead chốt, tỷ lệ chốt, doanh thu, chi phí chiến dịch phân bổ và CPL. Chi phí chiến dịch được phân bổ theo tỷ trọng lead từng nguồn trong chiến dịch; chiến dịch chưa gắn lead chưa thể phân bổ. Chưa chạy thử trên trình duyệt.
- [ ] **T2-04 (P2)** Nhập nhanh lead từ WhatsApp/Fanpage/Instagram: nhập tay + nhập hàng loạt CSV trước; tích hợp tự động sau (🔒 T0-03).
- [ ] **T2-05 (P3) 🔒** AI: gợi ý nội dung quảng cáo, bài Fanpage, email tự động (🔒 T0-03).
- [ ] **T2-06 (P2) 🔒** KPI Traffic: cần nguồn số liệu (nhập tay theo tuần/tháng hay lấy từ công cụ phân tích). Hỏi khách.

### EPIC 3 — Sales: thiết kế tour, báo giá, booking

- [ ] **T3-01 (P1)** Kéo–thả đổi thứ tự ngày (hiện chỉ nút lên/xuống `designMoveDay`); giữ nút lên/xuống cho mobile.
- [ ] **T3-02 (P1)** **Ngân hàng "ngày tour"**: mỗi ngày là một bản ghi (tiêu đề, mô tả, điểm đến, dịch vụ gợi ý, ngôn ngữ); tour mẫu = chuỗi ngày; Sales nhặt ngày hoặc cả tour mẫu để ghép thành tour độ dài tùy ý. (Hiện `tourTemplates.itinerary` chỉ là mảng tiêu đề.) *Cần collection mới → tạo bảng KIO.*
- [ ] **T3-03 (P1)** Quản lý tour mẫu: nhập/sửa/xóa/phân loại (vùng, quốc gia, loại tour); upload tour mẫu có sẵn.
- [ ] **T3-04 (P1)** Giá theo số khách: bảng giá **pax 1–30**, tính **theo từng ngày hoặc theo tổng tour**, hiển thị giá/khách theo từng mức pax.
- [ ] **T3-05 (P1)** Hiển thị giá theo tiền tệ chọn (USD mặc định) — phụ thuộc EPIC 1.
- [ ] **T3-06 (P2) 🔒** Lưu nội dung chương trình theo nhiều ngôn ngữ (bản gốc + bản dịch), cài đặt ngôn ngữ; dịch thủ công trước, AI dịch sau (T9-02).
- [ ] **T3-07 (P1)** **Tour ghép (SIC):** thực thể "chuyến khởi hành" (ngày cố định, sức chứa, giá theo pax, đơn vị ghép), booking gắn vào chuyến; còn chỗ/đã đầy. *Cần collection mới → bảng KIO.*
- [ ] **T3-08 (P2) 🔒** Nhập danh sách khách từ **ảnh hộ chiếu** (họ tên, ngày sinh, số hộ chiếu, ngày cấp, ngày hết hạn, quốc tịch): màn hình xem lại/sửa trước khi lưu vào `bookings.passengers`. (🔒 T0-03; lưu ảnh bằng `uploadFile()`). Trước mắt có thể làm trước phần form khách đầy đủ 6 trường + cảnh báo hộ chiếu sắp hết hạn.
- [ ] **T3-09 (P1) ⏳** Thiết kế/xuất tour theo **form mẫu khách sẽ gửi sau**. Chờ file mẫu.
- [ ] **T3-10 (P1)** **Hợp đồng:** *đã có một phần (22/10):* tự tạo **bản ghi** Contract trong Tài liệu khi booking đủ điều kiện xác nhận (`ensureBookingContract`). *Còn thiếu:* mẫu hợp đồng, số hợp đồng, nội dung điền sẵn theo booking, lưu tệp/PDF, gắn với nút "In hợp đồng" (`printContract`). *Cần mẫu hợp đồng từ khách (mục 8).*
- [ ] **T3-11 (P2)** Báo giá "1 click → PDF → email khách" (hiện in PDF qua hộp thoại + `mailto:`; không đính kèm). Phụ thuộc cách gửi email (🔒 T0-03).
- [ ] **T3-12 (P2)** Đảm bảo Sales nhìn thấy tiến độ sau WON (đặt cọc → thanh toán cuối) trên booking của mình mà **không** thấy màn hình kế toán.

### EPIC 4 — Điều hành & Nhà cung cấp

- [ ] **T4-01 (P1)** Đối chiếu/chuẩn hóa loại dịch vụ-NCC (`settings[0].serviceTypes/serviceLabels`) với danh sách khách: Khách sạn, Homestay, Du thuyền (Junk/Boat), Tàu đêm, Máy bay (VNA, VietJet, khác), Xe (7–47 chỗ), Thuyền/Tàu, HDV (Bắc/Trung/Nam, Laos, Cambodia, Thailand), Nhà hàng, **Landtour đối tác**, Visa, Lệ phí, Tham quan, Khác.
- [ ] **T4-02 (P2)** Phân hệ 1 — đặt dịch vụ: trường riêng theo loại (khách sạn: loại phòng/số đêm; bay: hãng/số hiệu/giờ; xe: loại chỗ; tàu đêm: toa/giường…).
- [ ] **T4-03 (P1)** Phân hệ 2 — bảng theo dõi dịch vụ **đã đặt / chưa đặt** của mọi tour, lọc theo trạng thái/hạn/điều hành viên.
- [ ] **T4-04 (P1)** Phân hệ 3 — form nhập NCC đầy đủ: phân loại, địa chỉ, người phụ trách + SĐT, email, các loại dịch vụ, điều khoản thanh toán.
- [ ] **T4-05 (P1)** **Loại phòng có cấu trúc** (tên, sức chứa) + **giá theo mùa tính theo phòng/đêm** (khoảng ngày + mùa). Hiện chỉ có "hạng mục" giá tự do trong `suppliers[].prices`.
- [ ] **T4-06 (P2)** **Chương trình khuyến mại** của NCC (thời gian, điều kiện, % hoặc số tiền) và áp vào tính giá thiết kế tour.
- [ ] **T4-07 (P2)** **Hợp đồng NCC:** upload tệp (online) hoặc đánh dấu lưu bản giấy (offline), ngày ký/hết hạn + cảnh báo. (dùng `uploadFile()` — T0-05 đã xong, nhóm `docs`). Hiện chỉ có trạng thái "Đã ký".
- [ ] **T4-08 (P2)** Nhiều người liên hệ cho mỗi NCC.
- [ ] **T4-09 (P1)** **Nhập NCC hàng loạt** từ CSV/Excel (500–1000+ NCC); kiểm tra trùng.
- [ ] **T4-10 (P2)** Landtour đối tác như loại NCC riêng và luồng đặt tour qua đối tác.
- [ ] **T4-11 (P2)** Trường quốc gia/khu vực đủ cho NCC & HDV ở Việt Nam, Laos, Cambodia, Thailand; lọc theo khu vực.
- [ ] **T4-12 (P3)** Loại xe/hạng chỗ (7, 16, 29, 35, 45, 47…), liên kết NCC xe.

### EPIC 5 — Kế toán

- [ ] **T5-01 (P1) 🔒** Hóa đơn & thu tiền đa tiền tệ **USD/EUR/VND** kèm tỷ giá (xem T1-04). *Phần thu tiền đa tiền tệ đã làm ở T1-04; hóa đơn hiện chỉ ghi USD (bản in kèm VND), chưa phát hành hóa đơn bằng EUR/VND.*
- [ ] **T5-02 (P1)** Phân loại phương thức thu: chuyển khoản quốc tế / chuyển khoản nội địa / tiền mặt / OnePay / VNPAY. Ghi nhận thủ công trước; **tích hợp cổng thanh toán** làm sau (🔒 T0-03).
- [ ] **T5-03 (P1)** Đối soát **VAT đầu ra** với tiền đã về tài khoản: cảnh báo khoản đã thu nhưng chưa xuất VAT.
- [ ] **T5-04 (P1)** Đối soát **VAT đầu vào** với thanh toán NCC: cảnh báo đã trả NCC nhưng chưa có hóa đơn VAT.
- [ ] **T5-05 (P2)** Nhắc hạn cọc & quyết toán NCC (từ `payables.due`) vào hộp việc/thông báo kế toán.
- [ ] **T5-06 (P1)** **Báo cáo lãi/lỗ theo từng dịch vụ** (hiện chỉ theo tour và theo tháng).
- [ ] **T5-07 (P2)** Báo cáo tuổi nợ phải thu/phải trả.

### EPIC 6 — HDV & Xe

- [ ] **T6-01 (P1) 🔒** Vai trò **Xe/Tài xế**: menu riêng, chỉ thấy tour được giao, khách, lịch trình; thêm vào `businessRolePolicies` và liên kết `vehicles`. (Hiện chỉ có vai trò HDV; `requiredTeamAccounts` chưa có tài khoản tài xế.) *Hỏi khách: tài xế có cần tài khoản riêng không, bao nhiêu (mục 8.1).*
- [ ] **T6-02 (P2)** Rà soát cổng HDV trên điện thoại (cỡ chữ, thao tác một tay, mạng yếu); cân nhắc PWA (cài lên màn hình chính) — hỏi người dùng trước.
- [ ] **T6-03 (P3)** Lọc HDV theo vùng/ngôn ngữ trong màn phân công.
- [ ] **T6-04 (P3) 🔒** Cổng HDV có 3 tab không ai truy cập được (Lịch phân công · Báo cáo · Tạm ứng & chi phí; `mod-guideapp.js` ~dòng 116). docx không yêu cầu 3 tab này (chỉ Tour/Khách/Voucher/Emergency). Quyết định: giữ (và cấp đường vào cho đúng vai trò) hay xóa.

### EPIC 7 — Dashboard CEO

- [ ] **T7-01 (P1) ⏳** Làm giao diện CEO theo **form mẫu khách gửi trên Zalo**, theo từng phân quyền. Chờ mẫu.
- [ ] **T7-02 (P1)** Bổ sung biểu đồ: pipeline, nguồn lead, công nợ phải thu/phải trả, dòng tiền, hiệu suất Sales/NCC (hiện có doanh thu theo tháng, phễu, trạng thái booking, sparkline).
- [ ] **T7-03 (P2)** Đối chiếu KPI mục 1.10: Marketing (Traffic, CPL), Operations (Error Rate, Cost Control, Running Tours, Pending Services, Supplier/Guide Issues, CSAT), Accounting (Receivable, Payable, Cash Flow) — thiếu gì bổ sung.

### EPIC 8 — Chăm sóc khách hàng

- [ ] **T8-01 (P3)** Biểu mẫu phản hồi khách điền trực tiếp (liên kết công khai) thay vì nhân viên nhập — phụ thuộc cách nhận dữ liệu từ ngoài (🔒 T0-03).
- [ ] **T8-02 (P3)** Nối Referral với CTV (T2-02).

### EPIC 9 — AI (toàn bộ 🔒 T0-03)

- [ ] **T9-01 (P3)** AI Itinerary Builder: nhập Quốc gia / Số khách / Ngân sách / Thời lượng → bản nháp chương trình để Sales chỉnh.
- [ ] **T9-02 (P3)** AI dịch chương trình tour (Pháp–Anh–Việt và ngôn ngữ khác theo cài đặt).
- [ ] **T9-03 (P3)** AI tạo báo giá nháp từ chương trình + bảng giá NCC.
- [ ] **T9-04 (P3)** AI hỗ trợ nhập liệu NCC từ văn bản/PDF (phân loại, liên hệ, loại phòng, giá mùa, khuyến mại).
- [ ] **T9-05 (P3)** AI OCR hộ chiếu (T3-08).
- [ ] **T9-06 (P3)** AI gợi ý phân công HDV, phân tích lợi nhuận (đã có bản thuật toán thường trong `mod-ai.js`, chưa nạp — T0-06).
- [ ] **T9-07 (P3)** AI nội dung marketing (T2-05).

### EPIC 10 — Tự động hóa lead website (🔒 T0-03)

- [ ] **T10-01 (P2)** Form website → tự tạo lead → phân công Sales (luật phân: luân phiên/theo thị trường) → email chào mừng → tạo task follow-up. Hiện chỉ có form nhập tay và panel mô phỏng.

### EPIC 11 — Tài liệu

- [ ] **T11-01 (P2) 🔒** Document Center đủ loại: Contract, Invoice, Passport, Voucher, Rooming List — gắn booking, quyền xem nhạy cảm (`document_sensitive`), cảnh báo hộ chiếu/giấy tờ hết hạn. Phụ thuộc T0-05.

### EPIC 12 — Phân quyền & kiểm thử vai trò

- [ ] **T12-01 (P1)** Rà từng vai trò so với bảng mục 1.2 (Marketing chỉ Leads/Campaign/Content/KPI; Sales không thấy kế toán; Điều hành chỉ Booking confirmed/Supplier/Guide/Xe; Kế toán chỉ Invoice/Payments/VAT/Debt). Ghi kết quả vào Nhật ký, sửa `businessRolePolicies` nếu lệch. *Đã rà bằng đọc code ngày 22/10: bảng 3.5.3 (khớp, trừ L5). Còn lại: **đăng nhập thử từng tài khoản trên trình duyệt** (CEO, SALES-001, DH-001, MKT-001, KT-001, HDV-001) và ghi kết quả — chưa làm nên chưa tick.*
- [ ] **T12-02 (P2) ⏳** Xin khách xác nhận các menu **ngoài danh sách "chỉ thấy"**: Dashboard (mọi vai trò), Tài liệu và CSKH (Sales, Điều hành), Thiết kế tour (Sales). Nếu khách muốn đúng chữ thì gỡ khỏi `businessRolePolicies.menus` (mục 3.5.2).

---

## 7. THỨ TỰ ĐỀ XUẤT

1. **Nền tảng:** T0-10 (dọn cây trùng) → T0-01 → T0-12 (đồng bộ owners/HDV) → T0-03 (quyết định AI/automation) → T0-04, T0-11, T0-05c, T0-05e.
2. **Tiền tệ:** EPIC 1 (ảnh hưởng báo giá, hóa đơn, thu tiền) — làm sớm vì kéo theo T3-04/05, T5-01.
3. **Sales lõi:** T3-01, T3-02, T3-03, T3-04, T3-07, T3-10.
4. **NCC & Điều hành:** T4-01, T4-04, T4-05, T4-09, T4-03.
5. **Kế toán:** T5-02, T5-03, T5-04, T5-06.
6. **Marketing:** T2-01, T2-03.
7. **Dashboard CEO** khi có mẫu Zalo (T7-01), **form tour** khi có mẫu (T3-09).
8. **AI & tự động hóa** (EPIC 9, 10) sau khi chốt T0-03.

> Đây là đề xuất; người dùng có thể đổi thứ tự bất cứ lúc nào.

---

## 8. CÂU HỎI MỞ & QUYẾT ĐỊNH

### 8.1 Đang chờ (khách hoặc người dùng trả lời)

- [ ] ⏳ **Mẫu giao diện CEO Dashboard** khách đã gửi qua Zalo (cần file/ảnh) — T7-01.
- [ ] ⏳ **Form mẫu thiết kế tour** "anh sẽ gửi sau" — T3-09.
- [ ] ⏳ **Mẫu hợp đồng** khách hàng (nội dung, điều khoản, ngôn ngữ) — T3-10.
- [x] ~~**Nguồn tỷ giá VCB:** nhập tay định kỳ hay tự lấy? Loại giá bán? Bao lâu cập nhật?~~ → Đã quyết định 22/10 (mục 8.2): tự lấy, giá bán, 1 lần/ngày. Còn nhờ khách xác nhận cột "Bán" của VCB (chỉ có một cột, không tách tiền mặt/chuyển khoản) là đúng ý — T1-01.
- [x] ~~**Sổ kế toán ghi bằng VND hay USD?**~~ → Đã quyết định 23/10: **USD** (mục 8.2). Còn hỏi: VAT/thuế Việt Nam vẫn phải khai theo VND — VAT giữ VND hay quy đổi? — T1-04d.
- [ ] **AI & tự động hóa chạy ở đâu?** (khóa API, gửi email thật, nhận form web, OCR). Demo là web tĩnh; KIO có hỗ trợ server-side/webhook/file không? — T0-03.
- [ ] **Quy mô NCC:** khách ghi 500+/1000/500 không thống nhất — thiết kế cho ≥ 1000, cần xác nhận.
- [x] ~~**CTV có hoa hồng không?**~~ *Người dùng quyết định 23/10: cho phép nhập hoa hồng, mặc định 0%.* - [ ] **Cách tính và chi trả hoa hồng CTV?** Hiện tính % trên giá trị hợp đồng booking chưa hủy, chưa có bước duyệt/chi trả (sổ phải trả, quyết toán) — hỏi khách còn muốn tính trên doanh thu thực thu, theo từng tour, hay có bậc thang — T2-02.
- [ ] **Traffic** lấy từ đâu? — T2-06.
- [ ] **Tài khoản thật:** demo đang tự tạo 22 tài khoản mẫu (`GD-001`, `SALES-001…005`, `DH-001/002`, `MKT-001/002/003`, `KT-001`, `HDV-001…010`) — cần **tên người thật** của từng người (Sales nay là 5 người) để đổi `fullName` và đồng bộ `crmOwners`, `operationOwners`, `marketingOwners`, `careOwners` (T0-12).
- [ ] **Tên thương hiệu:** docx ghi "Typic One ERP" và "Typic Travel"; code ghi "TypicOne ERP" — giữ **TypicOne ERP** trừ khi khách yêu cầu khác.
- [ ] **Máy chủ chạy thật là gì?** (Apache+PHP, Nginx, VPS, hosting nào?) — `upload.php` cần PHP ≥ 7.4; nếu không có PHP phải làm bản khác (T0-05c).
- [ ] **Google Login / Google Drive / Gmail:** docx mục 3 và "ERP V1" đề xuất đăng nhập Google, lưu tệp trên Google Drive, email qua Gmail Workspace. Đây là **bắt buộc** hay chỉ gợi ý của người tư vấn? — T0-03, T0-04, T0-05, T11-01.
- [ ] **Vai trò Xe/Tài xế:** có tài khoản riêng không, bao nhiêu người? (docx ghi "HDV / XE — App mobile" nhưng quy mô khách chỉ nêu 10 HDV, không nêu tài xế) — T6-01.
- [ ] **Điều hành có được xem lợi nhuận (Profit) của tour không?** docx: Điều hành "chỉ thấy Booking Confirmed, Supplier, Guide, Xe" nhưng Tour Dashboard của Điều hành có Cost và Profit. Hiện Điều hành có `operations_costs` (chi phí) nhưng không có `sales_financials`/`booking_financials` — T12-01.
- [ ] ⏳ **Menu ngoài danh sách:** Sales/Điều hành có thêm Tài liệu, CSKH; Sales có Thiết kế tour; mọi vai trò có Dashboard — chấp nhận hay gỡ? — T12-02.
- [ ] **Sales có chỉ thấy lead/booking của mình hay thấy chung?** docx không nói; demo đang giới hạn theo người phụ trách (khi tên khớp danh mục). Cần khách xác nhận.
- [ ] **Xóa cây mã nguồn trùng** (`js/core`, `js/modules`, `js/api`, `js/data`, `css/modules`): người dùng/đồng đội đồng ý chưa? — T0-10.
- [ ] **Mật khẩu mặc định `123456` không bắt đổi** có chủ ý cho demo không, hay cần khôi phục bắt đổi? — T0-11.

### 8.2 Đã quyết định

| Ngày | Quyết định |
|---|---|
| 21/10/2026 | Bỏ toàn bộ công nghệ đề xuất trong docx; giữ nguyên công nghệ demo (web tĩnh thuần + KIO). |
| 21/10/2026 | Nhật ký công việc ghi trong chính `claude.md` (mục 9). |
| 21/10/2026 | Giao file bằng zip chỉ chứa file thay đổi (giữ đường dẫn) + `claude.md` + `index.html` nếu đổi `?v=`. Quy ước `?v=YYYYMMDD.N` theo từng file. *(Đề xuất của Claude khi lập file này vì demo chưa có `?v=`; người dùng có thể đổi.)* |
| 22/10/2026 | Người dùng yêu cầu thêm vào claude.md: (a) bảng tài khoản/vai trò/menu (3.5.1–3.5.3); (b) quy trình cập nhật claude.md (5.11); (c) **luật viết code đúng định dạng demo, mỗi dòng một lệnh** (5.12); (d) kết quả đối chiếu demo ↔ yêu cầu (4.1) và điểm claude.md từng lệch (4.2). |
| 22/10/2026 | **Tệp tải lên lưu ở thư mục `uploads/` trong source, database chỉ lưu đường dẫn** (người dùng quyết định, thay cho base64). Cần `upload.php` — thành phần phía máy chủ duy nhất, là ngoại lệ so với "web tĩnh thuần" nhưng **không đổi stack** (vẫn không build, không framework). |
| 22/10/2026 | Khách đổi quy mô **Sales 2 → 5**: tài khoản mẫu thành 22 (`SALES-001…005`). docx chưa cập nhật. |
| 22/10/2026 | `.gitattributes`: repo lưu LF, checkout CRLF (`.php/.htaccess/.md` LF); `.gitignore` bỏ qua `uploads/*`. |
| 22/10/2026 | Cây mã nguồn **phẳng** (`js/*.js`, `css/mod-*.css`) là bản chạy thật; cây cũ (`js/core`, `js/modules`, `js/api`, `js/data`, `css/modules`) chỉ là bản trùng — **đề xuất xóa**, chờ xác nhận (T0-10). |
| 22/10/2026 | **Tỷ giá (T1-01):** nguồn là tỷ giá **bán** của VCB, **tự lấy mỗi ngày 1 lần** từ XML chính thức (người dùng yêu cầu). Thêm file PHP thứ hai `fx-vcb.php` (cùng loại ngoại lệ như `upload.php`, không đổi stack) vì trình duyệt không chắc gọi thẳng VCB được (CORS) và để giữ giới hạn 1 request/5 phút. |
| 22/10/2026 | **Tỷ giá — do Claude chọn, người dùng có thể đổi:** (a) chỉ CEO/Kế toán (`fx_manage`) kích hoạt tự cập nhật, tránh nhiều người cùng ghi `settings` gây `DATA_CONFLICT`; (b) Kế toán chỉnh tỷ giá ở tab mới trong màn *Kế toán* vì Kế toán không có menu *Cài đặt* (không đổi ma trận menu); (c) giữ 180 bản lịch sử; (d) không cho ngày hiệu lực ở tương lai. |
| 22/10/2026 | **T1-02 — do Claude chọn, người dùng có thể đổi:** USD là tiền *hiển thị*; dữ liệu và ô nhập vẫn VND (đổi sang nhập USD thuộc T1-04 🔒 vì ảnh hưởng ghi sổ). Mặc định hiển thị USD; nút chuyển USD / tiền của khách / VND. Bản in và email gửi khách giữ nguyên VND cho đến T1-03. |
| 22/10/2026 | **T1-03 (làm lại theo yêu cầu người dùng):** không lưu tỷ giá trên chứng từ, chỉ lưu ngày tạo và tra tỷ giá của ngày đó trong lịch sử để chuyển sang mọi loại tiền. Do Claude chọn: (a) booking thừa hưởng `fxDate` của báo giá được chấp nhận; (b) lịch sử giữ 800 bản (từ 180) vì chứng từ phụ thuộc vào nó; (c) ngày sớm hơn mọi bản đã lưu thì dùng bản cũ nhất; (d) báo giá cũ dùng ngày `createdAt`, không migrate; (e) khoản phải trả và VAT chưa tra tỷ giá theo ngày. |
| 22/10/2026 | **Nhập USD mặc định (T1-02b, người dùng yêu cầu):** hiển thị và nhập số tiền mặc định bằng USD; **lưu vẫn VND** (hệ thống, kế toán, VAT đều tính VND; đổi đơn vị lưu là di chuyển dữ liệu lớn). Do Claude chọn: form sửa báo giá giữ nguyên VND của số không sửa; phần kế toán (hóa đơn, thu/chi, phải trả, VAT) chưa đổi sang nhập USD vì thuộc T1-04 🔒. |
| 23/10/2026 | **Sổ kế toán ghi bằng USD (T1-04, người dùng quyết định).** Cách làm do Claude chọn: USD là đơn vị nhập và hiển thị của hóa đơn/thu tiền, **dữ liệu vẫn lưu VND** (không migrate dữ liệu cũ, không đụng `workflow.js`/VAT/quyết toán); số tiền của mỗi booking quy đổi USD theo tỷ giá ngày chốt báo giá để thu USD khớp hóa đơn USD. Nếu muốn **lưu hẳn bằng USD** (đổi đơn vị lưu của toàn bộ số tiền) thì phải migrate dữ liệu và sửa toàn bộ kế toán — cần người dùng xác nhận. Hóa đơn chỉ ghi USD (không phát hành bằng EUR/VND). Khách trả VND thì USD ghi sổ theo tỷ giá VCB hôm nay (có thể còn lẻ công nợ nếu tỷ giá đã đổi). |
| 23/10/2026 | **Nguồn lead chuẩn (T2-01) — do Claude chọn, người dùng có thể đổi:** (a) tên 9 nguồn viết tiếng Việt, riêng nguồn 1 tên là "Biểu mẫu trên trang web" (docx ghi "Form website") vì `localizeUI()` tự dịch "Form"/"Website" và làm lệch giá trị lưu; (b) chi tiết **bắt buộc** với CTV, Sách báo – quảng cáo, Đối tác B2B, Kênh hội chợ; "Khác" tùy chọn; 4 nguồn số, WhatsApp, Fanpage, Instagram không có ô chi tiết; (c) nguồn cũ tự đổi khi vào hệ thống: chứa web/whatsapp/fanpage|facebook/instagram/ctv/b2b/hội chợ/petit|routard… thì vào nguồn tương ứng, **còn lại vào "Khác" và giữ chữ cũ ở `sourceDetail`** (ví dụ "Giới thiệu", "Zalo"); (d) điểm lead (`leadScore`) vẫn cộng 10 cho kênh giới thiệu/CTV/WhatsApp/web. |
| 23/10/2026 | **CTV và hoa hồng (T2-02, người dùng quyết định: cho phép nhập hoa hồng, mặc định 0%).** Cách làm do Claude chọn, người dùng có thể đổi: (a) hoa hồng lưu **theo từng lead** (`lead.commissionRate`, %), không lưu theo CTV, để mỗi lead có thể thỏa thuận mức khác nhau; thống kê hiện "Nhiều mức" nếu một CTV có nhiều mức; (b) hoa hồng = `booking.revenue` (giá trị hợp đồng) của booking chưa hủy × tỷ lệ, lưu VND, hiển thị USD theo tỷ giá của booking; chưa có chi trả/công nợ hoa hồng; (c) CTV chọn từ `guides` (HDV) hoặc `customers` (khách cũ = **mọi** khách trong danh bạ, chưa lọc khách đã đi tour); (d) chỉ CEO và Sales (`sales_financials`) xem/sửa hoa hồng và doanh thu theo CTV vì Marketing không được xem chi phí/lợi nhuận (mục 1.2); Marketing vẫn nhập được lead CTV (hoa hồng mặc định 0) và xem số lead, đã chốt, tỷ lệ chốt; (e) khi chọn CTV thì `sourceDetail` tự lấy tên hồ sơ (không còn ô gõ tay). |

### 8.3 Rủi ro đã biết

- Đăng nhập kiểm tra ở trình duyệt, bảng người dùng đọc được từ client (T0-04).
- Mỗi collection là một blob → hiệu năng khi dữ liệu lớn, ghi đồng thời có thể gây xung đột (đã có chặn xung đột bằng so sánh, chưa tuyệt đối).
- Tài liệu **cũ** còn base64 trong `docs` (T0-05d); tệp **mới** ở `uploads/` nhưng `upload.php` chưa xác thực người dùng và tệp phục vụ qua URL tĩnh (T0-05e); `upload.php` chưa thử trên máy chủ thật (T0-05c).
- Nhiều thành phần AI/tự động hóa không làm được thuần phía trình duyệt nếu thiếu backend (T0-03).
- 22 tài khoản mẫu dùng mật khẩu `123456`, không bắt đổi, lại có nút điền sẵn mật khẩu ở màn hình đăng nhập (T0-04, T0-11).
- Phạm vi dữ liệu theo **tên** người dùng: lệch tên so với danh mục owners → phạm vi bị bỏ qua mà không báo (T0-12).
- Hai cây mã nguồn trùng trong git: dễ sửa nhầm file không được nạp, hoặc mất thay đổi khi hợp nhất nhánh (T0-10).
- docx đề xuất Google Login/Drive/Gmail; chưa rõ bắt buộc hay không — nếu bắt buộc thì phải có phương án phía máy chủ (mục 8.1).
- `fx-vcb.php` chưa thử với VCB thật từ máy chủ (T1-01b); phụ thuộc endpoint XML của VCB (VCB đổi định dạng thì tự lấy lỗi, vẫn nhập tay được). Tỷ giá chỉ tự cập nhật khi CEO/Kế toán đăng nhập (T1-01c).
- **Sửa/ghi đè bản tỷ giá của một ngày (nhập tay, hoặc bấm "Cập nhật từ VCB" lại trong ngày) làm đổi số USD của mọi báo giá/chứng từ tạo ngày đó**, vì chứng từ chỉ lưu ngày. Báo giá cũ (trước T1-03) dùng ngày `createdAt`; nếu sớm hơn lúc có bảng tỷ giá thì dùng bản cũ nhất. Lịch sử tỷ giá không giới hạn số bản nhưng đã nằm ở bảng riêng `typicone_fx_history`, không làm nặng `settings` (T1-01d). Chưa có tỷ giá thì màn hình tự hiện VND và ô nhập là VND.
- T1-04b: gần như mọi màn tiền gắn booking đã ở USD; còn **trộn đơn vị** ở VAT, Marketing, app HDV, đơn giá HDV/NCC, ngân sách lead, mục tiêu tháng (VND) — xem T1-04d. Chi phí thực tế quyết toán/hóa đơn NCC nhập USD nên VND lưu có thể lệch vài chục VND so với hóa đơn gốc VND (làm tròn theo tỷ giá). Đề xuất phê duyệt tạo **trước** 23/10 có câu lý do bằng VND (đã lưu thành chữ). Booking tạo trước khi có bảng tỷ giá dùng tỷ giá cũ nhất làm tỷ giá sổ; chưa có tỷ giá thì mọi thứ quay về VND.

---

## 9. NHẬT KÝ CÔNG VIỆC

> Thêm dòng mới **ở trên cùng**. Mỗi dòng: ngày · mã task · tóm tắt · file đổi · ghi chú (đang dở / cần làm thêm / bảng KIO cần tạo).

| Ngày | Task | Tóm tắt | File thay đổi | Ghi chú |
|---|---|---|---|---|
| 23/10/2026 | T2-03 | Thêm báo cáo hiệu quả theo nguồn lead trong Marketing → KPI tổng quan: số lead, số chốt, tỷ lệ chốt, doanh thu booking chưa hủy, chi phí chiến dịch phân bổ và CPL. Chi phí chiến dịch phân bổ theo tỷ trọng lead từng nguồn thuộc chiến dịch; nguồn chưa có chi phí phân bổ hiển thị CPL là —. Tăng cache-busting `mod-marketing.js?v=20261023.1`. | `js/mod-marketing.js`, `index.html`, `claude.md` | Chưa chạy thử trên trình duyệt/KIO thật. Cần kiểm tra với dữ liệu mẫu: nguồn lead, WON, booking hủy/không hủy, chiến dịch có/không có lead và chi phí phân bổ. |
| 23/10/2026 | T2-02 | CTV liên kết HDV/khách cũ + hoa hồng (mặc định 0%) + thống kê theo CTV: thêm `ctvTypes`, `canManageCommission`, `ctvRecords`, `ctvFromForm`, `ctvLeadFields`, `leadBookings`, `ctvCommissionVnd`, `ctvEditForm`/`saveCtv` (sửa CTV + hoa hồng, có `audit`), `crmCtvFields`, `ctvFooterButton`, `crmCtvGroups`, `ctvFinance`, `crmCtvRow`, `crmCtvPanel` (tab *Cộng tác viên* ở CRM); form *Thêm lead*: `leadFormCtvFields`, `leadCtvToggle`, `leadCtvTypeChanged`, `leadSourceChanged` hiện/ẩn khối CTV; `addLead` kiểm tra CTV, lưu `ctvType`/`ctvId`/`commissionRate`, `sourceDetail` = tên hồ sơ; hồ sơ lead hiện CTV + hoa hồng + nút sửa; tăng `?v=` `mod-crm.js` lên `.3` | `js/mod-crm.js`, `index.html`, `claude.md` | Kiểm tra: `node --check`; chạy thử logic bằng node với dữ liệu giả (hoa hồng 5%/50 triệu = 100 USD, booking hủy không tính, mặc định 0, 150% và âm bị chặn, Marketing không thấy hoa hồng/doanh thu và không sửa được, lead rỗng); dòng mới không dài > 160 (trừ dòng hồ sơ lead cũ đã quá dài, chỉ chèn thêm một lời gọi), không nhiều lệnh một dòng. **Chưa chạy thử trên trình duyệt** (T2-02b). Không cần tạo bảng KIO (chỉ thêm trường vào lead). Cập nhật số dòng mẫu `mod-crm.js` ở 5.12 |
| 23/10/2026 | T2-01 | Chuẩn hóa nguồn lead theo 9 nguồn mục 1.3: thêm `leadSourceCatalog` (tên, nhãn chi tiết, bắt buộc hay không), `leadSourceInfo`, `leadSourceOptions`, `leadSourceText`, `leadSourceDetailHtml`, `leadSourceFromLegacy`, `migrateLeadSources` (đưa `settings[0].leadSources` + nguồn lead cũ về 9 nguồn, idempotent); form *Thêm lead* tách khối (`leadFormOptions/SalesField/CampaignField/SourceFields`, `leadSourceChanged` hiện/ẩn ô chi tiết), `addLead` kiểm tra nguồn + chi tiết và lưu `sourceDetail`; bảng Leads tách `crmLeadRow` + hiện chi tiết nguồn; hồ sơ lead (`crmProfileTitle`), tìm kiếm, `leadScore` và xuất CSV (cột *Chi tiết nguồn*) theo nguồn mới; `workflow.js` gọi `migrateLeadSources` trong `migrateWorkflowData`; tăng `?v=` `mod-crm.js`, `workflow.js` | `js/mod-crm.js`, `js/workflow.js`, `index.html`, `claude.md` | Kiểm tra: `node --check` 2 file; chạy thử `migrateLeadSources` bằng node với dữ liệu mẫu (đổi đúng, chạy lần 2 không đổi, rỗng/thiếu `state.settings` không lỗi); dòng mới không dài > 160, không nhiều lệnh một dòng. **Chưa chạy thử trên trình duyệt** (T2-01b). Không cần tạo bảng KIO (chỉ thêm trường `sourceDetail` vào lead). Lần đầu có người đăng nhập, hệ thống ghi lại `settings` và các lead có nguồn cũ |
| 23/10/2026 | T1-04b | Chuyển nốt các màn tiền gắn booking sang USD theo tỷ giá ngày chốt báo giá của booking: phải trả NCC + chi NCC, quyết toán, lãi/lỗ (tháng/tour/CSV), dòng tiền, tổng `accountingTotals()`, dashboard CEO/Sales/Kế toán, duyệt giá (`approvalMoney`), hàng chờ việc, Điều hành, booking 360, hủy booking/hoàn tiền, CRM, Khách hàng, công nợ NCC, hợp đồng in (`USD (VND)`). Ô nhập USD: hóa đơn NCC, chi phí quyết toán, chi phí dịch vụ, tiền hoàn. Thêm 9 hàm `fxLedger*` ở `mod-fx.js`; **VAT giữ VND** (có ghi chú trên màn). | `js/mod-fx.js`, `js/mod-accounting.js`, `js/mod-approvals.js`, `js/workflow.js`, `js/mod-operations.js`, `js/mod-bookings.js`, `js/mod-crm.js`, `js/mod-customers.js`, `js/mod-suppliers.js`, `js/mod-dashboard.js`, `js/mod-documents.js`, `js/mod-ai.js`, `index.html`, `claude.md` | Do Claude chọn (đổi được): VAT, Marketing, app HDV, đơn giá HDV/NCC, ngân sách lead, mục tiêu tháng, CSV giao dịch giữ VND (không gắn booking hoặc là số liệu VND địa phương) → T1-04d. Mục tiêu tháng quy đổi theo tỷ giá hiện hành khi so với doanh thu. Test Node: tổng theo từng tỷ giá riêng, nhập 100 USD → 2.600.000 ₫ rồi hiện lại đúng 100 USD, quyết toán giữ nguyên VND khi không sửa số, lãi/lỗ, dòng tiền, chưa có tỷ giá → quay về VND. **Chưa chạy trên trình duyệt** (T1-04c). `?v=` đã tăng cho 11 thẻ. |
| 23/10/2026 | T1-01d | Tách lịch sử tỷ giá khỏi `settings`: collection mới `fxHistory` (bảng `typicone_fx_history`, optional), mảng **cũ → mới**, **bỏ giới hạn 800 bản**; `settings[0].fxRates` chỉ còn `{source, rateType}`. Thêm `fxLatest`, `fxLegacyHistory`, `fxCopyLegacy`, `fxMigrateLegacy` (tự chuyển dữ liệu cũ khi CEO/Kế toán vào, chỉ xóa bản trong settings sau khi ghi thành công, thiếu bảng thì giữ nguyên); `fxEntryOn` duyệt từ cuối; thẻ lịch sử hiện 60 bản gần nhất kèm tổng số. `syncDatabaseCollection` chỉ `update` chunk đổi nội dung (thêm `databaseChunks`), nên mỗi ngày chỉ ghi chunk cuối. | `js/data.js`, `js/travel-api.js`, `js/mod-fx.js`, `index.html` (`?v=` data 20261023.1, travel-api 20261023.1, mod-fx 20261023.2), `claude.md` | Kiểm tra bằng node (tra theo ngày, thay cùng ngày, chuyển dữ liệu, thiếu bảng, chỉ ghi chunk cuối); **chưa chạy trên trình duyệt/KIO thật**. Việc còn lại: T1-01e (tạo bảng KIO). Cache `sessionStorage` cũ không có `fxHistory` bị bỏ qua và nạp lại từ database (không lỗi). |
| 23/10/2026 | T1-02b (sửa lỗi) | Form *Điều chỉnh giá*: trước đây số không sửa giữ nguyên VND nhưng `fxDate` đổi sang hôm nay, làm giá USD của phiên bản mới bị lệch (1.000 → 964,81 USD) và sinh số lẻ khi thu/xuất hóa đơn theo số USD hiển thị. Nay giá bán và chi phí luôn quy đổi theo tỷ giá hôm nay: USD không đổi, VND trôi | `js/mod-quotes.js`, `index.html`, `claude.md` | `quoteVndFromInput(input, code)` còn 2 tham số. Người dùng xác nhận **không sửa tỷ giá**; đây là nguyên nhân khả dĩ của số lẻ 0,01 USD chứ chưa kiểm chứng được. Báo giá/booking đã tạo từ phiên bản lệch không tự sửa lại; `nearBalance` (bản 06) đã xử lý phần lẻ khi thu tiền. |
| 23/10/2026 | T1-04 (sửa lỗi) | Người dùng báo: còn phải thu 0,01 USD nhưng thu 0,01 USD bị báo "không vượt công nợ". Nguyên nhân: công nợ thực là vài trăm VND (< 1 xu USD) nhưng hiện làm tròn 0,01 USD; 0,01 USD quy ra 261 VND lớn hơn công nợ. Thêm `nearBalance` cho `receiptVnd` và `invoiceVnd`; ô mặc định ≥ 0,01 USD | `js/mod-accounting.js`, `index.html`, `claude.md` | Thêm 6 ca test (công nợ lẻ 200/100 VND, 1 xu thật, công nợ lớn, thu thừa, hóa đơn). Nguồn gốc số lẻ chưa xác định (nghi do sửa tỷ giá của ngày chốt báo giá sau khi đã có chứng từ, hoặc doanh thu VND cũ không tròn USD). |
| 23/10/2026 | T1-04 | Ghi sổ bằng USD cho hóa đơn và thu tiền: form thu chọn USD/EUR/CAD/VND (`receiptCurrencies`, `receiptVnd`, `receiveCurrencyChange`); giao dịch thu lưu thêm `currency`, `original`; hóa đơn nhập USD (`invoiceVnd`), in `USD (VND)`; màn Kế toán (Hóa đơn, Phải thu, Tổng quan, thống kê), tab Tài chính và danh sách booking hiển thị USD theo tỷ giá ngày chốt báo giá; thêm `fxLedgerReady`, `fxLedgerMoney`, `fxTxMoney`; `fxFormat` đổi sang tối đa 2 số lẻ | `js/mod-fx.js`, `js/mod-accounting.js`, `js/mod-bookings.js`, `index.html`, `claude.md` | Test Node 5 bộ đạt (thu 400+600 USD → công nợ đúng 0, thu EUR/VND, lệch 1 VND, vượt công nợ). **Chưa chạy trên trình duyệt** (T1-04c). Phần phải trả/VAT/quyết toán/lãi lỗ/dòng tiền còn VND (T1-04b). |
| 22/10/2026 | T1-03 (làm lại) + T1-02b | Bỏ `fx`/`rate` trên chứng từ: chỉ lưu ngày tạo (`fxDate`; hóa đơn dùng `issuedAt`, giao dịch dùng `date`) và tra tỷ giá của ngày đó trong lịch sử (`fxDocDate`, `fxEntryOf`; bỏ `fxSnapshot`). Nhập USD mặc định: thêm `fxInputCode`, `fxToVnd`, `fxFromVnd`; ô giá bán + chi phí mục dịch vụ ở thiết kế tour theo tiền đang chọn; form Điều chỉnh giá báo giá nhập USD (số không sửa giữ nguyên VND). Lịch sử tỷ giá 180 → 800 bản | `js/mod-fx.js`, `js/mod-design.js`, `js/mod-quotes.js`, `js/mod-accounting.js` (gỡ `fx`), `index.html`, `claude.md` | Test Node 4 bộ đạt (tra theo ngày, vòng nhập→lưu→hiện, không trôi VND khi không sửa, giới hạn 800). **Chưa chạy trên trình duyệt.** Dữ liệu `fx` do bản vá 03 (nếu đã dùng) sẽ không còn được đọc; báo giá tạo bằng bản 03 chưa có `fxDate` sẽ dùng ngày `createdAt`. |
| 22/10/2026 | T1-03 | Snapshot tỷ giá `fx` trên báo giá (và từng phiên bản), booking (thừa hưởng từ báo giá), hóa đơn, giao dịch thu/chi; thêm `fxSnapshot`, `fxEntryOf`, `fxMoneyOf`, `fxSumMoney`, `fxDual`, `fxFormat`; màn báo giá, bản in và email gửi khách hiển thị USD (kèm VND, kèm dòng tỷ giá VCB áp dụng) theo tỷ giá đã chụp | `js/mod-fx.js`, `js/mod-design.js`, `js/mod-quotes.js`, `js/mod-accounting.js`, `index.html`, `claude.md` | Không cần tạo bảng KIO (thêm trường vào bản ghi sẵn có). Test Node 4 bộ đạt (snapshot không đổi khi tỷ giá đổi, chứng từ cũ rơi về tỷ giá hiện hành, cộng nhiều chứng từ). **Chưa chạy trên trình duyệt.** Cần thử: tạo báo giá → đổi tỷ giá → báo giá/bản in giữ nguyên. |
| 22/10/2026 | T1-02 | USD là tiền hiển thị chung: thêm `fxDisplayCurrency`, `fxMoney`, `fxViewCurrencies` (mod-fx); thiết kế tour mặc định USD + nút USD/tiền khách/VND, ô Tỷ giá VCB chỉ đọc, bỏ `rate` 26000 nhập tay, `quote.rate` lấy từ bảng; báo giá (danh sách, KPI, chi tiết, lịch sử) hiển thị USD | `js/mod-fx.js`, `js/mod-design.js`, `js/mod-quotes.js`, `index.html`, `claude.md` | Chỉ phần hiển thị; ô nhập, bản in, email, duyệt giá, booking, kế toán vẫn VND. Test Node cho `fxMoney` và các hàm tiền tệ của thiết kế tour đạt; **chưa chạy trên trình duyệt**. |
| 22/10/2026 | T1-01 | Bảng tỷ giá VCB (giá bán): `fx-vcb.php` đọc XML VCB + cache 5 phút; `mod-fx.js` (dữ liệu `settings[0].fxRates`, tự cập nhật mỗi ngày, cập nhật ngay, nhập tay có ngày hiệu lực, bảng + lịch sử, `fxRate/fxConvert/fxEntryOn`); tab *Tỷ giá* ở Cài đặt (CEO) và Kế toán; quyền `fx_manage` cho Kế toán; tăng `?v=` 5 thẻ + thêm thẻ `mod-fx.js` | `fx-vcb.php`, `js/mod-fx.js`, `cache/.htaccess`, `cache/.gitkeep` (mới), `.gitignore`, `index.html`, `js/travel-config.js`, `js/app.core.js`, `js/app.js`, `js/mod-admin.js`, `js/mod-accounting.js`, `claude.md` | Không cần tạo bảng KIO. Đã `node --check`, `php -l`, test Node 12 nhóm cho `mod-fx.js`, test `fx-vcb.php` với XML VCB mẫu (cả ca VCB lỗi/stale). **Chưa chạy trên trình duyệt, chưa thử VCB thật từ máy chủ** (T1-01b). Cần `cache/` ghi được. |
| 22/10/2026 | T0-02b, T0-05, T0-07, quy mô Sales 5 | **T0-02b:** sửa thông báo trong `travel-api.js` trỏ claude.md mục 3.4. **T0-05:** thêm `upload.php`, `uploads/.htaccess`, hàm `uploadFile()`; `uploadDoc`/`openDocument` lưu và mở theo `path`; ảnh báo cáo cuối tour của HDV lưu ra `uploads/guide-reports/` (có xử lý lỗi, tách dòng dài theo 5.12). **T0-07:** thêm `.gitignore`, `.gitattributes` (kiểm chứng `git status` từ ~80 → đúng file đổi). **Sales 2 → 5:** thêm `SALES-003…005` (tổng 22 tài khoản). **claude.md:** thêm 3.4a, task T0-05c/d/e, câu hỏi máy chủ, 3 quyết định mới, sửa 3.1/3.2/3.5.1/3.6/5.2/5.4 và mọi chỗ "19 tài khoản" → 22. | `js/travel-config.js`, `js/travel-api.js`, `js/travel-auth.js`, `js/mod-documents.js`, `js/mod-guideapp.js`, `index.html` (tăng `?v=20261022.1` cho 5 thẻ), `upload.php` (mới), `uploads/.htaccess` (mới), `uploads/.gitkeep` (mới), `.gitignore` (mới), `.gitattributes` (mới), `claude.md` | **Chưa chạy thử trên trình duyệt; `upload.php` chưa chạy thử (môi trường không có PHP)** — hàm `uploadFile()` đã thử bằng máy chủ giả lập (thành công, 404, 415, mất kết nối, > 10 MB). Việc cho người dùng: đặt `upload.php` + `uploads/` lên máy chủ PHP (T0-05c); thêm 3 tên Sales mới vào `crmOwners` (T0-12). Không cần tạo bảng KIO mới. |
| 22/10/2026 | (rà soát, T12-01 một phần) | Đối chiếu docx ↔ claude.md ↔ demo (commit `71f2b33`). **Thêm:** 3.5.1 (19 tài khoản), 3.5.2 (ma trận 6 vai trò × 18 menu, 17 menu của CEO, tab từng màn hình, capabilities), 3.5.3 (đối chiếu yêu cầu), 4.1 (đúng/lệch/thiếu, mã L1–L11), 4.2 (11 điểm claude.md từng lệch), 5.11 (quy trình cập nhật claude.md), 5.12 (luật định dạng code), task T0-10…T0-13, T6-04, T12-02, 8 câu hỏi mở. **Sửa:** đầu file, mục 0, 3.2, 3.3, 3.5, 3.6, 3.8 (tên file), 3.10, dòng 1/14/23 mục 4, 5.1.4, 5.2, 5.3, 5.8, T0-01, T0-04, T3-10, T6-01, T12-01, mục 7. **Mở lại** T0-02b. | `claude.md` | **Không sửa code, không có zip.** Chưa chạy demo trên trình duyệt, chưa xem dữ liệu KIO. Cần người dùng: quyết định xóa cây trùng (T0-10) và trả lời mục 8.1 |
| 21/10/2026 | (khởi tạo) | Lập `claude.md` từ docx yêu cầu + demo `travel.zip`; chưa sửa code | `claude.md` (mới) | Chưa chạy demo trên trình duyệt. `index.html` chưa có `?v=` → T0-01 |

---

## 10. CÁCH BẮT ĐẦU MỘT PHIÊN LÀM VIỆC MỚI

1. Đọc toàn bộ file này (đặc biệt mục 3, 5, 8, 9).
2. Người dùng cung cấp: `travel.zip` (bản mới nhất) và, nếu có, bản sao lưu dữ liệu JSON.
3. Giải nén và xem mục 9 để biết lần trước đã làm gì; so với zip hiện tại nếu thấy lệch. **Chạy quy trình 5.11-B:** `git log`, so cấu trúc thư mục với 3.2, so tài khoản/menu với 3.5.1–3.5.3 và `index.html` (file nào thực sự được nạp).
4. Chọn task theo yêu cầu người dùng (hoặc theo mục 7), đọc code liên quan.
5. Làm → kiểm tra (5.8) → tăng `?v=` (5.3) → cập nhật checkbox + Nhật ký → đóng gói zip (5.4) → trả lời kèm danh sách file và việc người dùng cần làm.
