<?php
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
}
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Modelo para la gestión de Profesores.
 * Este modelo maneja la persistencia de Usuario con tipo 'P' (Profesor),
 * gestionando sus roles de coordinador, sus Ciclo asignados y sus módulos docentes.
 * 
 * @package Dualex\Models
 */
class ModProfesores {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Devuelve el listado completo de profesores (sin paginación).
     * 
     * @return array Array asociativo con la lista de profesores y sus relaciones.
     */
    public function listar() {
        $sql = "SELECT idUsuario as id, nombre, apellidos, correo, idCoordinador
                FROM Usuario u
                JOIN Profesor p ON idUsuario = p.idProfesor
                LEFT JOIN Coordinador c ON p.idProfesor = idCoordinador
                WHERE tipo = 'P'
                ORDER BY apellidos, nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($data as &$row) {
            $this->cargarInformacionRelacionada($row);
        }
        return $data;
    }
    /**
     * Prepara y retorna la estructura requerida por DataTables.
     * 
     * @param array $params Configuración enviada desde el front.
     * @return array Estructura con datos paginados, totales y variables de draw.
     */
    public function obtenerDataTables($params) {
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';

        // 1. Conteo total de registros
        $sqlTotal = "SELECT COUNT(*) as total FROM Usuario WHERE tipo = 'P'";
        $recordsTotal = $this->db->query($sqlTotal)->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Filtros de búsqueda
        $where = "";
        $binds = [];
        if ($search) {
            $where = " AND (nombre LIKE :s OR apellidos LIKE :s OR correo LIKE :s)";
            $binds[':s'] = "%$search%";
        }

        $sqlFilter = "SELECT COUNT(*) as total FROM Usuario u WHERE tipo = 'P'" . $where;
        $stmtFilter = $this->db->prepare($sqlFilter);
        foreach ($binds as $key => $val) $stmtFilter->bindValue($key, $val);
        $stmtFilter->execute();
        $recordsFiltered = $stmtFilter->fetch(PDO::FETCH_ASSOC)['total'];

        // 2.5. Ordenación dinámica
        $orderBy = " ORDER BY apellidos, nombre";
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = isset($params['order'][0]['dir']) && strtolower($params['order'][0]['dir']) === 'desc' ? 'DESC' : 'ASC';
            
            $columnsMap = [
                0 => 'nombre',
                1 => 'apellidos',
                2 => 'correo',
                3 => 'idCoordinador'
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        // 3. Obtención de datos con paginación
        $sqlData = "SELECT idUsuario as id, nombre, apellidos, correo, idCoordinador
                    FROM Usuario u
                    JOIN Profesor p ON idUsuario = p.idProfesor
                    LEFT JOIN Coordinador c ON p.idProfesor = idCoordinador
                    WHERE tipo = 'P'" . $where . "
                    $orderBy
                    LIMIT :start, :length";
        
        $stmtData = $this->db->prepare($sqlData);
        $stmtData->bindValue(':start', $start, PDO::PARAM_INT);
        $stmtData->bindValue(':length', $length, PDO::PARAM_INT);
        foreach ($binds as $key => $val) $stmtData->bindValue($key, $val);
        $stmtData->execute();
        $data = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // 4. Enriquecemos cada fila con sus módulos y Ciclo
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
     * (Registra al usuario, lo vincula como profesor, como coordinador si corresponde y asigna Ciclo y módulos).
     * 
     * @param array $datos Datos provistos en el registro.
     * @return array El profesor creado.
     * @throws InvalidArgumentException Si las reglas de negocio no se cumplen.
     * @throws Exception Si ocurre un fallo en la DB.
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

            // A. Insertar en tabla Usuario
            $sqlU = "INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'P')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['correo']
            ]);
            $idUsuario = $this->db->lastInsertId();

            // B. Insertar en tabla Profesor (Especialización)
            $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
            $this->db->prepare($sqlP)->execute([':id' => $idUsuario]);

