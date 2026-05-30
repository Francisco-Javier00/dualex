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
            
            $rol = null;
            if (in_array('COORDINADOR_DUALEX', $rolesUpper) || in_array('COORDINADOR_GENERAL_DUALEX', $rolesUpper)) {
                $rol = 'COORDINADOR';
            } else if (in_array('PROFESOR_DUALEX', $rolesUpper)) {
                $rol = 'PROFESOR';
            } else if (in_array('ALUMNO_DUALEX', $rolesUpper)) {
                $rol = 'ALUMNO';
            }

            if ($rol === 'ALUMNO' || $rol === null) {
                throw new Exception("No estás registrado en Dualex. Tu coordinador de ciclo debe darte de alta primero.");
            }

            try {
                $db->beginTransaction();

                $tipo = 'P'; // Ya no insertamos alumnos automáticamente

                $sqlU = "INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES (:nombre, :apellidos, :correo, :tipo)";
                $stmtU = $db->prepare($sqlU);
                $stmtU->execute([
                    ':nombre'    => $user['data']['nombre'] ?? '',
                    ':apellidos' => $user['data']['apellidos'] ?? '',
                    ':correo'    => $user['data']['email'],
                    ':tipo'      => $tipo
                ]);
                $idUsuario = $db->lastInsertId();
                if ($rol === 'COORDINADOR') {
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
            $idUsuario = $dbUser['idUsuario'];
            $user['id'] = $idUsuario;

            // Sincronización de roles para usuarios existentes
            $roles = $user['data']['roles'] ?? [];
            $rolesUpper = array_map('strtoupper', $roles);
            
            $isCoordinadorInToken = in_array('COORDINADOR_DUALEX', $rolesUpper) || in_array('COORDINADOR_GENERAL_DUALEX', $rolesUpper);
            $isProfesorInToken = in_array('PROFESOR_DUALEX', $rolesUpper);

            if ($isCoordinadorInToken || $isProfesorInToken) {
                try {
                    $db->beginTransaction();

                    if ($isCoordinadorInToken) {
                        $checkP = $db->prepare("SELECT 1 FROM Profesor WHERE idProfesor = :id");
                        $checkP->execute([':id' => $idUsuario]);
                        if (!$checkP->fetch()) {
                            $db->prepare("INSERT INTO Profesor (idProfesor) VALUES (:id)")->execute([':id' => $idUsuario]);
                        }
                        
                        $checkC = $db->prepare("SELECT 1 FROM Coordinador WHERE idCoordinador = :id");
                        $checkC->execute([':id' => $idUsuario]);
                        if (!$checkC->fetch()) {
                            $db->prepare("INSERT INTO Coordinador (idCoordinador) VALUES (:id)")->execute([':id' => $idUsuario]);
                        }
                    } else if ($isProfesorInToken) {
                        $checkP = $db->prepare("SELECT 1 FROM Profesor WHERE idProfesor = :id");
                        $checkP->execute([':id' => $idUsuario]);
                        if (!$checkP->fetch()) {
                            $db->prepare("INSERT INTO Profesor (idProfesor) VALUES (:id)")->execute([':id' => $idUsuario]);
                        }

                        $checkC = $db->prepare("SELECT 1 FROM Coordinador WHERE idCoordinador = :id");
                        $checkC->execute([':id' => $idUsuario]);
                        if ($checkC->fetch()) {
                            $db->prepare("UPDATE Ciclo SET idCoordinador = NULL WHERE idCoordinador = :id")->execute([':id' => $idUsuario]);
                            $db->prepare("DELETE FROM Coordinador WHERE idCoordinador = :id")->execute([':id' => $idUsuario]);
                        }
                    }

                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                }
            }
        }

        return $user;
    }
}
