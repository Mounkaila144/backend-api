<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Timing markers for performance monitoring (used by UserController)
$_SERVER['TIMING_AUTOLOAD_START'] = microtime(true);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';
$_SERVER['TIMING_AUTOLOAD_END'] = microtime(true);

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$_SERVER['TIMING_BOOTSTRAP_START'] = microtime(true);
$app = require_once __DIR__.'/../bootstrap/app.php';
$_SERVER['TIMING_BOOTSTRAP_END'] = microtime(true);

$app->handleRequest(Request::capture());
