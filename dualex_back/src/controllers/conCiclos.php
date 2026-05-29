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
 * File-level docblock for conCiclos.php
 * 
 */
require_once MODELO . 'modCiclos.php';

/**
 * Controlador para la gestión de Ciclos Formativos.
 * 
 * Permite listar, crear, actualizar y eliminar ciclos.
 */
class ConCiclos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModCiclos($db);
    }

    /**
     * Lista todos los ciclos disponibles.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function listar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    /**
     * Obtiene los detalles de un ciclo específico por su ID.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function obtener() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Ciclo no encontrado.", 404);
        }
        $this->sendResponse($data);
    }

    /**
     * Obtiene la lista de ciclos formateada para DataTables.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function obtenerDataTables() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $params = json_decode($json, true);
        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    /**
     * Crea un nuevo ciclo.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function crear() {
        $this->checkRole(['COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        
        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Actualiza un ciclo existente.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function actualizar() {
        $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        
        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Elimina un ciclo.
     * Requiere rol COORDINADOR.
     * 
     * @return json Respuesta JSON con el resultado o un error
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
}
