<?php
require_once MODELO . 'modEmpresas.php';

class ConEmpresas {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new ModEmpresas($db);
    }

    /**
     * Procesa la petición para el listado de DataTables.
     * Lee los parámetros enviados por POST en formato JSON (Angular HttpClient) o mediante $_REQUEST.
     * 
     * @return array Datos formateados para la tabla.
     */
    public function obtenerDataTables() {
        // Angular HttpClient post sends JSON body
        $json = file_get_contents('php://input');
        $params = json_decode($json, true);
        
        if (!$params) {
            $params = $_REQUEST;
        }

        return $this->modelo->obtenerDataTables($params);
    }

    /**
     * Recibe los datos en JSON del frontend, valida su completitud y las longitudes
     * máximas permitidas por la base de datos, y solicita al modelo crear la empresa.
     * 
     * @return array Respuesta JSON con código de éxito o error HTTP 400.
     */
    public function agregarEmpresa() {
        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['siglas']) || !isset($datos['nombre']) || !isset($datos['inicioConvenio'])) {
            http_response_code(400);
            return ["error" => "Datos insuficientes para agregar la empresa."];
        }

        $errorValidacion = $this->validarLongitudes($datos);
        if ($errorValidacion) {
            http_response_code(400);
            return ["error" => $errorValidacion];
        }

        $result = $this->modelo->agregarEmpresa($datos);
        if (isset($result['error'])) {
            http_response_code(500);
        }
        return $result;
    }

    /**
     * Recibe los datos actualizados y el ID de la empresa por la URL.
     * Valida los datos y llama al modelo para efectuar la modificación en cascada.
     * 
     * @return array Respuesta JSON indicando el estado de la operación.
     */
    public function actualizarEmpresa() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ["error" => "ID de empresa no proporcionado."];
        }

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['siglas']) || !isset($datos['nombre']) || !isset($datos['inicioConvenio'])) {
            http_response_code(400);
            return ["error" => "Datos insuficientes para actualizar la empresa."];
        }

        $errorValidacion = $this->validarLongitudes($datos);
        if ($errorValidacion) {
            http_response_code(400);
            return ["error" => $errorValidacion];
        }

        $result = $this->modelo->actualizarEmpresa($id, $datos);
        if (isset($result['error'])) {
            http_response_code(500);
        }
        return $result;
    }

    /**
     * Método auxiliar privado que comprueba que las cadenas de texto recibidas
     * no excedan el tamaño definido en la estructura (schema) de la base de datos MySQL.
     * 
     * @param array $datos Diccionario asociativo con los datos a comprobar.
     * @return string|null Devuelve el mensaje de error si falla la validación, o null si todo está correcto.
     */
    private function validarLongitudes($datos) {
        if (isset($datos['siglas']) && mb_strlen($datos['siglas']) > 6) return "Las siglas no pueden tener más de 6 caracteres.";
        if (isset($datos['nombre']) && mb_strlen($datos['nombre']) > 50) return "El nombre no puede tener más de 50 caracteres.";
        if (isset($datos['convenioUrl']) && mb_strlen($datos['convenioUrl']) > 100) return "La URL del convenio no puede tener más de 100 caracteres.";
        if (isset($datos['contacto']) && mb_strlen($datos['contacto']) > 50) return "El nombre del contacto principal no puede tener más de 50 caracteres.";
        if (isset($datos['numeroContacto']) && mb_strlen($datos['numeroContacto']) > 15) return "El teléfono del contacto principal no puede tener más de 15 caracteres.";
        
        if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
            foreach ($datos['contactosAdicionales'] as $add) {
                if (isset($add['contacto']) && mb_strlen($add['contacto']) > 50) return "El nombre de un contacto adicional no puede tener más de 50 caracteres.";
                if (isset($add['numeroContacto']) && mb_strlen($add['numeroContacto']) > 15) return "El teléfono de un contacto adicional no puede tener más de 15 caracteres.";
            }
        }
        return null;
    }

    /**
     * Recibe el ID de una empresa a eliminar a través de la URL (GET param 'id').
     * Realiza validaciones básicas y delega la ejecución al modelo.
     * 
     * @return array Respuesta JSON confirmando el borrado.
     */
    public function eliminarEmpresa() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ["error" => "ID de empresa no proporcionado."];
        }

        $result = $this->modelo->eliminarEmpresa($id);
        if (isset($result['error'])) {
            http_response_code(500);
        }
        return $result;
    }
}
?>
