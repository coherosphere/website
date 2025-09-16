<?php
// /api/alby-auth.php
require_once __DIR__ . '/_lib.php'; // lädt ../../phptmp/config.php
session_start();

$authUrl = 'https://getalby.com/oauth';
$params = [
  'response_type' => 'code',
  'client_id'     => ALBY_CLIENT_ID,
  'redirect_uri'  => ALBY_REDIRECT_URI,      // muss exakt mit der in Alby hinterlegten URL matchen
  'scope'         => ALBY_SCOPES,            // z.B. "account:read balance:read invoices:read transactions:read"
  'state'         => bin2hex(random_bytes(16)) // CSRF-Schutz
];
$_SESSION['alby_oauth_state'] = $params['state'];

header('Cache-Control: no-store');
header('Location: ' . $authUrl . '?' . http_build_query($params));
exit;
