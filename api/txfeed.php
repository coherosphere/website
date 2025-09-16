<?php
declare(strict_types=1);

/**
 * /api/txfeed.php – unified transaction feed
 * - On-chain via Esplora (mempool.space → blockstream.info fallback), direction & amount per address delta
 * - Lightning via Alby (incoming + outgoing, if scope available)
 * - System CA, IPv4, HTTP/1.1, retries; 45s file cache; CSV export
 */

header('Content-Type: application/json; charset=utf-8');

try { require_once __DIR__ . '/../../phptmp/config.php'; }
catch (Throwable $e) {
  echo json_encode(['ok'=>false,'error'=>'config_failed','detail'=>$e->getMessage()]); exit;
}

$BTC_ADDR   = defined('BTC_ADDRESS') ? BTC_ADDRESS : '';
$ESPLORA    = defined('ESPLORA_BASE') ? ESPLORA_BASE : 'https://mempool.space/api';
$ALBY_TOKEN = defined('ALBY_ACCESS_TOKEN') ? ALBY_ACCESS_TOKEN : '';

if (!$BTC_ADDR) { echo json_encode(['ok'=>false,'error'=>'no_btc_address']); exit; }

$format = (isset($_GET['format']) && strtolower($_GET['format'])==='csv') ? 'csv' : 'json';
$limit  = isset($_GET['limit']) ? max(1,min(200,(int)$_GET['limit'])) : 100;
$source = isset($_GET['source']) ? strtolower($_GET['source']) : 'all'; // all|onchain|lightning

// ---- File-Cache (45s)
$cacheDir = dirname(__DIR__) . '/phptmp';
if (!is_dir($cacheDir)) @mkdir($cacheDir,0775,true);
$cacheKey = $cacheDir.'/txfeed_v2_'.md5($BTC_ADDR.'|'.$limit.'|'.$source).'.json';
$ttl = 45;

if ($format==='json' && is_file($cacheKey) && (time()-filemtime($cacheKey) < $ttl)) {
  $cached = file_get_contents($cacheKey);
  if ($cached!==false) { echo $cached; exit; }
}

// ---- HTTP helper
function http_get_json(string $url, array $headers=[], int $retries=2): array {
  $last=['code'=>0,'err'=>null];
  for($i=0;$i<=$retries;$i++){
    $ch=curl_init($url);
    curl_setopt_array($ch,[
      CURLOPT_RETURNTRANSFER=>true,
      CURLOPT_FOLLOWLOCATION=>true,
      CURLOPT_CONNECTTIMEOUT=>5,
      CURLOPT_TIMEOUT=>12,
      CURLOPT_SSL_VERIFYPEER=>true,
      CURLOPT_SSL_VERIFYHOST=>2,
      CURLOPT_IPRESOLVE=>defined('CURL_IPRESOLVE_V4')?CURL_IPRESOLVE_V4:1,
      CURLOPT_HTTP_VERSION=>defined('CURL_HTTP_VERSION_1_1')?CURL_HTTP_VERSION_1_1:2,
      CURLOPT_HTTPHEADER=>array_merge(['User-Agent: txfeed/1.1'],$headers),
    ]);
    $body=curl_exec($ch);
    $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);
    $err=curl_error($ch);
    curl_close($ch);

    if($body!==false && $code>=200 && $code<300){
      $json=json_decode((string)$body,true);
      if(json_last_error()===JSON_ERROR_NONE) return [$json,$code,null];
      $last=['code'=>$code,'err'=>'json_decode: '.json_last_error_msg()];
    } else {
      $last=['code'=>$code,'err'=>$err?:'http_error'];
    }
    usleep((150+$i*250)*1000);
  }
  return [null,$last['code'],$last['err']];
}

// ---- On-Chain (Esplora) with Direction-Calculation
function esplora_fetch_with_direction(string $addr, string $primary, int $limit): array {
  $bases = [$primary,'https://blockstream.info/api'];
  $last  = ['base'=>$primary,'http_code'=>0,'err'=>'unknown'];
  foreach($bases as $base){
    $url=rtrim($base,'/').'/address/'.rawurlencode($addr).'/txs';
    [$json,$code,$err]=http_get_json($url);
    if(is_array($json)){
      if(count($json)>$limit) $json=array_slice($json,0,$limit);
      $items=[];
      foreach($json as $tx){
        // Ensure that we have prevout addresses
        $sumIn=0; $sumOut=0;
        if(!empty($tx['vin']) && is_array($tx['vin'])){
          foreach($tx['vin'] as $vin){
            $prev = $vin['prevout'] ?? null;
            if($prev && ($prev['scriptpubkey_address'] ?? null) === $addr){
              $sumIn += (int)($prev['value'] ?? 0);
            }
          }
        }
        if(!empty($tx['vout']) && is_array($tx['vout'])){
          foreach($tx['vout'] as $vout){
            if(($vout['scriptpubkey_address'] ?? null) === $addr){
              $sumOut += (int)($vout['value'] ?? 0);
            }
          }
        }
        $delta = $sumOut - $sumIn; // >0 in, <0 out
        $direction = $delta>0 ? 'in' : ($delta<0 ? 'out' : 'self');
        $amount = abs($delta);

        $items[] = [
          'id'        => $tx['txid'] ?? null,
          'ts'        => isset($tx['status']['block_time']) ? (int)$tx['status']['block_time'] : null,
          'amount'    => $amount ?: null,
          'direction' => $direction,
          'status'    => isset($tx['status']['confirmed']) ? ($tx['status']['confirmed']?'confirmed':'pending') : null,
          'source'    => 'onchain',
          'meta'      => [
            'fee'  => $tx['fee']  ?? null,
            'size' => $tx['size'] ?? null,
          ],
        ];
      }
      return [$items, ['base'=>$base,'http_code'=>$code,'err'=>null]];
    }
    $last=['base'=>$base,'http_code'=>$code,'err'=>$err];
  }
  return [[], $last];
}

