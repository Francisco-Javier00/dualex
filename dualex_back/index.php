<?php
// Cabeceras de respuesta y seguridad (CORS) para permitir peticiones desde Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si la petición es un "apretón de manos" de seguridad (OPTIONS), respondemos y cortamos la ejecución para ahorrar recursos
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
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

// Requerimos configuración de rutas y el núcleo de conexión a base de datos
require_once 'src/config/rutas.php';
require_once 'src/core/conexionDB.php';
require_once 'src/core/JWTHelper.php';
require_once 'src/core/BaseController.php';

// Inicializamos la base de datos
$db = (new ConexionDB())->getConnection();

// --- VALIDACIÓN DE JWT ---
// Obtenemos el secreto del entorno
$secret = $_ENV['JWT_SECRET'] ?? 'default_secret_cambiame';

// Obtenemos las cabeceras para buscar el token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

$userData = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $userData = JWTHelper::validar($token, $secret);
}

// Activarlo en producción, para obligar a tener token válido
// if ($c !== 'Auth' && !$userData) {
//     http_response_code(401);
//     echo json_encode(["error" => "No autorizado o sesión expirada"]);
//     exit;
// }

// Capturamos el Controlador (c) y el Método (m) de la URL
$c = $_GET["c"] ?? null;
$m = $_GET["m"] ?? null;

// Validamos que existan ambos parámetros
if (!$c || !$m) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros c (controlador) o m (método)"]);
    exit;
}

// Definimos la ruta del archivo del controlador según la constante CONTROLADOR
$ruta = CONTROLADOR . "con$c.php";

// Verificamos si el archivo del controlador existe
if (file_exists($ruta)) {
    require_once $ruta;
    $clase = "Con$c";
    // Pasamos la base de datos y los datos del usuario (si está autenticado)
    $obj = new $clase($db, $userData);

    // Verificamos si el método solicitado existe en la clase del controlador
    if (method_exists($obj, $m)) {
        echo json_encode($obj->$m());
    } else {
        http_response_code(404);
        echo json_encode(["error" => "El método $m no existe en el controlador $c"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "El recurso $c no ha sido encontrado"]);
}
?>
