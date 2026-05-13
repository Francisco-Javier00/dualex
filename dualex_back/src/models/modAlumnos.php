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

            $sqlU = "INSERT INTO Usuarios (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'A')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);
            $idUsuario = $this->db->lastInsertId();

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

            $sqlU = "UPDATE Usuarios SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':id'        => $id,
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);

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
        $sql = "DELETE FROM Usuarios WHERE idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function obtenerDataTables($params) {
        $idModulo = $params['idModulo'] ?? ($_GET['idModulo'] ?? ($_GET['moduloId'] ?? null));
        $emailProfesor = $params['emailProfesor'] ?? null;
        $rol = strtoupper($params['rol_token'] ?? '');
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;

        // Base de la consulta con DISTINCT para evitar duplicados si un alumno comparte varios módulos con el mismo profe
        $sql = "SELECT DISTINCT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, a.idCurso,
                       c.nombre as nombreCurso
                FROM Usuarios u
                INNER JOIN Alumnos a ON u.idUsuario = a.idAlumnos 
                LEFT JOIN Cursos c ON a.idCurso = c.idCurso ";

        // Si hay un ID de módulo (venimos desde el Dashboard), filtramos estrictamente por ese módulo
        if (!empty($idModulo) && $idModulo !== 'null') {
            $sql .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos ";
            $sql .= " WHERE mac.idModulo = :idModulo ";
        } 
        // Si NO hay módulo (venimos de la vista general "Alumnos") y somos Profesor
        else if ($rol === 'PROFESOR' && $emailProfesor) {
            $sql .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos ";
            $sql .= " INNER JOIN Modulo_Profesor mp ON mac.idModulo = mp.idModulo ";
            $sql .= " INNER JOIN Profesor p ON mp.idProfesor = p.idProfesor ";
            $sql .= " INNER JOIN Usuarios uProf ON p.idProfesor = uProf.idUsuario ";
            $sql .= " WHERE uProf.correo = :emailProfesor ";
        }

        $sql .= " ORDER BY u.apellidos, u.nombre LIMIT :start, :length";

        $stmt = $this->db->prepare($sql);
        
        if (!empty($idModulo) && $idModulo !== 'null') {
            $stmt->bindValue(':idModulo', (int)$idModulo, PDO::PARAM_INT);
        } else if ($rol === 'PROFESOR' && $emailProfesor) {
            $stmt->bindValue(':emailProfesor', $emailProfesor, PDO::PARAM_STR);
        }
        
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Para DataTables, necesitamos el conteo total
        $sqlCount = "SELECT COUNT(DISTINCT a.idAlumnos) FROM Usuarios u INNER JOIN Alumnos a ON u.idUsuario = a.idAlumnos ";
        if (!empty($idModulo) && $idModulo !== 'null') {
            $sqlCount .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos WHERE mac.idModulo = :idModulo";
            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->bindValue(':idModulo', (int)$idModulo, PDO::PARAM_INT);
        } else if ($rol === 'PROFESOR' && $emailProfesor) {
            $sqlCount .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos ";
            $sqlCount .= " INNER JOIN Modulo_Profesor mp ON mac.idModulo = mp.idModulo ";
            $sqlCount .= " INNER JOIN Profesor p ON mp.idProfesor = p.idProfesor ";
            $sqlCount .= " INNER JOIN Usuarios uProf ON p.idProfesor = uProf.idUsuario ";
            $sqlCount .= " WHERE uProf.correo = :emailProfesor";
            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->bindValue(':emailProfesor', $emailProfesor, PDO::PARAM_STR);
        } else {
            $stmtCount = $this->db->query($sqlCount);
        }
        
        $stmtCount->execute();
        $count = $stmtCount->fetchColumn();

        return [
            "draw" => (int)($params['draw'] ?? 0),
            "recordsTotal" => (int)$count,
            "recordsFiltered" => (int)$count,
            "data" => $data
        ];
    }

    public function listarPorModulo($idModulo) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       a.repetidor, a.idCurso
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos
                WHERE mac.idModulo = :idModulo
                ORDER BY u.apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idModulo', $idModulo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
