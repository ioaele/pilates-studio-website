<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Step 1: Starting...<br>";

session_start();
echo "Step 2: Session started<br>";
echo "Session users_id: " . ($_SESSION['users_id'] ?? 'NOT SET') . "<br>";

require "connect.php";
echo "Step 3: Database connected<br>";

// Test query
try {
    $test = $pdo->query("SELECT TOP 1 * FROM forma4.BOOKING");
    $row = $test->fetch();
    echo "Step 4: Query works<br>";
    echo "Sample booking_id: " . ($row['booking_id'] ?? 'none') . "<br>";
    echo "Sample users_id: " . ($row['users_id'] ?? 'none') . "<br>";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
}
?>