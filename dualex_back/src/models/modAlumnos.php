<?php

class ModAlumnos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT * FROM alumnos ORDER BY apellidos, nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT * FROM alumnos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        $sql = "INSERT INTO alumnos (nombre, apellidos, email, nia, nuss, dni, telefono, ciclo, curso, estado) 
                VALUES (:nombre, :apellidos, :email, :nia, :nuss, :dni, :telefono, :ciclo, :curso, :estado)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'    => $datos['nombre'],
            ':apellidos' => $datos['apellidos'],
            ':email'     => $datos['email'],
            ':nia'       => $datos['nia'] ?? null,
            ':nuss'      => $datos['nuss'] ?? null,
            ':dni'       => $datos['dni'],
            ':telefono'  => $datos['telefono'] ?? null,
            ':ciclo'     => $datos['ciclo'],
            ':curso'     => $datos['curso'] ?? '1º',
            ':estado'    => $datos['estado'] ?? 'Activo'
        ]);
        return $this->obtener($this->db->lastInsertId());
    }

    public function actualizar($id, $datos) {
        $sql = "UPDATE alumnos SET 
                nombre = :nombre, apellidos = :apellidos, email = :email, 
                nia = :nia, nuss = :nuss, dni = :dni, telefono = :telefono, 
                ciclo = :ciclo, curso = :curso, estado = :estado 
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $datos['id'] = $id;
        $stmt->execute($datos);
        return $this->obtener($id);
    }

    public function eliminar($id) {
        $sql = "DELETE FROM alumnos WHERE id = :id";
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
            $where = "WHERE nombre LIKE :search OR apellidos LIKE :search OR dni LIKE :search OR email LIKE :search";
        }

        // Total registros sin filtrar
        $total = $this->db->query("SELECT COUNT(*) FROM alumnos")->fetchColumn();

        // Registros filtrados
        $sqlFiltrados = "SELECT COUNT(*) FROM alumnos $where";
        $stmtF = $this->db->prepare($sqlFiltrados);
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // Datos paginados
        $sql = "SELECT * FROM alumnos $where LIMIT :start, :length";
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
