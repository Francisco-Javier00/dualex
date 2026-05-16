<?php

/**
 * Clase encargada de interactuar directamente con la base de datos para la entidad "Empresa"
 * y sus entidades dependientes ("Contacto").
 * Ejecuta consultas SQL puras utilizando sentencias preparadas de PDO.
 */
class ModEmpresas {
    private $db;

    /**
     * Constructor del modelo.
     * 
     * @param PDO $db Instancia de la conexión a la base de datos inyectada desde el controlador.
     */
    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Obtiene una lista simplificada de todas las empresas.
     * Ideal para llenar selectores o mostrar listas completas sin paginación.
     * La respuesta es procesada por el método auxiliar formatearEmpresas.
     * 
     * @return array Arreglo con la lista de todas las empresas y sus contactos estructurados.
     */
    public function listar() {
        $sql = "SELECT idEmpresa as id, siglas, nombre, url_Convenio as convenioUrl, inicioConvenio 
                FROM Empresa 
                ORDER BY nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        // Se formatea el array para añadir contactos y calcular la fecha de fin de convenio
        return $this->formatearEmpresas($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Busca y devuelve todos los datos y contactos de una empresa específica mediante su ID.
     * 
     * @param int $id Identificador único de la empresa.
     * @return array|null Un array asociativo con todos los datos de la empresa si existe, o null en caso contrario.
     */
    public function obtener($id) {
        $sql = "SELECT idEmpresa as id, siglas, nombre, url_Convenio as convenioUrl, inicioConvenio 
                FROM Empresa WHERE idEmpresa = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $empresa = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($empresa) {
            // Reutilizamos el formateador enviando un array de 1 elemento, y devolvemos la posición 0.
            $empresas = $this->formatearEmpresas([$empresa]);
            return $empresas[0];
        }
        return null; // Si no existe
    }

    /**
     * Crea un nuevo registro de empresa en la base de datos junto con todos sus contactos.
     * Esta operación es atómica (se realiza dentro de una transacción) para evitar registros huérfanos.
     * 
     * @param array $datos Arreglo con la información del formulario ('siglas', 'nombre', etc.)
     * @return array Devuelve los datos recién insertados de la empresa obtenidos directamente desde la BD.
     * @throws Exception Si hay cualquier fallo, deshace los cambios (rollBack) y lanza la excepción.
     */
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            // Transformar la fecha del formato español (DD/MM/YYYY) al formato de MySQL (YYYY-MM-DD HH:MM:SS)
            $fechaPartes = explode('/', $datos['inicioConvenio']);
            $fechaMySql = $fechaPartes[2] . '-' . $fechaPartes[1] . '-' . $fechaPartes[0] . ' 00:00:00';

            // 1. Inserción de los datos principales de la Empresa
            $sql = "INSERT INTO Empresa (siglas, nombre, url_Convenio, inicioConvenio) 
                    VALUES (:siglas, :nombre, :url_Convenio, :inicioConvenio)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':siglas' => $datos['siglas'],
                ':nombre' => $datos['nombre'],
                ':url_Convenio' => $datos['convenioUrl'],
                ':inicioConvenio' => $fechaMySql
            ]);
            
            // Guardamos el ID recién generado de la tabla Empresa
            $idEmpresa = $this->db->lastInsertId();

            // 2. Inserción del contacto principal de forma obligatoria
            $this->insertarContacto($idEmpresa, $datos['contacto'], $datos['numeroContacto'], 'Principal');

