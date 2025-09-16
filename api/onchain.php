<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../phptmp/config.php';

function http_get_json(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_USERAGENT => 'coherosphere-onchain/1.0'
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

try {
  $addr = http_get_json(rtrim(ESPLORA_BASE,'/').'/address/'.BTC_ADDRESS);

  $confirmed_in  = (int)($addr['chain_stats']['funded_txo_sum']  ?? 0);
  $confirmed_out = (int)($addr['chain_stats']['spent_txo_sum']   ?? 0);
  $confirmed     = max(0, $confirmed_in - $confirmed_out);

  $mempool_in  = (int)($addr['mempool_stats']['funded_txo_sum'] ?? 0);
  $mempool_out = (int)($addr['mempool_stats']['spent_txo_sum']  ?? 0);
  $projected   = max(0, $confirmed + ($mempool_in - $mempool_out));

  echo json_encode([
    'ok' => true,
    'address' => BTC_ADDRESS,
    'confirmed_sats' => $confirmed,
    'projected_total_sats' => $projected,
    '_meta' => [
      'updated_at' => gmdate('c'),
      'source' => 'esplora'
    ]
  ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'error' => 'onchain_unavailable',
    'message' => $e->getMessage(),
    '_meta' => ['updated_at' => gmdate('c')]
  ], JSON_UNESCAPED_SLASHES);
}
