<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_lib.php';

$CACHE = __DIR__ . '/cache_onchain.json';
$TTL = 45;

try {
  $cached = cache_try_get($CACHE, $TTL);
  if ($cached) { echo json_encode($cached); exit; }

  $on = http_get_json(rtrim(ESPLORA_BASE, '/') . '/address/' . urlencode(BTC_ADDRESS));
  $confirmed = intval($on['chain_stats']['funded_txo_sum'] ?? 0) - intval($on['chain_stats']['spent_txo_sum'] ?? 0);
  $unconf   = intval($on['mempool_stats']['funded_txo_sum'] ?? 0) - intval($on['mempool_stats']['spent_txo_sum'] ?? 0);
  $proj     = $confirmed + $unconf;

  $payload = [
    'address' => BTC_ADDRESS,
    'confirmed_sats' => $confirmed,
    'unconfirmed_delta_sats' => $unconf,
    'projected_total_sats' => $proj,
    '_meta' => ['updated_at' => gmdate('c')]
  ];
  cache_put($CACHE, $payload);
  echo json_encode($payload);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>'onchain_failed','detail'=>$e->getMessage()]);
}
