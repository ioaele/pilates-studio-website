<?php
header('Content-Type: application/json');
require_once 'database_connect.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection not available");
    }
    
    // Get current datetime
    $now = date('Y-m-d H:i:s');
    
    // Update sessions where end time has passed and status is still 'open'
    $sql = "
        UPDATE SESSION 
        SET status = 'closed'
        WHERE time_end < :now
        AND status = 'open'
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':now', $now, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        // Get count of updated rows
        $updatedCount = $stmt->rowCount();
        
        echo json_encode(array(
            'success' => true,
            'message' => "Updated $updatedCount session(s) to closed status",
            'updated_count' => $updatedCount
        ));
    } else {
        throw new Exception("Failed to update sessions");
    }
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
?>