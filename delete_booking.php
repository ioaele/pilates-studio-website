<?php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/delete_error.log');
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json');

try {
    if (!isset($_SESSION['users_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        exit;
    }

    $user_id = $_SESSION['users_id'];
    
    // Include and instantiate the database class
    require "database_connect.php";
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!isset($_POST['delete_id'])) {
        echo json_encode(['success' => false, 'error' => 'No booking ID']);
        exit;
    }
    
    $delete_id = intval($_POST['delete_id']); 

    $del = $pdo->prepare("
        DELETE FROM [forma4].[BOOKING] 
        WHERE booking_id = ? AND users_id = ?
    ");

    $del->execute([$delete_id, $user_id]);

    echo json_encode([
        'success' => true,
        'deleted' => $del->rowCount()
    ]);
    
} catch (Exception $e) {
    error_log("Delete error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>