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
     * Lista todas las tareas globales almacenadas en el sistema uniendo datos del alumno respectivo.
     * 
     * @return array Vector con las tareas y sus autores.
     */
    public function listar() {
        $sql = "SELECT t.*, u.nombre as nombre_alumno, u.apellidos as apellidos_alumno 
                FROM Tareas t 
                JOIN Alumnos a ON t.id_alumno = a.idAlumnos
                JOIN Usuarios u ON a.idAlumnos = u.idUsuario
                ORDER BY t.id DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Recupera exclusivamente las tareas ligadas a un alumno específico.
     * 
     * @param int $idAlumno ID del estudiante.
     * @return array Lista de tareas.
     */
    public function listarPorAlumno($idAlumno) {
        $sql = "SELECT * FROM Tareas WHERE id_alumno = :id_alumno ORDER BY id DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id_alumno', $idAlumno, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve el estado y características de una sola tarea en base a su ID.
     * 
     * @param int $id Clave principal de la tarea.
     * @return array|false Datos de la tarea solicitada.
     */
    public function obtener($id) {
        $sql = "SELECT * FROM Tareas WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Inserta una nueva entrega/tarea del cuaderno del alumno en el sistema.
     * 
     * @param array $datos Estructura del cuerpo de la petición con titulo, fecha, progreso, etc.
     * @return array La tarea recién creada.
     */
    public function crear($datos) {
        $sql = "INSERT INTO Tareas (id_alumno, titulo, descripcion, modulos, fecha_ini, fecha_fin, calificacion, progreso_actual, progreso_total) 
                VALUES (:id_alumno, :titulo, :descripcion, :modulos, :fecha_ini, :fecha_fin, :calificacion, :prog_act, :prog_tot)";
        $stmt = $this->db->prepare($sql);
        
        // El campo modulos en Angular es un array, lo guardamos como JSON o string separado por comas
        $modulosStr = is_array($datos['modulos']) ? implode(', ', $datos['modulos']) : $datos['modulos'];
        
        $stmt->execute([
            ':id_alumno'    => $datos['idAlumno'],
            ':titulo'       => $datos['titulo'],
            ':descripcion'  => $datos['descripcion'] ?? '',
            ':modulos'      => $modulosStr,
            ':fecha_ini'    => $datos['fechaIni'] ?? date('Y-m-d'),
            ':fecha_fin'    => $datos['fechaFin'] ?? null,
            ':calificacion' => $datos['calificacion'] ?? 'Sin calificar',
            ':prog_act'     => $datos['progreso']['actual'] ?? 0,
            ':prog_tot'     => $datos['progreso']['total'] ?? 1
        ]);
        return $this->obtener($this->db->lastInsertId());
    }

    /**
     * Aplica modificaciones sobre una tarea existente (Ej. cambios del profesor en la calificación).
     * 
     * @param int $id ID de la tarea a alterar.
     * @param array $datos Matriz con la información en su nuevo estado.
     * @return array Registro de la tarea tras guardarse.
     */
    public function actualizar($id, $datos) {
        $modulosStr = is_array($datos['modulos']) ? implode(', ', $datos['modulos']) : $datos['modulos'];
        
        $sql = "UPDATE Tareas SET 
                titulo = :titulo, descripcion = :descripcion, modulos = :modulos, 
                fecha_ini = :fecha_ini, fecha_fin = :fecha_fin, calificacion = :calificacion, 
                progreso_actual = :prog_act, progreso_total = :prog_tot 
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id'           => $id,
            ':titulo'       => $datos['titulo'],
            ':descripcion'  => $datos['descripcion'],
            ':modulos'      => $modulosStr,
            ':fecha_ini'    => $datos['fechaIni'],
            ':fecha_fin'    => $datos['fechaFin'],
            ':calificacion' => $datos['calificacion'],
            ':prog_act'     => $datos['progreso']['actual'],
            ':prog_tot'     => $datos['progreso']['total']
        ]);
        return $this->obtener($id);
    }

    /**
     * Elimina el registro de una tarea de forma definitiva.
     * 
     * @param int $id Identificador del trabajo.
     * @return bool True tras confirmarse el DELETE en la BD.
     */
    public function eliminar($id) {
        $sql = "DELETE FROM Tareas WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
