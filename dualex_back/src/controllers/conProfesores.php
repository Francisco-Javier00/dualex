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
    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos) $this->sendError("Datos inválidos", 400);

        // Validación básica
        if (empty($datos['nombre']) || empty($datos['apellidos']) || empty($datos['correo'])) {
            $this->sendError("Faltan campos obligatorios (nombre, apellidos, correo)", 400);
        }

        // Validación de correo
        if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
            $this->sendError("La dirección de correo electrónico no es válida.", 400);
        }

        try {
            $nuevo = $this->modelo->crear($datos);
            return $nuevo;
        } catch (InvalidArgumentException $e) {
            $this->sendError($e->getMessage(), 400);
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
        if (!$id) $this->sendError("ID no proporcionado", 400);

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos) $this->sendError("Datos inválidos", 400);

        // Validación de correo
        if (isset($datos['correo']) && !filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
            $this->sendError("La dirección de correo electrónico no es válida.", 400);
        }

        try {
            $actualizado = $this->modelo->actualizar($id, $datos);
            return $actualizado;
        } catch (InvalidArgumentException $e) {
            $this->sendError($e->getMessage(), 400);
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
