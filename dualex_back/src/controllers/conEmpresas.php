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
 * File-level docblock for conEmpresas.php
 * 
 */
require_once MODELO . 'modEmpresas.php';

/**
 * Controlador para la gestión de Empresas y sus respectivos contactos.
 * Extiende de BaseController para heredar funciones comunes como verificación de roles
 * y respuestas estándar en formato JSON (sendResponse / sendError).
 */
class ConEmpresas extends BaseController {
    private $modelo;

    /**
     * Constructor del controlador.
     * Inicializa el modelo correspondiente pasándole la conexión a la base de datos.
     * 
     * @param PDO $db Instancia de conexión a la base de datos.
     * @param array|null $user Datos del usuario logueado en la sesión (opcional).
     */
    public function __construct($db, $user = null) {
        parent::__construct($db, $user);
        $this->modelo = new ModEmpresas($db);
    }

    /**
     * Obtiene el listado completo de todas las empresas sin paginación.
     * Devuelve los datos en formato JSON mediante sendResponse.
     * 
     * @return void Imprime la respuesta JSON.
     */
    public function listar() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $data = $this->modelo->listar();
        $this->sendResponse($data);
    }

    /**
     * Obtiene los datos detallados de una empresa en concreto mediante su ID.
     * Verifica que el ID se reciba correctamente por parámetro GET y que la empresa exista.
     * 
     * @return void Imprime la respuesta JSON con los datos o un error 400/404.
     */
    public function obtener() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        $data = $this->modelo->obtener($id);
        if (!$data) {
            $this->sendError("Empresa no encontrada.", 404);
        }
        $this->sendResponse($data);
    }

    /**
     * Procesa la petición estructurada proveniente del plugin DataTables de Angular.
     * Lee los parámetros enviados por el cuerpo de la petición (JSON) para aplicar
     * búsqueda, paginación y ordenamiento desde el modelo.
     * 
     * @return void Imprime la respuesta JSON estructurada requerida por DataTables.
     */
    public function obtenerDataTables() {
        $this->checkRole(['PROFESOR', 'COORDINADOR']);
        $json = file_get_contents('php://input');
        $params = json_decode($json, true) ?: [];
        $data = $this->modelo->obtenerDataTables($params);
        $this->sendResponse($data);
    }

    /**
     * Gestiona la creación de una nueva empresa y sus contactos.
     * Requiere permisos de PROFESOR o COORDINADOR.
     * 
     * @return void Imprime la respuesta JSON con los datos de la nueva empresa creada y código 201.
     */
    public function crear() {
        // Bloqueo de seguridad: sólo el COORDINADOR puede crear empresas.
        $this->checkRole(['COORDINADOR']);
        
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }

        // Validación de longitudes según schema SQL antes de consultar al modelo
        $error = $this->validarLongitudes($datos);
        if ($error) {
            $this->sendError($error, 400);
        }
        
        try {
            // El modelo devuelve la empresa recién creada con su ID generado.
            $datos['idCoordinador'] = $this->user['id'] ?? $this->user['idUsuario'] ?? $this->user['sub'] ?? null;
            $res = $this->modelo->crear($datos);
            $this->sendResponse($res, 201);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Gestiona la actualización completa de los datos de una empresa y reemplaza todos sus contactos.
     * Requiere permisos de PROFESOR o COORDINADOR y un ID válido.
     * 
     * @return void Imprime la respuesta JSON con los datos actualizados de la empresa.
     */
    public function actualizar() {
        $this->checkRole(['COORDINADOR']);
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $this->sendError("ID no proporcionado.", 400);
        }
        
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);
        if (!$datos) {
            $this->sendError("Datos no válidos.", 400);
        }

        // Validación de longitudes según schema SQL
        $error = $this->validarLongitudes($datos);
        if ($error) {
            $this->sendError($error, 400);
        }
        
        try {
            $res = $this->modelo->actualizar($id, $datos);
            $this->sendResponse($res);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Gestiona la eliminación de una empresa basándose en su ID.
     * Al estar las claves foráneas configuradas en cascada en BD, se borrarán también sus contactos.
     * Requiere permisos de PROFESOR o COORDINADOR.
     * 
     * @return void Imprime la respuesta JSON confirmando el éxito de la operación.
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
     * Valida que las cadenas de texto recibidas no excedan el tamaño definido
     * en el script SQL de creación de la base de datos (scriptDB.sql).
     * 
     * @param array $datos Diccionario asociativo con los datos del frontend.
     * @return string|null Devuelve un string con el error si falla, o null si todo está bien.
     */
    private function validarLongitudes($datos) {
        if (isset($datos['siglas']) && mb_strlen($datos['siglas']) > 6) return "Las siglas superan los 6 caracteres permitidos.";
        if (isset($datos['nombre']) && mb_strlen($datos['nombre']) > 50) return "El nombre de la empresa supera los 50 caracteres permitidos.";
        if (isset($datos['convenioUrl']) && mb_strlen($datos['convenioUrl']) > 100) return "La URL del convenio supera los 100 caracteres permitidos.";
        
        if (isset($datos['contacto']) && mb_strlen($datos['contacto']) > 50) return "El nombre del contacto principal supera los 50 caracteres permitidos.";
        if (isset($datos['cargo']) && mb_strlen($datos['cargo']) > 100) return "El cargo del contacto supera los 100 caracteres permitidos.";
        if (isset($datos['numeroContacto']) && mb_strlen($datos['numeroContacto']) > 15) return "El teléfono del contacto principal supera los 15 caracteres permitidos.";
        if (isset($datos['correo']) && mb_strlen($datos['correo']) > 100) return "El correo del contacto principal supera los 100 caracteres permitidos.";
        if (!empty($datos['correo']) && !filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) return "El correo del contacto principal no es válido.";
        
        if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
            foreach ($datos['contactosAdicionales'] as $add) {
                if (isset($add['contacto']) && mb_strlen($add['contacto']) > 50) return "El nombre de un contacto adicional supera los 50 caracteres permitidos.";
                if (isset($add['cargo']) && mb_strlen($add['cargo']) > 100) return "El cargo de un contacto adicional supera los 100 caracteres permitidos.";
                if (isset($add['numeroContacto']) && mb_strlen($add['numeroContacto']) > 15) return "El teléfono de un contacto adicional supera los 15 caracteres permitidos.";
                if (isset($add['correo']) && mb_strlen($add['correo']) > 100) return "El correo de un contacto adicional supera los 100 caracteres permitidos.";
                if (!empty($add['correo']) && !filter_var($add['correo'], FILTER_VALIDATE_EMAIL)) return "El correo de un contacto adicional no es válido.";
            }
        }
        if (isset($datos['convenioUrl']) && !filter_var($datos['convenioUrl'], FILTER_VALIDATE_URL)) {
            return "La URL del convenio no es válida.";
        }

        return null;
    }
}
?>
