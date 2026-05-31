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
     * @param string $dbNameVar Variable de entorno para el nombre de la BD (por defecto 'DB_NAME').
     * @param string $hostVar Variable de entorno para el host (por defecto 'DB_HOST').
     * @param string $userVar Variable de entorno para el usuario (por defecto 'DB_USER').
     * @param string $passVar Variable de entorno para la contraseña (por defecto 'DB_PASS').
     * 
     * Inicializa las propiedades de conexión a partir de las variables de entorno.
     * Verifica que existan las variables críticas para el funcionamiento.
     */
    public function __construct($dbNameVar = 'DB_NAME', $hostVar = 'DB_HOST', $userVar = 'DB_USER', $passVar = 'DB_PASS') {
        // Obtenemos los datos exclusivamente de $_ENV, con fallback a las variables principales si no existen
        $this->host = $_ENV[$hostVar] ?? ($_ENV['DB_HOST'] ?? null);
        $this->db_name = $_ENV[$dbNameVar] ?? null;
        $this->username = $_ENV[$userVar] ?? ($_ENV['DB_USER'] ?? null);
        $this->password = $_ENV[$passVar] ?? ($_ENV['DB_PASS'] ?? '');

        // Validación de seguridad: no permitimos que falten variables críticas
        if (!$this->host || !$this->db_name || !$this->username) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(["error" => "Faltan variables de entorno críticas ($hostVar, $dbNameVar o $userVar)"]);
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