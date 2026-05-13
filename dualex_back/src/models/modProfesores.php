<?php
/**
 * Modelo para la gestión de Profesores.
 */
class ModProfesores {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Obtiene el listado completo de profesores con sus módulos y ciclos asociados procesados en PHP.
     */
    public function listar() {
        $sql = "SELECT 
                    u.idUsuario as id, 
                    u.nombre, 
                    u.apellidos, 
                    u.correo,
                    c.idCoordinador
                FROM Usuarios u
                JOIN Profesor p ON u.idUsuario = p.idProfesor
                LEFT JOIN Coordinador c ON p.idProfesor = c.idCoordinador
                WHERE u.tipo = 'P'
                ORDER BY u.apellidos, u.nombre";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $profesores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($profesores as &$prof) {
            $this->hidratarRelaciones($prof);
        }

        return $profesores;
    }

    /**
     * Obtiene los datos detallados de un profesor por su ID.
     */
    public function obtener($id) {
        $sql = "SELECT 
                    u.idUsuario as id, 
                    u.nombre, 
                    u.apellidos, 
                    u.correo,
                    c.idCoordinador
                FROM Usuarios u
                JOIN Profesor p ON u.idUsuario = p.idProfesor
                LEFT JOIN Coordinador c ON p.idProfesor = c.idCoordinador
                WHERE u.idUsuario = :id AND u.tipo = 'P'";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $profesor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($profesor) {
            $this->hidratarRelaciones($profesor);
        }

        return $profesor;
    }

    /**
     * Crea un nuevo profesor en el sistema.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            $sqlU = "INSERT INTO Usuarios (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'P')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['correo']
            ]);
            $idUsuario = $this->db->lastInsertId();

            $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
            $stmtP = $this->db->prepare($sqlP);
            $stmtP->execute([':id' => $idUsuario]);

            if (strtoupper($datos['rol']) === 'COORDINADOR') {
                $sqlC = "INSERT INTO Coordinador (idCoordinador) VALUES (:id)";
                $stmtC = $this->db->prepare($sqlC);
                $stmtC->execute([':id' => $idUsuario]);
            }

            $this->db->commit();
            return $this->obtener($idUsuario);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Actualiza los datos de un profesor y gestiona su rol de coordinador.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            $sqlU = "UPDATE Usuarios SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':id'        => $id,
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['correo']
            ]);

            $esCoordinadorActual = $this->esCoordinador($id);
            $quiereSerCoordinador = strtoupper($datos['rol']) === 'COORDINADOR';

            if ($quiereSerCoordinador && !$esCoordinadorActual) {
                $sqlC = "INSERT INTO Coordinador (idCoordinador) VALUES (:id)";
                $this->db->prepare($sqlC)->execute([':id' => $id]);
            } elseif (!$quiereSerCoordinador && $esCoordinadorActual) {
                $sqlC = "DELETE FROM Coordinador WHERE idCoordinador = :id";
                $this->db->prepare($sqlC)->execute([':id' => $id]);
            }

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Elimina un profesor.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Usuarios WHERE idUsuario = :id AND tipo = 'P'";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Lógica para DataTables con búsqueda y paginado.
     */
    public function obtenerDataTables($params) {
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';

        // Conteo total
        $sqlTotal = "SELECT COUNT(*) as total FROM Usuarios WHERE tipo = 'P'";
        $stmtTotal = $this->db->prepare($sqlTotal);
        $stmtTotal->execute();
        $recordsTotal = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];

        // Consulta filtrada
        $where = "";
        $binds = [];
        if ($search) {
            $where = " AND (u.nombre LIKE :s OR u.apellidos LIKE :s OR u.correo LIKE :s)";
            $binds[':s'] = "%$search%";
        }

        $sqlFilter = "SELECT COUNT(*) as total FROM Usuarios u WHERE u.tipo = 'P'" . $where;
        $stmtFilter = $this->db->prepare($sqlFilter);
        foreach ($binds as $key => $val) $stmtFilter->bindValue($key, $val);
        $stmtFilter->execute();
        $recordsFiltered = $stmtFilter->fetch(PDO::FETCH_ASSOC)['total'];

        // Datos principales
        $sqlData = "SELECT 
                        u.idUsuario as id, 
                        u.nombre, 
                        u.apellidos, 
                        u.correo,
                        c.idCoordinador
                    FROM Usuarios u
                    JOIN Profesor p ON u.idUsuario = p.idProfesor
                    LEFT JOIN Coordinador c ON p.idProfesor = c.idCoordinador
                    WHERE u.tipo = 'P'" . $where . "
                    ORDER BY u.apellidos, u.nombre
                    LIMIT :start, :length";
        
        $stmtData = $this->db->prepare($sqlData);
        $stmtData->bindValue(':start', $start, PDO::PARAM_INT);
        $stmtData->bindValue(':length', $length, PDO::PARAM_INT);
        foreach ($binds as $key => $val) $stmtData->bindValue($key, $val);
        $stmtData->execute();
        $data = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // Hidratar relaciones en PHP para evitar GROUP_CONCAT y CASE
        foreach ($data as &$row) {
            $this->hidratarRelaciones($row);
        }

        return [
            "draw" => intval($params['draw'] ?? 0),
            "recordsTotal" => intval($recordsTotal),
            "recordsFiltered" => intval($recordsFiltered),
            "data" => $data
        ];
    }

    /**
     * Procesa las relaciones de módulos, ciclos y rol.
     */
    private function hidratarRelaciones(&$prof) {
        $id = $prof['id'];

        // 1. Determinar ROL (en lugar de CASE SQL)
        $prof['rol'] = (isset($prof['idCoordinador']) && $prof['idCoordinador'] !== null) ? 'COORDINADOR' : 'PROFESOR';
        unset($prof['idCoordinador']); // Limpiamos el ID auxiliar

        // 2. Obtener módulos (en lugar de GROUP_CONCAT)
        $sqlMod = "SELECT m.sigla FROM Modulos m 
                   JOIN Modulo_Profesor mp ON m.idModulo = mp.idModulo 
                   WHERE mp.idProfesor = :id";
        $stmtMod = $this->db->prepare($sqlMod);
        $stmtMod->execute([':id' => $id]);
        $modulos = $stmtMod->fetchAll(PDO::FETCH_COLUMN);
        $prof['modulos'] = $modulos ? implode(', ', $modulos) : '';

        // 3. Obtener ciclos
        $sqlCic = "SELECT ci.siglas FROM Ciclos ci 
                   WHERE ci.idCoordinador = :id";
        $stmtCic = $this->db->prepare($sqlCic);
        $stmtCic->execute([':id' => $id]);
        $ciclos = $stmtCic->fetchAll(PDO::FETCH_COLUMN);
        $prof['ciclos'] = $ciclos ? implode(', ', $ciclos) : '';
    }

    private function esCoordinador($id) {
        $sql = "SELECT idCoordinador FROM Coordinador WHERE idCoordinador = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return (bool)$stmt->fetch();
    }
}
