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
 * File-level docblock for conConfiguracion.php
 * 
 */
require_once MODELO . 'modConfiguracion.php';

/**
 * Controlador para gestionar la Configuración del sistema.
 * 
 * Permite obtener y actualizar la configuración global y verificar permisos generales.
 */
class ConConfiguracion {
    private $modelo;
    private $db;
    private $user;

    public function __construct($db, $user = null) {
        $this->db = $db;
        $this->user = $user;
        $this->modelo = new ModConfiguracion($db);
    }

    /**
     * Verifica si el usuario actual tiene permisos de coordinador general.
     * 
     * @return array Array asociativo con la clave esGeneral (boolean)
     */
    public function esGeneral() {
        if (!$this->user || !isset($this->user['data']['roles'])) {
            return ["esGeneral" => false];
        }
        $rolesUpper = array_map('strtoupper', $this->user['data']['roles']);
        return ["esGeneral" => in_array('COORDINADOR_GENERAL_DUALEX', $rolesUpper)];
    }

    /**
     * Obtiene la configuración actual del sistema.
     * 
     * @return array Datos de la configuración actual
     */
    public function obtenerConfiguracion() {
        if (!$this->user) {
            http_response_code(401);
            echo json_encode(["error" => "No autenticado"]);
            exit;
        }
        return $this->modelo->obtenerConfiguracion();
    }

    /**
     * Actualiza la configuración global del sistema (días de aviso, url, etc.).
     * 
     * @return array|json Respuesta con los datos o un error
     */
    public function actualizarConfiguracion() {
        if (!$this->user) {
            http_response_code(401);
            echo json_encode(["error" => "No autenticado"]);
            exit;
        }
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['diasAvisoCaducidad']) || !isset($datos['tiempoFinalizacionConvenio'])) {
            http_response_code(400);
            return ["error" => "Datos insuficientes para actualizar la configuración."];
        }

        $dias = filter_var($datos['diasAvisoCaducidad'], FILTER_VALIDATE_INT);
        $tiempo = filter_var($datos['tiempoFinalizacionConvenio'], FILTER_VALIDATE_INT);

        // Validamos que sean números positivos y entren en un TINYINT UNSIGNED (máximo 255)
        if ($dias === false || $dias <= 0 || $dias > 255) {
            http_response_code(400);
            return ["error" => "Días de aviso inválido. Debe ser un número entre 1 y 255."];
        }

        if ($tiempo === false || $tiempo <= 0 || $tiempo > 255) {
            http_response_code(400);
            return ["error" => "Tiempo de finalización inválido. Debe ser un número entre 1 y 255."];
        }

        $url = $datos['urlConvenio'] ?? '';
        if (!empty($url) && !filter_var($url, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            return ["error" => "La URL del convenio no es válida."];
        }

        return $this->modelo->actualizarConfiguracion($datos);
    }
}
?>
