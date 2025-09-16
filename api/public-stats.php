<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../phptmp/config.php';

$CACHE_FILE = __DIR__ . '/cache.json';
$TTL = 30; 
$ALBY_TOKEN_FILE = __DIR__ . '/alby_token.json';

function cached_response($file, $ttl) {
  if (file_exists($file)) {
    $age = time() - filemtime($file);
    if ($age < $ttl) {
      $json = file_get_contents($file);
      if ($json) { echo $json; return true; }
    }
  }
  return false;
}

function http_get_json($url, $headers = []) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => $headers
  ]);
  $res = curl_exec($ch);
  if ($res === false) { $err = curl_error($ch); curl_close($ch); throw new Exception("HTTP error: $err"); }
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code < 200 || $code >= 300) { throw new Exception("HTTP status $code for $url"); }
  $json = json_decode($res, true);
  if ($json === null) { throw new Exception("Invalid JSON from $url"); }
  return $json;
}

function post_form($url, $data, $basicUser = '', $basicPass = '') {
  $ch = curl_init($url);
  $headers = ['Content-Type: application/x-www-form-urlencoded'];
  if ($basicUser !== '') {
    curl_setopt($ch, CURLOPT_USERPWD, $basicUser . ':' . $basicPass);
  }
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_TIMEOUT => 20
  ]);
  $res = curl_exec($ch);
  if ($res === false) { $err = curl_error($ch); curl_close($ch); throw new Exception("HTTP error: $err"); }
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code < 200 || $code >= 300) { throw new Exception("HTTP status $code for POST $url"); }
  $json = json_decode($res, true);
  if ($json === null) { throw new Exception("Invalid JSON from POST $url"); }
  return $json;
}

function get_alby_token() {
  global $ALBY_TOKEN_FILE;
  if (!file_exists($ALBY_TOKEN_FILE)) return null;
  $data = json_decode(file_get_contents($ALBY_TOKEN_FILE), true);
  return $data ?: null;
}

function refresh_alby_token($refresh) {
  $resp = post_form(
    'https://api.getalby.com/oauth/token',
    ['grant_type' => 'refresh_token', 'refresh_token' => $refresh],
    ALBY_CLIENT_ID, ALBY_CLIENT_SECRET
  );
  $out = [
    'access_token' => $resp['access_token'],
    'refresh_token' => $resp['refresh_token'] ?? '',
    'expires_at' => time() + intval($resp['expires_in'] ?? 7200),
    'scope' => $resp['scope'] ?? ''
  ];
  file_put_contents(__DIR__ . '/alby_token.json', json_encode($out, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
  return $out;
}

if (cached_response($CACHE_FILE, $TTL)) { exit; }

try {
  $onchain = http_get_json(rtrim(ESPLORA_BASE, '/') . '/address/' . urlencode(BTC_ADDRESS));
  $confirmed = intval($onchain['chain_stats']['funded_txo_sum'] ?? 0) - intval($onchain['chain_stats']['spent_txo_sum'] ?? 0);
  $unconfDelta = intval($onchain['mempool_stats']['funded_txo_sum'] ?? 0) - intval($onchain['mempool_stats']['spent_txo_sum'] ?? 0);
  $onchain_total_if_all_confirm = $confirmed + $unconfDelta;

  $ln_balance = 0;
  $ln_address = defined('LIGHTNING_ADDRESS') ? LIGHTNING_ADDRESS : '';

  $tok = get_alby_token();
  if ($tok && isset($tok['access_token'])) {
    if (isset($tok['expires_at']) && (time() > $tok['expires_at'] - 30) && !empty($tok['refresh_token'])) {
      $tok = refresh_alby_token($tok['refresh_token']);
    }
    $auth = ['Authorization: Bearer ' . $tok['access_token']];

    $bal = http_get_json('https://api.getalby.com/balance', $auth);
    $ln_balance = intval($bal['balance'] ?? 0);

    try {
      $v4v = http_get_json('https://api.getalby.com/user/value4value', $auth);
      if (!empty($v4v['lightning_address'])) {
        $ln_address = $v4v['lightning_address'];
      }
    } catch (Exception $e) {}
  }

  $payload = [
    'onchain' => [
      'address' => BTC_ADDRESS,
      'confirmed_sats' => $confirmed,
      'unconfirmed_delta_sats' => $unconfDelta,
      'projected_total_sats' => $onchain_total_if_all_confirm
    ],
    'lightning' => [
      'balance_sats' => $ln_balance,
      'receiving' => $ln_address
    ],
    'totals' => [
      'sats_confirmed_plus_ln' => $confirmed + $ln_balance,
      'sats_projected_plus_ln' => $onchain_total_if_all_confirm + $ln_balance
    ],
    '_meta' => [ 'updated_at' => gmdate('c') ]
  ];

  $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  file_put_contents($CACHE_FILE . '.tmp', $json);
  rename($CACHE_FILE . '.tmp', $CACHE_FILE);
  echo $json;
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'aggregation_failed', 'detail' => $e->getMessage()], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
