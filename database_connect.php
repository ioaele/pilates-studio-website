<?php
class Database {
    private $host = "mssql.cs.ucy.ac.cy";
    private $db_name = "forma4";
    private $username = "forma4";
    private $password = "M76ZNfgW";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            // Use sqlsrv driver (not odbc)
            $this->conn = new PDO(
                "sqlsrv:Server={$this->host};Database={$this->db_name};TrustServerCertificate=yes;Encrypt=yes",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            throw new Exception("Connection failed: " . $e->getMessage());
        }
        return $this->conn;
    }
}

function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>