// ---- Lightning: incoming + outgoing (if Scope avalable)
function alby_fetch_in_out(string $token, int $limit): array {
  if(!$token) return [[], ['http_code'=>0,'err'=>'no_token']];
  $BASE='https://api.getalby.com';
  $hdr=['Authorization: Bearer '.$token,'Accept: application/json'];

  // Balance (optional)
  [$bal,$cBal,$eBal]=http_get_json($BASE.'/balance',$hdr);

  // Incoming
  [$inc,$cInc,$eInc]=http_get_json($BASE.'/invoices/incoming?items='.max(1,min(100,$limit)),$hdr);
  $incData = (is_array($inc)&&isset($inc['data'])&&is_array($inc['data'])) ? $inc['data'] : ((is_array($inc))?$inc:[]);

  // Outgoing (can be 401/403, if Scope missing -> ignore)
  [$out,$cOut,$eOut]=http_get_json($BASE.'/invoices/outgoing?items='.max(1,min(100,$limit)),$hdr);
  $outData = ($cOut===200) ? ((isset($out['data'])&&is_array($out['data']))?$out['data']:(is_array($out)?$out:[])) : [];

  $items=[];
  $map = [
    ['data'=>$incData, 'dir'=>'in'],
    ['data'=>$outData, 'dir'=>'out'],
  ];
  foreach($map as $group){
    foreach($group['data'] as $row){
      $ts = null;
      if(!empty($row['paid_at']))       $ts=strtotime($row['paid_at']);
      elseif(!empty($row['created_at']))$ts=strtotime($row['created_at']);

      $items[] = [
        'id'        => $row['id'] ?? null,
        'ts'        => $ts ?: null,
        'amount'    => isset($row['amount']) ? (int)$row['amount'] : null,
        'direction' => $group['dir'],
        'status'    => !empty($row['settled']) ? 'settled' : 'open',
        'source'    => 'lightning',
        'meta'      => [
          'desc'   => $row['description'] ?? null,
          'expiry' => $row['expires_at'] ?? null,
        ],
      ];
    }
  }

  return [$items, [
    'http_code_in'=>$cInc, 'http_code_out'=>$cOut,
    'err_in'=>$eInc, 'err_out'=>$eOut,
    'balance_sats'=>$bal['balance'] ?? ($bal['balance_sats'] ?? null)
  ]];
}

// ---- get Data
$items=[]; $meta=['onchain'=>null,'lightning'=>null];

if($source==='all' || $source==='onchain'){
  [$oc,$m]=esplora_fetch_with_direction($BTC_ADDR,$ESPLORA,$limit);
  $items=array_merge($items,$oc);
  $meta['onchain']=$m;
}
if($source==='all' || $source==='lightning'){
  [$ln,$m]=alby_fetch_in_out($ALBY_TOKEN,$limit);
  $items=array_merge($items,$ln);
  $meta['lightning']=$m;
}

// ---- sort & limit
usort($items,function($a,$b){
  $ta=$a['ts']??0; $tb=$b['ts']??0;
  if($ta===$tb) return strcmp((string)($b['id']??''),(string)($a['id']??''));
  return $tb <=> $ta;
});
if(count($items)>$limit) $items=array_slice($items,0,$limit);

// ---- CSV?
if($format==='csv'){
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="transactions.csv"');
  $out=fopen('php://output','w');
  fputcsv($out,['ts_iso','source','direction','status','amount_sats','id','desc']);
  foreach($items as $it){
    $iso=$it['ts']?gmdate('c',(int)$it['ts']):'';
    fputcsv($out,[$iso,$it['source'],$it['direction']??'', $it['status']??'', (string)($it['amount']??''), (string)($it['id']??''), (string)($it['meta']['desc']??'')]);
  }
  fclose($out); exit;
}

// ---- JSON
$payload=[
  'ok'=>true,
  'items'=>$items,
  '_meta'=>[
    'address'=>$BTC_ADDR,'limit'=>$limit,'source'=>$source,
    'esplora'=>$meta['onchain'],'alby'=>$meta['lightning'],'ts'=>gmdate('c'),
  ],
];
$json=json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
echo $json;
// Cache
if($json && is_dir($cacheDir)){ @file_put_contents($cacheKey,$json); @chmod($cacheKey,0664); }
