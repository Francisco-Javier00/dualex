<?php
namespace Dualex\Models;

use Exception;
use PDO;
use PDOException;
use Dualex\Core\ConexionDB;

/**
 * File-level docblock for modModulos.php
 * 
 */
/**
 * Modelo para la gestión de Módulos (Asignaturas).
 * Gestiona relaciones complejas entre módulos, Curso y profesores.
 * 
 */
class ModModulos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Devuelve todos los módulos únicos disponibles en el sistema con información
     * sobre a qué ciclo pertenecen (utiliza LEFT JOIN).
     * 
     * @return array Listado de módulos.
     */
    public function listar() {
        // Usamos COALESCE para asegurar que el campo ciclo no sea NULL y no rompa el frontend
        $sql = "SELECT 
                    m.idModulo as id, 
                    m.nombre, 
                    m.sigla as siglas, 
                    m.color, 
                    IFNULL(c.siglas, 'S/C') as ciclo
                FROM Modulo m
                LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                LEFT JOIN Curso cur ON mc.idCurso = cur.idCurso
                LEFT JOIN Ciclo c ON cur.idCiclo = c.idCiclo
                ORDER BY m.nombre";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Eliminamos duplicados en PHP para mayor control
        $modulosUnicos = [];
        foreach ($resultados as $row) {
            $id = $row['id'];
            if (!isset($modulosUnicos[$id])) {
                $modulosUnicos[$id] = $row;
                $modulosUnicos[$id]['ciclos_list'] = [$row['ciclo']];
            } else {
                if (!in_array($row['ciclo'], $modulosUnicos[$id]['ciclos_list'])) {
                    $modulosUnicos[$id]['ciclos_list'][] = $row['ciclo'];
                }
            }
        }

        foreach ($modulosUnicos as &$mod) {
            $mod['ciclo'] = implode(',', $mod['ciclos_list']);
            unset($mod['ciclos_list']);
        }

        return array_values($modulosUnicos);
    }

    /**
     * Obtiene los módulos que pertenecen a un ciclo formativo específico.
     * 
     * @param string $siglasCiclo Acrónimo del ciclo a buscar.
     * @return array Listado de módulos filtrados.
     */
    public function listarPorCiclo($siglasCiclo) {
        $siglasCiclo = strtoupper(trim((string)$siglasCiclo));

        $sql = "SELECT DISTINCT
                    m.idModulo as id,
                    m.nombre,
                    m.sigla as siglas,
                    c.siglas as ciclo
                FROM Modulo m
                JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                JOIN Curso cur ON mc.idCurso = cur.idCurso
                JOIN Ciclo c ON cur.idCiclo = c.idCiclo
                WHERE c.siglas = :siglasCiclo
                ORDER BY m.nombre";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':siglasCiclo' => $siglasCiclo]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve la información de un módulo mediante su ID.
     * Incluye una subconsulta para resolver a qué ciclo está vinculado de forma rápida.
     * 
     * @param int $id Identificador del módulo.
     * @return array|false Datos del módulo.
     */
    public function obtener($id) {
        $sql = "SELECT m.idModulo as id, m.nombre, m.sigla, m.color, 
                       (SELECT cur.idCiclo FROM Modulo_Curso mc 
                        JOIN Curso cur ON mc.idCurso = cur.idCurso 
                        WHERE mc.idModulo = m.idModulo LIMIT 1) as idCiclo,
                       (SELECT mc.idCurso FROM Modulo_Curso mc 
                        WHERE mc.idModulo = m.idModulo LIMIT 1) as idCurso,
                       (SELECT GROUP_CONCAT(mc2.idCurso SEPARATOR ',') FROM Modulo_Curso mc2 
                        WHERE mc2.idModulo = m.idModulo) as cursos,
                       (SELECT GROUP_CONCAT(DISTINCT cur2.siglas SEPARATOR ',') FROM Modulo_Curso mc3 
                        JOIN Curso c2 ON mc3.idCurso = c2.idCurso
                        JOIN Ciclo cur2 ON c2.idCiclo = cur2.idCiclo
                        WHERE mc3.idModulo = m.idModulo) as ciclos
                FROM Modulo m 
                WHERE m.idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Recupera todos los módulos que imparte un profesor específico en base a su correo electrónico.
     * 
     * @param string $emailProfesor Correo electrónico del usuario (profesor).
     * @return array Módulos del profesor.
     */
    public function obtenerModulosProfesor($emailProfesor) {
        $sql = "SELECT DISTINCT m.idModulo, m.nombre, m.sigla, m.color,
                       c.idCurso, c.nombre as nombreCurso,
                       (SELECT COUNT(DISTINCT mac.idAlumno) FROM Modulo_Alumno_Cursa mac 
                        JOIN Alumno al ON mac.idAlumno = al.idAlumno
                        WHERE mac.idModulo = m.idModulo AND al.idCurso = c.idCurso) as numAlumnos,
                       (SELECT COUNT(DISTINCT mtr.idTarea) FROM Modulo_Tarea_Revision mtr 
                        JOIN Tarea t ON mtr.idTarea = t.idTarea 
                        JOIN Alumno al2 ON t.idAlumno = al2.idAlumno 
                        WHERE mtr.idModulo = m.idModulo AND al2.idCurso = c.idCurso) as numActividades
                FROM Modulo m
                JOIN Modulo_Profesor mp ON m.idModulo = mp.idModulo
                JOIN Profesor p ON mp.idProfesor = p.idProfesor
                JOIN Usuario u ON p.idProfesor = u.idUsuario
                JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                JOIN Curso c ON mc.idCurso = c.idCurso
                WHERE u.correo = :emailProfesor
                ORDER BY m.nombre, c.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':emailProfesor', $emailProfesor, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Registra un nuevo módulo y lo vincula con los Curso de un ciclo determinado mediante transacción.
     * 
     * @param array $datos Datos del módulo (nombre, sigla, color, idCiclo).
     * @return array Datos del módulo tras ser creado.
     * @throws Exception Si ocurre un fallo en la DB.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO Modulo (nombre, sigla, color) VALUES (:nombre, :sigla, :color)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':nombre' => $datos['nombre'],
                ':sigla' => $datos['sigla'],
                ':color'  => $datos['color']
            ]);
            $idModulo = $this->db->lastInsertId();

            // Vincular con el curso seleccionado o fallback a todos los Curso del ciclo
            if (!empty($datos['idCurso'])) {
                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                $stmtRel->execute([':idModulo' => $idModulo, ':idCurso' => $datos['idCurso']]);
            } else if (isset($datos['idCiclo'])) {
                $sqlCursos = "SELECT idCurso FROM Curso WHERE idCiclo = :idCiclo";
                $stmtCursos = $this->db->prepare($sqlCursos);
                $stmtCursos->execute([':idCiclo' => $datos['idCiclo']]);
                $cursos = $stmtCursos->fetchAll(PDO::FETCH_ASSOC);

                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                foreach ($cursos as $curso) {
                    $stmtRel->execute([':idModulo' => $idModulo, ':idCurso' => $curso['idCurso']]);
                }
            }

            // Asignar automáticamente el módulo a los alumnos del curso(s)
            $sqlAlumnos = "INSERT IGNORE INTO Modulo_Alumno_Cursa (idModulo, idAlumno)
                           SELECT mc.idModulo, a.idAlumno 
                           FROM Modulo_Curso mc
                           JOIN Alumno a ON mc.idCurso = a.idCurso
                           WHERE mc.idModulo = :idModulo";
            $stmtAlumnos = $this->db->prepare($sqlAlumnos);
            $stmtAlumnos->execute([':idModulo' => $idModulo]);

            $this->db->commit();
            return $this->obtener($idModulo);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Actualiza la información de un módulo existente.
     * Borra y recrea las relaciones con Curso si se especifica un cambio de ciclo.
     * 
     * @param int $id Identificador del módulo.
     * @param array $datos Nuevos datos del módulo.
     * @return array Datos del módulo actualizados.
     * @throws Exception En caso de error de transacción.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            $sql = "UPDATE Modulo SET nombre = :nombre, sigla = :sigla, color = :color WHERE idModulo = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'     => $id,
                ':nombre' => $datos['nombre'],
                ':sigla' => $datos['sigla'],
                ':color'  => $datos['color']
            ]);

            // Actualizar vínculos con Curso
            if (!empty($datos['idCurso'])) {
                // Borrar anteriores
                $this->db->prepare("DELETE FROM Modulo_Curso WHERE idModulo = :id")->execute([':id' => $id]);

                // Insertar nuevo
                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                $stmtRel->execute([':idModulo' => $id, ':idCurso' => $datos['idCurso']]);
            } else if (isset($datos['idCiclo'])) {
                // Borrar anteriores
                $this->db->prepare("DELETE FROM Modulo_Curso WHERE idModulo = :id")->execute([':id' => $id]);

                // Insertar nuevos (fallback)
                $sqlCursos = "SELECT idCurso FROM Curso WHERE idCiclo = :idCiclo";
                $stmtCursos = $this->db->prepare($sqlCursos);
                $stmtCursos->execute([':idCiclo' => $datos['idCiclo']]);
                $cursos = $stmtCursos->fetchAll(PDO::FETCH_ASSOC);

                $sqlRel = "INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES (:idModulo, :idCurso)";
                $stmtRel = $this->db->prepare($sqlRel);
                foreach ($cursos as $curso) {
                    $stmtRel->execute([':idModulo' => $id, ':idCurso' => $curso['idCurso']]);
                }
            }

            // Actualizar alumnos asignados según los nuevos cursos vinculados
            $sqlDeleteAlumnos = "DELETE mac FROM Modulo_Alumno_Cursa mac
                                 LEFT JOIN (
                                     SELECT mc.idModulo, a.idAlumno 
                                     FROM Modulo_Curso mc
                                     JOIN Alumno a ON mc.idCurso = a.idCurso
                                     WHERE mc.idModulo = :idModulo
                                 ) as validos ON mac.idModulo = validos.idModulo AND mac.idAlumno = validos.idAlumno
                                 WHERE mac.idModulo = :idModulo AND validos.idAlumno IS NULL";
            $this->db->prepare($sqlDeleteAlumnos)->execute([':idModulo' => $id]);

            $sqlAlumnos = "INSERT IGNORE INTO Modulo_Alumno_Cursa (idModulo, idAlumno)
                           SELECT mc.idModulo, a.idAlumno 
                           FROM Modulo_Curso mc
                           JOIN Alumno a ON mc.idCurso = a.idCurso
                           WHERE mc.idModulo = :idModulo";
            $stmtAlumnos = $this->db->prepare($sqlAlumnos);
            $stmtAlumnos->execute([':idModulo' => $id]);

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Elimina permanentemente un módulo del sistema.
     * 
     * @param int $id ID del módulo.
     * @return bool Estado de la eliminación.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Modulo WHERE idModulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Proveedor de datos para la tabla DataTables de la vista.
     * Implementa lógica de paginación, búsqueda en múltiples campos (nombre, sigla, ciclo)
     * y filtrado automático de seguridad según el rol de Coordinador.
     * 
     * @param array $params Parámetros de petición DataTables.
     * @return array Estructura estandarizada con `draw` y la `data` paginada.
     */
    public function obtenerDataTables($params) {
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';
        
        $idCoordinador = null;
        $email = $params['email'] ?? null;

        // Resolvemos el idCoordinador real de la base de datos a partir del correo
        if (!empty($email)) {
            $stmtUser = $this->db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :correo LIMIT 1");
            $stmtUser->execute([':correo' => $email]);
            $realId = $stmtUser->fetchColumn();
            if ($realId) {
                $idCoordinador = (int)$realId;
            }
        }

        $conditions = [];
        $binds = [];

        if ($search) {
            $conditions[] = "(m.nombre LIKE :search1 OR m.sigla LIKE :search2 OR c.nombre LIKE :search3 OR c.siglas LIKE :search4 OR cur.nombre LIKE :search5)";
            $binds[':search1'] = "%$search%";
            $binds[':search2'] = "%$search%";
            $binds[':search3'] = "%$search%";
            $binds[':search4'] = "%$search%";
            $binds[':search5'] = "%$search%";
        }

        if ($idCoordinador) {
            $conditions[] = "c.idCoordinador = :idCoordinador";
            $binds[':idCoordinador'] = $idCoordinador;
        }

        $idsCursos = $params['idsCursos'] ?? [];
        if (!empty($idsCursos) && is_array($idsCursos)) {
            $idsValidados = array_filter(array_map('intval', $idsCursos));
            if (!empty($idsValidados)) {
                $conditions[] = "cur.idCurso IN (" . implode(',', $idsValidados) . ")";
            }
        }

        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        // Conteo total
        $total = $this->db->query("SELECT COUNT(*) FROM Modulo")->fetchColumn();

        // Conteo filtrado
        $sqlCount = "SELECT COUNT(DISTINCT m.idModulo) 
                     FROM Modulo m
                     LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                     LEFT JOIN Curso cur ON mc.idCurso = cur.idCurso
                     LEFT JOIN Ciclo c ON cur.idCiclo = c.idCiclo
                     $where";
        $stmtF = $this->db->prepare($sqlCount);
        foreach ($binds as $key => $val) {
            $stmtF->bindValue($key, $val);
        }
        $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // 2.5. Ordenación dinámica
        $orderBy = " ORDER BY m.nombre";
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = isset($params['order'][0]['dir']) && strtolower($params['order'][0]['dir']) === 'desc' ? 'DESC' : 'ASC';
            
            $columnsMap = [
                0 => 'm.nombre',
                1 => 'm.sigla'
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        // Datos
        $sql = "SELECT m.idModulo as id, m.nombre, m.sigla, m.color, 
                       MIN(c.idCiclo) as idCiclo,
                       MIN(cur.idCurso) as idCurso,
                       GROUP_CONCAT(DISTINCT CONCAT(siglas, ' - ', c.nombre) SEPARATOR ', ') as cicloCompleto,
                       GROUP_CONCAT(DISTINCT cur.nombre SEPARATOR ', ') as cursoCompleto,
                       GROUP_CONCAT(DISTINCT CONCAT(u.nombre, ' ', u.apellidos) SEPARATOR ', ') as profesoresImparten
                  FROM Modulo m
                  LEFT JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                  LEFT JOIN Curso cur ON mc.idCurso = cur.idCurso
                  LEFT JOIN Ciclo c ON cur.idCiclo = c.idCiclo
                  LEFT JOIN Modulo_Profesor mp ON m.idModulo = mp.idModulo
                  LEFT JOIN Usuario u ON mp.idProfesor = u.idUsuario
                  $where 
                  GROUP BY m.idModulo, m.nombre, m.sigla, m.color
                  $orderBy
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

    public function vincularProfesores($idModulo, $profesoresIds) {
        try {
            $this->db->beginTransaction();

            // Borrar vínculos anteriores
            $stmtDel = $this->db->prepare("DELETE FROM Modulo_Profesor WHERE idModulo = :idModulo");
            $stmtDel->execute([':idModulo' => $idModulo]);

            // Insertar nuevos
            if (!empty($profesoresIds) && is_array($profesoresIds)) {
                $stmtIns = $this->db->prepare("INSERT INTO Modulo_Profesor (idModulo, idProfesor) VALUES (:idModulo, :idProfesor)");
                foreach ($profesoresIds as $idProfesor) {
                    $stmtIns->execute([':idModulo' => $idModulo, ':idProfesor' => $idProfesor]);
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
