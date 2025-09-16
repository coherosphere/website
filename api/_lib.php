<?php
require_once __DIR__ . '/../../phptmp/config.php';

function http_get_json($url, $headers = [], $timeout = 15) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => $timeout,
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
  if ($basicUser !== '') { curl_setopt($ch, CURLOPT_USERPWD, $basicUser . ':' . $basicPass); }
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

function cache_try_get($file, $ttl) {
  if (file_exists($file)) {
    $age = time() - filemtime($file);
    if ($age < $ttl) {
      $json = file_get_contents($file);
      if ($json) { return json_decode($json, true); }
    }
  }
  return null;
}

function cache_put($file, $data) {
  $json = json_encode($data, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
  file_put_contents($file . '.tmp', $json);
  rename($file . '.tmp', $file);
}

function get_alby_token($file) {
  if (!file_exists($file)) return null;
  $data = json_decode(file_get_contents($file), true);
  return $data ?: null;
}

function refresh_alby_token($token_file) {
  $tok = get_alby_token($token_file);
  if (!$tok || empty($tok['refresh_token'])) return null;
  $resp = post_form(
    'https://api.getalby.com/oauth/token',
    ['grant_type' => 'refresh_token', 'refresh_token' => $tok['refresh_token']],
    ALBY_CLIENT_ID, ALBY_CLIENT_SECRET
  );
  $out = [
    'access_token' => $resp['access_token'],
    'refresh_token' => $resp['refresh_token'] ?? '',
    'expires_at' => time() + intval($resp['expires_in'] ?? 7200),
    'scope' => $resp['scope'] ?? ''
  ];
  file_put_contents($token_file, json_encode($out, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
  return $out;
}
