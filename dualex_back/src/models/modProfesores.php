<?php
/**
 * Modelo para la gestión de Profesores.
 * Este modelo maneja la persistencia de usuarios con tipo 'P' (Profesor),
 * gestionando sus roles de coordinador, sus ciclos asignados y sus módulos docentes.
 */
class ModProfesores {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Obtiene el listado completo de profesores procesados para DataTables.
     */
    public function obtenerDataTables($params) {
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';

        // 1. Conteo total de registros
        $sqlTotal = "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'P'";
        $recordsTotal = $this->db->query($sqlTotal)->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Filtros de búsqueda
        $where = "";
        $binds = [];
        if ($search) {
            $where = " AND (u.nombre LIKE :s OR u.apellidos LIKE :s OR u.correo LIKE :s)";
            $binds[':s'] = "%$search%";
        }

        $sqlFilter = "SELECT COUNT(*) as total FROM usuarios u WHERE u.tipo = 'P'" . $where;
        $stmtFilter = $this->db->prepare($sqlFilter);
        foreach ($binds as $key => $val) $stmtFilter->bindValue($key, $val);
        $stmtFilter->execute();
        $recordsFiltered = $stmtFilter->fetch(PDO::FETCH_ASSOC)['total'];

        // 3. Obtención de datos con paginación
        $sqlData = "SELECT 
                        u.idUsuario as id, u.nombre, u.apellidos, u.correo,
                        c.idCoordinador
                    FROM usuarios u
                    JOIN profesor p ON u.idUsuario = p.idProfesor
                    LEFT JOIN coordinador c ON p.idProfesor = c.idCoordinador
                    WHERE u.tipo = 'P'" . $where . "
                    ORDER BY u.apellidos, u.nombre
                    LIMIT :start, :length";
        
        $stmtData = $this->db->prepare($sqlData);
        $stmtData->bindValue(':start', $start, PDO::PARAM_INT);
        $stmtData->bindValue(':length', $length, PDO::PARAM_INT);
        foreach ($binds as $key => $val) $stmtData->bindValue($key, $val);
        $stmtData->execute();
        $data = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // 4. Enriquecemos cada fila con sus módulos y ciclos
        foreach ($data as &$row) {
            $this->cargarInformacionRelacionada($row);
        }

        return [
            "draw" => intval($params['draw'] ?? 0),
            "recordsTotal" => intval($recordsTotal),
            "recordsFiltered" => intval($recordsFiltered),
            "data" => $data
        ];
    }

