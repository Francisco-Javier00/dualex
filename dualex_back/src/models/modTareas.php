<?php
namespace Dualex\Models;

use Exception;
use PDO;
use PDOException;
use Dualex\Core\ConexionDB;

/**
 * File-level docblock for modTareas.php
 * 
 */
/**
 * Modelo para la gestión de las Tarea asignadas y entregadas por los Alumno.
 * 
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
                JOIN Modulo m ON ma.idModulo = m.idModulo
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
     * Lista todas las Tarea globales almacenadas en el sistema uniendo datos del alumno respectivo.
     * 
     * @return array Vector con las Tarea y sus autores.
     */
    public function listar() {
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.documento, t.idAlumno, u.nombre as nombre_alumno, u.apellidos as apellidos_alumno 
                FROM Tarea t 
                JOIN Alumno a ON t.idAlumno = a.idAlumno
                JOIN Usuario u ON a.idAlumno = u.idUsuario
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
     * Recupera exclusivamente las Tarea ligadas a un alumno específico.
     * 
     * @param int $idAlumno ID del estudiante.
     * @return array Lista de Tarea.
     */
    public function listarPorAlumno($idAlumno) {
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.documento, t.idAlumno
                FROM Tarea t 
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
        $sql = "SELECT t.idTarea as id, t.codigo_auto, t.titulo, t.fecha_inicio as fechaIni, t.fecha_fin as fechaFin, t.fecha_fin as fechaLimite, t.descripcion, t.calificacion, t.comentario as comentarioEmpresa, t.documento, t.idAlumno
                FROM Tarea t 
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
        $sqlRev = "SELECT m.sigla as modulo, mtr.revisada, mtr.observaciones 
                   FROM Modulo_Tarea_Revision mtr
                   JOIN Modulo m ON mtr.idModulo = m.idModulo
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
                    'revisado' => $isRevisada,
                    'comentario' => $rev['observaciones'] ?? ''
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
        // Obtener anio_escolar y siglas del ciclo del alumno
        $sqlInfo = "SELECT cu.anio_escolar, ci.siglas 
                    FROM Alumno a
                    JOIN Curso cu ON a.idCurso = cu.idCurso
                    JOIN Ciclo ci ON cu.idCiclo = ci.idCiclo
                    WHERE a.idAlumno = :idAlumno";
        $stmtInfo = $this->db->prepare($sqlInfo);
        $stmtInfo->execute([':idAlumno' => (int)$datos['idAlumno']]);
        $info = $stmtInfo->fetch(PDO::FETCH_ASSOC);
        
        $anio = $info ? trim($info['anio_escolar']) : '24-25';
        $siglas = $info ? trim($info['siglas']) : 'DAW';

        $sql = "INSERT INTO Tarea (idAlumno, codigo_auto, titulo, fecha_inicio, fecha_fin, descripcion, calificacion, comentario, documento) 
                VALUES (:idAlumno, '', :titulo, :fecha_inicio, :fecha_fin, :descripcion, :calificacion, :comentario, :documento)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':idAlumno'     => (int)$datos['idAlumno'],
            ':titulo'       => $datos['titulo'],
            ':fecha_inicio' => $datos['fechaIni'] ?? date('Y-m-d H:i:s'),
            ':fecha_fin'    => $datos['fechaFin'] ?? date('Y-m-d H:i:s'),
            ':descripcion'  => $datos['descripcion'] ?? '',
            ':calificacion' => $this->mapCalificacionToDb($datos['evaluacionEmpresa'] ?? $datos['calificacion'] ?? null),
            ':comentario'   => $datos['comentarioEmpresa'] ?? null,
            ':documento'    => $datos['documento'] ?? null
        ]);
        
        $idTarea = $this->db->lastInsertId();
        
        // Formar código definitivo: anioEscolar_siglasCiclo_T[id]
        $codigo_auto = $anio . '_' . $siglas . '_T' . $idTarea;
        
        $sqlUpdate = "UPDATE Tarea SET codigo_auto = :codigo_auto WHERE idTarea = :idTarea";
        $stmtUpdate = $this->db->prepare($sqlUpdate);
        $stmtUpdate->execute([
            ':codigo_auto' => $codigo_auto,
            ':idTarea' => $idTarea
        ]);
        
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
            $sqlMods = "SELECT DISTINCT ma.idModulo, m.nombre, m.sigla
                        FROM Modulo_Actividad ma
                        JOIN Modulo m ON ma.idModulo = m.idModulo
                        WHERE ma.idActividad IN (" . implode(',', array_map('intval', $datos['actividadesSeleccionadas'])) . ")";
            $stmtMods = $this->db->prepare($sqlMods);
            $stmtMods->execute();
            $modules = $stmtMods->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $revisionesMap = [];
        if (!empty($datos['revisionesModulos'])) {
            foreach ($datos['revisionesModulos'] as $rev) {
                $key = strtoupper(trim($rev['modulo'] ?? ''));
                if ($key === '') continue;
                $revisionesMap[$key] = [
                    'revisado' => (bool)$rev['revisado'],
                    'comentario' => $rev['comentario'] ?? ''
                ];
            }
        }
        
        if (!empty($modules)) {
            foreach ($modules as $mod) {
                // El frontend puede enviar el módulo por nombre o por sigla (p.ej. "Programación" o "PROG").
                $keyNombre = strtoupper(trim($mod['nombre'] ?? ''));
                $keySigla = strtoupper(trim($mod['sigla'] ?? ''));
                $key = isset($revisionesMap[$keyNombre]) ? $keyNombre : (isset($revisionesMap[$keySigla]) ? $keySigla : null);

                $revisadaVal = ($key && !empty($revisionesMap[$key]['revisado'])) ? 1 : 0;
                $observacionesVal = $key ? ($revisionesMap[$key]['comentario'] ?? '') : '';
                $sqlRev = "INSERT INTO Modulo_Tarea_Revision (idModulo, idTarea, revisada, observaciones) 
                           VALUES (:idModulo, :idTarea, $revisadaVal, :observaciones)";
                $stmtRev = $this->db->prepare($sqlRev);
                $stmtRev->execute([
                    ':idModulo' => $mod['idModulo'],
                    ':idTarea' => $idTarea,
                    ':observaciones' => $observacionesVal
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
        $sql = "UPDATE Tarea SET 
                titulo = :titulo, 
                fecha_inicio = :fecha_inicio, 
                fecha_fin = :fecha_fin, 
                descripcion = :descripcion, 
                calificacion = :calificacion, 
                comentario = :comentario,
                documento = COALESCE(:documento, documento) 
                WHERE idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':titulo' => $datos['titulo'],
            ':fecha_inicio' => $datos['fechaIni'],
            ':fecha_fin' => $datos['fechaFin'],
            ':descripcion' => $datos['descripcion'] ?? '',
            ':calificacion' => $this->mapCalificacionToDb($datos['evaluacionEmpresa'] ?? $datos['calificacion'] ?? null),
            ':comentario' => $datos['comentarioEmpresa'] ?? null,
            ':documento' => $datos['documento'] ?? null
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
            $sqlMods = "SELECT DISTINCT ma.idModulo, m.nombre, m.sigla
                        FROM Modulo_Actividad ma
                        JOIN Modulo m ON ma.idModulo = m.idModulo
                        WHERE ma.idActividad IN (" . implode(',', array_map('intval', $datos['actividadesSeleccionadas'])) . ")";
            $stmtMods = $this->db->prepare($sqlMods);
            $stmtMods->execute();
            $modules = $stmtMods->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $revisionesMap = [];
        if (!empty($datos['revisionesModulos'])) {
            foreach ($datos['revisionesModulos'] as $rev) {
                $key = strtoupper(trim($rev['modulo'] ?? ''));
                if ($key === '') continue;
                $revisionesMap[$key] = [
                    'revisado' => (bool)$rev['revisado'],
                    'comentario' => $rev['comentario'] ?? ''
                ];
            }
        }
        
        $sqlDelRev = "DELETE FROM Modulo_Tarea_Revision WHERE idTarea = :idTarea";
        $stmtDelRev = $this->db->prepare($sqlDelRev);
        $stmtDelRev->execute([':idTarea' => $id]);
        
        if (!empty($modules)) {
            foreach ($modules as $mod) {
                $keyNombre = strtoupper(trim($mod['nombre'] ?? ''));
                $keySigla = strtoupper(trim($mod['sigla'] ?? ''));
                $key = isset($revisionesMap[$keyNombre]) ? $keyNombre : (isset($revisionesMap[$keySigla]) ? $keySigla : null);

                $revisadaVal = ($key && !empty($revisionesMap[$key]['revisado'])) ? 1 : 0;
                $observacionesVal = $key ? ($revisionesMap[$key]['comentario'] ?? '') : '';
                $sqlRev = "INSERT INTO Modulo_Tarea_Revision (idModulo, idTarea, revisada, observaciones) 
                           VALUES (:idModulo, :idTarea, $revisadaVal, :observaciones)";
                $stmtRev = $this->db->prepare($sqlRev);
                $stmtRev->execute([
                    ':idModulo' => $mod['idModulo'],
                    ':idTarea' => $id,
                    ':observaciones' => $observacionesVal
                ]);
            }
        }
        
        return $this->obtener($id);
    }

    /**
     * Guarda un PDF en el servidor asociado a una tarea.
     * 
     * @param int $idTarea ID de la tarea.
     * @param array $archivo $_FILES['documento']
     * @return string|false Nombre del archivo guardado o false si falla.
     */
    public function subirDocumento($idTarea, $archivo) {
        $uploadDir = __DIR__ . '/../../uploads/documentos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        if ($extension !== 'pdf') {
            return false;
        }

        $nombreArchivo = 'tarea_' . $idTarea . '_' . time() . '.pdf';
        $rutaDestino = $uploadDir . $nombreArchivo;

        if (move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
            $sql = "UPDATE Tarea SET documento = :documento WHERE idTarea = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':documento' => $nombreArchivo,
                ':id' => $idTarea
            ]);
            return $nombreArchivo;
        }

        return false;
    }

    /**
     * Obtiene la ruta de un documento PDF asociado a una tarea.
     * 
     * @param int $idTarea ID de la tarea.
     * @return string|null Ruta absoluta del archivo o null si no existe.
     */
    public function obtenerRutaDocumento($idTarea) {
        $sql = "SELECT documento FROM Tarea WHERE idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $idTarea]);
        $nombreArchivo = $stmt->fetchColumn();

        if (!$nombreArchivo) {
            return null;
        }

        $ruta = __DIR__ . '/../../uploads/documentos/' . $nombreArchivo;
        return file_exists($ruta) ? $ruta : null;
    }

    /**
     * Elimina el registro de una tarea de forma definitiva.
     * 
     * @param int $id Identificador del trabajo.
     * @return bool True tras confirmarse el DELETE en la BD.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Tarea WHERE idTarea = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
