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
 * File-level docblock for conCursos.php
 * 
 */
require_once MODELO . 'modCursos.php';

/**
 * Controlador para la gestión de Cursos.
 * 
 * Permite listar, crear, actualizar y eliminar cursos.
 */
class ConCursos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModCursos($db);
    }

    /**
     * Lista los cursos. Si se proporciona un idCiclo, filtra por ese ciclo.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function listar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $idCiclo = $_GET['idCiclo'] ?? null;
        if ($idCiclo) {
            $data = $this->modelo->listarPorCiclo($idCiclo);
        } else {
            $data = $this->modelo->listar();
        }
        $this->sendResponse($data);
    }

    /**
     * Lista los cursos asignados a un profesor en particular.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function listarPorProfesor() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $idProfesor = $_GET['idProfesor'] ?? null;
        if (!$idProfesor) {
            $this->sendError("ID de profesor no proporcionado.", 400);
        }
        $data = $this->modelo->listarPorProfesor($idProfesor);
        $this->sendResponse($data);
    }

    /**
     * Obtiene un curso específico por su ID.
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
            $this->sendError("Curso no encontrado.", 404);
        }
        $this->sendResponse($data);
    }

    /**
     * Crea un nuevo curso.
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
     * Actualiza los datos de un curso existente.
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
     * Elimina un curso.
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
