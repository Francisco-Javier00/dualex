<?php
namespace Dualex\Controllers;

use Exception;
use PDO;
use PDOException;
use Dualex\Core\BaseController;
use Dualex\Core\ConexionDB;
use Dualex\Core\JWTHelper;
use Dualex\Models\ModActividades;
use Dualex\Models\ModAlumnos;
use Dualex\Models\ModCiclos;
use Dualex\Models\ModConfiguracion;
use Dualex\Models\ModCursos;
use Dualex\Models\ModEmpresas;
use Dualex\Models\ModModulos;
use Dualex\Models\ModProfesores;
use Dualex\Models\ModTareas;

/**
 * File-level docblock for conActividades.php
 * 
 */
require_once MODELO . 'modActividades.php';

/**
 * Controlador para la gestión de Actividades.
 * 
 * Permite listar, crear, actualizar y eliminar actividades.
 * Hereda de BaseController para funcionalidades comunes.
 */
class ConActividades extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModActividades($db);
    }

    /**
     * Lista todas las actividades sin paginación.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function listar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    /**
     * Obtiene una actividad específica por su ID.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function obtener() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
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
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        // Capturar parámetros de la petición (JSON POST)
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?? [];

        // Inyectar contexto de usuario para filtrar
        $rolesUpper = array_map('strtoupper', $this->user['data']['roles'] ?? []);
        $params['email'] = $this->user['data']['email'] ?? null;
        if (in_array('COORDINADOR_GENERAL_DUALEX', $rolesUpper)) {
            $params['rol'] = 'COORDINADOR_GENERAL';
        } elseif (in_array('COORDINADOR_DUALEX', $rolesUpper)) {
            $params['rol'] = 'COORDINADOR';
        } else {
            $params['rol'] = 'PROFESOR';
        }
        
        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    /**
     * Crea una nueva actividad.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function crear() {
        $this->checkRole(['COORDINADOR']);
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

    /**
     * Actualiza una actividad existente.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function actualizar() {
        $this->checkRole(['COORDINADOR']);
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

    /**
     * Elimina una actividad.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function eliminar() {
        $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID de actividad no proporcionado.", 400);
        }

        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }
}
?>