    /**
     * Crea un profesor y gestiona todas sus vinculaciones en una sola transacción.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            $rol = strtoupper(trim($datos['rol'] ?? 'PROFESOR'));
            $ciclos = $this->normalizarLista($datos['ciclos'] ?? []);
            $modulos = $this->normalizarLista($datos['modulos'] ?? []);
            $modulosIds = $this->normalizarLista($datos['modulosIds'] ?? []);

            if (!in_array($rol, ['PROFESOR', 'COORDINADOR'], true)) {
                throw new InvalidArgumentException('El rol indicado no es válido.');
            }

            if ($rol === 'COORDINADOR' && empty($ciclos)) {
                throw new InvalidArgumentException('Un coordinador debe tener al menos un ciclo asignado.');
            }

            if ($rol !== 'COORDINADOR') {
                $ciclos = [];
            }

            // A. Insertar en tabla usuarios
            $sqlU = "INSERT INTO usuarios (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'P')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['correo']
            ]);
            $idUsuario = $this->db->lastInsertId();

            // B. Insertar en tabla profesor (Especialización)
            $sqlP = "INSERT INTO profesor (idProfesor) VALUES (:id)";
            $this->db->prepare($sqlP)->execute([':id' => $idUsuario]);

            // C. Gestión de Rol y Ciclos
            if ($rol === 'COORDINADOR') {
                $sqlC = "INSERT INTO coordinador (idCoordinador) VALUES (:id)";
                $this->db->prepare($sqlC)->execute([':id' => $idUsuario]);

                $this->asignarCiclos($idUsuario, $ciclos);
            }

            // D. Gestión de Módulos Docentes (Siempre se guardan)
            $vinculosModulos = !empty($modulosIds) ? $modulosIds : $modulos;
            $insertadosModulos = $this->asignarModulos($idUsuario, $vinculosModulos);
            if (!empty($vinculosModulos) && $insertadosModulos === 0) {
                throw new InvalidArgumentException('No se pudieron vincular los módulos seleccionados.');
            }

            $this->db->commit();
            return $this->obtener($idUsuario);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Actualiza un profesor y sincroniza sus roles y asignaciones.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            $rol = strtoupper(trim($datos['rol'] ?? 'PROFESOR'));
            $ciclos = $this->normalizarLista($datos['ciclos'] ?? []);
            $modulos = $this->normalizarLista($datos['modulos'] ?? []);
            $modulosIds = $this->normalizarLista($datos['modulosIds'] ?? []);

            if (!in_array($rol, ['PROFESOR', 'COORDINADOR'], true)) {
                throw new InvalidArgumentException('El rol indicado no es válido.');
            }

            if ($rol === 'COORDINADOR' && empty($ciclos)) {
                throw new InvalidArgumentException('Un coordinador debe tener al menos un ciclo asignado.');
            }

            if ($rol !== 'COORDINADOR') {
                $ciclos = [];
            }

            // A. Actualizar datos básicos
            $sqlU = "UPDATE usuarios SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
            $this->db->prepare($sqlU)->execute([
                ':id'        => $id,
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['correo']
            ]);

            // B. Sincronizar Rol de coordinador
            $esCoordinadorActual = $this->esCoordinador($id);
            $quiereSerCoordinador = $rol === 'COORDINADOR';

            if ($quiereSerCoordinador) {
                if (!$esCoordinadorActual) {
                    $this->db->prepare("INSERT INTO coordinador (idCoordinador) VALUES (:id)")->execute([':id' => $id]);
                }
                $this->asignarCiclos($id, $ciclos);
            } else {
                if ($esCoordinadorActual) {
                    $this->quitarCoordinacionDeTodo($id);
                    $this->db->prepare("DELETE FROM coordinador WHERE idCoordinador = :id")->execute([':id' => $id]);
                }
            }

            // C. Sincronizar Módulos Docentes
            $vinculosModulos = !empty($modulosIds) ? $modulosIds : $modulos;
            $insertadosModulos = $this->asignarModulos($id, $vinculosModulos);
            if (!empty($vinculosModulos) && $insertadosModulos === 0) {
                throw new InvalidArgumentException('No se pudieron vincular los módulos seleccionados.');
            }

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Carga módulos y ciclos asociados a un profesor.
     */
    private function cargarInformacionRelacionada(&$prof) {
        $id = $prof['id'];
        $prof['rol'] = (isset($prof['idCoordinador']) && $prof['idCoordinador'] !== null) ? 'COORDINADOR' : 'PROFESOR';
        unset($prof['idCoordinador']);

        // Módulos que imparte
        $sqlMod = "SELECT m.sigla FROM modulos m 
                   JOIN modulo_profesor mp ON m.idModulo = mp.idModulo 
                   WHERE mp.idProfesor = :id";
        $stmtMod = $this->db->prepare($sqlMod);
        $stmtMod->execute([':id' => $id]);
        $modulos = $stmtMod->fetchAll(PDO::FETCH_COLUMN);
        $prof['modulos'] = $modulos ? implode(', ', $modulos) : '';

        // Ciclos que coordina
        $sqlCic = "SELECT ci.siglas FROM ciclos ci WHERE ci.idCoordinador = :id";
        $stmtCic = $this->db->prepare($sqlCic);
        $stmtCic->execute([':id' => $id]);
        $ciclos = $stmtCic->fetchAll(PDO::FETCH_COLUMN);
        $prof['ciclos'] = $ciclos ? implode(', ', $ciclos) : '';
    }

