<?php
require_once MODELO . 'modActividades.php';

class ConActividades extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModActividades($db);
    }

    public function listar() {
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID de actividad no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Actividad no encontrada.", 404);
        }
        $this->sendResponse($data);
    }

    public function obtenerDataTables() {
        // Capturar parámetros de la petición (JSON POST)
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?? [];
        
        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos) {
            $this->sendError("Datos no proporcionados.", 400);
        }

        // Validación del lado del servidor
        $errores = $this->modelo->validar($datos);
        if (!empty($errores)) {
            $this->sendError(implode(" ", $errores), 400);
        }

        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    public function actualizar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID de actividad no proporcionado.", 400);
        }

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos) {
            $this->sendError("Datos no proporcionados.", 400);
        }

        // Validación del lado del servidor
        $errores = $this->modelo->validar($datos);
        if (!empty($errores)) {
            $this->sendError(implode(" ", $errores), 400);
        }

        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    public function eliminar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID de actividad no proporcionado.", 400);
        }

        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }
}
?>
