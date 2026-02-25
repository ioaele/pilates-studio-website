<?php
session_start();  // ADD THIS AT THE VERY TOP
require_once 'database_connect.php';

$database = new Database();
$conn = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $sql = "SELECT password_hashed FROM USER_SIGNUPS WHERE [username] = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(1, $username);

    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new Exception("Login failed! User not found.");
    }

    $storedHash = $row['password_hashed'];

    if (is_resource($storedHash)) {
        $storedHash = stream_get_contents($storedHash);
    }

    $storedHash = trim((string)$storedHash);

    // Verify password
    if (password_verify($password, $storedHash)) {
        try {
            $ip = $_SERVER['REMOTE_ADDR'];
            $browser = $_SERVER['HTTP_USER_AGENT'];
            $sql = "{CALL sp_login(?,?, ?)}";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Prepare failed");
            }
            $stmt->bindParam(1, $username);
            $stmt->bindParam(2, $browser);
            $stmt->bindParam(3, $ip);

            $success = $stmt->execute();

            if ($success) {
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            if ($result['result'] == '-1') {
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Wrong credentials",
                ]);
            } else {
                // SET SESSION VARIABLES HERE
                $_SESSION['username'] = $username;
                $_SESSION['users_id'] = $result['result'];  // ADD THIS LINE
                
                echo json_encode([
                    "status" => "success",
                    "message" => "User logged in successfully!",
                    "userid" => $result['result']
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                "status" => "error2",
                "message" => $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error2",
            "message" => "Wrong credentials",
        ]);
    }

} else {
    header('Location: login.html');
}