    /**
     * Vincula un profesor con los módulos que imparte.
     */
    private function asignarModulos($idProfesor, $modulosSiglasOIds) {
        // Limpiamos asignaciones previas
        $this->db->prepare("DELETE FROM modulo_profesor WHERE idProfesor = :id")->execute([':id' => $idProfesor]);

        if (is_string($modulosSiglasOIds)) {
            $modulosSiglasOIds = array_map('trim', explode(',', $modulosSiglasOIds));
        }

        $insertados = 0;

        if (!empty($modulosSiglasOIds)) {
            $sqlId = "SELECT idModulo FROM modulos WHERE sigla = :sigla LIMIT 1";
            $stmtId = $this->db->prepare($sqlId);
            $sqlIns = "INSERT INTO modulo_profesor (idProfesor, idModulo) VALUES (:idP, :idM)";
            $stmtIns = $this->db->prepare($sqlIns);

            foreach ($modulosSiglasOIds as $valor) {
                if (empty($valor)) continue;
                $idModulo = null;

                if (is_numeric($valor)) {
                    $idModulo = (int)$valor;
                } else {
                    $stmtId->execute([':sigla' => $valor]);
                    $idModulo = $stmtId->fetchColumn();
                }

                if ($idModulo) {
                    $stmtIns->execute([':idP' => $idProfesor, ':idM' => $idModulo]);
                    $insertados++;
                }
            }
        }

        return $insertados;
    }

    /**
     * Vincula un coordinador con los ciclos que gestiona.
     */
    private function asignarCiclos($idProfesor, $ciclosSiglas) {
        // Primero reseteamos cualquier ciclo que estuviera coordinando
        $this->quitarCoordinacionDeTodo($idProfesor);

        if (is_string($ciclosSiglas)) $ciclosSiglas = array_map('trim', explode(',', $ciclosSiglas));

        if (!empty($ciclosSiglas)) {
            $sql = "UPDATE ciclos SET idCoordinador = :id WHERE siglas = :sigla";
            $stmt = $this->db->prepare($sql);
            foreach ($ciclosSiglas as $sigla) {
                if (empty($sigla)) continue;
                $stmt->execute([':id' => $idProfesor, ':sigla' => $sigla]);
            }
        }
    }

    /**
     * Normaliza listas recibidas como array o cadena separada por comas.
     */
    private function normalizarLista($valor) {
        if (is_array($valor)) {
            $normalizada = array_map(function ($item) {
                return trim((string)$item);
            }, $valor);

            return array_values(array_unique(array_filter($normalizada, fn($item) => $item !== '')));
        }

        if (is_string($valor) && trim($valor) !== '') {
            $partes = explode(',', $valor);
            $normalizada = array_map(function ($item) {
                return trim((string)$item);
            }, $partes);

            return array_values(array_unique(array_filter($normalizada, fn($item) => $item !== '')));
        }

        return [];
    }

    /**
     * Devuelve todas las siglas de módulos pertenecientes a los ciclos recibidos.
     */
    private function obtenerModulosIdsDeCiclos(array $ciclosSiglas) {
        $ciclosSiglas = $this->normalizarLista($ciclosSiglas);
        if (empty($ciclosSiglas)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ciclosSiglas), '?'));
        $sql = "SELECT DISTINCT m.idModulo
                FROM modulos m
                JOIN modulo_curso mc ON m.idModulo = mc.idModulo
                JOIN cursos cur ON mc.idCurso = cur.idCurso
                JOIN ciclos ci ON cur.idCiclo = ci.idCiclo
                WHERE ci.siglas IN ($placeholders)
                ORDER BY m.idModulo";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($ciclosSiglas));

        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }

    private function quitarCoordinacionDeTodo($idProfesor) {
        $sql = "UPDATE ciclos SET idCoordinador = NULL WHERE idCoordinador = :id";
        $this->db->prepare($sql)->execute([':id' => $idProfesor]);
    }

    private function esCoordinador($id) {
        $sql = "SELECT idCoordinador FROM coordinador WHERE idCoordinador = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return (bool)$stmt->fetch();
    }

    public function obtener($id) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo, c.idCoordinador
                FROM usuarios u
                JOIN profesor p ON u.idUsuario = p.idProfesor
                LEFT JOIN coordinador c ON p.idProfesor = c.idCoordinador
                WHERE u.idUsuario = :id AND u.tipo = 'P'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $prof = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($prof) $this->cargarInformacionRelacionada($prof);
        return $prof;
    }

    public function eliminar($id) {
        try {
            $this->db->beginTransaction();
            $this->quitarCoordinacionDeTodo($id);
            $this->db->prepare("DELETE FROM usuarios WHERE idUsuario = :id AND tipo = 'P'")->execute([':id' => $id]);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
