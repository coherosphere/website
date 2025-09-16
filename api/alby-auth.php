<?php
require_once __DIR__ . '/../../phptmp/config.php';
$auth_url = 'https://getalby.com/oauth';
$params = [
  'client_id' => ALBY_CLIENT_ID,
  'response_type' => 'code',
  'redirect_uri' => ALBY_REDIRECT_URI,
  'scope' => ALBY_SCOPES,
  'state' => bin2hex(random_bytes(8))
];
file_put_contents(__DIR__ . '/alby_oauth_state', $params['state']);
$qs = http_build_query($params);
header('Location: ' . $auth_url . '?' . $qs);
exit;
