<?php
require_once MODELO . 'modModulos.php';

class ConModulos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModModulos($db);
    }

    public function listar() {
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Módulo no encontrado.", 404);
        }
        $this->sendResponse($data);
    }

    public function obtenerDataTables() {
        $json = file_get_contents('php://input');
        $params = json_decode($json, true);

        // Si el usuario es COORDINADOR, filtramos solo por sus ciclos
        if ($this->user && isset($this->user['roles']['dualex']) && strtoupper($this->user['roles']['dualex']) === 'COORDINADOR') {
            $params['idCoordinador'] = $this->user['id'];
        }

        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        
        if (empty($datos['nombre']) || empty($datos['sigla']) || empty($datos['idCiclo'])) {
            $this->sendError("Faltan campos obligatorios (nombre, sigla, ciclo).", 400);
        }

        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function actualizar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (empty($datos['nombre']) || empty($datos['sigla']) || empty($datos['idCiclo'])) {
            $this->sendError("Faltan campos obligatorios.", 400);
        }

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

    public function listarProfesor() {
        $emailProfesor = $_GET['emailProfesor'] ?? ($this->user['email'] ?? ($this->user['correo'] ?? null));
        $data = $this->modelo->obtenerModulosProfesor($emailProfesor);
        $this->sendResponse($data);
    }
}
