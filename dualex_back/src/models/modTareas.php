<?php

class ModTareas {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT t.*, a.nombre as nombre_alumno, a.apellidos as apellidos_alumno 
                FROM tareas t 
                JOIN alumnos a ON t.id_alumno = a.id 
                ORDER BY t.id DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarPorAlumno($idAlumno) {
        $sql = "SELECT * FROM tareas WHERE id_alumno = :id_alumno ORDER BY id DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id_alumno', $idAlumno, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $sql = "SELECT * FROM tareas WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crear($datos) {
        $sql = "INSERT INTO tareas (id_alumno, titulo, descripcion, modulos, fecha_ini, fecha_fin, calificacion, progreso_actual, progreso_total) 
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

    public function actualizar($id, $datos) {
        $modulosStr = is_array($datos['modulos']) ? implode(', ', $datos['modulos']) : $datos['modulos'];
        
        $sql = "UPDATE tareas SET 
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

    public function eliminar($id) {
        $sql = "DELETE FROM tareas WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
