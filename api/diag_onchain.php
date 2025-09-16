<?php
declare(strict_types=1);

// /api/diag_onchain.php – stabile On-Chain-Diag ohne CA-Datei (System-CA first), mit Retries & Fallbacks
header('Content-Type: application/json; charset=utf-8');
$started = microtime(true);

try {
  require_once __DIR__ . '/../../phptmp/config.php';
} catch (Throwable $e) {
  echo json_encode(['ok'=>false,'error'=>'config_failed','detail'=>$e->getMessage()]);
  exit;
}

$address   = defined('BTC_ADDRESS') ? BTC_ADDRESS : '';
$primary   = defined('ESPLORA_BASE') ? ESPLORA_BASE : 'https://mempool.space/api';
$fallbacks = [$primary, 'https://blockstream.info/api']; // Esplora-kompatibel

if (!$address) { echo json_encode(['ok'=>false,'error'=>'no_address_defined']); exit; }

function esplora_url(string $base, string $addr): string {
  return rtrim($base,'/').'/address/'.rawurlencode($addr).'/txs';
}

// low-level cURL (System-CA), IPv4 + HTTP/1.1, Retries
function curl_json_sysca(string $url, int $retries = 2): array {
  $last = ['code'=>0,'err'=>null];
  for ($i=0; $i<=$retries; $i++) {
    $ch = curl_init($url);
    $opts = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 5,
      CURLOPT_TIMEOUT        => 12,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
      CURLOPT_IPRESOLVE      => defined('CURL_IPRESOLVE_V4') ? CURL_IPRESOLVE_V4 : 1,
      CURLOPT_HTTP_VERSION   => defined('CURL_HTTP_VERSION_1_1') ? CURL_HTTP_VERSION_1_1 : 2,
      CURLOPT_HTTPHEADER     => ['User-Agent: txdiag/1.5'],
    ];
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body !== false && $code >= 200 && $code < 300) {
      $json = json_decode((string)$body, true);
      if (json_last_error() === JSON_ERROR_NONE) return [$json,$code,null];
      $last = ['code'=>$code,'err'=>'json_decode: '.json_last_error_msg()];
    } else {
      $last = ['code'=>$code,'err'=>$err ?: 'http_error'];
    }
    usleep((150 + $i*250) * 1000);
  }
  return [null,$last['code'],$last['err']];
}

$attempts = [];
$result=null; $code=0; $err=null; $used=null;

foreach ($fallbacks as $base) {
  $url = esplora_url($base, $address);
  [$json,$code,$err] = curl_json_sysca($url, 2);
  $attempts[] = ['base'=>$base,'http_code'=>$code,'err'=>$err];
  if ($json !== null) { $result=$json; $used=$url; break; }
}

$out = [
  'ok'          => ($result !== null),
  'http_code'   => $code,
  'duration_ms' => (int)round((microtime(true)-$started)*1000),
  'endpoint'    => $used ?: esplora_url($primary,$address),
  'ca_mode'     => 'system-only',
  'attempts'    => $attempts,
];

if ($result !== null) {
  $out['tx_count']    = is_array($result) ? count($result) : 0;
  $out['sample_txid'] = $out['tx_count'] ? ($result[0]['txid'] ?? null) : null;
} else {
  $out['error'] = $err ?: 'unknown_failure';
}

echo json_encode($out, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
