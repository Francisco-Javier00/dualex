<?php

class ModAlumnos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       a.repetidor, a.idCurso, c.nombre as nombreCurso
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                JOIN Cursos c ON a.idCurso = c.idCurso
                WHERE u.tipo = 'A'
                ORDER BY u.apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       a.repetidor, a.idCurso
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                WHERE u.idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            // 1. Insertar en Usuarios
            $sqlU = "INSERT INTO Usuarios (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'A')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);
            $idUsuario = $this->db->lastInsertId();

            // 2. Insertar en Alumnos
            $sqlA = "INSERT INTO Alumnos (idAlumnos, DNI, NUSS, NIA, telefono, repetidor, idCurso) 
                     VALUES (:id, :dni, :nuss, :nia, :telefono, :repetidor, :idCurso)";
            $stmtA = $this->db->prepare($sqlA);
            $stmtA->execute([
                ':id'        => $idUsuario,
                ':dni'       => $datos['dni'],
                ':nuss'      => $datos['nuss'],
                ':nia'       => $datos['nia'],
                ':telefono'  => $datos['telefono'],
                ':repetidor' => isset($datos['repetidor']) ? ($datos['repetidor'] ? 1 : 0) : 0,
                ':idCurso'   => $datos['idCurso']
            ]);

            $this->db->commit();
            return $this->obtener($idUsuario);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            // 1. Actualizar Usuarios
            $sqlU = "UPDATE Usuarios SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':id'        => $id,
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);

            // 2. Actualizar Alumnos
            $sqlA = "UPDATE Alumnos SET 
                     DNI = :dni, NUSS = :nuss, NIA = :nia, telefono = :telefono, 
                     repetidor = :repetidor, idCurso = :idCurso 
                     WHERE idAlumnos = :id";
            $stmtA = $this->db->prepare($sqlA);
            $stmtA->execute([
                ':id'        => $id,
                ':dni'       => $datos['dni'],
                ':nuss'      => $datos['nuss'],
                ':nia'       => $datos['nia'],
                ':telefono'  => $datos['telefono'],
                ':repetidor' => isset($datos['repetidor']) ? ($datos['repetidor'] ? 1 : 0) : 0,
                ':idCurso'   => $datos['idCurso']
            ]);

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function eliminar($id) {
        // Al tener ON DELETE CASCADE en la FK de Alumnos -> Usuarios, 
        // borrar el usuario borrará automáticamente al alumno.
        $sql = "DELETE FROM Usuarios WHERE idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function obtenerDataTables($params) {
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;
        $search = $params['search']['value'] ?? '';

        $where = "WHERE u.tipo = 'A'";
        if ($search) {
            $where .= " AND (u.nombre LIKE :search OR u.apellidos LIKE :search OR a.DNI LIKE :search OR u.correo LIKE :search)";
        }

        // Total registros
        $total = $this->db->query("SELECT COUNT(*) FROM Alumnos")->fetchColumn();

        // Registros filtrados
        $sqlFiltrados = "SELECT COUNT(*) FROM Usuarios u JOIN Alumnos a ON u.idUsuario = a.idAlumnos $where";
        $stmtF = $this->db->prepare($sqlFiltrados);
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // Datos paginados
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       a.repetidor, a.idCurso, c.nombre as nombreCurso
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                JOIN Cursos c ON a.idCurso = c.idCurso
                $where 
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
