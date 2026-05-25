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
     * Puede recibir un mensaje (string) o una Exception (objeto de error).
     */
    protected function sendError($error, $code = 400) {
        $message = $error;

        // Si es una Exception, aplicamos la lógica de traducción
        if ($error instanceof Exception) {
            $sqlMessage = $error->getMessage();
            $code = 500; // Por defecto para excepciones

            // Error 1062 es "Duplicate Entry" en MySQL
            if (strpos($sqlMessage, '1062') !== false || $error->getCode() == 23000) {
                $code = 400;
                if (strpos($sqlMessage, 'uq_alumnos_dni') !== false) $message = "Este DNI ya está registrado en el sistema.";
                else if (strpos($sqlMessage, 'uq_alumnos_nia') !== false) $message = "Este NIA ya está en uso por otro alumno.";
                else if (strpos($sqlMessage, 'uq_alumnos_nuss') !== false || strpos($sqlMessage, 'uq_alumno_nuss') !== false) $message = "Este número de la Seguridad Social (NUSS) ya existe.";
                else if (strpos($sqlMessage, 'uq_empresa_siglas') !== false) $message = "Estas siglas de empresa ya están registradas.";
                else if (strpos($sqlMessage, 'uq_ciclos_siglas') !== false) $message = "Las siglas de este ciclo formativo ya existen.";
                else if (strpos($sqlMessage, 'uq_modulos_sigla') !== false) $message = "Ya existe un módulo con estas siglas.";
                else if (strpos($sqlMessage, 'uq_cursos_nombre') !== false) $message = "Ya existe un curso con este nombre.";
                else if (strpos($sqlMessage, 'correo') !== false) $message = "Esta dirección de correo electrónico ya está registrada.";
                else $message = "Ya existe un registro con estos datos únicos.";
            } 
            // Error 1451: No se puede borrar/actualizar padre (Integridad referencial)
            else if (strpos($sqlMessage, '1451') !== false) {
                $code = 400;
                $message = "No se puede eliminar este registro porque tiene otros datos vinculados (alumnos, módulos, etc.). Borra primero los registros relacionados.";
            }
            // Error 1452: No se puede añadir/actualizar hijo (No existe el ID foráneo)
            else if (strpos($sqlMessage, '1452') !== false) {
                $code = 400;
                $message = "El registro seleccionado (curso, empresa, etc.) no es válido o ha dejado de existir.";
            }
            // Error 1406: Dato demasiado largo para la columna
            else if (strpos($sqlMessage, '1406') !== false) {
                $code = 400;
                $message = "Uno de los campos introducidos es demasiado largo. Por favor, acorta el texto.";
            }
            // Error 1048: La columna no puede ser nula (campo obligatorio)
            else if (strpos($sqlMessage, '1048') !== false) {
                $code = 400;
                $message = "Hay campos obligatorios que están vacíos. Por favor, rellena todos los datos.";
            }
            else {
                $message = "Error en la base de datos: " . $sqlMessage;
            }

        }

        $this->sendResponse([
            "error" => $message,
            "message" => $message
        ], $code);
    }

    /**
     * Verifica si el usuario tiene uno de los roles permitidos.
     */
    protected function checkRole($roles) {
        if (!$this->user || !isset($this->user['roles']['dualex'])) {
            $this->sendError("No autenticado o sesión inválida", 401);
        }

        $userRole = strtoupper($this->user['roles']['dualex']);
        
        // Verificar si es Coordinador General
        $esGeneral = false;
        if ($userRole === 'COORDINADOR') {
            $stmt = $this->db->prepare("SELECT CAST(general AS UNSIGNED) as general FROM Coordinador WHERE idCoordinador = :id");
            $stmt->execute([':id' => $this->user['id']]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($res && $res['general'] == 1) {
                $esGeneral = true;
            }
        }

        if ($esGeneral) return; // Coordinador General tiene acceso total

        $allowedRoles = array_map('strtoupper', (array)$roles);

        if (!in_array($userRole, $allowedRoles)) {
            $this->sendError("No tienes permisos para realizar esta acción", 403);
        }
    }
}
