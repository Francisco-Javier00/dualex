<?php
namespace Dualex\Models;

use Exception;
use PDO;
use PDOException;
use Dualex\Core\ConexionDB;

/**
 * File-level docblock for modActividades.php
 * 
 */
/**
 * Modelo para la gestión de Actividades en la base de datos.
 * Proporciona métodos CRUD para el catálogo maestro de actividades,
 * incluyendo su vinculación con múltiples módulos formativos de forma atómica.
 * 
 */
class ModActividades {
    private $conn;
    private $table_name = "Actividad";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Valida los datos recibidos de la petición.
     * 
     * @param array $datos Datos a validar.
     * @return array Lista de mensajes de error de validación (vacía si es válido).
     */
    public function validar($datos) {
        $errores = [];

        // Validación de título obligatorio y longitud (5 - 60 caracteres)
        if (!isset($datos['titulo']) || empty(trim($datos['titulo']))) {
            $errores[] = "El título de la actividad es obligatorio.";
        } else {
            $len = mb_strlen(trim($datos['titulo']), 'UTF-8');
            if ($len < 5 || $len > 255) {
                $errores[] = "El título debe tener entre 5 y 255 caracteres.";
            }
        }

        // Validación de descripción obligatoria (máximo 255 caracteres)
        if (!isset($datos['descripcion']) || empty(trim($datos['descripcion']))) {
            $errores[] = "La descripción de la actividad es obligatoria.";
        } else {
            if (mb_strlen(trim($datos['descripcion']), 'UTF-8') > 255) {
                $errores[] = "La descripción no puede superar los 255 caracteres.";
            }
        }

        // Validación de módulos asociados (mínimo 1 módulo obligatorio)
        if (!isset($datos['idModulos']) || !is_array($datos['idModulos']) || empty($datos['idModulos'])) {
            $errores[] = "Debe asociar al menos un módulo formativo a la actividad.";
        }

        return $errores;
    }

    /**
     * Obtiene el listado completo de actividades con la concatenación de nombres e IDs de módulos.
     * Si se proporciona un idAlumno, filtra las actividades para mostrar solo aquellas 
     * cuyo módulo esté asociado a un curso del mismo ciclo que el curso actual del alumno.
     * 
     * @param int|null $idAlumno ID del alumno para filtrar por ciclo (opcional).
     * @return array Lista de actividades.
     */
    public function listar($idAlumno = null) {
        $where = "";
        $binds = [];
        
        if ($idAlumno) {
             $where = " WHERE EXISTS (
                 SELECT 1 FROM Modulo_Actividad inner_ma
                 JOIN Modulo_Curso inner_mc ON inner_ma.idModulo = inner_mc.idModulo
                 JOIN Curso inner_cur ON inner_mc.idCurso = inner_cur.idCurso
                 WHERE inner_ma.idActividad = a.idActividad 
                 AND inner_cur.idCiclo = (
                     SELECT cur_alum.idCiclo 
                     FROM Alumno al_inner
                     JOIN Curso cur_alum ON al_inner.idCurso = cur_alum.idCurso
                     WHERE al_inner.idAlumno = :idAlumno
                     LIMIT 1
                 )
             )";
             $binds[':idAlumno'] = (int)$idAlumno;
        }

        $query = "SELECT a.idActividad as id, a.titulo, a.descripcion, 
                         IFNULL(GROUP_CONCAT(m.sigla SEPARATOR ', '), 'Sin módulos') as modulo,
                         IFNULL(GROUP_CONCAT(m.idModulo SEPARATOR ','), '') as idModulos
                  FROM " . $this->table_name . " a
                  LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                  LEFT JOIN Modulo m ON ma.idModulo = m.idModulo
                  $where
                  GROUP BY a.idActividad
                  ORDER BY a.idActividad DESC";
                  
