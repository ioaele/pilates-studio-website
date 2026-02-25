<?php
// admin_ban_client.php

header('Content-Type: application/json; charset=utf-8');

require_once 'database_connect.php';

// Set CORS headers (same as other admin APIs)
setCorsHeaders();

$response = [
    'success' => false,
    'message' => null,
    'error'   => null
];

try {
    // Read JSON input
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data) || empty($data['username'])) {
        throw new Exception('No username provided.');
    }

    $username = $data['username'];

    // Get DB connection
    $database = new Database();
    $db = $database->getConnection(); // PDO

    // Prepare DELETE statement
    $sql = "DELETE FROM USER_SIGNUPS WHERE username = :username";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);

    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $response['success'] = true;
        $response['message'] = "Client '$username' has been banned (deleted).";
    } else {
        // No row deleted (maybe wrong username)
        $response['error'] = "No client found with username '$username'.";
    }

} catch (PDOException $e) {
    http_response_code(500);
    $response['error'] = 'Database error: ' . $e->getMessage();
} catch (Exception $e) {
    http_response_code(400);
    $response['error'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
exit;
