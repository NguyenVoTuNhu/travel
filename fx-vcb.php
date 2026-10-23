<?php
/* Lấy tỷ giá Vietcombank (VCB) cho TypicOne ERP (T1-01).
 * Đọc XML chính thức của VCB ở phía máy chủ (trình duyệt gọi trực tiếp sẽ vướng CORS),
 * lưu cache vào cache/vcb-fx.json và trả JSON cho trình duyệt. Cần PHP 7.4 trở lên.
 * VCB ghi rõ: "Only one request every 5 minutes" nên cache tối thiểu 5 phút. */
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store");

const VCB_URL = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx";
const CACHE_SECONDS = 300;
const TIMEOUT_SECONDS = 10;
const CACHE_FILE = __DIR__ . "/cache/vcb-fx.json";

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $message): void
{
    respond(["ok" => false, "error" => $message], $status);
}

/* Số kiểu VCB "17,701.51" → 17701.51; "-" hoặc rỗng → null. */
function parseNumber(string $text): ?float
{
    $clean = str_replace(",", "", trim($text));
    if ($clean === "" || $clean === "-" || !is_numeric($clean)) {
        return null;
    }
    return (float) $clean;
}

/* Thời gian VCB "10/22/2026 6:52:33 AM" (giờ Việt Nam) → ISO 8601. */
function parseVcbTime(string $text): ?string
{
    $zone = new DateTimeZone("Asia/Ho_Chi_Minh");
    $date = DateTimeImmutable::createFromFormat("n/j/Y g:i:s A", trim($text), $zone);
    return $date ? $date->format("c") : null;
}

/* Đọc nội dung XML từ VCB, trả null nếu lỗi mạng. */
function downloadXml(): ?string
{
    if (function_exists("curl_init")) {
        $handle = curl_init(VCB_URL);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => TIMEOUT_SECONDS,
            CURLOPT_CONNECTTIMEOUT => TIMEOUT_SECONDS,
            CURLOPT_USERAGENT => "TypicOneERP/1.0",
        ]);
        $body = curl_exec($handle);
        $code = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);
        return ($body !== false && $code === 200) ? (string) $body : null;
    }
    $context = stream_context_create([
        "http" => ["timeout" => TIMEOUT_SECONDS, "user_agent" => "TypicOneERP/1.0"],
    ]);
    $body = @file_get_contents(VCB_URL, false, $context);
    return $body === false ? null : $body;
}

/* Chuyển XML của VCB thành mảng gọn: mã tiền → mua tiền mặt / chuyển khoản / bán. */
function parseRates(string $xmlText): ?array
{
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlText, "SimpleXMLElement", LIBXML_NONET);
    if ($xml === false || !isset($xml->Exrate)) {
        return null;
    }
    $rates = [];
    foreach ($xml->Exrate as $row) {
        $code = strtoupper(trim((string) $row["CurrencyCode"]));
        if (!preg_match('/^[A-Z]{3}$/', $code)) {
            continue;
        }
        $rates[$code] = [
            "name" => trim((string) $row["CurrencyName"]),
            "buy" => parseNumber((string) $row["Buy"]),
            "transfer" => parseNumber((string) $row["Transfer"]),
            "sell" => parseNumber((string) $row["Sell"]),
        ];
    }
    if (!isset($rates["USD"]["sell"])) {
        return null;
    }
    return [
        "vcbTime" => parseVcbTime((string) $xml->DateTime),
        "rates" => $rates,
    ];
}

function readCache(): ?array
{
    if (!is_file(CACHE_FILE)) {
        return null;
    }
    $data = json_decode((string) file_get_contents(CACHE_FILE), true);
    return is_array($data) && isset($data["rates"], $data["fetchedAtUnix"]) ? $data : null;
}

function writeCache(array $data): void
{
    $dir = dirname(CACHE_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return;
    }
    @file_put_contents(CACHE_FILE, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function publicPayload(array $data, bool $cached, bool $stale): array
{
    return [
        "ok" => true,
        "source" => "Vietcombank",
        "url" => VCB_URL,
        "vcbTime" => $data["vcbTime"] ?? null,
        "fetchedAt" => date("c", (int) $data["fetchedAtUnix"]),
        "cached" => $cached,
        "stale" => $stale,
        "rates" => $data["rates"],
    ];
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    fail(405, "Chỉ chấp nhận phương thức GET.");
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

$cache = readCache();
if ($cache !== null && (time() - (int) $cache["fetchedAtUnix"]) < CACHE_SECONDS) {
    respond(publicPayload($cache, true, false));
}

$xmlText = downloadXml();
$parsed = $xmlText === null ? null : parseRates($xmlText);
if ($parsed === null) {
    /* VCB lỗi hoặc đổi định dạng: dùng lại bản cũ (đánh dấu stale) nếu có. */
    if ($cache !== null) {
        respond(publicPayload($cache, true, true));
    }
    fail(502, "Không lấy được tỷ giá từ Vietcombank. Vui lòng thử lại sau hoặc nhập tay.");
}

$fresh = [
    "vcbTime" => $parsed["vcbTime"],
    "fetchedAtUnix" => time(),
    "rates" => $parsed["rates"],
];
writeCache($fresh);
respond(publicPayload($fresh, false, false));
