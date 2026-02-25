<?php
require_once 'database_connect.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
if (!$conn) { //if the connection is not available
        throw new Exception("Database connection not available");
    }
    
    // Handle only POST requests (sign-up form submission)
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = $_POST['username'];
        

        //Call the stored procedure
        $sql = "{CALL sp_DeleteAccount(?)}";
        
        $stmt = $conn->prepare($sql);
        
    
    if (!$stmt) {
        // if prep error 
        throw new Exception("Prepare failed");
    }
    
        // Bind all stored procedure parameters properly for PDO
        $stmt->bindParam(1, $username);
       

        // Execute the stored procedure
        $success = $stmt->execute();

        // If execution was successful, then print success message with the new username
        if ($success) {
        echo json_encode([
        "status" => "success"
    ]);
        }
    }else{
        echo json_encode([
        "status" => "error2"
    ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error2",
        "message" => $e->getMessage()
    ]);
}

?>