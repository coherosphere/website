<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<p>__DIR__ = " . __DIR__ . "</p>";

require_once __DIR__ . '/../../phptmp/config.php';

echo "<p>Config geladen ✅</p>";

echo "<pre>";
// Falls in deiner config.php Konstanten stehen:
if (defined('BTC_ADDRESS')) {
    echo "BTC_ADDRESS = " . BTC_ADDRESS . "\n";
}
if (defined('LIGHTNING_ADDRESS')) {
    echo "LIGHTNING_ADDRESS = " . LIGHTNING_ADDRESS . "\n";
}
echo "</pre>";