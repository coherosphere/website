<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_lib.php';

$CACHE = __DIR__ . '/cache_lightning.json';
$TTL = 20;
$TOKEN_FILE = __DIR__ . '/alby_token.json';

try {
  $cached = cache_try_get($CACHE, $TTL);
  if ($cached) { echo json_encode($cached); exit; }

  $ln_address = defined('LIGHTNING_ADDRESS') ? LIGHTNING_ADDRESS : '';
  $balance = 0;

  $tok = get_alby_token($TOKEN_FILE);
  if ($tok && isset($tok['access_token'])) {
    if (isset($tok['expires_at']) && time() > $tok['expires_at'] - 30) {
      $tok = refresh_alby_token($TOKEN_FILE) ?: $tok;
    }
    $auth = ['Authorization: Bearer ' . $tok['access_token']];

    // Balance
    $bal = http_get_json('https://api.getalby.com/balance', $auth);
    $balance = intval($bal['balance'] ?? 0);

    // Try fetch lightning address
    try {
      $v4v = http_get_json('https://api.getalby.com/user/value4value', $auth);
      if (!empty($v4v['lightning_address'])) $ln_address = $v4v['lightning_address'];
    } catch (Exception $e) { /* ignore */ }
  }

  $payload = [
    'balance_sats' => $balance,
    'receiving' => $ln_address,
    '_meta' => ['updated_at' => gmdate('c')]
  ];
  cache_put($CACHE, $payload);
  echo json_encode($payload);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>'lightning_failed','detail'=>$e->getMessage()]);
}
