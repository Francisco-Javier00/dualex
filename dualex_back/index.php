<?php
// Limpiamos cualquier salida previa para evitar errores de cabeceras
ob_start();

// Cabeceras de CORS - Deben ir lo primero de todo
$allowed_origins = [
    'https://05.proyectos.esvirgua.com',
    'https://17.daw.esvirgua.com',
    'http://localhost:4200',
    'http://localhost:8080'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Si no coincide, por defecto el de producción para evitar el *
    header("Access-Control-Allow-Origin: https://05.proyectos.esvirgua.com");
}

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
// Cargamos las dependencias de Composer (PhpSpreadsheet, etc.)
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Dependencias de Composer no instaladas. Ejecuta 'composer install' en el servidor."]);
    ob_end_flush();
    exit;
}
require_once $autoloadPath;

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

// --- Manejo de Autenticación (JWT) ---
$user = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;

// En algunos servidores Apache, getallheaders() es necesario
if (!$authHeader && function_exists('getallheaders')) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
}

// Fallback para descargar PDFs en pestañas nuevas (target="_blank") sin cabecera de Authorization
if (!$authHeader && isset($_GET['token'])) {
    $authHeader = 'Bearer ' . $_GET['token'];
}

if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = $matches[1];
    $secret = $_ENV['JWT_SECRET'] ?? '';
    if ($secret) {
        $user = JWTHelper::validar($token, $secret);
        
        if ($user && isset($user['data']['email'])) {
            // Verificar si el usuario ya existe en la base de datos local
            $stmt = $db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :correo");
            $stmt->execute([':correo' => $user['data']['email']]);
            $dbUser = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$dbUser) {
                // Determinar tipo y rol del token
                $roles = $user['data']['roles'] ?? [];
                $rolesUpper = array_map('strtoupper', $roles);
                
                $rol = 'ALUMNO'; // Por defecto
                if (in_array('COORDINADOR_DUALEX', $rolesUpper)) {
                    $rol = 'COORDINADOR';
                } else if (in_array('PROFESOR_DUALEX', $rolesUpper)) {
                    $rol = 'PROFESOR';
                } else if (in_array('ALUMNO_DUALEX', $rolesUpper)) {
                    $rol = 'ALUMNO';
                }

                try {
                    $db->beginTransaction();

                    $tipo = ($rol === 'ALUMNO') ? 'A' : 'P';

                    $sqlU = "INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, :tipo)";
                    $stmtU = $db->prepare($sqlU);
                    $stmtU->execute([
                        ':nombre'    => $user['data']['nombre'] ?? '',
                        ':apellidos' => $user['data']['apellidos'] ?? '',
                        ':correo'    => $user['data']['email'],
                        ':tipo'      => $tipo
                    ]);
                    $idUsuario = $db->lastInsertId();

                    if ($rol === 'ALUMNO') {
                        // Alumno requiere campos NOT NULL en la tabla Alumno (dni, nia, telefono, idCurso)
                        // Buscamos un idCurso existente como placeholder
                        $stmtC = $db->query("SELECT idCurso FROM Curso LIMIT 1");
                        $idCurso = $stmtC->fetchColumn();
                        if (!$idCurso) {
                            // Si no hay cursos, buscamos o creamos un ciclo
                            $stmtCiclo = $db->query("SELECT idCiclo FROM Ciclo LIMIT 1");
                            $idCiclo = $stmtCiclo->fetchColumn();
                            if (!$idCiclo) {
                                $db->exec("INSERT INTO Ciclo (nombre, siglas, grado) VALUES ('Ciclo Temporal', 'TEMP', 'medio')");
                                $idCiclo = $db->lastInsertId();
                            }
                            $db->exec("INSERT INTO Curso (nombre, anio_escolar, idCiclo) VALUES ('Curso Temporal', '24-25', $idCiclo)");
                            $idCurso = $db->lastInsertId();
                        }

                        // Generamos placeholders únicos para DNI y NIA
                        $dniPlaceholder = 'TEMP_' . str_pad($idUsuario, 8, '0', STR_PAD_LEFT);
                        $niaPlaceholder = 'TEMP_' . str_pad($idUsuario, 6, '0', STR_PAD_LEFT);
                        $telefonoPlaceholder = '000000000';

                        $sqlA = "INSERT INTO Alumno (idAlumno, dni, nia, telefono, idCurso) VALUES (:idAlumno, :dni, :nia, :telefono, :idCurso)";
                        $stmtA = $db->prepare($sqlA);
                        $stmtA->execute([
                            ':idAlumno' => $idUsuario,
                            ':dni'      => $dniPlaceholder,
                            ':nia'      => $niaPlaceholder,
                            ':telefono' => $telefonoPlaceholder,
                            ':idCurso'  => $idCurso
                        ]);
                    } else if ($rol === 'COORDINADOR') {
                        // Un Coordinador requiere ser Profesor primero
                        $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
                        $stmtP = $db->prepare($sqlP);
                        $stmtP->execute([':id' => $idUsuario]);

                        $sqlC = "INSERT INTO Coordinador (idCoordinador) VALUES (:id)";
                        $stmtC = $db->prepare($sqlC);
                        $stmtC->execute([':id' => $idUsuario]);
                    } else {
                        // Profesor por defecto o rol PROFESOR
                        $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
                        $stmtP = $db->prepare($sqlP);
                        $stmtP->execute([':id' => $idUsuario]);
                    }

                    $db->commit();
                    $user['id'] = $idUsuario;
                } catch (Exception $e) {
                    $db->rollBack();
                }
            } else {
                $user['id'] = $dbUser['idUsuario'];
            }
        }
    }
}

$ruta = CONTROLADOR . "con$c.php";

if (file_exists($ruta)) {
    require_once $ruta;
    $clase = "Con$c";
    $obj = new $clase($db, $user); 

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
