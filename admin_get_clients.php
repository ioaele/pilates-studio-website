<?php

header('Content-Type: application/json; charset=utf-8');

require_once 'database_connect.php';


setCorsHeaders();

$response = [
    'success' => false,
    'clients' => [],
    'error'   => null
];

try {
 
    $database = new Database();
    $db = $database->getConnection(); 

   
    $sql = "
        SELECT 
            username,
            [First Name] AS first_name,
            [Last Name]  AS last_name,
            email,
            time_create,
            phone_number,
            datebirth
        FROM USER_SIGNUPS
        ORDER BY time_create DESC
    ";

 
    $stmt = $db->query($sql);
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);


    $response['success'] = true;
    $response['clients'] = $clients;

} catch (PDOException $e) {
    http_response_code(500);
    $response['error'] = 'Database error: ' . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    $response['error'] = 'General error: ' . $e->getMessage();
}


echo json_encode($response);
exit;
