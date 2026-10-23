<?php
/* Nhận tệp tải lên từ TypicOne ERP, lưu vào uploads/<nhóm>/<năm>/<tháng>/ và trả về đường dẫn.
 * Database (KIO) chỉ lưu đường dẫn trả về. Cần PHP 7.4 trở lên. */
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store");

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_CATEGORIES = ["docs", "guide-reports"];
const OFFICE_ZIP = "application/zip";
const ALLOWED_TYPES = [
    "pdf" => ["application/pdf"],
    "jpg" => ["image/jpeg"],
    "jpeg" => ["image/jpeg"],
    "png" => ["image/png"],
    "webp" => ["image/webp"],
    "docx" => ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", OFFICE_ZIP],
    "xlsx" => ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", OFFICE_ZIP],
];

function fail(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode(["ok" => false, "error" => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    fail(405, "Chỉ chấp nhận phương thức POST.");
}

/* Chỉ nhận yêu cầu từ chính trang web này. */
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if ($origin !== "") {
    $originHost = (string) parse_url($origin, PHP_URL_HOST);
    $serverHost = (string) preg_replace('/:\d+$/', "", $_SERVER["HTTP_HOST"] ?? "");
    if ($originHost !== $serverHost) {
        fail(403, "Nguồn gửi yêu cầu không hợp lệ.");
    }
}

if (!isset($_FILES["file"])) {
    fail(413, "Không nhận được tệp (có thể vượt giới hạn upload_max_filesize / post_max_size của PHP).");
}

$file = $_FILES["file"];
if (!is_array($file) || ($file["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail(400, "Tải tệp lên không thành công (mã lỗi " . (int) ($file["error"] ?? -1) . ").");
}
if (!is_uploaded_file($file["tmp_name"])) {
    fail(400, "Tệp tải lên không hợp lệ.");
}
if ($file["size"] <= 0 || $file["size"] > MAX_BYTES) {
    fail(413, "Tệp phải không quá " . (MAX_BYTES / 1024 / 1024) . " MB.");
}

$extension = strtolower(pathinfo((string) $file["name"], PATHINFO_EXTENSION));
if (!isset(ALLOWED_TYPES[$extension])) {
    fail(415, "Định dạng tệp không được hỗ trợ (chỉ nhận pdf, jpg, png, webp, docx, xlsx).");
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string) $finfo->file($file["tmp_name"]);
if (!in_array($mime, ALLOWED_TYPES[$extension], true)) {
    fail(415, "Nội dung tệp không khớp với định dạng ." . $extension . ".");
}

$category = (string) ($_POST["category"] ?? "docs");
if (!in_array($category, ALLOWED_CATEGORIES, true)) {
    $category = "docs";
}

$relativeDir = "uploads/" . $category . "/" . date("Y") . "/" . date("m");
$targetDir = __DIR__ . "/" . $relativeDir;
if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
    fail(500, "Không tạo được thư mục lưu tệp trên máy chủ.");
}

$storedName = bin2hex(random_bytes(16)) . "." . $extension;
if (!move_uploaded_file($file["tmp_name"], $targetDir . "/" . $storedName)) {
    fail(500, "Không lưu được tệp trên máy chủ (kiểm tra quyền ghi thư mục uploads).");
}

echo json_encode(
    [
        "ok" => true,
        "path" => $relativeDir . "/" . $storedName,
        "mime" => $mime,
        "size" => (int) $file["size"],
    ],
    JSON_UNESCAPED_UNICODE
);
