<?php
require_once MODELO . 'modCursos.php';

class ConCursos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModCursos($db);
    }

    public function listar() {
        $idCiclo = $_GET['idCiclo'] ?? null;
        if ($idCiclo) {
            $data = $this->modelo->listarPorCiclo($idCiclo);
        } else {
            $data = $this->modelo->listar();
        }
        $this->sendResponse($data);
    }

    public function listarPorProfesor() {
        $idProfesor = $_GET['idProfesor'] ?? null;
        if (!$idProfesor) {
            $this->sendError("ID de profesor no proporcionado.", 400);
        }
        $data = $this->modelo->listarPorProfesor($idProfesor);
        $this->sendResponse($data);
    }

    public function obtener() {
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

    public function crear() {
        // $this->checkRole(['COORDINADOR']);
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

    public function actualizar() {
        // $this->checkRole(['COORDINADOR']);
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

    public function eliminar() {
        // $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }
}
