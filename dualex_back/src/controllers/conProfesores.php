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
        // En producción se podría restringir por rol
        // $this->checkRole(['PROFESOR', 'COORDINADOR']);
        return $this->modelo->listar();
    }

    /**
     * Obtiene un profesor específico por su ID.
     */
    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) $this->sendError("ID no proporcionado", 400);

        $profesor = $this->modelo->obtener($id);
        if (!$profesor) $this->sendError("Profesor no encontrado", 404);

        return $profesor;
    }

    /**
     * Punto de entrada para la carga de datos de DataTables.
     */
    public function obtenerDataTables() {
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?: [];
        return $this->modelo->obtenerDataTables($params);
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
        } catch (Exception $e) {
            $this->sendError("Error al crear el profesor: " . $e->getMessage(), 500);
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
        } catch (Exception $e) {
            $this->sendError("Error al actualizar: " . $e->getMessage(), 500);
        }
    }

    /**
     * Elimina un profesor.
     */
    public function eliminar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        
        $id = $_GET['id'] ?? null;
        if (!$id) $this->sendError("ID no proporcionado", 400);

        $success = $this->modelo->eliminar($id);
        return ["success" => $success];
    }
}
