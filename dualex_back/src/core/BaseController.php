<?php

class BaseController {
    protected $db;
    protected $user;

    public function __construct($db, $user = null) {
        $this->db = $db;
        $this->user = $user;
    }

    /**
     * Envía una respuesta JSON y finaliza la ejecución.
     */
    protected function sendResponse($data, $code = 200) {
        // Si ya se enviaron cabeceras, no intentamos setear el código
        if (!headers_sent()) {
            http_response_code($code);
        }
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Envía un error JSON y finaliza la ejecución.
     */
    protected function sendError($message, $code = 400) {
        $this->sendResponse(["error" => $message], $code);
    }

    /**
     * Verifica si el usuario tiene uno de los roles permitidos.
     */
    protected function checkRole($roles) {
        if (!$this->user || !isset($this->user['roles']['dualex'])) {
            $this->sendError("No autenticado o sesión inválida", 401);
        }

        $userRole = strtoupper($this->user['roles']['dualex']);
        $allowedRoles = array_map('strtoupper', (array)$roles);

        if (!in_array($userRole, $allowedRoles)) {
            $this->sendError("No tienes permisos para realizar esta acción", 403);
        }
    }
}
