<?php
require_once MODELO . 'modModulos.php';

class ConModulos extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModModulos($db);
    }

    public function listar() {
        try {
            $data = $this->modelo->listar();
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function listarPorCiclo() {
        $siglasCiclo = $_GET['siglasCiclo'] ?? null;
        if (!$siglasCiclo) {
            $this->sendError("Siglas de ciclo no proporcionadas.", 400);
        }

        try {
            $data = $this->modelo->listarPorCiclo($siglasCiclo);
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        try {
            $data = $this->modelo->obtener($id);
            if (!$data) {
                $this->sendError("Módulo no encontrado.", 404);
            }
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function obtenerDataTables() {
        $json = file_get_contents('php://input');
        $params = json_decode($json, true);

        // Si el usuario es COORDINADOR, pasamos su correo de la sesión para filtrar sus ciclos de forma segura
        if ($this->user && isset($this->user['roles']['dualex']) && strtoupper($this->user['roles']['dualex']) === 'COORDINADOR') {
            $params['email'] = $this->user['email'] ?? null;
        }

        try {
            $data = $this->modelo->obtenerDataTables($params);
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function crear() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        
        if (empty($datos['nombre']) || empty($datos['sigla']) || empty($datos['idCiclo']) || empty($datos['idCurso'])) {
            $this->sendError("Faltan campos obligatorios (nombre, sigla, ciclo, curso).", 400);
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

        if (empty($datos['nombre']) || empty($datos['sigla']) || empty($datos['idCiclo']) || empty($datos['idCurso'])) {
            $this->sendError("Faltan campos obligatorios (nombre, sigla, ciclo, curso).", 400);
        }

        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function eliminar() {
        $this->checkRole(['COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $success = $this->modelo->eliminar($id);
        $this->sendResponse(["success" => $success]);
    }

    public function listarProfesor() {
        try {
            // Protección contra acceso a offset en null si el usuario no está autenticado
            $emailToken = null;
            if ($this->user) {
                $emailToken = $this->user['email'] ?? ($this->user['correo'] ?? null);
            }
            
            $emailProfesor = $_GET['emailProfesor'] ?? $emailToken;
            
            if (!$emailProfesor) {
                $this->sendError("Identificación de profesor no proporcionada.", 400);
            }

            $data = $this->modelo->obtenerModulosProfesor($emailProfesor);
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function vincularProfesores() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $idModulo = $_GET['id'] ?? null;
        if (!$idModulo) {
            $this->sendError("ID de módulo no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        $profesoresIds = $datos['profesoresIds'] ?? [];

        try {
            $res = $this->modelo->vincularProfesores($idModulo, $profesoresIds);
            $this->sendResponse(["success" => $res]);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }
}
