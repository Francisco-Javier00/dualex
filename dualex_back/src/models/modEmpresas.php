<?php
class ModEmpresas {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene la lista de empresas procesada para DataTables, aplicando paginación, filtros y ordenación.
     * También calcula la fecha de finalización del convenio basándose en la configuración y
     * agrupa los contactos asociados a cada empresa (principal y adicionales).
     * 
     * @param array $params Parámetros enviados por DataTables (start, length, search, order, etc.)
     * @return array Estructura requerida por DataTables con los registros procesados.
     */
    public function obtenerDataTables($params) {
        $start = isset($params['start']) ? intval($params['start']) : 0;
        $length = isset($params['length']) ? intval($params['length']) : 10;
        $searchValue = isset($params['search']['value']) ? $params['search']['value'] : '';

        // Base queries (Consultas jodidamente simples)
        $queryBase = "SELECT e.idEmpresa as id, e.siglas, e.nombre, e.url_Convenio as convenioUrl, e.inicioConvenio 
                      FROM Empresa e";

        $countQuery = "SELECT COUNT(*) as total FROM Empresa e";

        // Obtener los años de configuración para el fin de convenio
        $stmtConf = $this->conn->prepare("SELECT tiempo_finalizacion_convenio FROM Configuracion LIMIT 1");
        $stmtConf->execute();
        $conf = $stmtConf->fetch(PDO::FETCH_ASSOC);
        $aniosConvenio = $conf ? intval($conf['tiempo_finalizacion_convenio']) : 1;

        // Filtering
        $where = "";
        $bindParams = [];
        if (!empty($searchValue)) {
            $where = " WHERE e.siglas LIKE :search1 
                          OR e.nombre LIKE :search2 
                          OR e.url_Convenio LIKE :search3";
            $bindParams[':search1'] = "%$searchValue%";
            $bindParams[':search2'] = "%$searchValue%";
            $bindParams[':search3'] = "%$searchValue%";
        }

        // Total records without filter
        $stmtTotal = $this->conn->prepare($countQuery);
        $stmtTotal->execute();
        $recordsTotal = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];

