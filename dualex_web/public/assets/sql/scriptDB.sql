USE `dualex`;

CREATE TABLE Usuarios (
    idUsuario SMALLINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    tipo CHAR(2) NOT NULL,

    CONSTRAINT pk_usuarios PRIMARY KEY (idUsuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT chk_usuarios_tipo CHECK (tipo IN ('P', 'A'))
);

CREATE TABLE Profesor (
    idProfesor SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_profesor PRIMARY KEY (idProfesor),
    CONSTRAINT fk_profesor_usuario FOREIGN KEY (idProfesor)
        REFERENCES Usuarios(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Coordinador (
    idCoordinador SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_coordinador PRIMARY KEY (idCoordinador),
    CONSTRAINT fk_coordinador_profesor FOREIGN KEY (idCoordinador)
        REFERENCES Profesor(idProfesor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Ciclos (
    idCiclo TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    siglas CHAR(5) NOT NULL,
    idCoordinador SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_ciclos PRIMARY KEY (idCiclo),
    CONSTRAINT fk_ciclos_coordinador FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON UPDATE CASCADE
);

CREATE TABLE Cursos (
    idCurso TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    anio_escolar CHAR(5) NOT NULL,
    idCiclo TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_cursos PRIMARY KEY (idCurso),
    CONSTRAINT fk_cursos_ciclos FOREIGN KEY (idCiclo)
        REFERENCES Ciclos(idCiclo)
        ON UPDATE CASCADE
);

CREATE TABLE Empresa (
    idEmpresa SMALLINT UNSIGNED AUTO_INCREMENT,
    siglas CHAR(6) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    inicioConvenio TIMESTAMP NOT NULL,
    url_Convenio VARCHAR(100) NOT NULL,
    idCoordinador SMALLINT UNSIGNED NULL,

    CONSTRAINT pk_empresa PRIMARY KEY (idEmpresa),
    CONSTRAINT fk_empresa_coordinador FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Alumnos (
    idAlumnos SMALLINT UNSIGNED NOT NULL,
    DNI CHAR(15) NOT NULL,
    NUSS CHAR(12) NOT NULL,
    NIA CHAR(10) NOT NULL,
    telefono CHAR(15) NOT NULL,
    repetidor BIT NOT NULL DEFAULT 0,
    idCurso TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_alumnos PRIMARY KEY (idAlumnos),
    CONSTRAINT uq_alumnos_dni UNIQUE (DNI),
    CONSTRAINT uq_alumnos_nuss UNIQUE (NUSS),
    CONSTRAINT uq_alumnos_nia UNIQUE (NIA),
    CONSTRAINT fk_alumnos_usuario FOREIGN KEY (idAlumnos)
        REFERENCES Usuarios(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_alumnos_curso FOREIGN KEY (idCurso)
        REFERENCES Cursos(idCurso)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE ANEXO_IV (
    idAnexo SMALLINT UNSIGNED AUTO_INCREMENT,
    idAlumnos SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_anexo_iv PRIMARY KEY (idAnexo),
    CONSTRAINT fk_anexo_iv_alumnos FOREIGN KEY (idAlumnos)
        REFERENCES Alumnos(idAlumnos)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Contacto (
    idContacto SMALLINT UNSIGNED AUTO_INCREMENT,
    tfnoContacto CHAR(15) NOT NULL,
    nombreContacto VARCHAR(50) NOT NULL,
    titular VARCHAR(50) NOT NULL,
    idEmpresa SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_contacto PRIMARY KEY (idContacto),
    CONSTRAINT fk_contacto_empresa FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulos (
    idModulo TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    sigla CHAR(5) NOT NULL,
    color VARCHAR(36) NOT NULL,

    CONSTRAINT pk_modulos PRIMARY KEY (idModulo)
);

CREATE TABLE Actividades (
    idActividad SMALLINT UNSIGNED AUTO_INCREMENT,
    titulo VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    idCoordinador SMALLINT UNSIGNED NULL,

    CONSTRAINT pk_actividades PRIMARY KEY (idActividad),
    CONSTRAINT fk_actividades_coordinador FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Tareas (
    idTarea SMALLINT UNSIGNED AUTO_INCREMENT,
    codigo_auto VARCHAR(20) NOT NULL,
    titulo VARCHAR(60) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    calificacion CHAR(13) NULL,
    comentario VARCHAR(255) NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_tareas PRIMARY KEY (idTarea),
    CONSTRAINT chk_tareas_calificacion CHECK (
        calificacion IN (
            'insuficiente',
            'suficiente',
            'bien',
            'notable',
            'sobresaliente'
        )
    ),
    CONSTRAINT fk_tareas_alumnos FOREIGN KEY (idAlumno)
        REFERENCES Alumnos(idAlumnos)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Tarea_Actividad (
    idTarea SMALLINT UNSIGNED NOT NULL,
    idActividad SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_tarea_actividad PRIMARY KEY (idTarea, idActividad),
    CONSTRAINT fk_tarea_actividad_tarea FOREIGN KEY (idTarea)
        REFERENCES Tareas(idTarea)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tarea_actividad_actividad FOREIGN KEY (idActividad)
        REFERENCES Actividades(idActividad)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Actividad (
    idModulo TINYINT UNSIGNED NOT NULL,
    idActividad SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_actividad PRIMARY KEY (idModulo, idActividad),
    CONSTRAINT fk_modulo_actividad_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_actividad_actividad FOREIGN KEY (idActividad)
        REFERENCES Actividades(idActividad)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Curso (
    idModulo TINYINT UNSIGNED NOT NULL,
    idCurso TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_curso PRIMARY KEY (idModulo, idCurso),
    CONSTRAINT fk_modulo_curso_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_curso_curso FOREIGN KEY (idCurso)
        REFERENCES Cursos(idCurso)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Profesor (
    idModulo TINYINT UNSIGNED NOT NULL,
    idProfesor SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_profesor PRIMARY KEY (idModulo, idProfesor),
    CONSTRAINT fk_modulo_profesor_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_profesor_profesor FOREIGN KEY (idProfesor)
        REFERENCES Profesor(idProfesor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Alumno_Cursa (
    idModulo TINYINT UNSIGNED NOT NULL,
    idAlumnos SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_alumno_cursa PRIMARY KEY (idModulo, idAlumnos),
    CONSTRAINT fk_modulo_alumno_cursa_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_alumno_cursa_alumno FOREIGN KEY (idAlumnos)
        REFERENCES Alumnos(idAlumnos)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Alumno_Pendiente (
    idModulo TINYINT UNSIGNED NOT NULL,
    idAlumnos SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_alumno_pendiente PRIMARY KEY (idModulo, idAlumnos),
    CONSTRAINT fk_modulo_alumno_pendiente_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_alumno_pendiente_alumno FOREIGN KEY (idAlumnos)
        REFERENCES Alumnos(idAlumnos)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Tarea_Revision (
    idModulo TINYINT UNSIGNED NOT NULL,
    idTarea SMALLINT UNSIGNED NOT NULL,
    revisada BIT NOT NULL DEFAULT 0,
    observaciones VARCHAR(255) NOT NULL,

    CONSTRAINT pk_modulo_tarea_revision PRIMARY KEY (idModulo, idTarea),
    CONSTRAINT fk_modulo_tarea_revision_modulo FOREIGN KEY (idModulo)
        REFERENCES Modulos(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_modulo_tarea_revision_tarea FOREIGN KEY (idTarea)
        REFERENCES Tareas(idTarea)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Ciclo_Empresa (
    idCiclo TINYINT UNSIGNED NOT NULL,
    idEmpresa SMALLINT UNSIGNED NOT NULL,
    tutor VARCHAR(50) NOT NULL,

    CONSTRAINT pk_ciclo_empresa PRIMARY KEY (idCiclo, idEmpresa),
    CONSTRAINT fk_ciclo_empresa_ciclo FOREIGN KEY (idCiclo)
        REFERENCES Ciclos(idCiclo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_ciclo_empresa_empresa FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Empresa_Alumnos (
    idEmpresa SMALLINT UNSIGNED NOT NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_empresa_alumnos PRIMARY KEY (idEmpresa, idAlumno),
    CONSTRAINT fk_empresa_alumnos_empresa FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_empresa_alumnos_alumno FOREIGN KEY (idAlumno)
        REFERENCES Alumnos(idAlumnos)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Configuracion (
    dias_aviso_caducidad TINYINT UNSIGNED NOT NULL DEFAULT 30,
    tiempo_finalizacion_convenio TINYINT UNSIGNED NOT NULL DEFAULT 4,

    CONSTRAINT chk_configuracion_dias_aviso CHECK (dias_aviso_caducidad > 0),
    CONSTRAINT chk_configuracion_tiempo_convenio CHECK (tiempo_finalizacion_convenio > 0)
);
ALTER TABLE Ciclos
ADD grado CHAR(8) NOT NULL DEFAULT 'medio',
ADD CONSTRAINT chk_ciclos_grado
CHECK (grado IN ('superior', 'medio'));
UPDATE Ciclos
SET grado = 'superior'
WHERE siglas IN ('DAW', 'DAM', 'ASIR');

UPDATE Ciclos
SET grado = 'medio'
WHERE siglas IN ('SMR', 'MKP');