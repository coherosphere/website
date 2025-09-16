<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../phptmp/config.php';

function http_get_json_auth(string $url, string $token): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $token,
      'Accept: application/json'
    ],
    CURLOPT_USERAGENT => 'coherosphere-lightning/1.0'
  ]);
  $res = curl_exec($ch);
  if ($res === false) throw new Exception('cURL error: '.curl_error($ch));
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code < 200 || $code >= 300) throw new Exception("HTTP $code for $url");
  $json = json_decode($res, true);
  if (!is_array($json)) throw new Exception('Invalid JSON');
  return $json;
}

$payload = [
  'ok' => true,
  'receiving' => defined('LIGHTNING_ADDRESS') ? LIGHTNING_ADDRESS : null,
  'balance_sats' => null,
  '_meta' => [
    'updated_at' => gmdate('c'),
    'source' => null
  ]
];

try {
  if (defined('ALBY_ACCESS_TOKEN') && ALBY_ACCESS_TOKEN) {
    $data = http_get_json_auth('https://api.getalby.com/user/wallet', ALBY_ACCESS_TOKEN);
    $sats = null;
    if (isset($data['balance']) && is_numeric($data['balance'])) {
      $bal = (float)$data['balance'];
      $sats = ($bal > 9e12) ? (int)round($bal/1000) : (int)$bal; // msats vs sats
    } elseif (isset($data['satoshi_balance'])) {
      $sats = (int)$data['satoshi_balance'];
    }
    if ($sats !== null) $payload['balance_sats'] = $sats;
    $payload['_meta']['source'] = 'alby_api';
  } else {
    $payload['_meta']['source'] = 'no_token_fallback';
  }
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'receiving' => $payload['receiving'],
    'error' => 'lightning_unavailable',
    'message' => $e->getMessage(),
    '_meta' => [
      'updated_at' => gmdate('c')
    ]
  ], JSON_UNESCAPED_SLASHES);
}
