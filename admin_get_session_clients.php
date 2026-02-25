<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Get session_id from query parameter
$session_id = isset($_GET['session_id']) ? intval($_GET['session_id']) : 0;

if ($session_id <= 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid session ID'
    ]);
    exit;
}

// Database connection
require_once 'database_connect.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection not available");
    }
    // Query to get clients who have booked this session
    // Assumes you have a bookings table with columns: username, session_id, booking_time
    // And a clients/users table with client details
    $sql = "SELECT DISTINCT
                c.username,
                c.[first name] AS first_name,
                c.[last name] AS last_name,
                c.email,
                c.phone_number,
                b.time_created AS booking_time
            FROM [booking] b
            INNER JOIN [user_signups] c ON b.users_id = c.users_id
            WHERE b.session_id = :session_id
            ORDER BY b.time_created ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':session_id', $session_id, PDO::PARAM_INT);
    $stmt->execute();

    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'clients' => $clients,
        'count' => count($clients)
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn = null;
?>