        // Total records with filter
        $stmtFiltered = $this->conn->prepare($countQuery . $where);
        foreach ($bindParams as $key => $value) {
            $stmtFiltered->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmtFiltered->execute();
        $recordsFiltered = $stmtFiltered->fetch(PDO::FETCH_ASSOC)['total'];

        // Sorting
        $orderBy = " ORDER BY e.idEmpresa DESC"; // Default
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = $params['order'][0]['dir'] === 'asc' ? 'ASC' : 'DESC';
            
            // Map column index to column name (based on frontend columns array)
            $columnsMap = [
                0 => 'e.siglas',
                1 => 'e.nombre',
                2 => 'e.url_Convenio',
                3 => 'e.inicioConvenio',
                4 => 'e.inicioConvenio' // finConvenio is proportional to inicioConvenio
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        // Pagination
        $limit = "";
        if ($length != -1) {
            $limit = " LIMIT :start, :length";
        }

        // Final query
        $stmtData = $this->conn->prepare($queryBase . $where . $orderBy . $limit);
        foreach ($bindParams as $key => $value) {
            $stmtData->bindValue($key, $value, PDO::PARAM_STR);
        }
        if ($length != -1) {
            $stmtData->bindValue(':start', $start, PDO::PARAM_INT);
            $stmtData->bindValue(':length', $length, PDO::PARAM_INT);
        }
        
        $stmtData->execute();
        $empresas = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // Fetch contacts for each company
        foreach ($empresas as &$empresa) {
            // Calcular y formatear fechas en PHP (jodidamente simple SQL)
            $inicioDt = new DateTime($empresa['inicioConvenio']);
            $empresa['inicioConvenio'] = $inicioDt->format('d/m/Y');
            
            $finDt = clone $inicioDt;
            $finDt->modify("+$aniosConvenio years");
            $empresa['finConvenio'] = $finDt->format('d/m/Y');

            $stmtContacts = $this->conn->prepare("SELECT tfnoContacto, nombreContacto FROM Contacto WHERE idEmpresa = :idEmpresa ORDER BY idContacto ASC");
            $stmtContacts->bindValue(':idEmpresa', $empresa['id'], PDO::PARAM_INT);
            $stmtContacts->execute();
            $contactos = $stmtContacts->fetchAll(PDO::FETCH_ASSOC);

            if (count($contactos) > 0) {
                // First contact is main
                $empresa['contacto'] = $contactos[0]['nombreContacto'];
                $empresa['numeroContacto'] = $contactos[0]['tfnoContacto'];

                $adicionales = [];
                for ($i = 1; $i < count($contactos); $i++) {
                    $adicionales[] = [
                        'contacto' => $contactos[$i]['nombreContacto'],
                        'numeroContacto' => $contactos[$i]['tfnoContacto']
                    ];
                }
                $empresa['contactosAdicionales'] = $adicionales;
            } else {
                $empresa['contacto'] = '';
                $empresa['numeroContacto'] = '';
                $empresa['contactosAdicionales'] = [];
            }
        }

        return [
            "draw" => isset($params['draw']) ? intval($params['draw']) : 0,
            "recordsTotal" => intval($recordsTotal),
            "recordsFiltered" => intval($recordsFiltered),
            "data" => $empresas
        ];
    }

    /**
     * Agrega una nueva empresa a la base de datos junto con sus contactos.
     * Utiliza una transacción para asegurar que la empresa y sus contactos se inserten correctamente
     * de forma atómica. En caso de error, se revierte toda la operación (rollback).
     * 
     * @param array $datos Datos de la empresa y contactos recibidos desde el frontend.
     * @return array Resultado de la operación (éxito o mensaje de error).
     */
    public function agregarEmpresa($datos) {
        $this->conn->beginTransaction();
        try {
            // Convert 'DD/MM/YYYY' to 'YYYY-MM-DD HH:MM:SS' for MySQL
            $fechaPartes = explode('/', $datos['inicioConvenio']);
            $fechaMySql = $fechaPartes[2] . '-' . $fechaPartes[1] . '-' . $fechaPartes[0] . ' 00:00:00';

            $query = "INSERT INTO Empresa (siglas, nombre, url_Convenio, inicioConvenio) 
                      VALUES (:siglas, :nombre, :url_Convenio, :inicioConvenio)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':siglas', $datos['siglas']);
            $stmt->bindValue(':nombre', $datos['nombre']);
            $stmt->bindValue(':url_Convenio', $datos['convenioUrl']);
            $stmt->bindValue(':inicioConvenio', $fechaMySql);
            $stmt->execute();

            $idEmpresa = $this->conn->lastInsertId();

            // Insert main contact
            $this->insertarContacto($idEmpresa, $datos['contacto'], $datos['numeroContacto'], 'Principal');

            // Insert additional contacts
            if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
                foreach ($datos['contactosAdicionales'] as $contactoAdi) {
                    $this->insertarContacto($idEmpresa, $contactoAdi['contacto'], $contactoAdi['numeroContacto'], 'Adicional');
                }
            }

            $this->conn->commit();
            return ["status" => "success", "message" => "Empresa agregada correctamente."];
        } catch (Exception $e) {
            $this->conn->rollBack();
            // Fallback manual por si la BD usa MyISAM y no soporta transacciones nativas
            if (isset($idEmpresa)) {
                $stmtDel = $this->conn->prepare("DELETE FROM Empresa WHERE idEmpresa = :idEmpresa");
                $stmtDel->bindValue(':idEmpresa', $idEmpresa, PDO::PARAM_INT);
                $stmtDel->execute();
            }
            return ["error" => "Error al agregar la empresa y sus contactos: " . $e->getMessage()];
        }
    }

    /**
     * Actualiza los datos de una empresa existente y renueva su lista de contactos.
     * Elimina todos los contactos previos asociados a la empresa y los vuelve a insertar 
     * con los datos actualizados proporcionados. Todo se ejecuta bajo una transacción.
     * 
     * @param int $id Identificador único de la empresa a modificar.
     * @param array $datos Nuevos datos de la empresa y su lista actualizada de contactos.
     * @return array Resultado de la operación (éxito o mensaje de error).
     */
    public function actualizarEmpresa($id, $datos) {
        $this->conn->beginTransaction();
        try {
            $fechaPartes = explode('/', $datos['inicioConvenio']);
            $fechaMySql = $fechaPartes[2] . '-' . $fechaPartes[1] . '-' . $fechaPartes[0] . ' 00:00:00';

            $query = "UPDATE Empresa SET siglas = :siglas, nombre = :nombre, url_Convenio = :url_Convenio, inicioConvenio = :inicioConvenio 
                      WHERE idEmpresa = :idEmpresa";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':siglas', $datos['siglas']);
            $stmt->bindValue(':nombre', $datos['nombre']);
            $stmt->bindValue(':url_Convenio', $datos['convenioUrl']);
            $stmt->bindValue(':inicioConvenio', $fechaMySql);
            $stmt->bindValue(':idEmpresa', $id, PDO::PARAM_INT);
            $stmt->execute();

            // Replace all contacts: delete existing, insert new ones
            $stmtDel = $this->conn->prepare("DELETE FROM Contacto WHERE idEmpresa = :idEmpresa");
            $stmtDel->bindValue(':idEmpresa', $id, PDO::PARAM_INT);
            $stmtDel->execute();

            // Insert main contact
            $this->insertarContacto($id, $datos['contacto'], $datos['numeroContacto'], 'Principal');

            // Insert additional contacts
            if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
                foreach ($datos['contactosAdicionales'] as $contactoAdi) {
                    $this->insertarContacto($id, $contactoAdi['contacto'], $contactoAdi['numeroContacto'], 'Adicional');
                }
            }

            $this->conn->commit();
            return ["status" => "success", "message" => "Empresa actualizada correctamente."];
        } catch (Exception $e) {
            $this->conn->rollBack();
            return ["error" => "Error al actualizar la empresa: " . $e->getMessage()];
        }
    }

    /**
     * Elimina permanentemente una empresa de la base de datos basándose en su ID.
     * Gracias a las restricciones ON DELETE CASCADE en MySQL, los contactos asociados 
     * también se eliminarán automáticamente.
     * 
     * @param int $id Identificador único de la empresa a eliminar.
     * @return array Resultado de la operación indicando éxito o error.
     */
    public function eliminarEmpresa($id) {
        try {
            $query = "DELETE FROM Empresa WHERE idEmpresa = :idEmpresa";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':idEmpresa', $id, PDO::PARAM_INT);
            $stmt->execute();
            return ["status" => "success", "message" => "Empresa eliminada correctamente."];
        } catch (Exception $e) {
            return ["error" => "Error al eliminar la empresa: " . $e->getMessage()];
        }
    }

    /**
     * Método auxiliar privado para insertar un contacto asociado a una empresa específica.
     * 
     * @param int $idEmpresa ID de la empresa a la que pertenece el contacto.
     * @param string $nombre Nombre completo del contacto.
     * @param string $telefono Número de teléfono del contacto.
     * @param string $titular Cargo o título del contacto (ej: 'Principal', 'Adicional').
     * @return void
     */
    private function insertarContacto($idEmpresa, $nombre, $telefono, $titular) {
        $query = "INSERT INTO Contacto (idEmpresa, nombreContacto, tfnoContacto, titular) 
                  VALUES (:idEmpresa, :nombre, :telefono, :titular)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':idEmpresa', $idEmpresa, PDO::PARAM_INT);
        $stmt->bindValue(':nombre', $nombre);
        $stmt->bindValue(':telefono', $telefono);
        $stmt->bindValue(':titular', $titular);
        $stmt->execute();
    }
}
?>
