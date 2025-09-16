<?php
// /api/alby-callback.php
require_once __DIR__ . '/_lib.php';
session_start();
header('Content-Type: text/html; charset=utf-8');

// 1) State prüfen
if (!isset($_GET['state']) || !hash_equals($_SESSION['alby_oauth_state'] ?? '', $_GET['state'])) {
  http_response_code(400);
  exit('Invalid state');
}
unset($_SESSION['alby_oauth_state']);

// 2) Code prüfen
$code = $_GET['code'] ?? null;
if (!$code) { http_response_code(400); exit('Missing code'); }

// 3) Token holen
$ch = curl_init('https://api.getalby.com/oauth/token');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
  CURLOPT_POSTFIELDS     => http_build_query([
    'grant_type'    => 'authorization_code',
    'code'          => $code,
    'redirect_uri'  => ALBY_REDIRECT_URI,
    'client_id'     => ALBY_CLIENT_ID,
    'client_secret' => ALBY_CLIENT_SECRET,
  ]),
  CURLOPT_TIMEOUT        => 15
]);
$resp = curl_exec($ch);
if ($resp === false) { http_response_code(502); exit('Token request failed: '.curl_error($ch)); }
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($codeHttp < 200 || $codeHttp >= 300) { http_response_code($codeHttp); exit('Token request HTTP '.$codeHttp.': '.$resp); }
$data = json_decode($resp, true);
if (!is_array($data) || empty($data['access_token'])) { http_response_code(500); exit('No access_token'); }

// 4) Token sicher speichern
$payload = [
  'access_token'  => $data['access_token'],
  'refresh_token' => $data['refresh_token'] ?? null,
  'token_type'    => $data['token_type'] ?? 'Bearer',
  'scope'         => $data['scope'] ?? null,
  'expires_in'    => $data['expires_in'] ?? null,
  'expires_at'    => isset($data['expires_in']) ? (time() + (int)$data['expires_in']) : null,
  'saved_at'      => time(),
];
$tokenFile = __DIR__ . '/../../phptmp/alby_token.json';
if (!is_dir(dirname($tokenFile))) { mkdir(dirname($tokenFile), 0700, true); }
file_put_contents($tokenFile, json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT), LOCK_EX);
@chmod($tokenFile, 0600);

// 5) Zurück zur Liste
header('Location: /transactions.html');
exit;
