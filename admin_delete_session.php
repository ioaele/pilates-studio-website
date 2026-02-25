<?php
// admin_delete_session.php file 
header('Content-Type: application/json; charset=utf-8');
require_once 'database_connect.php'; //uses database connect to connect to the server

try {
    //starts the connection and saves it inside a variable
    $database = new Database();
    $conn = $database->getConnection();

    //if conn is empty which means database connection failed
    if (!$conn) {
        throw new Exception("Database connection not available");
    }

        //converts json into a string and saves it inside input var
        $input = json_decode(file_get_contents('php://input'), true);

        //if json input is null throw exception
        if (!$input) {
            throw new Exception("Invalid input data");
        }

        //if the input session_id is not set throw exception
        if (!isset($input['session_id'])) {
            throw new Exception("Missing session_id");
        }

        //converts session to int and stores inside val
        $sessionId = (int)$input['session_id'];



        //delete session for the user u want to delete
        $stmt = $conn->prepare("DELETE FROM SESSION WHERE session_id = :session_id");
        $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT); 

        //enters in the if if the execute is successful
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) { //if more than 0 rows were deleted it means that the deletion was a success
                echo json_encode([
                    'success' => true,
                    'message' => 'Session deleted successfully'
                ]);
            } else { //else it means te session was not found on the database
                echo json_encode([
                    'success' => false,
                    'error'   => 'Session not found'
                ]);
            }
        } else { //if it doesnt get into the if statement it means the execution was not successful
            throw new Exception("Failed to delete session");
        }

        //row count 0 it means something wrong happened
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => $e->getMessage()
        ]);
    }
