<?php
// /api/donofeed.php
declare(strict_types=1);
header('Cache-Control: no-store');

require_once __DIR__ . '/../../phptmp/config.php';

function out_json($data, int $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}
function out_csv(array $payload) {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename=donations.csv');
  $fh = fopen('php://output', 'w');
  fputcsv($fh, ['section','key','value']);
  foreach (['onchain','lightning','totals'] as $sec) {
    if (!empty($payload[$sec])) {
      foreach ($payload[$sec] as $k=>$v) fputcsv($fh, [$sec, $k, is_scalar($v)?$v:json_encode($v)]);
    }
  }
  fclose($fh); exit;
}

// ---- HTTP mit Retry/Backoff (robust wie txfeed) ----
function http_get_json_retry(string $url, array $hdr = [], int $tries = 3, int $timeout = 10): array {
  $lastEx = null;
  for ($i=0; $i<$tries; $i++) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CONNECTTIMEOUT => 6,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_HTTPHEADER => $hdr,
      CURLOPT_USERAGENT => 'coherosphere-donofeed/1.1',
    ]);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($res !== false && $code >= 200 && $code < 300) {
      $json = json_decode($res, true);
      if (is_array($json)) return $json;
      $lastEx = new Exception('Invalid JSON');
    } else {
      $lastEx = new Exception(($res===false?'cURL error: '.$err:"HTTP $code"));
    }
    // Exponentielles Backoff (ms): 300, 900, 1800 (+ Jitter)
    usleep((300 * (int)pow(3,$i) + random_int(0,120)) * 1000);
  }
  throw $lastEx ?? new Exception('Request failed');
}

// ---- On-chain (mit Fallback-Esplora wie in deinen Diags) ----
$onchain = [
  'address' => defined('BTC_ADDRESS') ? BTC_ADDRESS : null,
  'confirmed_sats' => 0,
  'projected_total_sats' => 0,
  '_meta' => ['updated_at' => gmdate('c'), 'source' => 'esplora']
];

try {
  if (!defined('BTC_ADDRESS')) throw new Exception('Missing BTC_ADDRESS');
  $bases = [];
  if (defined('ESPLORA_BASE') && ESPLORA_BASE) $bases[] = rtrim(ESPLORA_BASE,'/');
  // Fallback wie bei diag_onchain (z. B. Zertifikatsthema bei mempool.space)
  $bases[] = 'https://blockstream.info/api';

  $addr = null; $err = null;
  foreach ($bases as $b) {
    try {
      $addr = http_get_json_retry($b.'/address/'.BTC_ADDRESS);
      $onchain['_meta']['source'] = (strpos($b,'blockstream.info')!==false)?'blockstream_esplora':'esplora';
      break;
    } catch (Throwable $e) { $err = $e; }
  }
  if (!$addr) throw $err ?? new Exception('no esplora reachable');

  $confirmed_in  = (int)($addr['chain_stats']['funded_txo_sum']  ?? 0);
  $confirmed_out = (int)($addr['chain_stats']['spent_txo_sum']   ?? 0);
  $confirmed     = max(0, $confirmed_in - $confirmed_out);

  $mempool_in  = (int)($addr['mempool_stats']['funded_txo_sum'] ?? 0);
  $mempool_out = (int)($addr['mempool_stats']['spent_txo_sum']  ?? 0);
  $projected   = max(0, $confirmed + ($mempool_in - $mempool_out));

  $onchain['confirmed_sats'] = $confirmed;
  $onchain['projected_total_sats'] = $projected;
} catch (Throwable $e) {
  $onchain['_meta']['error'] = 'onchain_unavailable';
  $onchain['_meta']['message'] = $e->getMessage();
}

// ---- Lightning (Alby): zuerst /balance, dann /user/wallet (wie diag) ----
$lightning = [
  'receiving' => defined('LIGHTNING_ADDRESS') ? LIGHTNING_ADDRESS : null,
  'balance_sats' => null,
  '_meta' => ['updated_at' => gmdate('c'), 'source' => null]
];

function alby_headers(): array {
  if (!defined('ALBY_ACCESS_TOKEN') || !ALBY_ACCESS_TOKEN) throw new Exception('Missing ALBY_ACCESS_TOKEN');
  return ['Authorization: Bearer '.ALBY_ACCESS_TOKEN, 'Accept: application/json'];
}
function alby_balance_sats(): ?int {
  // 1) Primär: /balance  (liefert msats oder sats, je nach API-Version)
  try {
    $b = http_get_json_retry('https://api.getalby.com/balance', alby_headers());
    if (isset($b['balance']) && is_numeric($b['balance'])) {
      $bal = (float)$b['balance'];
      return ($bal > 9e12) ? (int)round($bal/1000) : (int)$bal; // msats→sats Heuristik
    }
    if (isset($b['satoshi_balance'])) return (int)$b['satoshi_balance'];
  } catch (Throwable $e) { /* fall back */ }

  // 2) Fallback: /user/wallet  (liefert teils satoshi_balance)
  try {
    $w = http_get_json_retry('https://api.getalby.com/user/wallet', alby_headers());
    if (isset($w['satoshi_balance'])) return (int)$w['satoshi_balance'];
    if (isset($w['balance']) && is_numeric($w['balance'])) {
      $bal = (float)$w['balance'];
      return ($bal > 9e12) ? (int)round($bal/1000) : (int)$bal;
    }
  } catch (Throwable $e) { /* give up below */ }

  return null;
}

try {
  if (defined('ALBY_ACCESS_TOKEN') && ALBY_ACCESS_TOKEN) {
    $sats = alby_balance_sats();
    if ($sats !== null) $lightning['balance_sats'] = $sats;
    $lightning['_meta']['source'] = 'alby_api';
  } else {
    $lightning['_meta']['source'] = 'no_token_fallback';
  }
} catch (Throwable $e) {
  $lightning['_meta']['error'] = 'lightning_unavailable';
  $lightning['_meta']['message'] = $e->getMessage();
}

// ---- Totals ----
$ln = (int)($lightning['balance_sats'] ?? 0);
$oc_conf = (int)($onchain['confirmed_sats'] ?? 0);
$oc_proj = (int)($onchain['projected_total_sats'] ?? $oc_conf);
$totals = [
  'confirmed_plus_ln' => $oc_conf + $ln,
  'projected_plus_ln' => $oc_proj + $ln
];

$payload = [
  'ok' => true,
  'onchain' => $onchain,
  'lightning' => $lightning,
  'totals' => $totals,
  '_meta' => ['generated_at' => gmdate('c')]
];

$format = strtolower($_GET['format'] ?? 'json');
if ($format === 'csv') out_csv($payload);
out_json($payload);
