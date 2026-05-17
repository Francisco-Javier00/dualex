<?php

class ModModulos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        // Usamos COALESCE para asegurar que el campo ciclo no sea NULL y no rompa el frontend
        $sql = "SELECT 
                    m.idModulo as id, 
                    m.nombre, 
                    m.sigla as siglas, 
                    m.color, 
                    IFNULL(c.siglas, 'S/C') as ciclo
                FROM Modulos m
                LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                LEFT JOIN Cursos cur ON mc.idCurso = cur.idCurso
                LEFT JOIN Ciclos c ON cur.idCiclo = c.idCiclo
                ORDER BY m.nombre";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Eliminamos duplicados en PHP para mayor control
        $modulosUnicos = [];
        foreach ($resultados as $row) {
            if (!isset($modulosUnicos[$row['id']])) {
                $modulosUnicos[$row['id']] = $row;
            }
        }

        return array_values($modulosUnicos);
    }

    public function listarPorCiclo($siglasCiclo) {
        $siglasCiclo = strtoupper(trim((string)$siglasCiclo));

        $sql = "SELECT DISTINCT
                    m.idModulo as id,
                    m.nombre,
                    m.sigla as siglas,
                    c.siglas as ciclo
                FROM Modulos m
                JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                JOIN Cursos cur ON mc.idCurso = cur.idCurso
                JOIN Ciclos c ON cur.idCiclo = c.idCiclo
                WHERE c.siglas = :siglasCiclo
                ORDER BY m.nombre";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':siglasCiclo' => $siglasCiclo]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT m.idModulo as id, m.nombre, m.sigla, m.color, 
                       (SELECT cur.idCiclo FROM Modulo_Curso mc 
                        JOIN Cursos cur ON mc.idCurso = cur.idCurso 
                        WHERE mc.idModulo = m.idModulo LIMIT 1) as idCiclo
                FROM Modulos m 
                WHERE m.idModulo = :id";
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
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO Modulos (nombre, sigla, color) VALUES (:nombre, :sigla, :color)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':nombre' => $datos['nombre'],
                ':sigla' => $datos['sigla'],
                ':color'  => $datos['color']
            ]);
            $idModulo = $this->db->lastInsertId();

            // Vincular con los cursos del ciclo seleccionado
            if (isset($datos['idCiclo'])) {
                $sqlCursos = "SELECT idCurso FROM Cursos WHERE idCiclo = :idCiclo";
                $stmtCursos = $this->db->prepare($sqlCursos);
                $stmtCursos->execute([':idCiclo' => $datos['idCiclo']]);
                $cursos = $stmtCursos->fetchAll(PDO::FETCH_ASSOC);

                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                foreach ($cursos as $curso) {
                    $stmtRel->execute([':idModulo' => $idModulo, ':idCurso' => $curso['idCurso']]);
                }
            }

            $this->db->commit();
            return $this->obtener($idModulo);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            $sql = "UPDATE Modulos SET nombre = :nombre, sigla = :sigla, color = :color WHERE idModulo = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'     => $id,
                ':nombre' => $datos['nombre'],
                ':sigla' => $datos['sigla'],
                ':color'  => $datos['color']
            ]);

            // Actualizar vínculos con cursos
            if (isset($datos['idCiclo'])) {
                // Borrar anteriores
                $this->db->prepare("DELETE FROM Modulo_Curso WHERE idModulo = :id")->execute([':id' => $id]);

                // Insertar nuevos
                $sqlCursos = "SELECT idCurso FROM Cursos WHERE idCiclo = :idCiclo";
                $stmtCursos = $this->db->prepare($sqlCursos);
                $stmtCursos->execute([':idCiclo' => $datos['idCiclo']]);
                $cursos = $stmtCursos->fetchAll(PDO::FETCH_ASSOC);

                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                foreach ($cursos as $curso) {
                    $stmtRel->execute([':idModulo' => $id, ':idCurso' => $curso['idCurso']]);
                }
            }

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function eliminar($id) {
        $sql = "DELETE FROM Modulos WHERE idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function obtenerDataTables($params) {
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';
        
        $idCoordinador = null; // Nunca usamos el ID del token por seguridad
        $email = $params['email'] ?? null;

        // Resolvemos el idCoordinador real de la base de datos a partir del correo
        if (!empty($email)) {
            $stmtUser = $this->db->prepare("SELECT idUsuario FROM Usuarios WHERE correo = :correo LIMIT 1");
            $stmtUser->execute([':correo' => $email]);
            $realId = $stmtUser->fetchColumn();
            if ($realId) {
                $idCoordinador = (int)$realId;
            }
        }

        $conditions = [];
        $binds = [];

        if ($search) {
            $conditions[] = "(m.nombre LIKE :search1 OR m.sigla LIKE :search2 OR c.nombre LIKE :search3)";
            $binds[':search1'] = "%$search%";
            $binds[':search2'] = "%$search%";
            $binds[':search3'] = "%$search%";
        }

        if ($idCoordinador) {
            $conditions[] = "c.idCoordinador = :idCoordinador";
            $binds[':idCoordinador'] = $idCoordinador;
        }

        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        // Conteo total
        $total = $this->db->query("SELECT COUNT(*) FROM Modulos")->fetchColumn();

        // Conteo filtrado
        $sqlCount = "SELECT COUNT(DISTINCT m.idModulo) 
                     FROM Modulos m
                     LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                     LEFT JOIN Cursos cur ON mc.idCurso = cur.idCurso
                     LEFT JOIN Ciclos c ON cur.idCiclo = c.idCiclo
                     $where";
        $stmtF = $this->db->prepare($sqlCount);
        foreach ($binds as $key => $val) {
            $stmtF->bindValue($key, $val);
        }
        $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // Datos
        $sql = "SELECT m.idModulo as id, m.nombre, m.sigla, m.color, 
                       MIN(c.idCiclo) as idCiclo,
                       GROUP_CONCAT(DISTINCT CONCAT(c.siglas, ' - ', c.nombre) SEPARATOR ', ') as cicloCompleto
                FROM Modulos m
                LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                LEFT JOIN Cursos cur ON mc.idCurso = cur.idCurso
                LEFT JOIN Ciclos c ON cur.idCiclo = c.idCiclo
                $where 
                GROUP BY m.idModulo, m.nombre, m.sigla, m.color
                ORDER BY m.nombre
                LIMIT :start, :length";
        
        $stmt = $this->db->prepare($sql);
        foreach ($binds as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':start', $start, PDO::PARAM_INT);
        $stmt->bindValue(':length', $length, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            "draw" => (int)($params['draw'] ?? 0),
            "recordsTotal" => (int)$total,
            "recordsFiltered" => (int)$totalFiltrados,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    }
}
