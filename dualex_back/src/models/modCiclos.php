<?php

/**
 * Modelo para la gestión de Ciclo Formativos.
 * Incluye lógica transaccional para operaciones en cascada.
 * 
 * @package Dualex\Models
 */
class ModCiclos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Recupera todos los Ciclo formativos junto a sus coordinadores.
     * 
     * @return array Array asociativo con el listado de Ciclo.
     */
    public function listar() {
        $sql = "SELECT idCiclo as id, c.nombre, siglas, c.idCoordinador, 
                       grado, CONCAT('1º ', siglas, ', 2º ', siglas) AS Curso,
                       u.nombre as nombreCoordinador, apellidos as apellidosCoordinador 
                FROM Ciclo c
                LEFT JOIN Coordinador co ON c.idCoordinador = co.idCoordinador
                LEFT JOIN Usuario u ON co.idCoordinador = u.idUsuario
                ORDER BY c.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un ciclo específico por su identificador único.
     * Además, carga los Curso asociados (1º y 2º) dentro del resultado.
     * 
     * @param int $id Identificador del ciclo.
     * @return array|false Datos del ciclo y sus Curso.
     */
    public function obtener($id) {
        $sql = "SELECT idCiclo as id, nombre, siglas, idCoordinador FROM Ciclo WHERE idCiclo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $ciclo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ciclo) {
            $ciclo['cursos_lista'] = $this->obtenerCursos($id);
        }

        return $ciclo;
    }

    /**
     * Obtiene los Curso que pertenecen a un ciclo formativo específico.
     * 
     * @param int $idCiclo ID del ciclo.
     * @return array Listado de Curso.
     */
    private function obtenerCursos($idCiclo) {
        $sql = "SELECT * FROM Curso WHERE idCiclo = :idCiclo";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idCiclo', $idCiclo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Registra un nuevo ciclo formativo.
     * Implementa una transacción para asegurar la integridad de la base de datos.
     * 
     * @param array $datos Datos del ciclo (nombre, siglas, idCoordinador, grado).
     * @return array Los datos completos del ciclo recién insertado.
     * @throws Exception Si ocurre un error en la transacción.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            // 1. Insertar el Ciclo
            $sql = "INSERT INTO Ciclo (nombre, siglas, idCoordinador, grado) VALUES (:nombre, :siglas, :idCoordinador, :grado)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':nombre'        => $datos['nombre'],
                ':siglas'        => $datos['siglas'],
                ':idCoordinador' => $datos['idCoordinador'] ?? null,
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

    /**
     * Actualiza un ciclo formativo y aplica el cambio de siglas en cascada a sus Curso.
     * 
     * @param int $id Identificador del ciclo.
     * @param array $datos Datos actualizados.
     * @return array Datos del ciclo tras la modificación.
     * @throws Exception Si la transacción falla.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            // 1. Actualizar el Ciclo
            $sql = "UPDATE Ciclo SET nombre = :nombre, siglas = :siglas, idCoordinador = :idCoordinador, grado = :grado WHERE idCiclo = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'            => $id,
                ':nombre'        => $datos['nombre'],
                ':siglas'        => $datos['siglas'],
                ':idCoordinador' => $datos['idCoordinador'] ?? null,
                ':grado'         => $datos['grado']
            ]);

            // 2. Actualizar los nombres de los Curso asociados (1º y 2º)
            $siglas = $datos['siglas'];
            $sqlCursos = "UPDATE Curso SET nombre = CASE 
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

    /**
     * Elimina un ciclo y todos sus Curso asociados de forma manual mediante transacción.
     * 
     * @param int $id ID del ciclo a borrar.
     * @return bool True si la operación se completó con éxito.
     * @throws Exception Si falla la eliminación en cascada.
     */
    public function eliminar($id) {
        try {
            $this->db->beginTransaction();

            // 1. Borrar los Curso asociados primero (ya que la DB no tiene ON DELETE CASCADE en esta relación)
            $sqlCursos = "DELETE FROM Curso WHERE idCiclo = :id";
            $stmtCursos = $this->db->prepare($sqlCursos);
            $stmtCursos->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtCursos->execute();

            // 2. Borrar el ciclo
            $sqlCiclo = "DELETE FROM Ciclo WHERE idCiclo = :id";
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

    public function vincularCoordinador($idCiclo, $idCoordinador) {
        try {
            // Asegurar que el profesor exista en la tabla Coordinador
            $check = $this->db->prepare("SELECT 1 FROM Coordinador WHERE idCoordinador = :id");
            $check->execute([':id' => $idCoordinador]);
            if (!$check->fetch()) {
                $this->db->prepare("INSERT INTO Coordinador (idCoordinador) VALUES (:id)")->execute([':id' => $idCoordinador]);
            }

            $sql = "UPDATE Ciclo SET idCoordinador = :idCoordinador WHERE idCiclo = :idCiclo";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([':idCoordinador' => $idCoordinador, ':idCiclo' => $idCiclo]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new InvalidArgumentException('Ese coordinador ya está asignado a otro ciclo.', 23000);
            }
            throw $e;
        }
    }

    /**
     * Proporciona la estructura y el filtrado paginado para el plugin DataTables en la vista.
     * 
     * @param array $params Parámetros HTTP GET/POST enviados por DataTables.
     * @return array Estructura estandarizada con `draw`, `recordsTotal`, etc.
     */
    public function obtenerDataTables($params) {
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;
        $search = $params['search']['value'] ?? '';

        $where = "";
        $binds = [];
        if ($search) {
            $where = "WHERE c.nombre LIKE :search1 OR c.siglas LIKE :search2 OR c.grado LIKE :search3 OR CONCAT('1º ', c.siglas, ', 2º ', c.siglas) LIKE :search4";
            $binds[':search1'] = "%$search%";
            $binds[':search2'] = "%$search%";
            $binds[':search3'] = "%$search%";
            $binds[':search4'] = "%$search%";
        }

        $total = $this->db->query("SELECT COUNT(*) FROM Ciclo")->fetchColumn();

        $stmtF = $this->db->prepare("SELECT COUNT(*) FROM Ciclo c $where");
        foreach ($binds as $key => $val) {
            $stmtF->bindValue($key, $val);
        }
        $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // 2.5. Ordenación dinámica
        $orderBy = " ORDER BY c.nombre";
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = isset($params['order'][0]['dir']) && strtolower($params['order'][0]['dir']) === 'desc' ? 'DESC' : 'ASC';
            
            $columnsMap = [
                0 => 'c.nombre',
                1 => 'c.siglas',
                2 => 'c.grado',
                3 => 'u.nombre'
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        $sql = "SELECT idCiclo as id, c.nombre, siglas, c.idCoordinador, 
                       grado, CONCAT('1º ', siglas, ', 2º ', siglas) AS Curso,
                       u.nombre as nombreCoordinador, apellidos as apellidosCoordinador 
                FROM Ciclo c
                LEFT JOIN Coordinador co ON c.idCoordinador = co.idCoordinador
                LEFT JOIN Usuario u ON co.idCoordinador = u.idUsuario
                $where 
                $orderBy
                LIMIT :start, :length";
        
        $stmt = $this->db->prepare($sql);
        foreach ($binds as $key => $val) {
            $stmt->bindValue($key, $val);
        }
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
