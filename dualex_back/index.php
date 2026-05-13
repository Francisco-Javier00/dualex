<?php
// Limpiamos cualquier salida previa para evitar errores de cabeceras
ob_start();

// Cabeceras de CORS - Deben ir lo primero de todo
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Manejo de peticiones OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit;
}

// Cargamos las variables de entorno desde el archivo .env si existe
if (file_exists(__DIR__ . '/.env')) {
    foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
        }
    }
}

// Requerimos configuración y núcleo
require_once 'src/config/rutas.php';
require_once 'src/core/conexionDB.php';
require_once 'src/core/JWTHelper.php';
require_once 'src/core/BaseController.php';

// Inicializamos la base de datos
$db = (new ConexionDB())->getConnection();

// Capturamos el Controlador (c) y el Método (m)
$c = $_GET["c"] ?? null;
$m = $_GET["m"] ?? null;

if (!$c || !$m) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros c o m"]);
    ob_end_flush();
    exit;
}

$ruta = CONTROLADOR . "con$c.php";

if (file_exists($ruta)) {
    require_once $ruta;
    $clase = "Con$c";
    $obj = new $clase($db, null); // Pasamos null al user por ahora para simplificar

    if (method_exists($obj, $m)) {
        $resultado = $obj->$m();
        echo json_encode($resultado);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Metodo no encontrado"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "Controlador no encontrado"]);
}

ob_end_flush();
?>
