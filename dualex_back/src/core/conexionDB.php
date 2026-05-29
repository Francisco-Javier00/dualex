<?php
namespace Dualex\Core;

use Exception;
use PDO;
use PDOException;

/**
 * File-level docblock for conexionDB.php
 * 
 */
/**
 * Clase ConexionDB
 * 
 * Gestiona la conexión a la base de datos MySQL utilizando PDO.
 * Extrae las credenciales directamente de las variables de entorno.
 */
class ConexionDB {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    public $conn;

    /**
     * Constructor de la clase ConexionDB.
     * 
     * Inicializa las propiedades de conexión a partir de las variables de entorno.
     * Verifica que existan las variables críticas para el funcionamiento.
     */
    public function __construct() {
        // Obtenemos los datos exclusivamente de $_ENV
        $this->host = $_ENV['DB_HOST'] ?? null;
        $this->db_name = $_ENV['DB_NAME'] ?? null;
        $this->username = $_ENV['DB_USER'] ?? null;
        $this->password = $_ENV['DB_PASS'] ?? '';

        // Validación de seguridad: no permitimos que falten variables críticas
        if (!$this->host || !$this->db_name || !$this->username) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(["error" => "Faltan variables de entorno críticas (DB_HOST, DB_NAME o DB_USER)"]);
            exit;
        }
    }

    /**
     * Establece y devuelve la conexión PDO a la base de datos.
     * 
     * @return PDO|null La instancia de conexión PDO o null si falla y termina el script.
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanza excepciones en errores
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve arrays asociativos por defecto
                PDO::ATTR_EMULATE_PREPARES   => true,                   // Emula sentencias preparadas para evitar error 1615 en servidores MySQL
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch (PDOException $e) {
            // En una API, lo ideal es devolver un error 500 en lugar de un die()
            http_response_code(500);
            echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
            exit;
        }

        return $this->conn;
    }
}