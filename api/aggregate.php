<?php
// Optional combined endpoint that doesn't fail if one source fails.
header('Content-Type: application/json; charset=utf-8');

$base = __DIR__;
function safe_get($path) {
  $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
       . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/' . ltrim($path, '/');
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>8]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ($code>=200 && $code<300) ? json_decode($res, true) : null;
}

$onchain = safe_get('onchain.php');
$ln      = safe_get('lightning.php');

$out = [
  'onchain' => $onchain ?: ['error'=>'onchain_unavailable'],
  'lightning' => $ln ?: ['error'=>'lightning_unavailable'],
  '_meta' => ['aggregated_at' => gmdate('c')]
];
echo json_encode($out, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
