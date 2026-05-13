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
        $res = $this->modelo->crear($datos);
        $this->sendResponse($res, 201);
    }

    public function actualizar() {
        // $this->checkRole(['COORDINADOR']);
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
        // $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }
}
