<?php

class ModCursos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT c.*, ci.nombre as nombreCiclo 
                FROM Cursos c
                LEFT JOIN Ciclos ci ON c.idCiclo = ci.idCiclo
                ORDER BY c.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT * FROM Cursos WHERE idCurso = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function listarPorCiclo($idCiclo) {
        $sql = "SELECT * FROM Cursos WHERE idCiclo = :idCiclo ORDER BY nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idCiclo', $idCiclo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        $sql = "INSERT INTO Cursos (nombre, anio_escolar, idCiclo) VALUES (:nombre, :anio_escolar, :idCiclo)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'       => $datos['nombre'],
            ':anio_escolar' => $datos['anio_escolar'],
            ':idCiclo'      => $datos['idCiclo']
        ]);
        return $this->obtener($this->db->lastInsertId());
    }

    public function actualizar($id, $datos) {
        $sql = "UPDATE Cursos SET nombre = :nombre, anio_escolar = :anio_escolar, idCiclo = :idCiclo WHERE idCurso = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id'           => $id,
            ':nombre'       => $datos['nombre'],
            ':anio_escolar' => $datos['anio_escolar'],
            ':idCiclo'      => $datos['idCiclo']
        ]);
        return $this->obtener($id);
    }

    public function eliminar($id) {
        $sql = "DELETE FROM Cursos WHERE idCurso = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
