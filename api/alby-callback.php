<?php
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/../../phptmp/config.php';

$expected_state_file = __DIR__ . '/alby_oauth_state';
$expected_state = file_exists($expected_state_file) ? trim(file_get_contents($expected_state_file)) : null;
if (isset($_GET['state']) && $expected_state && $_GET['state'] !== $expected_state) {
  http_response_code(400);
  echo "Invalid state.";
  exit;
}
if (!isset($_GET['code'])) { http_response_code(400); echo "Missing authorization code."; exit; }
$code = $_GET['code'];

$ch = curl_init('https://api.getalby.com/oauth/token');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
  CURLOPT_USERPWD => ALBY_CLIENT_ID . ':' . ALBY_CLIENT_SECRET,
  CURLOPT_POSTFIELDS => http_build_query([
    'grant_type' => 'authorization_code',
    'redirect_uri' => ALBY_REDIRECT_URI,
    'code' => $code
  ]),
  CURLOPT_TIMEOUT => 20
]);
$res = curl_exec($ch);
if ($res === false) { $err = curl_error($ch); curl_close($ch); http_response_code(500); echo "Token exchange failed: " . htmlspecialchars($err); exit; }
$code_http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($code_http < 200 || $code_http >= 300) { http_response_code(500); echo "Token exchange HTTP status: " . intval($code_http) . "<br/>" . htmlspecialchars($res); exit; }

$data = json_decode($res, true);
if (!$data || !isset($data['access_token'])) { http_response_code(500); echo "Invalid token response."; exit; }

$payload = [
  'access_token' => $data['access_token'],
  'refresh_token' => $data['refresh_token'] ?? '',
  'expires_at' => time() + intval($data['expires_in'] ?? 7200),
  'scope' => $data['scope'] ?? ''
];
file_put_contents(__DIR__ . '/alby_token.json', json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
echo "<p>Alby connected ✅</p><p>You can close this tab and reload your transparency page.</p>";
