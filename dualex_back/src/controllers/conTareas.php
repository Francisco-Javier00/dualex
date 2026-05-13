<?php
require_once MODELO . 'modTareas.php';

class ConTareas extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModTareas($db);
    }

    public function listar() {
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    public function listarPorAlumno() {
        $idAlumno = $_GET['idAlumno'] ?? null;
        if (!$idAlumno) {
            $this->sendError("ID de alumno no proporcionado.", 400);
        }
        $data = $this->modelo->listarPorAlumno($idAlumno);
        $this->sendResponse($data);
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Tarea no encontrada.", 404);
        }
        $this->sendResponse($data);
    }

    public function crear() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        $res = $this->modelo->crear($datos);
        $this->sendResponse($res, 201);
    }

    public function actualizar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
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
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }
}
