<?php

/**
 * Modelo para la gestión de las Tareas asignadas y entregadas por los alumnos.
 * 
 * @package Dualex\Models
 */
class ModTareas {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Mapea el texto de calificación del frontend al valor de base de datos.
     */
    private function mapCalificacionToDb($val) {
        if (!$val || strtolower($val) === 'sin calificar') {
            return null;
        }
        $valLower = strtolower(trim($val));
        if ($valLower === 'superado') return 'superado';
        if ($valLower === 'bien') return 'bien';
        if ($valLower === 'notable') return 'notable';
        if ($valLower === 'excelente') return 'excelente';
        if ($valLower === 'no superado') return 'no superado';
        return null;
    }

    /**
     * Mapea el valor de la base de datos al formato del frontend.
     */
    private function mapCalificacionFromDb($val) {
        if (!$val) {
            return 'Sin Calificar';
        }
        $valLower = strtolower(trim($val));
        if ($valLower === 'superado') return 'Superado';
        if ($valLower === 'bien') return 'Bien';
        if ($valLower === 'notable') return 'Notable';
        if ($valLower === 'excelente') return 'Excelente';
        if ($valLower === 'no superado') return 'No Superado';
        return 'Sin Calificar';
    }

    /**
     * Helper para obtener las siglas de los módulos de una tarea.
     */
    private function obtenerModulosSiglas($idTarea) {
        $sql = "SELECT DISTINCT m.sigla, m.color 
                FROM Tarea_Actividad ta
                JOIN Modulo_Actividad ma ON ta.idActividad = ma.idActividad
                JOIN Modulos m ON ma.idModulo = m.idModulo
                WHERE ta.idTarea = :idTarea";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idTarea' => $idTarea]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Helper para calcular el progreso (revisado/total) de una tarea.
     */
    private function obtenerProgreso($idTarea) {
        $sql = "SELECT revisada FROM Modulo_Tarea_Revision WHERE idTarea = :idTarea";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idTarea' => $idTarea]);
        $revisions = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $total = count($revisions);
        $actual = 0;
        foreach ($revisions as $rev) {
            $val = is_numeric($rev) ? (int)$rev : ord($rev);
            if ($val === 1) {
                $actual++;
            }
        }
        return [
            'actual' => $actual,
            'total' => $total > 0 ? $total : 1
        ];
    }

    /**
     * Lista todas las tareas globales almacenadas en el sistema uniendo datos del alumno respectivo.
     * 
     * @return array Vector con las tareas y sus autores.
     */
    public function listar() {
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.idAlumno, u.nombre as nombre_alumno, u.apellidos as apellidos_alumno 
                FROM Tareas t 
                JOIN Alumnos a ON t.idAlumno = a.idAlumnos
                JOIN Usuarios u ON a.idAlumnos = u.idUsuario
                ORDER BY t.idTarea DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tareas as &$t) {
            $t['id'] = (int)$t['id'];
            $t['idAlumno'] = (int)$t['idAlumno'];
            $t['calificacion'] = $this->mapCalificacionFromDb($t['calificacion']);
            $t['fechaIni'] = $t['fechaIni'] ? substr($t['fechaIni'], 0, 10) : null;
            $t['fechaFin'] = $t['fechaFin'] ? substr($t['fechaFin'], 0, 10) : null;
            $t['fechaLimite'] = $t['fechaLimite'] ? substr($t['fechaLimite'], 0, 10) : null;
            $t['modulos'] = $this->obtenerModulosSiglas($t['id']);
            $t['progreso'] = $this->obtenerProgreso($t['id']);
        }
        return $tareas;
    }