            // C. Gestión de Rol y Ciclo
            if ($rol === 'COORDINADOR') {
                $sqlC = "INSERT INTO Coordinador (idCoordinador) VALUES (:id)";
                $this->db->prepare($sqlC)->execute([':id' => $idUsuario]);

                // Limitar a 1 ciclo
                $ciclos = array_slice($ciclos, 0, 1);
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
     * 
     * @param int $id Identificador del profesor.
     * @param array $datos Información actualizada.
     * @return array Datos modificados del profesor.
     * @throws InvalidArgumentException Reglas de negocio incumplidas.
     * @throws Exception Errores en cascada SQL.
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
            $sqlU = "UPDATE Usuario SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
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
                    $this->db->prepare("INSERT INTO Coordinador (idCoordinador) VALUES (:id)")->execute([':id' => $id]);
                }
                // Limitar a 1 ciclo
                $ciclos = array_slice($ciclos, 0, 1);
                $this->asignarCiclos($id, $ciclos);
            } else {
                if ($esCoordinadorActual) {
                    $this->quitarCoordinacionDeTodo($id);
                    $this->db->prepare("DELETE FROM Coordinador WHERE idCoordinador = :id")->execute([':id' => $id]);
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
     * Carga módulos y Ciclo asociados a un profesor (Por referencia).
     * 
     * @param array &$prof Puntero al array del profesor que se quiere popular.
     */
    private function cargarInformacionRelacionada(&$prof) {
        $id = $prof['id'];
        $prof['rol'] = (isset($prof['idCoordinador']) && $prof['idCoordinador'] !== null) ? 'COORDINADOR' : 'PROFESOR';
        unset($prof['idCoordinador']);

        // Módulos que imparte
        $sqlMod = "SELECT m.sigla FROM Modulo m 
                   JOIN Modulo_Profesor mp ON m.idModulo = mp.idModulo 
                   WHERE mp.idProfesor = :id";
        $stmtMod = $this->db->prepare($sqlMod);
        $stmtMod->execute([':id' => $id]);
        $modulos = $stmtMod->fetchAll(PDO::FETCH_COLUMN);
        $prof['modulos'] = $modulos ? implode(', ', $modulos) : '';

        // Ciclo que coordina
        $sqlCic = "SELECT ci.siglas FROM Ciclo ci WHERE ci.idCoordinador = :id";
        $stmtCic = $this->db->prepare($sqlCic);
        $stmtCic->execute([':id' => $id]);
        $ciclos = $stmtCic->fetchAll(PDO::FETCH_COLUMN);
        $prof['ciclos'] = $ciclos ? implode(', ', $ciclos) : '';
    }

    /**
     * Vincula un profesor con los módulos que imparte.
     * 
     * @param int $idProfesor ID del profesor.
     * @param array|string $modulosSiglasOIds Lista de identificadores o siglas de módulos.
     * @return int Número de inserciones correctas.
     */
    private function asignarModulos($idProfesor, $modulosSiglasOIds) {
        // Limpiamos asignaciones previas
        $this->db->prepare("DELETE FROM Modulo_Profesor WHERE idProfesor = :id")->execute([':id' => $idProfesor]);

        if (is_string($modulosSiglasOIds)) {
            $modulosSiglasOIds = array_map('trim', explode(',', $modulosSiglasOIds));
        }

        $insertados = 0;

        if (!empty($modulosSiglasOIds)) {
            $sqlId = "SELECT idModulo FROM Modulo WHERE sigla = :sigla LIMIT 1";
            $stmtId = $this->db->prepare($sqlId);
            $sqlIns = "INSERT INTO Modulo_Profesor (idProfesor, idModulo) VALUES (:idP, :idM)";
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
     * Vincula un coordinador con los Ciclo que gestiona.
     * 
     * @param int $idProfesor ID del coordinador.
     * @param array|string $ciclosSiglas Siglas de los Ciclo a los que se vinculará.
     */
    private function asignarCiclos($idProfesor, $ciclosSiglas) {
        // Primero reseteamos cualquier ciclo que estuviera coordinando
        $this->quitarCoordinacionDeTodo($idProfesor);

        if (is_string($ciclosSiglas)) $ciclosSiglas = array_map('trim', explode(',', $ciclosSiglas));

        if (!empty($ciclosSiglas)) {
            $sql = "UPDATE Ciclo SET idCoordinador = :id WHERE siglas = :sigla";
            $stmt = $this->db->prepare($sql);
            foreach ($ciclosSiglas as $sigla) {
                if (empty($sigla)) continue;
                $stmt->execute([':id' => $idProfesor, ':sigla' => $sigla]);
            }
        }
    }

    /**
     * Normaliza listas recibidas como array o cadena separada por comas a un array plano limpio.
     * 
     * @param mixed $valor Valor a estandarizar.
     * @return array Array normalizado.
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
     * Devuelve todas las siglas de módulos pertenecientes a los Ciclo recibidos.
     * 
     * @param array $ciclosSiglas Lista de siglas de Ciclo.
     * @return array IDs numéricos de los módulos.
     */
    private function obtenerModulosIdsDeCiclos(array $ciclosSiglas) {
        $ciclosSiglas = $this->normalizarLista($ciclosSiglas);
        if (empty($ciclosSiglas)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ciclosSiglas), '?'));
        $sql = "SELECT DISTINCT m.idModulo
                FROM Modulo m
                JOIN Modulo_Curso mc ON m.idModulo = mc.idModulo
                JOIN Curso cur ON mc.idCurso = cur.idCurso
                JOIN Ciclo ci ON cur.idCiclo = ci.idCiclo
                WHERE ci.siglas IN ($placeholders)
                ORDER BY m.idModulo";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($ciclosSiglas));

        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }

    /**
     * Anula todas las coordinaciones previas de un profesor.
     * 
     * @param int $idProfesor ID del usuario.
     */
    private function quitarCoordinacionDeTodo($idProfesor) {
        $sql = "UPDATE Ciclo SET idCoordinador = NULL WHERE idCoordinador = :id";
        $this->db->prepare($sql)->execute([':id' => $idProfesor]);
    }

    /**
     * Verifica si el profesor tiene asignado el rol de Coordinador en la base de datos.
     * 
     * @param int $id ID del profesor.
     * @return bool True si es coordinador.
     */
    private function esCoordinador($id) {
        $sql = "SELECT idCoordinador FROM Coordinador WHERE idCoordinador = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return (bool)$stmt->fetch();
    }

    /**
     * Obtiene el perfil completo de un profesor mediante su ID.
     * 
     * @param int $id Identificador del usuario.
     * @return array|false Datos del usuario o false si no existe.
     */
    public function obtener($id) {
        $sql = "SELECT idUsuario as id, nombre, apellidos, correo, idCoordinador
                FROM Usuario u
                JOIN Profesor p ON idUsuario = p.idProfesor
                LEFT JOIN Coordinador c ON p.idProfesor = idCoordinador
                WHERE idUsuario = :id AND tipo = 'P'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $prof = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($prof) $this->cargarInformacionRelacionada($prof);
        return $prof;
    }

    /**
     * Obtiene el perfil completo de un profesor mediante su correo electrónico.
     * 
     * @param string $correo Email registrado.
     * @return array|false Datos del profesor.
     */
    public function obtenerPorCorreo($correo) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo, c.idCoordinador
                FROM Usuario u
                JOIN Profesor p ON u.idUsuario = p.idProfesor
                LEFT JOIN Coordinador c ON p.idProfesor = c.idCoordinador
                WHERE u.correo = :correo AND u.tipo = 'P'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':correo' => $correo]);
        $prof = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($prof) $this->cargarInformacionRelacionada($prof);
        return $prof;
    }

    /**
     * Elimina por completo un usuario Profesor del sistema (y sus relaciones).
     * 
     * @param int $id Identificador del usuario.
     * @return bool Estado de la operación.
     * @throws Exception Si falla el borrado.
     */
    public function eliminar($id) {
        try {
            $this->db->beginTransaction();
            $this->quitarCoordinacionDeTodo($id);
            $this->db->prepare("DELETE FROM Usuario WHERE idUsuario = :id AND tipo = 'P'")->execute([':id' => $id]);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Realiza la validación de negocio de los datos de un profesor, incluyendo campos obligatorios,
     * formato de correo y límites de caracteres.
     *
     * @param array $datos Datos del profesor a validar.
     * @return string[] Array con los mensajes de error encontrados (vacío si es válido).
     */
    public function validar($datos) {
        $errores = [];

        // Campos obligatorios
        $camposReq = ['nombre', 'apellidos', 'correo'];
        foreach ($camposReq as $campo) {
            if (!isset($datos[$campo]) || trim($datos[$campo]) === '') {
                $errores[] = "El campo $campo es obligatorio.";
            }
        }

        if (!empty($errores)) return $errores;

        // Formato de Email
        if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
            $errores[] = "El formato del correo electrónico no es válido.";
        }

        // Longitudes máximas
        if (strlen($datos['nombre']) > 50) $errores[] = "El nombre es demasiado largo (máx 50).";
        if (strlen($datos['apellidos']) > 100) $errores[] = "Los apellidos son demasiado largos (máx 100).";

        return $errores;
    }

    /**
     * Importa profesores de forma masiva desde un archivo .xlsx / .xls.
     * Si un profesor ya existe (por correo), lo ignora.
     * Cada inserción se realiza bajo una transacción (implementada en crear()).
     *
     * @param string $filePath Ruta al archivo temporal del excel.
     * @throws Exception En caso de errores graves de formato o lectura.
     * @return array Resumen del proceso (imported, errors).
     */
    public function importarExcel($filePath) {
        if (!file_exists($filePath)) {
            throw new Exception("Archivo no encontrado.");
        }

        // Cargar Excel
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Convertimos todo a array
        $rows = $sheet->toArray(null, true, true, true);

        $imported = 0;
        $errors = [];
        $rowNumber = 1;

        // Sacamos cabecera (primera fila)
        if (!isset($rows[1]) || empty($rows[1])) {
            throw new Exception("El archivo Excel está vacío o no contiene una fila de cabeceras.");
        }

        $header = array_map(function($h) {
            return strtolower(trim($h ?? ''));
        }, $rows[1]);

        // Validar columnas requeridas en la cabecera
        $tieneNombre = in_array('nombre', $header, true);
        $tieneApellidos = in_array('apellidos', $header, true);
        $tieneCorreo = in_array('correo', $header, true) || in_array('email', $header, true);

        if (!$tieneNombre || !$tieneApellidos || !$tieneCorreo) {
            $columnasFaltantes = [];
            if (!$tieneNombre) $columnasFaltantes[] = "'nombre'";
            if (!$tieneApellidos) $columnasFaltantes[] = "'apellidos'";
            if (!$tieneCorreo) $columnasFaltantes[] = "'correo' o 'email'";
            
            throw new Exception("El archivo Excel no tiene el formato correcto. Faltan las siguientes columnas requeridas: " . implode(', ', $columnasFaltantes) . ".");
        }

        unset($rows[1]); // quitamos cabecera

        foreach ($rows as $row) {
            $rowNumber++;

            // Normalizar claves con cabecera
            $data = [];
            $i = 0;

            foreach ($header as $key) { //saca el "número de la columna", es decir A, B,C... y la compara con los campos de la cabecera
                $i++;
                $data[$key] = trim($row[array_keys($row)[$i - 1]] ?? '');
            }

            // Mapear campos
            $nombre = $data['nombre'] ?? '';
            $apellidos = $data['apellidos'] ?? '';
            $correo = $data['correo'] ?? $data['email'] ?? '';

            // Fila vacía → saltar
            if ($nombre === '' && $apellidos === '' && $correo === '') {
                continue;
            }

            // Validación básica
            if ($nombre === '' || $apellidos === '' || $correo === '') {
                $errors[] = "Fila $rowNumber: Faltan campos obligatorios (nombre, apellidos, correo/email).";
                continue;
            }

            $profesorData = [ //añadimos fila con los datos del profesor
                'nombre' => $nombre,
                'apellidos' => $apellidos,
                'correo' => $correo,
                'rol' => 'PROFESOR',
                'ciclos' => [], //los ponemos vacios y más adelante se rellenan.
                'modulos' => [], //los ponemos vacios y más adelante se rellenan.
                'modulosIds' => [] //los ponemos vacios y más adelante se rellenan.
            ];

            // Validar
            $validacionErrores = $this->validar($profesorData);
            if (!empty($validacionErrores)) {
                $errors[] = "Fila $rowNumber: " . implode(" ", $validacionErrores);
                continue;
            }

            try {
                $this->crear($profesorData);
                $imported++;
            } catch (Exception $e) {
                $msg = $e->getMessage();
                if (strpos($msg, '1062') !== false || $e->getCode() == 23000 || $e->getCode() == '23000') {
                    $errors[] = "Fila $rowNumber: El correo electrónico '$correo' ya está registrado.";
                } else {
                    $errors[] = "Fila $rowNumber: " . $msg;
                }
            }
        }

        return [
            'imported' => $imported,
            'errors' => $errors
        ];
    }
}
