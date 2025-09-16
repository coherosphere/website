<?php
declare(strict_types=1);

/**
 * txdiag.php — Serverseitiger Diagnose-Endpunkt
 * Prüft die Erreichbarkeit & Formate von onchain.php / lightning.php,
 * ohne deren Code zu ändern. Liefert eine kompakte JSON-Antwort.
 *
 * Ablage: /api/txdiag.php
 */

header('Content-Type: application/json; charset=utf-8');

$started = microtime(true);

// Lade config damit Konstanten wie ESPLORA_BASE, Alby usw. bereitstehen
try {
  require_once __DIR__ . '/../../phptmp/config.php';
} catch (Throwable $e) {
  echo json_encode(['ok'=>false,'error'=>'config_failed','detail'=>$e->getMessage()]);
  exit;
}

function capture_include(string $file) : array {
  $full = __DIR__ . '/' . ltrim($file,'/');
  if (!is_file($full)) throw new RuntimeException("missing_file: {$file}");
  $old = $_GET;
  ob_start();
  try {
    include $full;
  } finally {
    $raw = ob_get_clean();
    $_GET = $old;
  }
  $json = json_decode((string)$raw, true);
  if (!is_array($json)) throw new RuntimeException("invalid_json from {$file}: ".substr((string)$raw,0,200));
  return $json;
}

function try_loopback(string $file) : ?array {
  $uri = $file[0] === '/' ? $file : '/api/'.$file;
  $urls = ['http://127.0.0.1'.$uri, 'http://localhost'.$uri];
  foreach ($urls as $u) {
    $ctx = stream_context_create([
      'http'=>['timeout'=>5,'ignore_errors'=>true],
      'ssl' =>['verify_peer'=>false,'verify_peer_name'=>false],
    ]);
    $raw = @file_get_contents($u,false,$ctx);
    if ($raw !== false) {
      $json = json_decode((string)$raw, true);
      if (is_array($json)) return $json;
    }
  }
  return null;
}

function assess_onchain(array $oc) : array {
  $res = ['ok'=>true,'keys'=>array_keys($oc)];
  $res['confirmed_sats'] = $oc['confirmed_sats'] ?? null;
  $res['projected_total_sats'] = $oc['projected_total_sats'] ?? null;
  $txs = $oc['transactions'] ?? [];
  $res['tx_count'] = is_array($txs) ? count($txs) : 0;
  if (!$res['tx_count'] && !isset($oc['confirmed_sats'])) {
    $res['ok'] = false;
    $res['warn'] = 'no_transactions_and_no_balance_fields';
  }
  return $res;
}

function assess_lightning(array $ln) : array {
  $res = ['ok'=>true,'keys'=>array_keys($ln)];
  $res['balance_sats'] = $ln['balance_sats'] ?? null;
  $counts = [
    'invoices'     => (isset($ln['invoices'])  && is_array($ln['invoices']))  ? count($ln['invoices'])  : 0,
    'payments'     => (isset($ln['payments'])  && is_array($ln['payments']))  ? count($ln['payments'])  : 0,
    'transactions' => (isset($ln['transactions'])&& is_array($ln['transactions'])) ? count($ln['transactions']) : 0,
    'data'         => (isset($ln['data'])      && is_array($ln['data']))      ? count($ln['data'])      : 0,
  ];
  $res['counts'] = $counts;
  if (!isset($ln['balance_sats']) && array_sum($counts) === 0) {
    $res['ok'] = false;
    $res['warn'] = 'no_balance_and_no_lists';
  }
  return $res;
}

$out = ['ok'=>true, '_meta'=>['ts'=>gmdate('c')]];

// --- On-Chain testen ---
try {
  $oc = capture_include('onchain.php');
  $out['onchain'] = ['source'=>'include','assess'=>assess_onchain($oc)];
} catch (Throwable $e) {
  $out['onchain'] = ['source'=>'include','ok'=>false,'error'=>$e->getMessage()];
  // Loopback-Fallback ohne TLS
  $oc2 = try_loopback('onchain.php');
  if ($oc2) {
    $out['onchain_fallback'] = ['source'=>'loopback','assess'=>assess_onchain($oc2)];
  } else {
    $out['onchain_fallback'] = ['source'=>'loopback','ok'=>false,'error'=>'loopback_failed'];
  }
}

// --- Lightning testen ---
try {
  $ln = capture_include('lightning.php');
  $out['lightning'] = ['source'=>'include','assess'=>assess_lightning($ln)];
} catch (Throwable $e) {
  $out['lightning'] = ['source'=>'include','ok'=>false,'error'=>$e->getMessage()];
  $ln2 = try_loopback('lightning.php');
  if ($ln2) {
    $out['lightning_fallback'] = ['source'=>'loopback','assess'=>assess_lightning($ln2)];
  } else {
    $out['lightning_fallback'] = ['source'=>'loopback','ok'=>false,'error'=>'loopback_failed'];
  }
}

$out['_meta']['duration_ms'] = (int)round((microtime(true)-$started)*1000);
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