    /**
     * Recupera exclusivamente las tareas ligadas a un alumno específico.
     * 
     * @param int $idAlumno ID del estudiante.
     * @return array Lista de tareas.
     */
    public function listarPorAlumno($idAlumno) {
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.idAlumno
                FROM Tareas t 
                WHERE t.idAlumno = :idAlumno 
                ORDER BY t.idTarea DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idAlumno', $idAlumno, PDO::PARAM_INT);
        $stmt->execute();
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tareas as &$t) {
            $t['id'] = (int)$t['id'];
            $t['idAlumno'] = (int)$t['idAlumno'];
            $t['calificacion'] = $this->mapCalificacionFromDb($t['calificacion']);
            $t['fechaIni'] = $t['fechaIni'] ? substr($t['fechaIni'], 0, 10) : null;
            $t['fechaFin'] = $t['fechaFin'] ? substr($t['fechaFin'], 0, 10) : null;
            $t['fechaLimite'] = $t['fechaLimite'] ? substr($t['fechaLimite'], 0, 10) : null;
            $t['modulos'] = $this->obtenerModulosSiglas($t['id']);
            $t['progreso'] = $this->obtenerProgreso($t['id']);
        }
        return $tareas;
    }

    /**
     * Devuelve el estado y características de una sola tarea en base a su ID.
     * 
     * @param int $id Clave principal de la tarea.
     * @return array|false Datos de la tarea solicitada.
     */
    public function obtener($id) {
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.idAlumno
                FROM Tareas t 
                WHERE t.idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $t = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$t) {
            return false;
        }
        
        $t['id'] = (int)$t['id'];
        $t['idAlumno'] = (int)$t['idAlumno'];
        $t['fechaIni'] = $t['fechaIni'] ? substr($t['fechaIni'], 0, 10) : null;
        $t['fechaFin'] = $t['fechaFin'] ? substr($t['fechaFin'], 0, 10) : null;
        $t['fechaLimite'] = $t['fechaLimite'] ? substr($t['fechaLimite'], 0, 10) : null;
        $t['evaluacionEmpresa'] = $this->mapCalificacionFromDb($t['calificacion']);
        $t['calificacion'] = $t['evaluacionEmpresa'];
        
        // Adjuntar siglas de módulos
        $t['modulos'] = $this->obtenerModulosSiglas($t['id']);
        
        // Adjuntar progreso
        $t['progreso'] = $this->obtenerProgreso($t['id']);
        
        // Adjuntar IDs de actividades seleccionadas
        $sqlAct = "SELECT idActividad FROM Tarea_Actividad WHERE idTarea = :idTarea";
        $stmtAct = $this->db->prepare($sqlAct);
        $stmtAct->execute([':idTarea' => $id]);
        $t['actividadesSeleccionadas'] = array_map('intval', $stmtAct->fetchAll(PDO::FETCH_COLUMN));
        
        // Adjuntar revisiones por módulo
        $sqlRev = "SELECT m.nombre as modulo, mtr.revisada, mtr.observaciones 
                   FROM Modulo_Tarea_Revision mtr
                   JOIN Modulos m ON mtr.idModulo = m.idModulo
                   WHERE mtr.idTarea = :idTarea";
        $stmtRev = $this->db->prepare($sqlRev);
        $stmtRev->execute([':idTarea' => $id]);
        $revisions = $stmtRev->fetchAll(PDO::FETCH_ASSOC);
        
        $t['revisionesModulos'] = [];
        $t['revisadoProfesor'] = true;
        $t['comentarioProfesor'] = '';
        
        if (count($revisions) > 0) {
            foreach ($revisions as $rev) {
                $val = is_numeric($rev['revisada']) ? (int)$rev['revisada'] : ord($rev['revisada']);
                $isRevisada = ($val === 1);
                
                $t['revisionesModulos'][] = [
                    'modulo' => $rev['modulo'],
                    'revisado' => $isRevisada
                ];
                
                if (!$isRevisada) {
                    $t['revisadoProfesor'] = false;
                }
                
                // Mapear observaciones al comentario profesor general
                if (empty($t['comentarioProfesor']) && !empty($rev['observaciones'])) {
                    $t['comentarioProfesor'] = $rev['observaciones'];
                }
            }
        } else {
            $t['revisadoProfesor'] = false;
        }
        
        return $t;
    }

    /**
     * Inserta una nueva entrega/tarea del cuaderno del alumno en el sistema.
     * 
     * @param array $datos Estructura del cuerpo de la petición.
     * @return array La tarea recién creada.
     */
    public function crear($datos) {
        $codigo_auto = 'T-' . strtoupper(substr(md5(uniqid()), 0, 8));
        
        $sql = "INSERT INTO Tareas (idAlumno, codigo_auto, titulo, fecha_inicio, fecha_fin, descripcion, calificacion, comentario) 
                VALUES (:idAlumno, :codigo_auto, :titulo, :fecha_inicio, :fecha_fin, :descripcion, :calificacion, :comentario)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':idAlumno'     => (int)$datos['idAlumno'],
            ':codigo_auto'  => $codigo_auto,
            ':titulo'       => $datos['titulo'],
            ':fecha_inicio' => $datos['fechaIni'] ?? date('Y-m-d H:i:s'),
            ':fecha_fin'    => $datos['fechaFin'] ?? date('Y-m-d H:i:s'),
            ':descripcion'  => $datos['descripcion'] ?? '',
            ':calificacion' => $this->mapCalificacionToDb($datos['evaluacionEmpresa'] ?? $datos['calificacion'] ?? null),
            ':comentario'   => $datos['comentarioEmpresa'] ?? null
        ]);
        
        $idTarea = $this->db->lastInsertId();
        
        // Guardar actividades relacionadas
        if (!empty($datos['actividadesSeleccionadas'])) {
            $sqlAct = "INSERT INTO Tarea_Actividad (idTarea, idActividad) VALUES (:idTarea, :idActividad)";
            $stmtAct = $this->db->prepare($sqlAct);
            foreach ($datos['actividadesSeleccionadas'] as $actId) {
                $stmtAct->execute([':idTarea' => $idTarea, ':idActividad' => (int)$actId]);
            }
        }
        
        // Calcular módulos únicos de las actividades para crear la revisión
        $modules = [];
        if (!empty($datos['actividadesSeleccionadas'])) {
            $sqlMods = "SELECT DISTINCT ma.idModulo, m.nombre 
                        FROM Modulo_Actividad ma
                        JOIN Modulos m ON ma.idModulo = m.idModulo
                        WHERE ma.idActividad IN (" . implode(',', array_map('intval', $datos['actividadesSeleccionadas'])) . ")";
            $stmtMods = $this->db->prepare($sqlMods);
            $stmtMods->execute();
            $modules = $stmtMods->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $revisionesMap = [];
        if (!empty($datos['revisionesModulos'])) {
            foreach ($datos['revisionesModulos'] as $rev) {
                $revisionesMap[$rev['modulo']] = (bool)$rev['revisado'];
            }
        }
        
        $comentarioProfesor = $datos['comentarioProfesor'] ?? '';
        
        if (!empty($modules)) {
            foreach ($modules as $mod) {
                $revisadaVal = (isset($revisionesMap[$mod['nombre']]) && $revisionesMap[$mod['nombre']]) ? 1 : 0;
                $sqlRev = "INSERT INTO Modulo_Tarea_Revision (idModulo, idTarea, revisada, observaciones) 
                           VALUES (:idModulo, :idTarea, $revisadaVal, :observaciones)";
                $stmtRev = $this->db->prepare($sqlRev);
                $stmtRev->execute([
                    ':idModulo' => $mod['idModulo'],
                    ':idTarea' => $idTarea,
                    ':observaciones' => $comentarioProfesor
                ]);
            }
        }
        
        return $this->obtener($idTarea);
    }

    /**
     * Aplica modificaciones sobre una tarea existente.
     * 
     * @param int $id ID de la tarea a alterar.
     * @param array $datos Matriz con la información en su nuevo estado.
     * @return array Registro de la tarea tras guardarse.
     */
    public function actualizar($id, $datos) {
        $sql = "UPDATE Tareas SET 
                titulo = :titulo, 
                fecha_inicio = :fecha_inicio, 
                fecha_fin = :fecha_fin, 
                descripcion = :descripcion, 
                calificacion = :calificacion, 
                comentario = :comentario 
                WHERE idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':titulo' => $datos['titulo'],
            ':fecha_inicio' => $datos['fechaIni'],
            ':fecha_fin' => $datos['fechaFin'],
            ':descripcion' => $datos['descripcion'] ?? '',
            ':calificacion' => $this->mapCalificacionToDb($datos['evaluacionEmpresa'] ?? $datos['calificacion'] ?? null),
            ':comentario' => $datos['comentarioEmpresa'] ?? null
        ]);
        
        // Actualizar actividades relacionadas
        $sqlDelAct = "DELETE FROM Tarea_Actividad WHERE idTarea = :idTarea";
        $stmtDelAct = $this->db->prepare($sqlDelAct);
        $stmtDelAct->execute([':idTarea' => $id]);
        
        if (!empty($datos['actividadesSeleccionadas'])) {
            $sqlAct = "INSERT INTO Tarea_Actividad (idTarea, idActividad) VALUES (:idTarea, :idActividad)";
            $stmtAct = $this->db->prepare($sqlAct);
            foreach ($datos['actividadesSeleccionadas'] as $actId) {
                $stmtAct->execute([':idTarea' => $id, ':idActividad' => (int)$actId]);
            }
        }
        
        // Actualizar revisiones de módulos
        $modules = [];
        if (!empty($datos['actividadesSeleccionadas'])) {
            $sqlMods = "SELECT DISTINCT ma.idModulo, m.nombre 
                        FROM Modulo_Actividad ma
                        JOIN Modulos m ON ma.idModulo = m.idModulo
                        WHERE ma.idActividad IN (" . implode(',', array_map('intval', $datos['actividadesSeleccionadas'])) . ")";
            $stmtMods = $this->db->prepare($sqlMods);
            $stmtMods->execute();
            $modules = $stmtMods->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $revisionesMap = [];
        if (!empty($datos['revisionesModulos'])) {
            foreach ($datos['revisionesModulos'] as $rev) {
                $revisionesMap[$rev['modulo']] = (bool)$rev['revisado'];
            }
        }
        
        $comentarioProfesor = $datos['comentarioProfesor'] ?? '';
        
        $sqlDelRev = "DELETE FROM Modulo_Tarea_Revision WHERE idTarea = :idTarea";
        $stmtDelRev = $this->db->prepare($sqlDelRev);
        $stmtDelRev->execute([':idTarea' => $id]);
        
        if (!empty($modules)) {
            foreach ($modules as $mod) {
                $revisadaVal = (isset($revisionesMap[$mod['nombre']]) && $revisionesMap[$mod['nombre']]) ? 1 : 0;
                $sqlRev = "INSERT INTO Modulo_Tarea_Revision (idModulo, idTarea, revisada, observaciones) 
                           VALUES (:idModulo, :idTarea, $revisadaVal, :observaciones)";
                $stmtRev = $this->db->prepare($sqlRev);
                $stmtRev->execute([
                    ':idModulo' => $mod['idModulo'],
                    ':idTarea' => $id,
                    ':observaciones' => $comentarioProfesor
                ]);
            }
        }
        
        return $this->obtener($id);
    }

    /**
     * Elimina el registro de una tarea de forma definitiva.
     * 
     * @param int $id Identificador del trabajo.
     * @return bool True tras confirmarse el DELETE en la BD.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Tareas WHERE idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
