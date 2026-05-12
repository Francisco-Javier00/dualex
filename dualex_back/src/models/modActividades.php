<?php
class ModActividades {
    private $conn;
    private $table_name = "Actividades";

    public function __construct($db) {
        $this->conn = $db;
    }

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
