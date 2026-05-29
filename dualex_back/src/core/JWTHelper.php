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
}