        $stmt = $this->conn->prepare($query);
        foreach ($binds as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene una actividad específica por su ID.
     */
    public function obtener($id) {
        $query = "SELECT a.idActividad as id, a.titulo, a.descripcion, 
                         IFNULL(GROUP_CONCAT(m.sigla SEPARATOR ', '), 'Sin módulos') as modulo,
                         IFNULL(GROUP_CONCAT(m.idModulo SEPARATOR ','), '') as idModulos
                  FROM " . $this->table_name . " a
                  LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                  LEFT JOIN Modulo m ON ma.idModulo = m.idModulo
                  WHERE a.idActividad = :id
                  GROUP BY a.idActividad";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene los datos paginados, ordenados y filtrados para renderizar con DataTables en frontend.
     * 
     * @param array $params Parámetros enviados por la librería DataTables del cliente.
     * @return array JSON estructurado para el DataTable de Angular.
     */
    public function obtenerDataTables($params) {
        $draw = isset($params['draw']) ? (int)$params['draw'] : 1;
        $start = isset($params['start']) ? (int)$params['start'] : 0;
        $length = isset($params['length']) ? (int)$params['length'] : 10;
        $searchVal = isset($params['search']['value']) ? trim($params['search']['value']) : '';
        $rol = $params['rol'] ?? '';
        $email = $params['email'] ?? '';

        $binds = [];
        $whereRol = "";

        if (($rol === 'COORDINADOR' || $rol === 'COORDINADOR_GENERAL') && !empty($email)) {
            $whereRol = " WHERE EXISTS (
                            SELECT 1 
                            FROM Modulo_Actividad ma2
                            JOIN Modulo_Curso mc ON ma2.idModulo = mc.idModulo
                            JOIN Curso cu ON mc.idCurso = cu.idCurso
                            JOIN Ciclo c ON cu.idCiclo = c.idCiclo
                            JOIN Usuario u ON c.idCoordinador = u.idUsuario
                            WHERE ma2.idActividad = a.idActividad 
                              AND u.correo = :email
                          )";
            $binds[':email'] = $email;
        } elseif ($rol === 'PROFESOR' && !empty($email)) {
            $whereRol = " WHERE EXISTS (
                            SELECT 1 
                            FROM Modulo_Actividad ma2
                            JOIN Modulo_Profesor mp ON ma2.idModulo = mp.idModulo
                            JOIN Usuario u ON mp.idProfesor = u.idUsuario
                            WHERE ma2.idActividad = a.idActividad 
                              AND u.correo = :email
                          )";
            $binds[':email'] = $email;
        }


        // 1. Obtener el número total de registros sin filtrar
        $queryTotal = "SELECT COUNT(*) as total FROM " . $this->table_name . " a " . $whereRol;
        $stmtTotal = $this->conn->prepare($queryTotal);
        if (!empty($email) && strpos($whereRol, ':email') !== false) {
            $stmtTotal->bindValue(':email', $email, PDO::PARAM_STR);
        }
        $stmtTotal->execute();
        $totalRecords = (int)$stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Construir la consulta principal con filtros de búsqueda
        $whereClause = "";
        if ($searchVal !== '') {
            $whereClause = " HAVING (a.titulo LIKE :search1 OR a.descripcion LIKE :search2 OR modulo LIKE :search3)";
            $binds[':search1'] = '%' . $searchVal . '%';
            $binds[':search2'] = '%' . $searchVal . '%';
            $binds[':search3'] = '%' . $searchVal . '%';
        }

        // 3. Cláusula de ordenación dinámica
        $orderColumnIndex = isset($params['order'][0]['column']) ? (int)$params['order'][0]['column'] : 0;
        $orderDir = isset($params['order'][0]['dir']) && strtolower($params['order'][0]['dir']) === 'desc' ? 'DESC' : 'ASC';
        
        $columnsMap = [
            0 => 'a.titulo',
            1 => 'modulo',
            2 => 'a.descripcion'
        ];
        
        $orderField = isset($columnsMap[$orderColumnIndex]) ? $columnsMap[$orderColumnIndex] : 'a.idActividad';

        $query = "SELECT a.idActividad as id, a.titulo, a.descripcion, 
                         IFNULL(GROUP_CONCAT(m.sigla SEPARATOR ', '), 'Sin módulos') as modulo,
                         IFNULL(GROUP_CONCAT(m.idModulo SEPARATOR ','), '') as idModulos
                  FROM " . $this->table_name . " a
                  LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                  LEFT JOIN Modulo m ON ma.idModulo = m.idModulo
                  $whereRol
                  GROUP BY a.idActividad
                  $whereClause
                  ORDER BY $orderField $orderDir
                  LIMIT :start, :length";

        $stmt = $this->conn->prepare($query);

        // Vincular los parámetros de búsqueda si existen
        foreach ($binds as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_STR);
        }

        // Vincular paginación (PDO::PARAM_INT requerido para LIMIT)
        $stmt->bindValue(':start', $start, PDO::PARAM_INT);
        $stmt->bindValue(':length', $length, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Calcular el total de registros filtrados
        $filteredRecords = $totalRecords;
        if ($searchVal !== '') {
            $queryFiltered = "SELECT COUNT(*) as total FROM (
                                SELECT a.idActividad, a.titulo, a.descripcion, IFNULL(GROUP_CONCAT(m.sigla SEPARATOR ', '), 'Sin módulos') as modulo
                                FROM " . $this->table_name . " a
                                LEFT JOIN Modulo_Actividad ma ON a.idActividad = ma.idActividad
                                LEFT JOIN Modulo m ON ma.idModulo = m.idModulo
                                $whereRol
                                GROUP BY a.idActividad
                                HAVING (a.titulo LIKE :search1 OR a.descripcion LIKE :search2 OR modulo LIKE :search3)
                              ) as sub";
            $stmtFiltered = $this->conn->prepare($queryFiltered);
            if (!empty($email) && strpos($whereRol, ':email') !== false) {
                $stmtFiltered->bindValue(':email', $email, PDO::PARAM_STR);
            }
            $stmtFiltered->bindValue(':search1', '%' . $searchVal . '%', PDO::PARAM_STR);
            $stmtFiltered->bindValue(':search2', '%' . $searchVal . '%', PDO::PARAM_STR);
            $stmtFiltered->bindValue(':search3', '%' . $searchVal . '%', PDO::PARAM_STR);
            $stmtFiltered->execute();
            $filteredRecords = (int)$stmtFiltered->fetch(PDO::FETCH_ASSOC)['total'];
        }

