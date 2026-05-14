<?php

class ModCiclos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT c.idCiclo as id, c.nombre, c.siglas, c.idCoordinador, 
                       c.grado, CONCAT('1º ', c.siglas, ', 2º ', c.siglas) AS cursos,
                       u.nombre as nombreCoordinador, u.apellidos as apellidosCoordinador 
                FROM Ciclos c
                LEFT JOIN Coordinador co ON c.idCoordinador = co.idCoordinador
                LEFT JOIN Usuarios u ON co.idCoordinador = u.idUsuario
                ORDER BY c.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT idCiclo as id, nombre, siglas, idCoordinador FROM Ciclos WHERE idCiclo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $ciclo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ciclo) {
            $ciclo['cursos_lista'] = $this->obtenerCursos($id);
        }

        return $ciclo;
    }

    private function obtenerCursos($idCiclo) {
        $sql = "SELECT * FROM Cursos WHERE idCiclo = :idCiclo";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idCiclo', $idCiclo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            // 1. Insertar el Ciclo
            $sql = "INSERT INTO Ciclos (nombre, siglas, idCoordinador, grado) VALUES (:nombre, :siglas, :idCoordinador, :grado)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':nombre'        => $datos['nombre'],
                ':siglas'        => $datos['siglas'],
                ':idCoordinador' => $datos['idCoordinador'] ?? 1,
                ':grado'         => $datos['grado'] ?? 'superior'
            ]);
            $idCiclo = $this->db->lastInsertId();

            $this->db->commit();
            return $this->obtener($idCiclo);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            // 1. Actualizar el Ciclo
            $sql = "UPDATE Ciclos SET nombre = :nombre, siglas = :siglas, idCoordinador = :idCoordinador, grado = :grado WHERE idCiclo = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'            => $id,
                ':nombre'        => $datos['nombre'],
                ':siglas'        => $datos['siglas'],
                ':idCoordinador' => $datos['idCoordinador'] ?? 1,
                ':grado'         => $datos['grado']
            ]);

            // 2. Actualizar los nombres de los cursos asociados (1º y 2º)
            $siglas = $datos['siglas'];
            $sqlCursos = "UPDATE Cursos SET nombre = CASE 
                            WHEN nombre LIKE '1º %' THEN :nombre1
                            WHEN nombre LIKE '2º %' THEN :nombre2
                            ELSE nombre 
                          END 
                          WHERE idCiclo = :id";
            $stmtCursos = $this->db->prepare($sqlCursos);
            $stmtCursos->execute([
                ':nombre1' => "1º $siglas",
                ':nombre2' => "2º $siglas",
                ':id'      => $id
            ]);

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function eliminar($id) {
        try {
            $this->db->beginTransaction();

            // 1. Borrar los cursos asociados primero (ya que la DB no tiene ON DELETE CASCADE en esta relación)
            $sqlCursos = "DELETE FROM Cursos WHERE idCiclo = :id";
            $stmtCursos = $this->db->prepare($sqlCursos);
            $stmtCursos->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtCursos->execute();

            // 2. Borrar el ciclo
            $sqlCiclo = "DELETE FROM Ciclos WHERE idCiclo = :id";
            $stmtCiclo = $this->db->prepare($sqlCiclo);
            $stmtCiclo->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtCiclo->execute();

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function obtenerDataTables($params) {
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;
        $search = $params['search']['value'] ?? '';

        $where = "";
        if ($search) {
            $where = "WHERE c.nombre LIKE :search OR c.siglas LIKE :search";
        }

        $total = $this->db->query("SELECT COUNT(*) FROM Ciclos")->fetchColumn();

        $stmtF = $this->db->prepare("SELECT COUNT(*) FROM Ciclos c $where");
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        $sql = "SELECT c.idCiclo as id, c.nombre, c.siglas, c.idCoordinador, 
                       c.grado, CONCAT('1º ', c.siglas, ', 2º ', c.siglas) AS cursos,
                       u.nombre as nombreCoordinador, u.apellidos as apellidosCoordinador 
                FROM Ciclos c
                LEFT JOIN Coordinador co ON c.idCoordinador = co.idCoordinador
                LEFT JOIN Usuarios u ON co.idCoordinador = u.idUsuario
                $where 
                ORDER BY c.nombre
                LIMIT :start, :length";
        
        $stmt = $this->db->prepare($sql);
        if ($search) $stmt->bindValue(':search', "%$search%");
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            "draw" => (int)($params['draw'] ?? 0),
            "recordsTotal" => (int)$total,
            "recordsFiltered" => (int)$totalFiltrados,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    }
}
