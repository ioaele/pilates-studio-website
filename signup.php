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
        // Retrieve user data sent from the HTML form
        $username = $_POST['username'];
        $firstname = $_POST['firstname'];
        $lastname = $_POST['lastname'];
        $email = $_POST['email'];
        $password = $_POST['password'];
        $phone = $_POST['phone'];
        $dob = $_POST['dateOfBirth'];
        

       
        // Hash the password for security
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        
        //Call the stored procedure
        $sql = "{CALL sp_RegisterUser(?, ?, ?, ?, ?, ?, ?)}";
        
        $stmt = $conn->prepare($sql);
        
    
    if (!$stmt) {
        // if prep error 
        throw new Exception("Prepare failed");
    }
    
        // Bind all stored procedure parameters properly for PDO
        $stmt->bindParam(1, $username);
        $stmt->bindParam(2, $firstname);
        $stmt->bindParam(3, $lastname);      
        $stmt->bindParam(4, $email);
        $stmt->bindParam(5, $passwordHash);
        $stmt->bindParam(6, $phone);
        $stmt->bindParam(7, $dob);

        // Execute the stored procedure
        $success = $stmt->execute();

        // If execution was successful, then print success message with the new username
        if ($success) {

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
           
            if($result['result']=='-1'){
                echo json_encode([
                "status" => "ERROR",
                "message" => "USERNAME ALREADY EXISTS"
            ]);
            }else if($result['result'] == '-2'){
                echo json_encode([
                "status" => "ERROR",
                "message" => "EMAIL ALREADY EXISTS"
                ]);
            }else if($result['result'] == '-3'){
                echo json_encode([
                "status" => "ERROR",
                "message" => "PHONE ALREADY EXISTS"
                ]);
            }else if($result['result'] == '-4'){
                echo json_encode([
                "status" => "ERROR",
                "message" => "DATABASE INSERT ERROR"
                ]);
            }else{
       
                echo json_encode([
                "status" => "success",
                "message" => "User registered successfully!",
                "userid" => $result
            ]);
        }
            
        } 
        // If not successful execution, retrieve and output error info
        else {
            $errorInfo = $stmt->errorInfo();
            echo json_encode([
                "status" => "error",
                "message" => $errorInfo[2]
            ]);
        }
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error2",
        "message" => $e->getMessage()
    ]);
}
?>