        return [
            "draw" => $draw,
            "recordsTotal" => $totalRecords,
            "recordsFiltered" => $filteredRecords,
            "data" => $data
        ];
    }

    /**
     * Crea una nueva actividad y asocia sus módulos correspondientes bajo transacción atómica.
     * 
     * @param array $datos Datos de la actividad (titulo, descripcion, idModulos, idCoordinador).
     * @return array Estado de la transacción.
     */
    public function crear($datos) {
        try {
            $this->conn->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " (titulo, descripcion, idCoordinador) VALUES (:titulo, :descripcion, :idCoordinador)";
            $stmt = $this->conn->prepare($query);
            
            $idCoordinador = $datos['idCoordinador'] ?? null;
            $stmt->bindParam(":titulo", $datos['titulo']);
            $stmt->bindParam(":descripcion", $datos['descripcion']);
            $stmt->bindParam(":idCoordinador", $idCoordinador);
            $stmt->execute();

            $idActividad = $this->conn->lastInsertId();

            // Insertar asociaciones de la tabla intermedia
            $queryRel = "INSERT INTO Modulo_Actividad (idActividad, idModulo) VALUES (:idActividad, :idModulo)";
            $stmtRel = $this->conn->prepare($queryRel);

            foreach ($datos['idModulos'] as $idModulo) {
                $stmtRel->bindValue(":idActividad", $idActividad, PDO::PARAM_INT);
                $stmtRel->bindValue(":idModulo", $idModulo, PDO::PARAM_INT);
                $stmtRel->execute();
            }

            $this->conn->commit();
            return ["status" => "success", "id" => $idActividad, "message" => "Actividad y sus asociaciones creadas exitosamente."];

        } catch (Exception $e) {
            $this->conn->rollBack();
            throw new Exception("Error al insertar actividad transaccionalmente: " . $e->getMessage());
        }
    }

    /**
     * Actualiza la información básica de la actividad y sincroniza sus módulos asociados bajo transacción.
     */
    public function actualizar($id, $datos) {
        try {
            $this->conn->beginTransaction();

            // 1. Actualizar campos de la tabla principal
            $query = "UPDATE " . $this->table_name . " 
                      SET titulo = :titulo, descripcion = :descripcion, idCoordinador = :idCoordinador 
                      WHERE idActividad = :id";
            $stmt = $this->conn->prepare($query);
            
            $idCoordinador = $datos['idCoordinador'] ?? null;
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->bindParam(":titulo", $datos['titulo']);
            $stmt->bindParam(":descripcion", $datos['descripcion']);
            $stmt->bindParam(":idCoordinador", $idCoordinador);
            $stmt->execute();

            // 2. Eliminar relaciones intermedias previas
            $queryDel = "DELETE FROM Modulo_Actividad WHERE idActividad = :id";
            $stmtDel = $this->conn->prepare($queryDel);
            $stmtDel->bindParam(":id", $id, PDO::PARAM_INT);
            $stmtDel->execute();

            // 3. Insertar las nuevas relaciones seleccionadas en el formulario
            $queryRel = "INSERT INTO Modulo_Actividad (idActividad, idModulo) VALUES (:idActividad, :idModulo)";
            $stmtRel = $this->conn->prepare($queryRel);

            foreach ($datos['idModulos'] as $idModulo) {
                $stmtRel->bindValue(":idActividad", $id, PDO::PARAM_INT);
                $stmtRel->bindValue(":idModulo", $idModulo, PDO::PARAM_INT);
                $stmtRel->execute();
            }

            $this->conn->commit();
            return ["status" => "success", "message" => "Actividad y asignaturas actualizadas correctamente."];

        } catch (Exception $e) {
            $this->conn->rollBack();
            throw new Exception("Error al actualizar actividad transaccionalmente: " . $e->getMessage());
        }
    }

    /**
     * Elimina una actividad del catálogo y limpia automáticamente sus relaciones.
     */
    public function eliminar($id) {
        try {
            $this->conn->beginTransaction();

            // Eliminar dependencias
            $queryDel = "DELETE FROM Modulo_Actividad WHERE idActividad = :id";
            $stmtDel = $this->conn->prepare($queryDel);
            $stmtDel->bindParam(":id", $id, PDO::PARAM_INT);
            $stmtDel->execute();

            // Eliminar maestro
            $query = "DELETE FROM " . $this->table_name . " WHERE idActividad = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
}
?>
