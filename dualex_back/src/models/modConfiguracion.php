<?php
class ModConfiguracion {
    private $conn;
    private $table_name = "Configuracion";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function obtenerConfiguracion() {
        $query = "SELECT dias_aviso_caducidad as diasAvisoCaducidad, 
                         tiempo_finalizacion_convenio as tiempoFinalizacionConvenio 
                  FROM " . $this->table_name . " LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function actualizarConfiguracion($datos) {
        // Al ser una tabla de configuración de una sola fila, hacemos el update directamente
        $query = "UPDATE " . $this->table_name . " 
                  SET dias_aviso_caducidad = :diasAvisoCaducidad, 
                      tiempo_finalizacion_convenio = :tiempoFinalizacionConvenio";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":diasAvisoCaducidad", $datos['diasAvisoCaducidad']);
        $stmt->bindParam(":tiempoFinalizacionConvenio", $datos['tiempoFinalizacionConvenio']);

        if($stmt->execute()) {
            return ["status" => "success", "message" => "Configuración actualizada."];
        }
        return ["status" => "error", "message" => "No se pudo actualizar la configuración."];
    }
}
?>
