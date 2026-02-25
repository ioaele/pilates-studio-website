<?php
session_start();
header('Content-Type: application/json');

// 1) Check if we have users_id in the session
if (!isset($_SESSION['users_id']) || !is_numeric($_SESSION['users_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit();
}

$user_id = (int)$_SESSION['users_id'];

// 2) Database connection
require_once "database_connect.php";
$database = new Database();
$conn = $database->getConnection();

// 3) Decide which action (default: get_bookings)
$action = $_GET["action"] ?? $_POST["action"] ?? "get_bookings";

switch ($action) {
    case "get_bookings":
        try {
            $sql = "SELECT b.booking_id,
                           b.status,
                           s.date,
                           s.time_start,
                           s.time_end,
                           s.level 
                    FROM forma4.BOOKING b 
                    INNER JOIN forma4.SESSION s ON b.session_id = s.session_id 
                    WHERE b.users_id = :user_id 
                    ORDER BY s.date ASC, s.time_start ASC";

            $stmt = $conn->prepare($sql);
            $stmt->execute([":user_id" => $user_id]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(["success" => true, "bookings" => $bookings]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case "check_auth":
        echo json_encode([
            "success" => true,
            "user_id" => $user_id,
            "session" => $_SESSION
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid action"]);
        break;
}
