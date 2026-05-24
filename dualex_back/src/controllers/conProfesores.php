<?php
require_once MODELO . 'modProfesores.php';

/**
 * Controlador para la sección de Profesores.
 * Gestiona las peticiones HTTP y valida los datos antes de enviarlos al modelo.
 */
class ConProfesores extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModProfesores($db);
    }

    /**
     * Devuelve el listado completo de profesores (para selects o listas simples).
     */
    public function listar() {
        try {
            $data = $this->modelo->listar();
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Obtiene un profesor específico por su ID.
     */
    public function obtener() {
        $id = $_GET['id'] ?? null;
        $correo = $_GET['correo'] ?? null;

        try {
            if ($id) {
                $profesor = $this->modelo->obtener($id);
            } elseif ($correo) {
                $profesor = $this->modelo->obtenerPorCorreo($correo);
            } else {
                $this->sendError("ID o correo no proporcionado", 400);
            }

            if (!$profesor) {
                $this->sendError("Profesor no encontrado", 404);
            }

            $this->sendResponse($profesor);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Punto de entrada para la carga de datos de DataTables.
     */
    public function obtenerDataTables() {
        try {
            $json = file_get_contents('php://input');
            $params = json_decode($json, true) ?: [];
            $data = $this->modelo->obtenerDataTables($params);
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Crea un nuevo profesor.
     */
    public function esGeneral() {
        if (!$this->user || !isset($this->user['id'])) {
            return ["esGeneral" => false];
        }
        $stmt = $this->db->prepare("SELECT CAST(general AS UNSIGNED) as general FROM Coordinador WHERE idCoordinador = :id");
        $stmt->execute([':id' => $this->user['id']]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return ["esGeneral" => ($res && $res['general'] == 1)];
    }

    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        
        // Nueva validación: Solo el General puede crear coordinadores
        if ($datos['rol'] === 'COORDINADOR' && !$this->esGeneral()['esGeneral']) {
            $this->sendError("No tienes permisos para crear coordinadores.", 403);
        }

        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Actualiza un profesor existente.
     */
    public function actualizar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        // Nueva validación: Solo el General puede actualizar a Coordinador
        if ($datos['rol'] === 'COORDINADOR' && !$this->esGeneral()['esGeneral']) {
            $this->sendError("No tienes permisos para asignar el rol de Coordinador.", 403);
        }
        
        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Elimina un profesor.
     */
    public function eliminar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        
        $id = $_GET['id'] ?? null;
        if (!$id) $this->sendError("ID no proporcionado", 400);

        try {
            $success = $this->modelo->eliminar($id);
            return ["success" => $success];
        } catch (Exception $e) {
            $this->sendError("Error al eliminar el profesor: " . $e->getMessage(), 500);
        }
    }
}
