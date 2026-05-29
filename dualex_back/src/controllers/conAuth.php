<?php

class ConAuth extends BaseController {

    /**
     * Endpoint para recibir el login desde el SSO por método POST
     * URL esperada: index.php?c=Auth&m=ssoLogin
     */
    public function ssoLogin() {
        // 1. Obtener el token enviado por el SSO
        // Comprobamos tanto $_POST (formulario tradicional) como JSON body por si acaso
        $token = $_POST['token'] ?? null;
        
        if (!$token) {
            $input = json_decode(file_get_contents('php://input'), true);
            $token = $input['token'] ?? null;
        }

        // Si no se recibe token, redirigimos de vuelta al SSO
        if (!$token) {
            header('Location: https://17.daw.esvirgua.com/');
            exit;
        }

        // 2. Opcional: Podríamos validar la firma del token aquí con JWTHelper, 
        // pero Angular ya lo decodifica y la siguiente petición a la API lo validará matemáticamente.

        // 3. Crear la cookie
        // httponly = false es VITAL para que el código JavaScript de Angular pueda leerla (document.cookie)
        setcookie('auth_token', $token, [
            'expires' => time() + 86400, // 1 día
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', // True si es HTTPS
            'httponly' => false, 
            'samesite' => 'Lax'
        ]);

        // 4. Redirigir al frontend Angular
        // Como comparten el dominio (05.proyectos.esvirgua.com), la cookie viajará perfectamente
        header('Location: https://05.proyectos.esvirgua.com/');
        exit;
    }
}
