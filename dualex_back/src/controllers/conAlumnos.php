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
 * File-level docblock for conAlumnos.php
 * 
 */
require_once MODELO . 'modAlumnos.php';

/**
 * Controlador para la gestión de Alumnos.
 * 
 * Permite listar, crear, actualizar, eliminar e importar alumnos.
 */
class ConAlumnos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModAlumnos($db);
    }

    /**
     * Lista todos los alumnos sin paginación.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function listar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    /**
     * Obtiene un alumno específico por su ID.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function obtener() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
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

    /**
     * Obtiene los alumnos formateados para DataTables, aplicando filtros por módulo y rol.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function obtenerDataTables() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
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
        
        // 4. Inyectamos los datos del token de sesión
        $params['email'] = $this->user['data']['email'] ?? null;
        $params['idUsuario'] = $this->user['id'] ?? null;
        
        $rolesUpper = array_map('strtoupper', $this->user['data']['roles'] ?? []);
        $rol_token = 'ALUMNO';
        if (in_array('COORDINADOR_GENERAL_DUALEX', $rolesUpper)) {
            $rol_token = 'COORDINADOR_GENERAL';
        } else if (in_array('COORDINADOR_DUALEX', $rolesUpper)) {
            $rol_token = 'COORDINADOR';
        } else if (in_array('PROFESOR_DUALEX', $rolesUpper)) {
            $rol_token = 'PROFESOR';
        }
        $params['rol_token'] = $rol_token;
        
        $data = $this->modelo->obtenerDataTables($params);
        error_log("PARAMS: " . print_r($params, true) . " DATA: " . print_r($data, true));
        $this->sendResponse($data);
    }

    /**
     * Crea un nuevo alumno.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function crear() {
        $this->checkRole(['COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        // Validación del lado del servidor
        $errores = $this->modelo->validar($datos);
        if (!empty($errores)) {
            $this->sendError(implode(" ", $errores), 400);
        }

        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Actualiza los datos de un alumno existente.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function actualizar() {
        $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        // Validación del lado del servidor
        $errores = $this->modelo->validar($datos);
        if (!empty($errores)) {
            $this->sendError(implode(" ", $errores), 400);
        }

        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Elimina un alumno.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function eliminar() {
        $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }

    /**
     * Lista los alumnos filtrados por un módulo específico.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function listarPorModulo() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $idModulo = $_GET['idModulo'] ?? null;
        if (!$idModulo) {
            $this->sendError("ID de módulo no proporcionado.", 400);
        }
        $data = $this->modelo->listarPorModulo($idModulo);
        $this->sendResponse($data);
    }

    /**
     * Importa alumnos masivamente desde un archivo Excel.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function importarExcel() {
        $this->checkRole(['COORDINADOR']);
        
        // El idCurso puede venir en $_POST debido a FormData
        $idCurso = $_POST['idCurso'] ?? null;
        if (!$idCurso) {
            $this->sendError("ID de curso no proporcionado.", 400);
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->sendError("No se ha subido ningún archivo o ha ocurrido un error al subirlo.", 400);
        }

        $fileTmpPath = $_FILES['file']['tmp_name'];
        $fileName = $_FILES['file']['name'];
        
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if (!in_array($ext, ['xlsx', 'xls'])) {
            $this->sendError("El archivo debe estar en formato Excel (.xlsx o .xls).", 400);
        }

        try {
            $resultado = $this->modelo->importarExcel($fileTmpPath, $idCurso);

            try {
                $this->sendResponse($resultado);
            } catch (Exception $e) {
                $this->sendError($e->getMessage(), 400);
            }

        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 400);
        }
    }

    /**
     * Obtiene todos los alumnos para DataTables sin aplicar filtros de rol específicos,
     * usualmente para vistas de administración general.
     * 
     * @return json Respuesta JSON con los datos o un error (vía sendResponse o sendError)
     */
    public function listarTodosDataTables() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?? [];
        $data = $this->modelo->listarTodosDataTables($params);
        $this->sendResponse($data);
    }
}

