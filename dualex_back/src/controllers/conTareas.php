<?php
require_once MODELO . 'modTareas.php';

class ConTareas extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModTareas($db);
    }

    public function listar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        try {
            $userRole = strtoupper($this->user['roles']['dualex'] ?? '');
            if ($userRole === 'ALUMNO') {
                $email = $this->user['email'] ?? '';
                $stmt = $this->db->prepare("SELECT idUsuario FROM Usuarios WHERE correo = :email");
                $stmt->execute([':email' => $email]);
                $idAlumno = $stmt->fetchColumn();
                $data = $this->modelo->listarPorAlumno($idAlumno);
            } else {
                $data = $this->modelo->listar();
            }
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function listarPorAlumno() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $idAlumno = $_GET['idAlumno'] ?? null;
        if (!$idAlumno) {
            $this->sendError("ID de alumno no proporcionado.", 400);
        }
        try {
            $data = $this->modelo->listarPorAlumno($idAlumno);
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function obtener() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        try {
            $data = $this->modelo->obtener($id);
            if (!$data) {
                $this->sendError("Tarea no encontrada.", 404);
            }
            $this->sendResponse($data);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function crear() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        
        $userRole = strtoupper($this->user['roles']['dualex'] ?? '');
        if ($userRole === 'ALUMNO') {
            $email = $this->user['email'] ?? '';
            $stmt = $this->db->prepare("SELECT idUsuario FROM Usuarios WHERE correo = :email");
            $stmt->execute([':email' => $email]);
            $idAlumno = $stmt->fetchColumn();
            $datos['idAlumno'] = $idAlumno ? $idAlumno : null;
        }
        
        if (empty($datos['idAlumno'])) {
            $this->sendError("ID de alumno no especificado.", 400);
        }
        
        try {
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function actualizar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        
        $userRole = strtoupper($this->user['roles']['dualex'] ?? '');
        if ($userRole === 'ALUMNO') {
            $email = $this->user['email'] ?? '';
            $stmt = $this->db->prepare("SELECT idUsuario FROM Usuarios WHERE correo = :email");
            $stmt->execute([':email' => $email]);
            $idAlumno = $stmt->fetchColumn();
            $datos['idAlumno'] = $idAlumno ? $idAlumno : null;
        }
        
        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    public function eliminar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        try {
            $success = $this->modelo->eliminar($id);
            $this->sendResponse(["success" => $success]);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }
}
?>
