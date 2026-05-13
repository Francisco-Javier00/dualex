<?php

class ModModulos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT idModulo as id, nombre, sigla, color FROM Modulos ORDER BY nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT idModulo as id, nombre, sigla, color FROM Modulos WHERE idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function obtenerModulosProfesor($emailProfesor) {
        $sql = "SELECT m.idModulo, m.nombre, m.sigla, m.color,
                       (SELECT COUNT(*) FROM Modulo_Alumno_Cursa mac WHERE mac.idModulo = m.idModulo) as numAlumnos
                FROM Modulos m
                JOIN Modulo_Profesor mp ON m.idModulo = mp.idModulo
                JOIN Profesor p ON mp.idProfesor = p.idProfesor
                JOIN Usuarios u ON p.idProfesor = u.idUsuario
                WHERE u.correo = :emailProfesor
                ORDER BY m.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':emailProfesor', $emailProfesor, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        $sql = "INSERT INTO Modulos (nombre, sigla, color) VALUES (:nombre, :sigla, :color)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':sigla' => $datos['sigla'],
            ':color'  => $datos['color']
        ]);
        return $this->obtener($this->db->lastInsertId());
    }

    public function actualizar($id, $datos) {
        $sql = "UPDATE Modulos SET nombre = :nombre, sigla = :sigla, color = :color WHERE idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id'     => $id,
            ':nombre' => $datos['nombre'],
            ':sigla' => $datos['sigla'],
            ':color'  => $datos['color']
        ]);
        return $this->obtener($id);
    }

    public function eliminar($id) {
        $sql = "DELETE FROM Modulos WHERE idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function obtenerDataTables($params) {
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;
        $search = $params['search']['value'] ?? '';

        $where = "";
        if ($search) {
            $where = "WHERE nombre LIKE :search OR sigla LIKE :search";
        }

        $total = $this->db->query("SELECT COUNT(*) FROM Modulos")->fetchColumn();

        $stmtF = $this->db->prepare("SELECT COUNT(*) FROM Modulos $where");
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        $sql = "SELECT idModulo as id, nombre, sigla, color FROM Modulos $where LIMIT :start, :length";
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
