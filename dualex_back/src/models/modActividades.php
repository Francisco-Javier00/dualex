<?php
/**
 * Modelo para la gestión de Actividades en la base de datos.
 * Proporciona métodos CRUD para el catálogo maestro de actividades.
 * 
 * @package Dualex\Models
 */
class ModActividades {
    private $conn;
    private $table_name = "Actividades";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene el listado completo de actividades registradas, incluyendo el módulo asociado si lo tiene.
     * 
     * @return array Lista de actividades.
     */
    public function listar() {
        $query = "SELECT a.idActividad as id, a.titulo, a.descripcion, 
                         IFNULL(GROUP_CONCAT(m.nombre SEPARATOR ', '), 'Sin módulo') as modulo 
                  FROM " . $this->table_name . " a
                  LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                  LEFT JOIN Modulos m ON ma.idModulo = m.idModulo
                  GROUP BY a.idActividad";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene una actividad específica por su ID.
     * 
     * @param int $id Identificador de la actividad.
     * @return array|false Datos de la actividad o false si no se encuentra.
     */
    public function obtener($id) {
        $query = "SELECT a.idActividad as id, a.titulo, a.descripcion, 
                         IFNULL(GROUP_CONCAT(m.nombre SEPARATOR ', '), 'Sin módulo') as modulo 
                  FROM " . $this->table_name . " a
                  LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                  LEFT JOIN Modulos m ON ma.idModulo = m.idModulo
                  WHERE a.idActividad = :id
                  GROUP BY a.idActividad";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Crea una nueva actividad en el sistema.
     * 
     * @param array $datos Datos de la actividad (titulo, descripcion, idCoordinador).
     * @return array Array asociativo con el estado de la operación (success/error).
     */
    public function crear($datos) {
        $query = "INSERT INTO " . $this->table_name . " (titulo, descripcion, idCoordinador) VALUES (:titulo, :descripcion, :idCoordinador)";
        $stmt = $this->conn->prepare($query);
        
        $idCoordinador = $datos['idCoordinador'] ?? null;

        $stmt->bindParam(":titulo", $datos['titulo']);
        $stmt->bindParam(":descripcion", $datos['descripcion']);
        $stmt->bindParam(":idCoordinador", $idCoordinador);

        if($stmt->execute()) {
            return ["status" => "success", "id" => $this->conn->lastInsertId()];
        }
        return ["status" => "error", "message" => "No se pudo crear la actividad."];
    }

    /**
     * Actualiza la información de una actividad existente.
     * 
     * @param int $id Identificador de la actividad a modificar.
     * @param array $datos Nuevos datos de la actividad.
     * @return array Array asociativo con el estado de la operación.
     */
    public function actualizar($id, $datos) {
        $query = "UPDATE " . $this->table_name . " 
                  SET titulo = :titulo, descripcion = :descripcion, idCoordinador = :idCoordinador 
                  WHERE idActividad = :id";
        $stmt = $this->conn->prepare($query);
        
        $idCoordinador = $datos['idCoordinador'] ?? null;

        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":titulo", $datos['titulo']);
        $stmt->bindParam(":descripcion", $datos['descripcion']);
        $stmt->bindParam(":idCoordinador", $idCoordinador);

        if($stmt->execute()) {
            return ["status" => "success", "message" => "Actividad actualizada."];
        }
        return ["status" => "error", "message" => "No se pudo actualizar la actividad."];
    }

    /**
     * Elimina una actividad del catálogo de forma permanente.
     * 
     * @param int $id Identificador de la actividad a eliminar.
     * @return array Array asociativo con el estado de la operación.
     */
    public function eliminar($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE idActividad = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        if($stmt->execute()) {
            return ["status" => "success", "message" => "Actividad eliminada."];
        }
        return ["status" => "error", "message" => "No se pudo eliminar la actividad."];
    }
}
?>
