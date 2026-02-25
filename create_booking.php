<?php
session_start(); //a beautiful sesssion is about to start
header('Content-Type: application/json');
require_once 'database_connect.php'; //using the database connection file for the forma4 database that was reserved our beautiful university!!!

try { 
    $database = new Database(); //new connection
    $conn = $database->getConnection(); //save the connection status inside $conn
    
    if (!$conn) { //if connection fails
        throw new Exception("Database connection not available");
    }
    //if all good
    $input = json_decode(file_get_contents('php://input'), true);
    
    //if the session_id didnt start well and we didnt get the session_id or user_id we print this message 
    if (!isset($input['session_id']) || !isset($input['user_id'])) {
        throw new Exception("Session ID and User ID are required"); //exception to not ruin the flow
    }
    
    //if all went well and no problems occured we then save sessionid and userID
    $sessionId = (int)$input['session_id'];
    $userId = (int)$input['user_id'];
    
    //variable that prepares the koueri 
    $stmt = $conn->prepare("SELECT session_id, capacity, status, level, date, time_start FROM [SESSION] WHERE session_id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    //if session that we try to book is not found throw error
    if (!$session) {
        throw new Exception("Session not found");
    }
    
    //but if the session was found but is closed because of whatever reason
    if ($session['status'] !== 'open') {
        throw new Exception("This session is not available for booking");
    }
    
    //if the session was able to reserve correctly we have to keep track of the counts / capacity so we can print the messages accordingly
    $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM BOOKING WHERE session_id = ? AND status = 'confirmed'");
    $stmt->execute([$sessionId]);
    $countRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $bookedCount = (int)$countRow['cnt'];
    
    $available = $session['capacity'] - $bookedCount;
    
    //if its full 
    if ($available <= 0) {
        throw new Exception("This session is full");
    }
    
    $stmt = $conn->prepare("SELECT booking_id FROM BOOKING WHERE session_id = ? AND users_id = ? AND status = 'confirmed'");
    $stmt->execute([$sessionId, $userId]);
    
    if ($stmt->fetch()) {
        throw new Exception();
    }
    
    //if it's successfully reserved then we insert the booking into the database
    $stmt = $conn->prepare("INSERT INTO BOOKING (users_id, session_id, time_created, status) VALUES (?, ?, GETDATE(), 'confirmed')");
    
    //calls query and whatever query returns we Put it to the webpage on the specific booking
    if ($stmt->execute([$userId, $sessionId])) {
        echo json_encode([
            'success' => true,
            'message' => 'Booking confirmed successfully!',
            'session' => [
                'level' => $session['level'],
                'date' => $session['date'],
                'time' => $session['time_start']
            ]
        ]);
    } else {
        throw new Exception();
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>