            // 3. Inserción iterativa de los posibles contactos adicionales
            if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
                foreach ($datos['contactosAdicionales'] as $add) {
                    $this->insertarContacto($idEmpresa, $add['contacto'], $add['numeroContacto'], 'Adicional');
                }
            }

            // 4. Inserción iterativa de los ciclos seleccionados en ciclo_empresa
            if (isset($datos['ciclos']) && is_array($datos['ciclos'])) {
                foreach ($datos['ciclos'] as $siglaCiclo) {
                    $this->insertarCicloEmpresa($idEmpresa, trim($siglaCiclo));
                }
            }

            // Confirmar transacción si todo sale bien
            $this->db->commit();
            return $this->obtener($idEmpresa); // Retornamos los datos recién guardados para Angular
            
        } catch (Exception $e) {
            $this->db->rollBack();
            // Parche de seguridad: si el servidor usa el motor MyISAM en MySQL, las transacciones
            // no funcionan. Si es así, forzamos un borrado manual para que no quede la empresa huérfana.
            if (isset($idEmpresa)) {
                $stmtDel = $this->db->prepare("DELETE FROM Empresa WHERE idEmpresa = :id");
                $stmtDel->execute([':id' => $idEmpresa]);
            }
            throw $e;
        }
    }

    /**
     * Actualiza la información de una empresa ya existente basándose en su ID.
     * Al igual que la creación, funciona con transacciones. Borra los contactos anteriores
     * para insertar la nueva lista limpia sin arrastrar datos obsoletos.
     * 
     * @param int $id Identificador de la empresa a modificar.
     * @param array $datos Información actualizada.
     * @return array Datos refrescados de la empresa resultante de la BD.
     * @throws Exception Si ocurre un fallo en la inserción o actualización, la transacción se deshace.
     */
    public function actualizar($id, $datos) {
        try {
            $this->db->beginTransaction();

            // 1. Actualización de los campos principales de la tabla Empresa (solo si vienen todos los datos)
            if (isset($datos['siglas'], $datos['nombre'], $datos['convenioUrl'], $datos['inicioConvenio'])) {
                $fechaPartes = explode('/', $datos['inicioConvenio']);
                $fechaMySql = $fechaPartes[2] . '-' . $fechaPartes[1] . '-' . $fechaPartes[0] . ' 00:00:00';

                $sql = "UPDATE Empresa SET siglas = :siglas, nombre = :nombre, url_Convenio = :url_Convenio, inicioConvenio = :inicioConvenio 
                        WHERE idEmpresa = :id";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':id' => $id,
                    ':siglas' => $datos['siglas'],
                    ':nombre' => $datos['nombre'],
                    ':url_Convenio' => $datos['convenioUrl'],
                    ':inicioConvenio' => $fechaMySql
                ]);

                // 2. Destruimos y volvemos a insertar contactos solo si vienen los datos
                if (isset($datos['contacto'], $datos['numeroContacto'])) {
                    $stmtDel = $this->db->prepare("DELETE FROM Contacto WHERE idEmpresa = :id");
                    $stmtDel->execute([':id' => $id]);

                    $this->insertarContacto($id, $datos['contacto'], $datos['numeroContacto'], 'Principal');

                    if (isset($datos['contactosAdicionales']) && is_array($datos['contactosAdicionales'])) {
                        foreach ($datos['contactosAdicionales'] as $add) {
                            $this->insertarContacto($id, $add['contacto'], $add['numeroContacto'], 'Adicional');
                        }
                    }
                }
            }

            // 3. Actualización de ciclos (esto siempre se intenta si vienen en el array)
            if (isset($datos['ciclos']) && is_array($datos['ciclos'])) {
                $stmtDelCiclos = $this->db->prepare("DELETE FROM Ciclo_Empresa WHERE idEmpresa = :id");
                $stmtDelCiclos->execute([':id' => $id]);

                foreach ($datos['ciclos'] as $item) {
                    // Si viene como objeto {sigla, tutor} o solo como sigla
                    $sigla = is_array($item) ? $item['sigla'] : $item;
                    $tutor = is_array($item) && isset($item['tutor']) ? $item['tutor'] : null;
                    
                    $this->insertarCicloEmpresa($id, trim($sigla), $tutor);
                }
            }

            // Confirmar cambios
            $this->db->commit();
            return $this->obtener($id);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Elimina el registro de una empresa.
     * Si la base de datos tiene "ON DELETE CASCADE", los contactos y otros anexos relacionados
     * desaparecerán automáticamente.
     * 
     * @param int $id Identificador de la empresa.
     * @return bool Retorna verdadero si se ejecutó correctamente el comando SQL de borrado.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Empresa WHERE idEmpresa = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Obtiene el listado de empresas preparado exclusivamente para ser consumido
     * por la tabla de Angular (DataTables). Soporta paginado automático del servidor,
     * búsquedas de texto ('search') y ordenamiento ascendente o descendente.
     * 
     * @param array $params Atributos JSON enviados por DataTables en la petición AJAX.
     * @return array Diccionario con draw, recordsTotal, recordsFiltered y data.
     */
    public function obtenerDataTables($params) {
        $start = $params['start'] ?? 0;
        $length = $params['length'] ?? 10;
        $search = $params['search']['value'] ?? '';

        $where = "";
        // Si el usuario escribió en el cuadro de búsqueda
        if ($search) {
            $where = " WHERE e.siglas LIKE :search OR e.nombre LIKE :search OR e.url_Convenio LIKE :search";
        }

        // Obtener el recuento total de elementos en la tabla ignorando filtros
        $total = $this->db->query("SELECT COUNT(*) FROM Empresa")->fetchColumn();

        // Obtener el recuento aplicando la cláusula LIKE para que la paginación no se rompa al buscar
        $sqlFiltrados = "SELECT COUNT(*) FROM Empresa e $where";
        $stmtF = $this->db->prepare($sqlFiltrados);
        if ($search) $stmtF->execute([':search' => "%$search%"]);
        else $stmtF->execute();
        $totalFiltrados = $stmtF->fetchColumn();

        // Procesamiento del orden seleccionado en las cabeceras de la tabla
        $orderBy = " ORDER BY e.idEmpresa DESC";
        if (isset($params['order']) && count($params['order']) > 0) {
            $orderColumnIndex = intval($params['order'][0]['column']);
            $orderDir = $params['order'][0]['dir'] === 'asc' ? 'ASC' : 'DESC';
            
            // Mapa para saber a qué índice pertenece cada columna
            $columnsMap = [
                0 => 'e.siglas',
                1 => 'e.nombre',
                2 => 'e.url_Convenio',
                3 => 'e.inicioConvenio',
                4 => 'e.inicioConvenio' // Fin convenio deriva de inicioConvenio
            ];

            if (isset($columnsMap[$orderColumnIndex])) {
                $orderBy = " ORDER BY " . $columnsMap[$orderColumnIndex] . " " . $orderDir;
            }
        }

        // Límite de paginación para evitar devolver 5.000 filas de golpe
        $limit = "";
        if ($length != -1) {
            $limit = " LIMIT :start, :length";
        }

        // Query final maestra de extracción de datos
        $sql = "SELECT e.idEmpresa as id, e.siglas, e.nombre, e.url_Convenio as convenioUrl, e.inicioConvenio 
                FROM Empresa e 
                $where 
                $orderBy 
                $limit";
        
        $stmt = $this->db->prepare($sql);
        if ($search) $stmt->bindValue(':search', "%$search%");
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        
        // Formateamos las fechas y adjuntamos el array de contactos al payload
        $empresas = $this->formatearEmpresas($stmt->fetchAll(PDO::FETCH_ASSOC));

        return [
            "draw" => (int)($params['draw'] ?? 0),
            "recordsTotal" => (int)$total,
            "recordsFiltered" => (int)$totalFiltrados,
            "data" => $empresas
        ];
    }

    /**
     * Función privada que procesa en bruto las filas devueltas por MySQL para inyectarles:
     * - Fechas calculadas (fin de convenio según configuración central).
     * - Formatos legibles DD/MM/YYYY.
     * - El array "contactosAdicionales" estructurado en JSON como requiere el frontend en Angular.
     * 
     * @param array $empresas Filas crudas extraídas de la tabla Empresa.
     * @return array Matriz tratada lista para enviarse mediante la API.
     */
    private function formatearEmpresas($empresas) {
        if (empty($empresas)) return [];

        // Hacemos una sub-consulta rápida para saber de cuántos años es el convenio en este servidor
        $stmtConf = $this->db->prepare("SELECT tiempo_finalizacion_convenio FROM Configuracion LIMIT 1");
        $stmtConf->execute();
        $conf = $stmtConf->fetch(PDO::FETCH_ASSOC);
        $aniosConvenio = $conf ? intval($conf['tiempo_finalizacion_convenio']) : 1;

        foreach ($empresas as &$empresa) {
            // Conversión inversa: De la base de datos (YYYY-MM-DD HH:MM:SS) a español (DD/MM/YYYY)
            $inicioDt = new DateTime($empresa['inicioConvenio']);
            $empresa['inicioConvenio'] = $inicioDt->format('d/m/Y');
            
            // Calculamos la caducidad inyectando los años definidos en BD
            $finDt = clone $inicioDt;
            $finDt->modify("+$aniosConvenio years");
            $empresa['finConvenio'] = $finDt->format('d/m/Y');

            // Obtenemos los ciclos vinculados a esta empresa
            $sqlCiclos = "SELECT c.siglas, ce.tutor FROM Ciclos c 
                          INNER JOIN Ciclo_Empresa ce ON c.idCiclo = ce.idCiclo 
                          WHERE ce.idEmpresa = :id";
            $stmtCiclos = $this->db->prepare($sqlCiclos);
            $stmtCiclos->execute([':id' => $empresa['id']]);
            $ciclosRel = $stmtCiclos->fetchAll(PDO::FETCH_ASSOC);

            // Guardamos la lista de objetos para el modal y un string para la tabla
            $empresa['ciclosInfo'] = $ciclosRel;
            $empresa['ciclos'] = count($ciclosRel) > 0 ? implode(', ', array_column($ciclosRel, 'siglas')) : 'No asignado';

            // Sacamos absolutamente todos los contactos asociados a esta empresa
            $stmtC = $this->db->prepare("SELECT tfnoContacto, nombreContacto FROM Contacto WHERE idEmpresa = :id ORDER BY idContacto ASC");
            $stmtC->execute([':id' => $empresa['id']]);
            $contactos = $stmtC->fetchAll(PDO::FETCH_ASSOC);

            // Extraemos los contactos para agruparlos según las variables TypeScript requeridas por Angular
            if (count($contactos) > 0) {
                // El primer contacto siempre será asignado al bloque principal
                $empresa['contacto'] = $contactos[0]['nombreContacto'];
                $empresa['numeroContacto'] = $contactos[0]['tfnoContacto'];

                // Los siguientes contactos irán a la matriz (array) de contactos adicionales
                $adicionales = [];
                for ($i = 1; $i < count($contactos); $i++) {
                    $adicionales[] = [
                        'contacto' => $contactos[$i]['nombreContacto'],
                        'numeroContacto' => $contactos[$i]['tfnoContacto']
                    ];
                }
                $empresa['contactosAdicionales'] = $adicionales;
            } else {
                // Previene que Angular falle por campos undefined si alguien editó manual en PhpMyAdmin
                $empresa['contacto'] = '';
                $empresa['numeroContacto'] = '';
                $empresa['contactosAdicionales'] = [];
            }
        }
        return $empresas; // La matriz ahora lleva toda la información
    }

    /**
     * Función privada que encapsula la pequeña pero repetitiva lógica de insertar un registro
     * en la tabla secundaria Contacto. 
     * 
     * @param int $idEmpresa La foránea hacia la que apunta este contacto.
     * @param string $nombre Nombre del contacto personal.
     * @param string $telefono Número del teléfono, sea fijo o móvil.
     * @param string $titular Permite discriminar en BD si el contacto es Principal o Adicional.
     * @return void
     */
    private function insertarContacto($idEmpresa, $nombre, $telefono, $titular) {
        $sql = "INSERT INTO Contacto (idEmpresa, nombreContacto, tfnoContacto, titular) 
                VALUES (:idEmpresa, :nombre, :telefono, :titular)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':idEmpresa' => $idEmpresa,
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':titular' => $titular
        ]);
    }

    /**
     * Vincula una empresa a un ciclo específico mediante sus siglas, incluyendo opcionalmente el tutor.
     */
    private function insertarCicloEmpresa($idEmpresa, $siglaCiclo, $tutor = null) {
        // Primero buscamos el ID del ciclo basándonos en la sigla
        $stmtBusca = $this->db->prepare("SELECT idCiclo FROM Ciclos WHERE siglas = :siglas LIMIT 1");
        $stmtBusca->execute([':siglas' => $siglaCiclo]);
        $ciclo = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        if ($ciclo) {
            $sql = "INSERT INTO Ciclo_Empresa (idCiclo, idEmpresa, tutor) VALUES (:idC, :idE, :tutor)";
            $stmtInsert = $this->db->prepare($sql);
            $stmtInsert->execute([
                ':idC' => $ciclo['idCiclo'],
                ':idE' => $idEmpresa,
                ':tutor' => $tutor
            ]);
        }
    }
}
?>
