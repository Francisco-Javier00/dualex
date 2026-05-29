<?php
namespace Dualex\Core;

use Exception;
use PDO;
use PDOException;

/**
 * File-level docblock for JWTHelper.php
 * 
 */
class JWTHelper {
    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $base64 = str_replace(['-', '_'], ['+', '/'], $data);
        return base64_decode($base64);
    }

    /**
     * Valida un token JWT y devuelve el payload si es válido.
     */
    public static function validar($token, $secret) {
        $partes = explode('.', $token);
        if (count($partes) !== 3) return false;

        list($header, $payload, $signature) = $partes;

        // Validar firma
        $firmaValida = self::base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));

        if ($signature !== $firmaValida) {
            return false;
        }

        $datos = json_decode(self::base64UrlDecode($payload), true);

        // Validar expiración si existe
        if (isset($datos['exp']) && $datos['exp'] < time()) return false;

        return $datos;
    }

    /**
     * Sincroniza el usuario del token con la base de datos local.
     * Si no existe, lo crea asignándole roles y datos por defecto.
     *
     * @param PDO $db Conexión a la base de datos.
     * @param array $user Payload decodificado del JWT.
     * @return array Payload modificado incluyendo el ID local de la BBDD.
     */
    public static function syncUser($db, $user) {
        $stmt = $db->prepare("SELECT idUsuario FROM Usuario WHERE correo = :correo");
        $stmt->execute([':correo' => $user['data']['email']]);
        $dbUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$dbUser) {
            $roles = $user['data']['roles'] ?? [];
            $rolesUpper = array_map('strtoupper', $roles);
            
            $rol = 'ALUMNO'; // Por defecto
            if (in_array('COORDINADOR_DUALEX', $rolesUpper)) {
                $rol = 'COORDINADOR';
            } else if (in_array('PROFESOR_DUALEX', $rolesUpper)) {
                $rol = 'PROFESOR';
            } else if (in_array('ALUMNO_DUALEX', $rolesUpper)) {
                $rol = 'ALUMNO';
            }

            try {
                $db->beginTransaction();

                $tipo = ($rol === 'ALUMNO') ? 'A' : 'P';

                $sqlU = "INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, :tipo)";
                $stmtU = $db->prepare($sqlU);
                $stmtU->execute([
                    ':nombre'    => $user['data']['nombre'] ?? '',
                    ':apellidos' => $user['data']['apellidos'] ?? '',
                    ':correo'    => $user['data']['email'],
                    ':tipo'      => $tipo
                ]);
                $idUsuario = $db->lastInsertId();

                if ($rol === 'ALUMNO') {
                    $stmtC = $db->query("SELECT idCurso FROM Curso LIMIT 1");
                    $idCurso = $stmtC->fetchColumn();
                    if (!$idCurso) {
                        $stmtCiclo = $db->query("SELECT idCiclo FROM Ciclo LIMIT 1");
                        $idCiclo = $stmtCiclo->fetchColumn();
                        if (!$idCiclo) {
                            $db->exec("INSERT INTO Ciclo (nombre, siglas, grado) VALUES ('Ciclo Temporal', 'TEMP', 'medio')");
                            $idCiclo = $db->lastInsertId();
                        }
                        $db->exec("INSERT INTO Curso (nombre, anio_escolar, idCiclo) VALUES ('Curso Temporal', '24-25', $idCiclo)");
                        $idCurso = $db->lastInsertId();
                    }

                    $dniPlaceholder = 'TEMP_' . str_pad($idUsuario, 8, '0', STR_PAD_LEFT);
                    $niaPlaceholder = 'TEMP_' . str_pad($idUsuario, 6, '0', STR_PAD_LEFT);
                    $telefonoPlaceholder = '000000000';

                    $sqlA = "INSERT INTO Alumno (idAlumno, dni, nia, telefono, idCurso) VALUES (:idAlumno, :dni, :nia, :telefono, :idCurso)";
                    $stmtA = $db->prepare($sqlA);
                    $stmtA->execute([
                        ':idAlumno' => $idUsuario,
                        ':dni'      => $dniPlaceholder,
                        ':nia'      => $niaPlaceholder,
                        ':telefono' => $telefonoPlaceholder,
                        ':idCurso'  => $idCurso
                    ]);
                } else if ($rol === 'COORDINADOR') {
                    $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
                    $stmtP = $db->prepare($sqlP);
                    $stmtP->execute([':id' => $idUsuario]);

                    $sqlC = "INSERT INTO Coordinador (idCoordinador) VALUES (:id)";
                    $stmtC = $db->prepare($sqlC);
                    $stmtC->execute([':id' => $idUsuario]);
                } else {
                    $sqlP = "INSERT INTO Profesor (idProfesor) VALUES (:id)";
                    $stmtP = $db->prepare($sqlP);
                    $stmtP->execute([':id' => $idUsuario]);
                }

                $db->commit();
                $user['id'] = $idUsuario;
            } catch (Exception $e) {
                $db->rollBack();
            }
        } else {
            $user['id'] = $dbUser['idUsuario'];
        }

        return $user;
    }
}
