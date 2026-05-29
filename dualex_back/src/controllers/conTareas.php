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
 * File-level docblock for conTareas.php
 * 
 */
require_once MODELO . 'modTareas.php';

/**
 * Controlador para la gestión de Tareas.
 * 
 * Permite listar, crear, actualizar, eliminar y gestionar documentos de tareas.
 */
class ConTareas extends BaseController {
    private $modelo;

    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModTareas($db);
    }

    /**
     * Lista todas las tareas (filtra por alumno si el rol actual es ALUMNO).
     * 
     * @return json Respuesta JSON con los datos o un error
     */
    public function listar() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        try {
            $userRole = strtoupper($this->user['roles']['dualex'] ?? '');
            if ($userRole === 'ALUMNO') {
                $email = $this->user['email'] ?? '';
                $stmt = $this->db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :email");
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

    /**
     * Lista las tareas asignadas a un alumno específico.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
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

    /**
     * Obtiene los detalles de una tarea específica por su ID.
     * 
     * @return json Respuesta JSON con los datos o un error
     */
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

    /**
     * Crea una nueva tarea.
     * Requiere rol ALUMNO.
     * 
     * @return json Respuesta JSON con los datos creados o un error
     */
    public function crear() {
        $this->checkRole(['ALUMNO']);
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }
        
        $userRole = strtoupper($this->user['roles']['dualex'] ?? '');
        if ($userRole === 'ALUMNO') {
            $email = $this->user['email'] ?? '';
            $stmt = $this->db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :email");
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

    /**
     * Actualiza los datos de una tarea existente.
     * 
     * @return json Respuesta JSON con los datos actualizados o un error
     */
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
            $stmt = $this->db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :email");
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

    /**
     * Sube un documento PDF asociado a una tarea específica.
     * Requiere rol ALUMNO.
     * 
     * @return json Respuesta JSON con el nombre del documento o un error
     */
    public function subirDocumento() {
        $this->checkRole(['ALUMNO']);
        $idTarea = $_GET['id'] ?? null;
        if (!$idTarea) {
            $this->sendError("ID de tarea no proporcionado.", 400);
        }
        if (!isset($_FILES['documento'])) {
            $this->sendError("No se ha enviado ningún archivo.", 400);
        }

        $archivo = $_FILES['documento'];
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if ($mimeType !== 'application/pdf') {
            $this->sendError("Solo se permiten archivos PDF.", 400);
        }
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            $this->sendError("Error al subir el archivo.", 400);
        }

        try {
            $nombreArchivo = $this->modelo->subirDocumento($idTarea, $archivo);
            if (!$nombreArchivo) {
                $this->sendError("Error al guardar el archivo.", 500);
            }
            $this->sendResponse(['documento' => $nombreArchivo]);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Descarga el documento PDF de una tarea específica.
     * 
     * @return void Inyecta el archivo PDF directamente en la respuesta HTTP o devuelve error JSON
     */
    public function descargarDocumento() {
        $this->checkRole(['ALUMNO', 'PROFESOR', 'COORDINADOR']);
        $idTarea = $_GET['id'] ?? null;
        if (!$idTarea) {
            $this->sendError("ID de tarea no proporcionado.", 400);
        }

        try {
            $ruta = $this->modelo->obtenerRutaDocumento($idTarea);
            if (!$ruta) {
                $this->sendError("Documento no encontrado.", 404);
            }

            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . basename($ruta) . '"');
            header('Content-Length: ' . filesize($ruta));
            readfile($ruta);
            exit;
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Elimina una tarea por su ID.
     * 
     * @return json Respuesta JSON con el resultado de éxito o error
     */
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
