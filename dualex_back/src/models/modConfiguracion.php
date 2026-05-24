<?php
/**
 * Modelo para la configuración global del sistema (una sola fila en BD).
 * 
 * @package Dualex\Models
 */
class ModConfiguracion {
    private $conn;
    private $table_name = "Configuracion";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene los valores actuales de la configuración global.
     * 
     * @return array|false Datos de la configuración.
     */
    public function obtenerConfiguracion() {
        $query = "SELECT dias_aviso_caducidad as diasAvisoCaducidad, 
                         tiempo_finalizacion_convenio as tiempoFinalizacionConvenio,
                         urlConvenio as urlConvenio
                  FROM " . $this->table_name . " LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Actualiza la única fila de configuración en la base de datos.
     * 
     * @param array $datos Valores actualizados de la configuración.
     * @return array Estado de la operación.
     */
    public function actualizarConfiguracion($datos) {
        // Al ser una tabla de configuración de una sola fila, hacemos el update directamente
        $query = "UPDATE " . $this->table_name . " 
                  SET dias_aviso_caducidad = :diasAvisoCaducidad, 
                      tiempo_finalizacion_convenio = :tiempoFinalizacionConvenio,
                      urlConvenio = :urlConvenio";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":diasAvisoCaducidad", $datos['diasAvisoCaducidad']);
        $stmt->bindParam(":tiempoFinalizacionConvenio", $datos['tiempoFinalizacionConvenio']);
        $stmt->bindParam(":urlConvenio", $datos['urlConvenio']);

        if($stmt->execute()) {
            return ["status" => "success", "message" => "Configuración actualizada."];
        }
        return ["status" => "error", "message" => "No se pudo actualizar la configuración."];
    }
}
?>
