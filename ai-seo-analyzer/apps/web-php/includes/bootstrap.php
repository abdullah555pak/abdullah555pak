<?php
/**
 * Runs first on every request, page or API. Step 09 security-UI check:
 * never let a raw PHP warning/error/stack trace reach a visitor or an
 * API response, regardless of the host's own php.ini default (many
 * common local setups, e.g. XAMPP/MAMP, ship with display_errors On).
 * Real errors still go to the server's error log.
 */
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
