<?php

class ModModulos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT * FROM modulos ORDER BY nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT * FROM modulos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        $sql = "INSERT INTO modulos (nombre, siglas, ciclo) VALUES (:nombre, :siglas, :ciclo)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':siglas' => $datos['siglas'],
            ':ciclo'  => $datos['ciclo']
        ]);
        return $this->obtener($this->db->lastInsertId());
    }

    public function actualizar($id, $datos) {
        $sql = "UPDATE modulos SET nombre = :nombre, siglas = :siglas, ciclo = :ciclo WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id'     => $id,
            ':nombre' => $datos['nombre'],
            ':siglas' => $datos['siglas'],
            ':ciclo'  => $datos['ciclo']
        ]);
        return $this->obtener($id);
    }

    public function eliminar($id) {
        $sql = "DELETE FROM modulos WHERE id = :id";
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
            $where = "WHERE nombre LIKE :search OR siglas LIKE :search OR ciclo LIKE :search";
        }

        $total = $this->db->query("SELECT COUNT(*) FROM modulos")->fetchColumn();

        $stmtF = $this->db->prepare("SELECT COUNT(*) FROM modulos $where");
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        $sql = "SELECT * FROM modulos $where LIMIT :start, :length";
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
