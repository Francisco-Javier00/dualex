CREATE DATABASE IF NOT EXISTS dualex;
USE dualex;

CREATE TABLE Usuario (
    idUsuario SMALLINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    tipo CHAR(2) NOT NULL,

    CONSTRAINT pk_usuario PRIMARY KEY (idUsuario),
    CONSTRAINT uq_usuario_correo UNIQUE (correo),
    CONSTRAINT chk_usuario_tipo
        CHECK (tipo IN ('P', 'A'))
);

CREATE TABLE Profesor (
    idProfesor SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_profesor PRIMARY KEY (idProfesor),

    CONSTRAINT fk_profesor_usuario
        FOREIGN KEY (idProfesor)
        REFERENCES Usuario(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Coordinador (
    idCoordinador SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_coordinador PRIMARY KEY (idCoordinador),

    CONSTRAINT fk_coordinador_profesor
        FOREIGN KEY (idCoordinador)
        REFERENCES Profesor(idProfesor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Ciclo (
    idCiclo TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    siglas CHAR(5) NOT NULL,
    grado CHAR(8) NOT NULL DEFAULT 'medio',
    idCoordinador SMALLINT UNSIGNED NULL,

    CONSTRAINT pk_ciclo PRIMARY KEY (idCiclo),

    CONSTRAINT chk_ciclo_grado
        CHECK (grado IN ('superior', 'medio')),

    CONSTRAINT fk_ciclo_coordinador
        FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Curso (
    idCurso TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    anio_escolar CHAR(5) NOT NULL,
    idCiclo TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_curso PRIMARY KEY (idCurso),

    CONSTRAINT fk_curso_ciclo
        FOREIGN KEY (idCiclo)
        REFERENCES Ciclo(idCiclo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Alumno (
    idAlumno SMALLINT UNSIGNED NOT NULL,
    dni CHAR(15) NOT NULL,
    nuss CHAR(12) NOT NULL,
    nia CHAR(10) NOT NULL,
    telefono CHAR(15) NOT NULL,
    repetidor BIT NOT NULL DEFAULT 0,
    idCurso TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_alumno PRIMARY KEY (idAlumno),

    CONSTRAINT uq_alumno_dni UNIQUE (dni),
    CONSTRAINT uq_alumno_nuss UNIQUE (nuss),
    CONSTRAINT uq_alumno_nia UNIQUE (nia),

    CONSTRAINT fk_alumno_usuario
        FOREIGN KEY (idAlumno)
        REFERENCES Usuario(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_alumno_curso
        FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Empresa (
    idEmpresa SMALLINT UNSIGNED AUTO_INCREMENT,
    siglas CHAR(6) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    inicioConvenio TIMESTAMP NOT NULL,
    urlConvenio VARCHAR(100) NOT NULL,
    idCoordinador SMALLINT UNSIGNED NULL,

    CONSTRAINT pk_empresa PRIMARY KEY (idEmpresa),

    CONSTRAINT fk_empresa_coordinador
        FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Empresa_Alumno (
    idEmpresa SMALLINT UNSIGNED NOT NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_empresa_alumno
        PRIMARY KEY (idEmpresa, idAlumno),

    CONSTRAINT fk_empresa_alumno_empresa
        FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_empresa_alumno_alumno
        FOREIGN KEY (idAlumno)
        REFERENCES Alumno(idAlumno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Contacto (
    idContacto SMALLINT UNSIGNED AUTO_INCREMENT,
    tfnoContacto CHAR(15) NOT NULL,
    nombreContacto VARCHAR(50) NOT NULL,
    titular VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    idEmpresa SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_contacto PRIMARY KEY (idContacto),

    CONSTRAINT uq_contacto_correo UNIQUE (correo),

    CONSTRAINT fk_contacto_empresa
        FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Anexo_IV (
    idAnexo SMALLINT UNSIGNED AUTO_INCREMENT,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_anexo_iv PRIMARY KEY (idAnexo),

    CONSTRAINT fk_anexo_iv_alumno
        FOREIGN KEY (idAlumno)
        REFERENCES Alumno(idAlumno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo (
    idModulo TINYINT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    sigla CHAR(5) NOT NULL,
    color VARCHAR(36) NOT NULL,

    CONSTRAINT pk_modulo PRIMARY KEY (idModulo)
);

CREATE TABLE Actividad (
    idActividad SMALLINT UNSIGNED AUTO_INCREMENT,
    titulo VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    idCoordinador SMALLINT UNSIGNED NULL,

    CONSTRAINT pk_actividad PRIMARY KEY (idActividad),

    CONSTRAINT fk_actividad_coordinador
        FOREIGN KEY (idCoordinador)
        REFERENCES Coordinador(idCoordinador)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Tarea (
    idTarea INT UNSIGNED AUTO_INCREMENT,
    codigo_auto VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    descripcion TEXT NOT NULL,
    calificacion CHAR(13) NULL,
    comentario VARCHAR(255) NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_tarea PRIMARY KEY (idTarea),

    CONSTRAINT chk_tarea_calificacion
        CHECK (
            calificacion IN (
                'superado',
                'bien',
                'notable',
                'excelente',
                'no superado'
            )
        ),

    CONSTRAINT fk_tarea_alumno
        FOREIGN KEY (idAlumno)
        REFERENCES Alumno(idAlumno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Tarea_Actividad (
    idTarea INT UNSIGNED NOT NULL,
    idActividad SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_tarea_actividad
        PRIMARY KEY (idTarea, idActividad),

    CONSTRAINT fk_tarea_actividad_tarea
        FOREIGN KEY (idTarea)
        REFERENCES Tarea(idTarea)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_tarea_actividad_actividad
        FOREIGN KEY (idActividad)
        REFERENCES Actividad(idActividad)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Actividad (
    idModulo TINYINT UNSIGNED NOT NULL,
    idActividad SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_actividad
        PRIMARY KEY (idModulo, idActividad),

    CONSTRAINT fk_modulo_actividad_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_actividad_actividad
        FOREIGN KEY (idActividad)
        REFERENCES Actividad(idActividad)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Curso (
    idModulo TINYINT UNSIGNED NOT NULL,
    idCurso TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_curso
        PRIMARY KEY (idModulo, idCurso),

    CONSTRAINT fk_modulo_curso_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_curso_curso
        FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Profesor (
    idModulo TINYINT UNSIGNED NOT NULL,
    idProfesor SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_profesor
        PRIMARY KEY (idModulo, idProfesor),

    CONSTRAINT fk_modulo_profesor_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_profesor_profesor
        FOREIGN KEY (idProfesor)
        REFERENCES Profesor(idProfesor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Alumno_Cursa (
    idModulo TINYINT UNSIGNED NOT NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_alumno_cursa
        PRIMARY KEY (idModulo, idAlumno),

    CONSTRAINT fk_modulo_alumno_cursa_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_alumno_cursa_alumno
        FOREIGN KEY (idAlumno)
        REFERENCES Alumno(idAlumno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Alumno_Pendiente (
    idModulo TINYINT UNSIGNED NOT NULL,
    idAlumno SMALLINT UNSIGNED NOT NULL,

    CONSTRAINT pk_modulo_alumno_pendiente
        PRIMARY KEY (idModulo, idAlumno),

    CONSTRAINT fk_modulo_alumno_pendiente_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_alumno_pendiente_alumno
        FOREIGN KEY (idAlumno)
        REFERENCES Alumno(idAlumno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Modulo_Tarea_Revision (
    idModulo TINYINT UNSIGNED NOT NULL,
    idTarea INT UNSIGNED NOT NULL,
    revisada BIT NOT NULL DEFAULT 0,
    observaciones VARCHAR(255) NOT NULL,

    CONSTRAINT pk_modulo_tarea_revision
        PRIMARY KEY (idModulo, idTarea),

    CONSTRAINT fk_modulo_tarea_revision_modulo
        FOREIGN KEY (idModulo)
        REFERENCES Modulo(idModulo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_modulo_tarea_revision_tarea
        FOREIGN KEY (idTarea)
        REFERENCES Tarea(idTarea)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Ciclo_Empresa (
    idCiclo TINYINT UNSIGNED NOT NULL,
    idEmpresa SMALLINT UNSIGNED NOT NULL,
    tutor VARCHAR(50) NOT NULL,

    CONSTRAINT pk_ciclo_empresa
        PRIMARY KEY (idCiclo, idEmpresa),

    CONSTRAINT fk_ciclo_empresa_ciclo
        FOREIGN KEY (idCiclo)
        REFERENCES Ciclo(idCiclo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_ciclo_empresa_empresa
        FOREIGN KEY (idEmpresa)
        REFERENCES Empresa(idEmpresa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Configuracion (
    dias_aviso_caducidad TINYINT UNSIGNED NOT NULL DEFAULT 30,
    tiempo_finalizacion_convenio TINYINT UNSIGNED NOT NULL DEFAULT 4,
    urlConvenio VARCHAR(100) NOT NULL,

    CONSTRAINT chk_configuracion_dias
        CHECK (dias_aviso_caducidad > 0),

    CONSTRAINT chk_configuracion_tiempo
        CHECK (tiempo_finalizacion_convenio > 0)
);

USE dualex;

-- =====================================================
-- USUARIO
-- =====================================================

INSERT INTO Usuario (
    nombre,
    apellidos,
    correo,
    tipo
) VALUES

-- PROFESORES ESPECIALES

('Daniel', 'Coordinador Ruiz', 'dev.coordinador@dualex.es', 'P'),
('Sergio', 'Profesor Martin', 'dev.profesor@dualex.es', 'P'),
('Laura', 'Coordinadora General', 'dev.coordinador_general@dualex.es', 'P'),

-- PROFESORES NORMALES

('Juan', 'Martinez Lopez', 'juan.martinez@dualex.es', 'P'),
('Lucia', 'Sanchez Ruiz', 'lucia.sanchez@dualex.es', 'P'),
('Carlos', 'Fernandez Gil', 'carlos.fernandez@dualex.es', 'P'),
('Marta', 'Lopez Perez', 'marta.lopez@dualex.es', 'P'),
('Alberto', 'Ruiz Gomez', 'alberto.ruiz@dualex.es', 'P'),
('Sofia', 'Navarro Diaz', 'sofia.navarro@dualex.es', 'P'),
('Miguel', 'Torres Leon', 'miguel.torres@dualex.es', 'P'),
('Clara', 'Santos Vega', 'clara.santos@dualex.es', 'P'),
('Ruben', 'Gil Moreno', 'ruben.gil@dualex.es', 'P'),

-- ALUMNO ESPECIAL

('Alejandro', 'Alumno Demo', 'dev.alumno@dualex.es', 'A'),

-- ALUMNOS

('Paula', 'Diaz Martin', 'paula.diaz@gmail.com', 'A'),
('David', 'Moreno Lopez', 'david.moreno@gmail.com', 'A'),
('Andrea', 'Jimenez Ruiz', 'andrea.jimenez@gmail.com', 'A'),
('Sergio', 'Perez Castro', 'sergio.perez@gmail.com', 'A'),
('Elena', 'Vega Torres', 'elena.vega@gmail.com', 'A'),
('Mario', 'Suarez Ramos', 'mario.suarez@gmail.com', 'A'),
('Claudia', 'Ortega Cano', 'claudia.ortega@gmail.com', 'A'),
('Hugo', 'Molina Vera', 'hugo.molina@gmail.com', 'A'),
('Irene', 'Cruz Santos', 'irene.cruz@gmail.com', 'A'),
('Javier', 'Rubio Nieto', 'javier.rubio@gmail.com', 'A'),
('Laura', 'Reyes Pardo', 'laura.reyes@gmail.com', 'A'),
('Raul', 'Mendez Soler', 'raul.mendez@gmail.com', 'A'),
('Cristina', 'Navarro Ruiz', 'cristina.navarro@gmail.com', 'A'),
('Adrian', 'Torres Leon', 'adrian.torres@gmail.com', 'A'),
('Nerea', 'Santos Vega', 'nerea.santos@gmail.com', 'A'),
('Pablo', 'Garcia Ruiz', 'pablo.garcia@gmail.com', 'A'),
('Aitana', 'Castro Moreno', 'aitana.castro@gmail.com', 'A'),
('Victor', 'Ramos Perez', 'victor.ramos@gmail.com', 'A'),
('Lucia', 'Ortega Diaz', 'lucia.ortega@gmail.com', 'A'),
('Diego', 'Fernandez Soto', 'diego.fernandez@gmail.com', 'A'),
('Alba', 'Molina Perez', 'alba.molina@gmail.com', 'A'),
('Jorge', 'Ruiz Cano', 'jorge.ruiz@gmail.com', 'A'),
('Carmen', 'Gil Santos', 'carmen.gil@gmail.com', 'A'),
('Samuel', 'Diaz Torres', 'samuel.diaz@gmail.com', 'A'),
('Noa', 'Lopez Vera', 'noa.lopez@gmail.com', 'A'),
('Ivan', 'Jimenez Leon', 'ivan.jimenez@gmail.com', 'A'),
('Sara', 'Navarro Castro', 'sara.navarro@gmail.com', 'A'),
('Alex', 'Perez Ruiz', 'alex.perez@gmail.com', 'A'),
('Marta', 'Santos Gil', 'marta.santos@gmail.com', 'A'),
('Dario', 'Morales Cano', 'dario.morales@gmail.com', 'A');

-- =====================================================
-- PROFESOR
-- =====================================================

INSERT INTO Profesor VALUES
(1),
(2),
(3),
(4),
(5),
(6),
(7),
(8),
(9),
(10),
(11);

-- =====================================================
-- COORDINADOR
-- =====================================================

INSERT INTO Coordinador VALUES
(1),
(3),
(4),
(5);

-- =====================================================
-- CICLO
-- =====================================================

INSERT INTO Ciclo (
    nombre,
    siglas,
    grado,
    idCoordinador
) VALUES
('Desarrollo de Aplicaciones Web', 'DAW', 'superior', 1),
('Desarrollo de Aplicaciones Multiplataforma', 'DAM', 'superior', 3),
('Administracion de Sistemas Informaticos', 'ASIR', 'superior', 4),
('Sistemas Microinformaticos', 'SMR', 'medio', 5),
('Marketing y Publicidad', 'MKP', 'medio', 1),
('Comercio Internacional', 'CI', 'superior', 3);

-- =====================================================
-- CURSO
-- =====================================================

INSERT INTO Curso (
    nombre,
    anio_escolar,
    idCiclo
) VALUES
('1º DAW', '24-25', 1),
('2º DAW', '24-25', 1),
('1º DAM', '24-25', 2),
('2º DAM', '24-25', 2),
('1º ASIR', '24-25', 3),
('2º ASIR', '24-25', 3),
('1º SMR', '24-25', 4),
('2º SMR', '24-25', 4),
('1º MKP', '24-25', 5),
('1º CI', '24-25', 6);

-- =====================================================
-- ALUMNO
-- =====================================================

INSERT INTO Alumno (
    idAlumno,
    dni,
    nuss,
    nia,
    telefono,
    repetidor,
    idCurso
) VALUES

(12, '11111111A', '100000000001', '2000000001', '600111111', 0, 2),
(13, '11111111B', '100000000002', '2000000002', '600111112', 0, 2),
(14, '11111111C', '100000000003', '2000000003', '600111113', 1, 4),
(15, '11111111D', '100000000004', '2000000004', '600111114', 0, 4),
(16, '11111111E', '100000000005', '2000000005', '600111115', 0, 6),
(17, '11111111F', '100000000006', '2000000006', '600111116', 1, 6),
(18, '11111111G', '100000000007', '2000000007', '600111117', 0, 8),
(19, '11111111H', '100000000008', '2000000008', '600111118', 0, 8),
(20, '11111111I', '100000000009', '2000000009', '600111119', 0, 2),
(21, '11111111J', '100000000010', '2000000010', '600111120', 1, 4),
(22, '11111111K', '100000000011', '2000000011', '600111121', 0, 6),
(23, '11111111L', '100000000012', '2000000012', '600111122', 0, 2),
(24, '11111111M', '100000000013', '2000000013', '600111123', 0, 4),
(25, '11111111N', '100000000014', '2000000014', '600111124', 0, 6),
(26, '11111111P', '100000000015', '2000000015', '600111125', 1, 8),
(27, '11111111Q', '100000000016', '2000000016', '600111126', 0, 2),
(28, '11111111R', '100000000017', '2000000017', '600111127', 0, 4),
(29, '11111111S', '100000000018', '2000000018', '600111128', 0, 5),
(30, '11111111T', '100000000019', '2000000019', '600111129', 1, 7),
(31, '11111111U', '100000000020', '2000000020', '600111130', 0, 9),
(32, '11111111V', '100000000021', '2000000021', '600111131', 0, 10),
(33, '11111111W', '100000000022', '2000000022', '600111132', 0, 1),
(34, '11111111X', '100000000023', '2000000023', '600111133', 1, 3),
(35, '11111111Y', '100000000024', '2000000024', '600111134', 0, 5),
(36, '11111111Z', '100000000025', '2000000025', '600111135', 0, 7);

-- =====================================================
-- EMPRESA
-- =====================================================

INSERT INTO Empresa (
    siglas,
    nombre,
    inicioConvenio,
    urlConvenio,
    idCoordinador
) VALUES
('GOOGLE', 'Google Spain', NOW(), 'https://google.com/convenio', 1),
('INDRA', 'Indra Sistemas', NOW(), 'https://indra.com/convenio', 3),
('NTTDAT', 'NTT Data', NOW(), 'https://nttdata.com/convenio', 1),
('ACENTR', 'Accenture', NOW(), 'https://accenture.com/convenio', 4),
('CAPGEM', 'Capgemini', NOW(), 'https://capgemini.com/convenio', 5),
('IBMESP', 'IBM España', NOW(), 'https://ibm.com/convenio', 3),
('AMAZON', 'Amazon Tech', NOW(), 'https://amazon.com/convenio', NULL),
('ORACLE', 'Oracle España', NOW(), 'https://oracle.com/convenio', 1),
('MERCAD', 'Mercadona IT', NOW(), 'https://mercadona.es/convenio', 4),
('TELEFO', 'Telefonica Tech', NOW(), 'https://telefonica.es/convenio', 5);

-- =====================================================
-- EMPRESA_ALUMNO
-- =====================================================

INSERT INTO Empresa_Alumno VALUES
(1,12),
(1,13),
(2,14),
(2,15),
(3,16),
(3,17),
(4,18),
(4,19),
(5,20),
(5,21),
(6,22),
(6,23),
(7,24),
(7,25),
(8,26),
(8,27),
(9,28),
(9,29),
(10,30),
(10,31);

-- =====================================================
-- CONTACTO
-- =====================================================

INSERT INTO Contacto (
    tfnoContacto,
    nombreContacto,
    titular,
    correo,
    idEmpresa
) VALUES
('911111111', 'Pedro Garcia', 'RRHH', 'pedro@google.com', 1),
('922222222', 'Ana Ruiz', 'CTO', 'ana@indra.com', 2),
('933333333', 'Miguel Torres', 'Manager', 'miguel@nttdata.com', 3),
('944444444', 'Laura Perez', 'CEO', 'laura@accenture.com', 4),
('955555555', 'Alberto Diaz', 'Director', 'alberto@capgemini.com', 5),
('966666666', 'Marta Leon', 'Responsable IT', 'marta@ibm.com', 6),
('977777777', 'Clara Sanchez', 'RRHH', 'clara@amazon.com', 7),
('988888888', 'Raul Martin', 'Tech Lead', 'raul@oracle.com', 8),
('999999999', 'Sonia Vega', 'Manager', 'sonia@mercadona.com', 9),
('900000000', 'Victor Ruiz', 'CTO', 'victor@telefonica.com', 10);