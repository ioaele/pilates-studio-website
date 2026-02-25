<?php
header('Content-Type: application/json; charset=utf-8'); //this will return a json
require_once 'database_connect.php'; //connects to the database using this php file

//try catch-block for errors to not end the program flow with a crash and end it with
//a printed error message instead
try { 
    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) { //if the connection variable is null print this message
        throw new Exception("Database connection not available");
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true); //converts it to json

    if (!$input) { //if the input is null print this message
        throw new Exception("Invalid input data");
    }

    //this are the variables needed to start a session if one of those is NULL throw error
    $required = ['level', 'capacity', 'date', 'time_start', 'time_end', 'status'];
    foreach ($required as $field) { //for to help iterate through the arguements
        if (!isset($input[$field])) {
            throw new Exception("Missing required field: $field"); //tell which field is missing
        }
    }
    //if the json includes a session id and the session id is not empty then convert it to an interger
    //otherwise set it to NULL
    $sessionId = isset($input['session_id']) && $input['session_id'] !== '' ? (int)$input['session_id'] : null;

    //if session_id exists then update it with the variables filled on line $required...
    if ($sessionId) {
        // Update existing session
        $sql = "
            UPDATE SESSION 
            SET level = :level,
                capacity = :capacity,
                date = :date,
                time_start = :time_start,
                time_end = :time_end,
                status = :status
            WHERE session_id = :session_id
        ";

        
        $stmt = $conn->prepare($sql); //use the dbconnection to 
        $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    } else { //otherwise insert it (the session)
        $sql = "
            INSERT INTO SESSION (level, capacity, date, time_start, time_end, status)
            VALUES (:level, :capacity, :date, :time_start, :time_end, :status)
        ";

        $stmt = $conn->prepare($sql);
    }

    //i did this to prevent SQL INJECTIONS because data is treated as data and not sql executions
    $stmt->bindParam(':level', $input['level'], PDO::PARAM_STR);
    $stmt->bindParam(':capacity', $input['capacity'], PDO::PARAM_INT);
    $stmt->bindParam(':date', $input['date'], PDO::PARAM_STR);
    $stmt->bindParam(':time_start', $input['time_start'], PDO::PARAM_STR);
    $stmt->bindParam(':time_end', $input['time_end'], PDO::PARAM_STR);
    $stmt->bindParam(':status', $input['status'], PDO::PARAM_STR);

    if ($stmt->execute()) {
        //get ID for new record
        if (!$sessionId) { //if this was an insert statement get the last inserted id
            try {
                $sessionId = (int)$conn->lastInsertId();
            } catch (Throwable $e) {
                $sessionId = null;
            }
        }
        //return success response
        echo json_encode([
            'success'    => true,
            'message'    => $sessionId ? 'Session saved successfully' : 'Session created successfully',
            'session_id' => $sessionId
        ]);
    } else {
        throw new Exception("Failed to save session");
    }

    //
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
