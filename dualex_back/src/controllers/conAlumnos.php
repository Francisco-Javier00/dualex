<?php
require_once MODELO . 'modAlumnos.php';

class ConAlumnos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModAlumnos($db);
    }

    public function listar() {
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Alumno no encontrado.", 404);
        }
        $this->sendResponse($data);
    }

    public function obtenerDataTables() {
        // 1. Capturar parámetros del cuerpo JSON (POST)
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?? [];
        
        // 2. Priorizar parámetros de la URL (GET) si existen
        if (isset($_GET['idModulo']) && $_GET['idModulo'] !== '') {
            $params['idModulo'] = $_GET['idModulo'];
        }
        
        // 3. Si no está en ninguno, buscar en $_POST tradicional
        if (!isset($params['idModulo']) && isset($_POST['idModulo'])) {
            $params['idModulo'] = $_POST['idModulo'];
        }
        
        // 4. Inyectamos los datos del token de sesión para que el modelo pueda filtrar por profesor
        // Extraemos el email directamente del JWT en el backend por seguridad, en vez del frontend
        $params['emailProfesor'] = $this->user['email'] ?? null;
        $params['rol_token'] = $this->user['roles']['dualex'] ?? null;
        
        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        $res = $this->modelo->crear($datos);
        $this->sendResponse($res, 201);
    }

    public function actualizar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        $res = $this->modelo->actualizar($id, $datos);
        $this->sendResponse($res);
    }

    public function eliminar() {
        // $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }

    public function listarPorModulo() {
        $idModulo = $_GET['idModulo'] ?? null;
        if (!$idModulo) {
            $this->sendError("ID de módulo no proporcionado.", 400);
        }
        $data = $this->modelo->listarPorModulo($idModulo);
        $this->sendResponse($data);
    }
}
