<?php
require_once MODELO . 'modConfiguracion.php';

class ConConfiguracion {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new ModConfiguracion($db);
    }

    public function obtenerConfiguracion() {
        return $this->modelo->obtenerConfiguracion();
    }

    public function actualizarConfiguracion() {
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

        return $this->modelo->actualizarConfiguracion($datos);
    }
}
?>
