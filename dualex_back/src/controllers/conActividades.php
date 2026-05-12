<?php
require_once MODELO . 'modActividades.php';

class ConActividades {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new ModActividades($db);
    }

    public function listar() {
        return $this->modelo->listar();
    }

    public function obtener() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            return ["error" => "ID de actividad no proporcionado."];
        }
        return $this->modelo->obtener($id);
    }

    public function crear() {
        // Capturamos el cuerpo de la petición (JSON)
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['titulo']) || !isset($datos['descripcion'])) {
            return ["error" => "Datos insuficientes para crear la actividad."];
        }

        return $this->modelo->crear($datos);
    }

    public function actualizar() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            return ["error" => "ID de actividad no proporcionado."];
        }

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['titulo']) || !isset($datos['descripcion'])) {
            return ["error" => "Datos insuficientes para actualizar la actividad."];
        }

        return $this->modelo->actualizar($id, $datos);
    }

    public function eliminar() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            return ["error" => "ID de actividad no proporcionado."];
        }

        return $this->modelo->eliminar($id);
    }
}
?>
