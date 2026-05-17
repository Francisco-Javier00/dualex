<?php

class ModAlumnos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       CAST(a.repetidor AS UNSIGNED) as repetidor, 
                       a.idCurso, c.nombre as nombreCurso,
                       ea.idEmpresa
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                JOIN Cursos c ON a.idCurso = c.idCurso
                LEFT JOIN Empresa_Alumnos ea ON a.idAlumnos = ea.idAlumno
                WHERE u.tipo = 'A'
                ORDER BY u.apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       CAST(a.repetidor AS UNSIGNED) as repetidor, a.idCurso, ea.idEmpresa
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                LEFT JOIN Empresa_Alumnos ea ON a.idAlumnos = ea.idAlumno
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
                $sqlEA = "INSERT INTO Empresa_Alumnos (idEmpresa, idAlumno) VALUES (:idEmpresa, :idAlumno)";
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
            $sqlDelete = "DELETE FROM Empresa_Alumnos WHERE idAlumno = :id";
            $stmtDel = $this->db->prepare($sqlDelete);
            $stmtDel->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtDel->execute();

            // Si hay una nueva empresa, la insertamos
            if (isset($datos['idEmpresa']) && !empty($datos['idEmpresa'])) {
                $sqlEA = "INSERT INTO Empresa_Alumnos (idEmpresa, idAlumno) VALUES (:idEmpresa, :idAlumno)";
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

    public function eliminar($id) {
        $sql = "DELETE FROM Usuarios WHERE idUsuario = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function obtenerDataTables($params) {
        $idModulo = $params['idModulo'] ?? ($_GET['idModulo'] ?? ($_GET['moduloId'] ?? null));
        $email = $params['email'] ?? null;
        $idUsuario = null; // Nunca usamos el idUsuario del token por seguridad

        // Resolvemos el idUsuario real de la base de datos a partir del correo del token
        if (!empty($email)) {
            $stmtUser = $this->db->prepare("SELECT idUsuario FROM Usuarios WHERE correo = :correo LIMIT 1");
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
        $sql = "SELECT DISTINCT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, a.idCurso,
                       CAST(a.repetidor AS UNSIGNED) as repetidor,
                       c.nombre as nombreCurso, ea.idEmpresa
                FROM Usuarios u
                INNER JOIN Alumnos a ON u.idUsuario = a.idAlumnos 
                LEFT JOIN Cursos c ON a.idCurso = c.idCurso
                LEFT JOIN Empresa_Alumnos ea ON a.idAlumnos = ea.idAlumno ";

        // Construcción de condiciones
        $conditions = [];
        $binds = [];
        $joinClause = "";

        if ($search) {
            $conditions[] = "(u.nombre LIKE :search1 OR u.apellidos LIKE :search2 OR u.correo LIKE :search3 OR a.DNI LIKE :search4)";
            $binds[':search1'] = "%$search%";
            $binds[':search2'] = "%$search%";
            $binds[':search3'] = "%$search%";
            $binds[':search4'] = "%$search%";
        }
        
        // 1. Filtrado por módulo específico
        if (!empty($idModulo) && $idModulo !== 'null') {
            $joinClause .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos ";
            $conditions[] = "mac.idModulo = :idModulo";
            $binds[':idModulo'] = (int)$idModulo;
        } 
        // 2. Si es COORDINADOR, aplicamos su filtro de ciclo SIEMPRE (es el más restrictivo para él)
        if (strtoupper($rol) === 'COORDINADOR' && !empty($idUsuario)) {
            $joinClause .= " INNER JOIN Ciclos cic ON c.idCiclo = cic.idCiclo ";
            $conditions[] = "cic.idCoordinador = :idUsuario";
            $binds[':idUsuario'] = (int)$idUsuario;
            
            // Si además ha filtrado por cursos específicos desde el frontal, los añadimos como filtro extra
            if (!empty($idsCursos) && is_array($idsCursos)) {
                $idsValidados = array_filter(array_map('intval', $idsCursos));
                if (!empty($idsValidados)) {
                    $conditions[] = "a.idCurso IN (" . implode(',', $idsValidados) . ")";
                }
            }
        }
        // 3. Si NO es coordinador pero hay una lista de cursos (caso Profesor con selección manual)
        else if (!empty($idsCursos) && is_array($idsCursos)) {
            $idsValidados = array_filter(array_map('intval', $idsCursos));
            if (!empty($idsValidados)) {
                $conditions[] = "a.idCurso IN (" . implode(',', $idsValidados) . ")";
            }
        }
        // 4. Si es Profesor, ve los alumnos de los módulos que imparte
        else if (empty($conditions) && strtoupper($rol) === 'PROFESOR' && !empty($idUsuario)) {
            $joinClause .= " INNER JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos ";
            $joinClause .= " INNER JOIN Modulo_Profesor mp ON mac.idModulo = mp.idModulo ";
            $conditions[] = "mp.idProfesor = :idUsuario";
            $binds[':idUsuario'] = (int)$idUsuario;
        }

        $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

        // Consulta de datos con paginado
        $sqlData = $sql . $joinClause . $whereClause . " ORDER BY u.apellidos, u.nombre LIMIT :start, :length";
        $stmtData = $this->db->prepare($sqlData);
        foreach ($binds as $key => $val) {
            $stmtData->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtData->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmtData->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmtData->execute();
        $data = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // Consulta de conteo para DataTables
        $sqlCount = "SELECT COUNT(DISTINCT a.idAlumnos) FROM Usuarios u 
                     INNER JOIN Alumnos a ON u.idUsuario = a.idAlumnos 
                     LEFT JOIN Cursos c ON a.idCurso = c.idCurso " . $joinClause . $whereClause;
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

    public function listarPorModulo($idModulo) {
        $sql = "SELECT u.idUsuario as id, u.nombre, u.apellidos, u.correo as email, 
                       a.DNI as dni, a.NUSS as nuss, a.NIA as nia, a.telefono, 
                       CAST(a.repetidor AS UNSIGNED) as repetidor, a.idCurso, ea.idEmpresa
                FROM Usuarios u
                JOIN Alumnos a ON u.idUsuario = a.idAlumnos
                JOIN Modulo_Alumno_Cursa mac ON a.idAlumnos = mac.idAlumnos
                LEFT JOIN Empresa_Alumnos ea ON a.idAlumnos = ea.idAlumno
                WHERE mac.idModulo = :idModulo
                ORDER BY u.apellidos, u.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idModulo', $idModulo, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

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
}
