<?php
declare(strict_types=1);

// /api/diag_lightning.php — Diagnose gegen die Alby Wallet API (read-only)
header('Content-Type: application/json; charset=utf-8');

// --- Stoppuhr
$started = microtime(true);

// --- Grundstruktur der Antwort
$out = [
  'ok' => false,
  '_meta' => ['ts' => gmdate('c')],
  'http_codes' => [],
];

// --- Konfiguration laden (dein config.php-Pfad)
try {
  require_once __DIR__ . '/../../phptmp/config.php';
} catch (Throwable $e) {
  http_response_code(200);
  $out['error'] = 'config_failed';
  $out['detail'] = $e->getMessage();
  $out['duration_ms'] = (int)round((microtime(true) - $started) * 1000);
  echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

// --- Token prüfen
$token = defined('ALBY_ACCESS_TOKEN') ? ALBY_ACCESS_TOKEN : '';
if (!$token) {
  http_response_code(200);
  $out['error'] = 'no_access_token';
  $out['duration_ms'] = (int)round((microtime(true) - $started) * 1000);
  echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

// --- Hilfsfunktion: GET + Bearer + JSON, mit Retries
function curl_json_auth(string $url, string $bearer, int $retries = 2): array {
  $last = ['code' => 0, 'err' => null, 'json' => null];
  for ($i = 0; $i <= $retries; $i++) {
    $ch = curl_init($url);
    $opts = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 5,
      CURLOPT_TIMEOUT        => 12,
      CURLOPT_HTTPHEADER     => [
        'User-Agent: txdiag/1.2',
        'Authorization: Bearer ' . $bearer,
        'Accept: application/json',
      ],
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
      CURLOPT_HEADER         => false,
    ];
    // IPv4 bevorzugen – sicher, falls Konstante fehlt
    $opts[CURLOPT_IPRESOLVE] = defined('CURL_IPRESOLVE_V4') ? CURL_IPRESOLVE_V4 : 1;

    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body !== false && $code >= 200 && $code < 300) {
      $json = json_decode((string)$body, true);
      if (json_last_error() === JSON_ERROR_NONE) {
        return [$json, $code, null];
      }
      $last = ['code' => $code, 'err' => 'json_decode: ' . json_last_error_msg(), 'json' => null];
    } else {
      $last = ['code' => $code, 'err' => $err ?: 'http_error', 'json' => null];
    }
    // leichter Backoff
    usleep((150 + $i * 200) * 1000);
  }
  return [null, $last['code'], $last['err']];
}

// --- Endpoints nach Alby-Doku
$BASE = 'https://api.getalby.com';
$urls = [
  'me'       => $BASE . '/user/me',        // benötigt: account:read
  'balance'  => $BASE . '/balance',        // benötigt: balance:read
  'invoices' => $BASE . '/invoices?items=50', // benötigt: invoices:read (gemischt)
  // Optional bei Bedarf:
  // 'invoices_in'  => $BASE . '/invoices/incoming?items=50',
  // 'invoices_out' => $BASE . '/invoices/outgoing?items=50', // benötigt zusätzlich transactions:read
];

// --- Requests absetzen
[$me, $codeMe, $errMe]         = curl_json_auth($urls['me'],       $token);
[$bal, $codeBal, $errBal]      = curl_json_auth($urls['balance'],  $token);
[$inv, $codeInv, $errInv]      = curl_json_auth($urls['invoices'], $token);

$out['http_codes'] = [
  'me'       => $codeMe,
  'balance'  => $codeBal,
  'invoices' => $codeInv,
];

// --- Ergebnis zusammensetzen
if ($codeBal === 200) {
  $out['ok'] = true;
  // Balance-Feldname kann 'balance' oder 'balance_sats' heißen – beide abdecken
  $out['balance_sats'] = $bal['balance'] ?? ($bal['balance_sats'] ?? null);

  // Invoices zählen – je nach Form (data[] oder Array) robust
  $out['counts'] = [
    'invoices' => isset($inv['data']) && is_array($inv['data'])
      ? count($inv['data'])
      : (is_array($inv) ? count($inv) : 0),
  ];

  // Scopes aus /user/me, wenn vorhanden
  if (is_array($me)) {
    $out['scopes_seen'] = $me['scopes'] ?? null;
  }
} else {
  // Fehlertext priorisieren
  $out['error'] = $errMe ?? $errBal ?? $errInv ?? 'unknown';
}

// --- Dauer & Ausgabe
$out['duration_ms'] = (int)round((microtime(true) - $started) * 1000);
http_response_code(200);
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
