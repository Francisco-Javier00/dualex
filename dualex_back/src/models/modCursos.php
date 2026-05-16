<?php

class ModCursos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar($idCiclo = null) {
        $sql = "SELECT c.idCurso as id, c.nombre, c.anio_escolar, c.idCiclo, ci.nombre as ciclo, ci.grado 
                FROM Cursos c
                JOIN Ciclos ci ON c.idCiclo = ci.idCiclo";
        
        if ($idCiclo) {
            $sql .= " WHERE c.idCiclo = :idCiclo";
        }
        
        $sql .= " ORDER BY c.nombre";
        
        $stmt = $this->db->prepare($sql);
        if ($idCiclo) {
            $stmt->bindValue(':idCiclo', $idCiclo, PDO::PARAM_INT);
        }
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

    /**
     * Obtiene los cursos relacionados con un profesor (ya sea porque los coordina o porque imparte clase en ellos).
     */
    public function listarPorProfesor($idProfesor) {
        // Cursos de ciclos que coordina
        $sqlC = "SELECT c.idCurso as id, c.nombre, c.anio_escolar, c.idCiclo, ci.nombre as ciclo, ci.grado 
                 FROM Cursos c
                 JOIN Ciclos ci ON c.idCiclo = ci.idCiclo
                 WHERE ci.idCoordinador = :id1";
        
        // Cursos donde imparte algún módulo (basado en los alumnos que cursan sus módulos)
        $sqlP = "SELECT DISTINCT c.idCurso as id, c.nombre, c.anio_escolar, c.idCiclo, ci.nombre as ciclo, ci.grado
                 FROM Cursos c
                 JOIN Ciclos ci ON c.idCiclo = ci.idCiclo
                 JOIN Alumnos a ON c.idCurso = a.idCurso
                 JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos
                 JOIN Modulo_Profesor mp ON mac.idModulo = mp.idModulo
                 WHERE mp.idProfesor = :id2";
        
        $sql = "($sqlC) UNION ($sqlP) ORDER BY nombre";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id1', $idProfesor, PDO::PARAM_INT);
        $stmt->bindValue(':id2', $idProfesor, PDO::PARAM_INT);
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
