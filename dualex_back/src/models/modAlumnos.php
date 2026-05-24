<?php
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
}
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Modelo de datos para la gestión y persistencia de Alumno en la base de datos de Dualex.
 * 
 * Esta clase interactúa directamente con las tablas `Usuario`, `Alumno` y
 * la tabla intermedia `Empresa_Alumno`, gestionando la lógica de negocio y transacciones
 * asociadas a los registros de Alumno.
 * 
 * @category Model
 * @package  Dualex\Models
 */
class ModAlumnos {
    /**
     * @var PDO Conexión activa a la base de datos MySQL.
     */
    private $db;

    /**
     * Constructor del modelo.
     *
     * @param PDO $db Instancia de la conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Obtiene el listado completo de todos los Alumno registrados en el sistema,
     * asociando sus datos personales de usuario, curso y empresa vinculada.
     *
     * @return array[] Listado de Alumno con formato de clave-valor asociativo.
     */
    public function listar() {
        $sql = "SELECT idUsuario as id, u.nombre, apellidos, correo as email, 
                       DNI as dni, NUSS as nuss, NIA as nia, telefono, 
                       CAST(repetidor AS UNSIGNED) as repetidor, 
                       a.idCurso, c.nombre as nombreCurso,
                       idEmpresa
                FROM Usuario u
                JOIN Alumno a ON u.idUsuario = a.idAlumno
                JOIN Curso c ON a.idCurso = c.idCurso
                LEFT JOIN Empresa_Alumno ea ON a.idAlumno = ea.idAlumno
                WHERE tipo = 'A'
                ORDER BY apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene la información detallada de un alumno específico mediante su identificador.
     *
     * @param int $id Identificador único del alumno (ID de usuario).
     * @return array|false Datos del alumno si se encuentra, o false si no existe.
     */
    public function obtener($id) {
        $sql = "SELECT idUsuario as id, nombre, apellidos, correo as email, 
                       DNI as dni, NUSS as nuss, NIA as nia, telefono, 
                       CAST(repetidor AS UNSIGNED) as repetidor, idCurso, idEmpresa
                FROM Usuario u
                JOIN Alumno a ON u.idUsuario = a.idAlumno
                LEFT JOIN Empresa_Alumno ea ON a.idAlumno = ea.idAlumno
                WHERE idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Registra un nuevo alumno en la base de datos, creando el usuario base
     * y asociando el alumno y su empresa bajo una transacción segura.
     *
     * @param array $datos Datos estructurados del alumno (nombre, apellidos, email, dni, nuss, nia, telefono, repetidor, idCurso, idEmpresa).
     * @throws Exception Si ocurre un fallo en la inserción (hace rollback de la transacción).
     * @return array La información detallada del alumno recién creado.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            $sqlU = "INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, 'A')";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);
            $idUsuario = $this->db->lastInsertId();

            $sqlA = "INSERT INTO Alumno (idAlumno, DNI, NUSS, NIA, telefono, repetidor, idCurso) 
                     VALUES (:id, :dni, :nuss, :nia, :telefono, :repetidor, :idCurso)";
            $stmtA = $this->db->prepare($sqlA);
            $stmtA->bindValue(':id', $idUsuario, PDO::PARAM_INT);
            $stmtA->bindValue(':dni', $datos['dni'], PDO::PARAM_STR);
            $stmtA->bindValue(':nuss', $datos['nuss'], PDO::PARAM_STR);
            $stmtA->bindValue(':nia', $datos['nia'], PDO::PARAM_STR);
            $stmtA->bindValue(':telefono', $datos['telefono'], PDO::PARAM_STR);
            $repetidor = (isset($datos['repetidor']) && $datos['repetidor']) ? chr(1) : chr(0);
            $stmtA->bindValue(':repetidor', $repetidor, PDO::PARAM_STR);
            $stmtA->bindValue(':idCurso', $datos['idCurso'], PDO::PARAM_INT);
            $stmtA->execute();

            // Gestión de la empresa (tabla intermedia)
            if (isset($datos['idEmpresa']) && !empty($datos['idEmpresa'])) {
                $sqlEA = "INSERT INTO Empresa_Alumno (idEmpresa, idAlumno) VALUES (:idEmpresa, :idAlumno)";
                $stmtEA = $this->db->prepare($sqlEA);
                $stmtEA->bindValue(':idEmpresa', $datos['idEmpresa'], PDO::PARAM_INT);
                $stmtEA->bindValue(':idAlumno', $idUsuario, PDO::PARAM_INT);
                $stmtEA->execute();
            }

            $this->db->commit();
            return $this->obtener($idUsuario);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Actualiza la información de un alumno y su relación con la empresa bajo una transacción segura.
     *
     * @param int   $id    Identificador único del alumno a actualizar.
     * @param array $datos Nuevos datos estructurados del alumno.
     * @throws Exception Si ocurre un fallo durante la transacción.
     * @return array Los datos actualizados del alumno.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            $sqlU = "UPDATE Usuario SET nombre = :nombre, apellidos = :apellidos, correo = :correo WHERE idUsuario = :id";
            $stmtU = $this->db->prepare($sqlU);
            $stmtU->execute([
                ':id'        => $id,
                ':nombre'    => $datos['nombre'],
                ':apellidos' => $datos['apellidos'],
                ':correo'    => $datos['email']
            ]);

            $sqlA = "UPDATE Alumno SET 
                     DNI = :dni, NUSS = :nuss, NIA = :nia, telefono = :telefono, 
                     repetidor = :repetidor, idCurso = :idCurso 
                     WHERE idAlumno = :id";
            $stmtA = $this->db->prepare($sqlA);
            $stmtA->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtA->bindValue(':dni', $datos['dni'], PDO::PARAM_STR);
            $stmtA->bindValue(':nuss', $datos['nuss'], PDO::PARAM_STR);
            $stmtA->bindValue(':nia', $datos['nia'], PDO::PARAM_STR);
            $stmtA->bindValue(':telefono', $datos['telefono'], PDO::PARAM_STR);
            $repetidor = (isset($datos['repetidor']) && $datos['repetidor']) ? chr(1) : chr(0);
            $stmtA->bindValue(':repetidor', $repetidor, PDO::PARAM_STR);
            $stmtA->bindValue(':idCurso', $datos['idCurso'], PDO::PARAM_INT);
            $stmtA->execute();
            // Primero borramos la relación anterior
            $sqlDelete = "DELETE FROM Empresa_Alumno WHERE idAlumno = :id";
            $stmtDel = $this->db->prepare($sqlDelete);
            $stmtDel->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtDel->execute();

            // Si hay una nueva empresa, la insertamos
            if (isset($datos['idEmpresa']) && !empty($datos['idEmpresa'])) {
                $sqlEA = "INSERT INTO Empresa_Alumno (idEmpresa, idAlumno) VALUES (:idEmpresa, :idAlumno)";
                $stmtEA = $this->db->prepare($sqlEA);
                $stmtEA->bindValue(':idEmpresa', $datos['idEmpresa'], PDO::PARAM_INT);
                $stmtEA->bindValue(':idAlumno', $id, PDO::PARAM_INT);
                $stmtEA->execute();
            }

            $this->db->commit();
            return $this->obtener($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Elimina un alumno y su correspondiente registro de la tabla Usuario en cascada.
     *
     * @param int $id Identificador del alumno a eliminar.
     * @return bool True si la operación fue exitosa, false en caso contrario.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Usuario WHERE idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Obtiene los Alumno paginados, ordenados y filtrados según la petición de DataTables,
     * aplicando reglas de visibilidad y filtros específicos de acuerdo al Rol del usuario (Coordinador, Profesor o Administrador).
     *
     * @param array $params Parámetros de DataTables y metadatos de sesión (incluyendo rol_token y email).
     * @return array Estructura requerida por DataTables (draw, recordsTotal, recordsFiltered, data).
     */
    public function obtenerDataTables($params) {
        $idModulo = $params['idModulo'] ?? ($_GET['idModulo'] ?? ($_GET['moduloId'] ?? null));
        $email = $params['email'] ?? null;
        $idUsuario = null;

        // Resolvemos el idUsuario real de la base de datos a partir del correo del token
        if (!empty($email)) {
            $stmtUser = $this->db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :correo LIMIT 1");
            $stmtUser->execute([':correo' => $email]);
            $realId = $stmtUser->fetchColumn();
            if ($realId) {
                $idUsuario = (int)$realId;
            }
        }

        $idsCursos = $params['idsCursos'] ?? null;
        $rol = strtoupper($params['rol_token'] ?? '');
        $start = (int)($params['start'] ?? 0);
        $length = (int)($params['length'] ?? 10);
        $search = $params['search']['value'] ?? '';

        // Base de la consulta con DISTINCT para evitar duplicados
        $sql = "SELECT DISTINCT idUsuario as id, u.nombre, apellidos, correo as email, 
                       DNI as dni, NUSS as nuss, NIA as nia, telefono, a.idCurso,
                       CAST(repetidor AS UNSIGNED) as repetidor,
                       c.nombre as nombreCurso, idEmpresa
                FROM Usuario u
                INNER JOIN Alumno a ON u.idUsuario = a.idAlumno 
                LEFT JOIN Curso c ON a.idCurso = c.idCurso
                 LEFT JOIN Empresa_Alumno ea ON a.idAlumno = ea.idAlumno ";

        // Construcción de condiciones
        $conditions = [];
        $binds = [];
        $joinClause = "";
        $joinMac = false;
        $joinMp = false;

        if ($search) {
            $conditions[] = "(u.nombre LIKE :search1 OR apellidos LIKE :search2 OR correo LIKE :search3 OR DNI LIKE :search4)";
            $binds[':search1'] = "%$search%";
            $binds[':search2'] = "%$search%";
            $binds[':search3'] = "%$search%";
            $binds[':search4'] = "%$search%";
        }
        
        // Filtrado por modulo especifico
        if (!empty($idModulo) && $idModulo !== 'null') {
            $joinMac = true;
            $conditions[] = "mac.idModulo = :idModulo";
            $binds[':idModulo'] = (int)$idModulo;
        } 
        // Si es COORDINADOR, aplicamos su filtro de ciclo SIEMPRE (es el mas restrictivo para el)
        if (strtoupper($rol) === 'COORDINADOR' && !empty($idUsuario)) {
            $joinClause .= " INNER JOIN Ciclo cic ON c.idCiclo = cic.idCiclo ";
            $conditions[] = "cic.idCoordinador = :idUsuario";
            $binds[':idUsuario'] = (int)$idUsuario;
            
            // Si además ha filtrado por Curso específicos desde el frontal, los añadimos como filtro extra
            if (!empty($idsCursos) && is_array($idsCursos)) {
                $idsValidados = array_filter(array_map('intval', $idsCursos));
                if (!empty($idsValidados)) {
                    $conditions[] = "a.idCurso IN (" . implode(',', $idsValidados) . ")";
                }
            }
        }
        // Si NO es coordinador pero hay una lista de Curso (caso Profesor con seleccion manual)
        else if (!empty($idsCursos) && is_array($idsCursos)) {
            $idsValidados = array_filter(array_map('intval', $idsCursos));
            if (!empty($idsValidados)) {
                $conditions[] = "a.idCurso IN (" . implode(',', $idsValidados) . ")";
            }
        }
        // Si es Profesor, ve los Alumnos de los modulos que imparte
        else if (strtoupper($rol) === 'PROFESOR' && !empty($idUsuario)) {
            $joinMac = true;
            $joinMp = true;
            $conditions[] = "mp.idProfesor = :idUsuario";
            $binds[':idUsuario'] = (int)$idUsuario;
        }

        // Construir los INNER JOINs segun las banderas para evitar duplicados
        if ($joinMac) {
            $joinClause .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumno = mac.idAlumno ";
        }
        if ($joinMp) {
            $joinClause .= " INNER JOIN Modulo_Profesor mp ON mac.idModulo = mp.idModulo ";
        }
        $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

        // Ordenación dinámica
        $orderBy = " ORDER BY apellidos, u.nombre";
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = isset($params['order'][0]['dir']) && strtolower($params['order'][0]['dir']) === 'desc' ? 'DESC' : 'ASC';
            
            $columnsMap = [
                1 => 'u.nombre',
                2 => 'apellidos',
                3 => 'correo',
                4 => 'c.nombre',
                5 => 'DNI',
                6 => 'NUSS',
                7 => 'NIA',
                8 => 'telefono'
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        // Consulta de datos con paginado
        $sqlData = $sql . $joinClause . $whereClause . $orderBy . " LIMIT :start, :length";
        $stmtData = $this->db->prepare($sqlData);
        foreach ($binds as $key => $val) {
            $stmtData->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtData->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmtData->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmtData->execute();
        $data = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // Consulta de conteo para DataTables
        $sqlCount = "SELECT COUNT(DISTINCT a.idAlumno) FROM Usuario u 
                     INNER JOIN Alumno a ON u.idUsuario = a.idAlumno 
                     LEFT JOIN Curso c ON a.idCurso = c.idCurso " . $joinClause . $whereClause;
        $stmtCount = $this->db->prepare($sqlCount);
        foreach ($binds as $key => $val) {
            $stmtCount->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
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

    /**
     * Obtiene el listado de Alumno que están cursando un módulo específico.
     *
     * @param int $idModulo Identificador único del módulo.
     * @return array[] Listado de Alumno vinculados al módulo.
     */
    public function listarPorModulo($idModulo) {
        $sql = "SELECT idUsuario as id, u.nombre, apellidos, correo as email, 
                       DNI as dni, NUSS as nuss, NIA as nia, telefono, 
                       CAST(repetidor AS UNSIGNED) as repetidor, idCurso, idEmpresa
                FROM Usuario u
                JOIN Alumno a ON u.idUsuario = a.idAlumno
                JOIN Modulo_Alumno_Cursa mac ON a.idAlumno = mac.idAlumno
                LEFT JOIN Empresa_Alumno ea ON a.idAlumno = ea.idAlumno
                WHERE mac.idModulo = :idModulo
                ORDER BY apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idModulo', $idModulo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Realiza la validación de negocio de los datos de un alumno, incluyendo campos obligatorios,
     * formato de correo, límites de caracteres y algoritmo oficial de validación de DNI/NIE.
     *
     * @param array $datos Datos del alumno a validar.
     * @return string[] Array con los mensajes de error encontrados (vacío si es válido).
     */
    public function validar($datos) {
        $errores = [];

        // Campos obligatorios
        $camposReq = ['nombre', 'apellidos', 'email', 'dni', 'nia', 'nuss', 'telefono', 'idCurso'];
        foreach ($camposReq as $campo) {
            if (!isset($datos[$campo]) || trim($datos[$campo]) === '') {
                $errores[] = "El campo $campo es obligatorio.";
            }
        }

        if (!empty($errores)) return $errores;

        // Formato de Email
        if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) {
            $errores[] = "El formato del correo electrónico no es válido.";
        }

        // Validación de DNI / NIE (Algoritmo oficial)
        $dni = strtoupper($datos['dni']);
        $letras = "TRWAGMYFPDXBNJZSQVHLCKE";
        
        if (preg_match('/^[0-9]{8}[A-Z]$/', $dni)) {
            $numero = substr($dni, 0, 8);
            $letra = substr($dni, -1);
            if ($letras[$numero % 23] !== $letra) {
                $errores[] = "La letra del DNI no es correcta.";
            }
        } elseif (preg_match('/^[XYZ][0-9]{7}[A-Z]$/', $dni)) {
            $nie = str_replace(['X', 'Y', 'Z'], ['0', '1', '2'], $dni);
            $numero = substr($nie, 0, 8);
            $letra = substr($nie, -1);
            if ($letras[$numero % 23] !== $letra) {
                $errores[] = "La letra del NIE no es correcta.";
            }
        } else {
            $errores[] = "El formato del DNI/NIE no es válido.";
        }

        // Longitudes máximas
        if (strlen($datos['nombre']) > 50) $errores[] = "El nombre es demasiado largo (máx 50).";
        if (strlen($datos['apellidos']) > 100) $errores[] = "Los apellidos son demasiado largos (máx 100).";
        if (strlen($datos['nia']) > 10) $errores[] = "El NIA no puede tener más de 10 dígitos.";
        if (strlen($datos['nuss']) > 12) $errores[] = "El NUSS no puede tener más de 12 dígitos.";

        return $errores;
    }

    /**
     * Importa alumnos de forma masiva desde un archivo .xlsx / .xls.
     * Si un alumno ya existe (por correo, DNI, NUSS o NIA), lo ignora.
     * Cada inserción se realiza bajo una transacción (implementada en crear()).
     *
     * @param string $filePath Ruta al archivo temporal del excel.
     * @param int    $idCurso  ID del curso al que se asignarán los alumnos.
     * @throws Exception En caso de errores graves de formato o lectura.
     * @return array Resumen del proceso (imported, skipped, errors).
     */
    public function importarExcel($filePath, $idCurso) {
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
        $header = array_map(function($h) {
            return strtolower(trim($h));
        }, $rows[1]);

        unset($rows[1]); // quitamos cabecera

        foreach ($rows as $row) {
            $rowNumber++;

            // Normalizar claves con cabecera
            $data = [];
            $i = 0;

            foreach ($header as $key) {
                $i++;
                $data[$key] = trim($row[array_keys($row)[$i - 1]] ?? '');
            }

            // Mapear campos (igual que antes)
            $nombre = $data['nombre'] ?? '';
            $apellidos = $data['apellidos'] ?? '';
            $email = $data['email'] ?? '';
            $dni = $data['dni'] ?? '';
            $nuss = $data['nuss'] ?? '';
            $nia = $data['nia'] ?? '';
            $telefono = $data['telefono'] ?? '';
            $repetidor = $data['repetidor'] ?? '';

            // Fila vacía → saltar
            if ($nombre === '' && $apellidos === '' && $email === '') {
                continue;
            }

            // Validación básica (igual que CSV)
            if ($nombre === '' || $apellidos === '' || $email === '' ||
                $dni === '' || $nuss === '' || $nia === '' || $telefono === '') {

                $errors[] = "Fila $rowNumber: Faltan campos obligatorios.";
                continue;
            }

            // Repetidor
            $repetidorVal = in_array(strtolower($repetidor), ['si','sí','1','true','yes']) ? 1 : 0;

            $studentData = [
                'nombre' => $nombre,
                'apellidos' => $apellidos,
                'email' => $email,
                'dni' => $dni,
                'nuss' => $nuss,
                'nia' => $nia,
                'telefono' => $telefono,
                'repetidor' => $repetidorVal,
                'idCurso' => $idCurso,
                'idEmpresa' => null
            ];

            try {
                $this->crear($studentData);
                $imported++;
            } catch (Exception $e) {
                $errors[] = "Fila $rowNumber: " . $e->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'errors' => $errors
        ];
    }
}

