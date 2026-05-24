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

INSERT INTO Usuario (nombre, apellidos, correo, tipo) VALUES
('Daniel', 'Coordinador Ruiz', 'dev.coordinador@dualex.es', 'P'),
('Sergio', 'Profesor Martin', 'dev.profesor@dualex.es', 'P'),
('Laura', 'Coordinadora General', 'dev.coordinador_general@dualex.es', 'P'),
('Juan', 'Martinez Lopez', 'juan@fundacionloyola.net', 'P'),
('Lucia', 'Sanchez Ruiz', 'lucia@fundacionloyola.net', 'P'),
('Carlos', 'Fernandez Gil', 'carlos@fundacionloyola.net', 'P'),
('Marta', 'Lopez Perez', 'marta@fundacionloyola.net', 'P'),
('Alberto', 'Ruiz Gomez', 'alberto@fundacionloyola.net', 'P'),
('Sofia', 'Navarro Diaz', 'sofia@fundacionloyola.net', 'P'),
('Miguel', 'Torres Leon', 'miguel@fundacionloyola.net', 'P'),

('Alejandro', 'Alumno Demo', 'dev.alumno@dualex.es', 'A'),
('Paula', 'Diaz Martin', 'paula.guadalupe@alumnado.fundacionloyola.net', 'A'),
('David', 'Moreno Lopez', 'david.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Andrea', 'Jimenez Ruiz', 'andrea.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Sergio', 'Perez Castro', 'sergio.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Elena', 'Vega Torres', 'elena.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Mario', 'Suarez Ramos', 'mario.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Claudia', 'Ortega Cano', 'claudia.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Hugo', 'Molina Vera', 'hugo.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Irene', 'Cruz Santos', 'irene.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Javier', 'Rubio Nieto', 'franciscojaviermartinezfernandez.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Laura', 'Reyes Pardo', 'laura.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Raul', 'Mendez Soler', 'raul.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Cristina', 'Navarro Ruiz', 'cristina.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Adrian', 'Torres Leon', 'adrian.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Nerea', 'Santos Vega', 'nerea.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Pablo', 'Garcia Ruiz', 'pablo.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Aitana', 'Castro Moreno', 'aitana.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Victor', 'Ramos Perez', 'victor.guadalupe@alumnado.fundacionloyola.net', 'A'),
('Lucia', 'Ortega Diaz', 'lucia.guadalupe@alumnado.fundacionloyola.net', 'A');

-- =====================================================
-- PROFESOR
-- =====================================================

INSERT INTO Profesor (idProfesor) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- =====================================================
-- COORDINADOR
-- =====================================================

INSERT INTO Coordinador (idCoordinador) VALUES
(1),(3),(4),(5);

-- =====================================================
-- CICLO
-- =====================================================

INSERT INTO Ciclo (nombre, siglas, grado, idCoordinador) VALUES
('Desarrollo de Aplicaciones Web', 'DAW', 'superior', 1),
('Desarrollo de Aplicaciones Multiplataforma', 'DAM', 'superior', 3),
('Administracion de Sistemas Informaticos', 'ASIR', 'superior', 4),
('Sistemas Microinformaticos y Redes', 'SMR', 'medio', 5),
('Marketing y Publicidad', 'MKP', 'superior', 1),
('Comercio Internacional', 'CI', 'superior', 3);

-- =====================================================
-- CURSO
-- =====================================================

INSERT INTO Curso (nombre, anio_escolar, idCiclo) VALUES
('1 DAW', '24-25', 1),
('2 DAW', '24-25', 1),
('1 DAM', '24-25', 2),
('2 DAM', '24-25', 2),
('1 ASIR', '24-25', 3),
('2 ASIR', '24-25', 3),
('1 SMR', '24-25', 4),
('2 SMR', '24-25', 4),
('1 MKP', '24-25', 5),
('1 CI', '24-25', 6);

-- =====================================================
-- ALUMNO
-- =====================================================

INSERT INTO Alumno (idAlumno, dni, nuss, nia, telefono, repetidor, idCurso) VALUES
(11, '11111111A', '100000000001', '2000000001', '600111111', 0, 2),
(12, '11111111B', '100000000002', '2000000002', '600111112', 0, 2),
(13, '11111111C', '100000000003', '2000000003', '600111113', 1, 4),
(14, '11111111D', '100000000004', '2000000004', '600111114', 0, 4),
(15, '11111111E', '100000000005', '2000000005', '600111115', 0, 6),
(16, '11111111F', '100000000006', '2000000006', '600111116', 1, 6),
(17, '11111111G', '100000000007', '2000000007', '600111117', 0, 8),
(18, '11111111H', '100000000008', '2000000008', '600111118', 0, 8),
(19, '11111111I', '100000000009', '2000000009', '600111119', 0, 1),
(20, '11111111J', '100000000010', '2000000010', '600111120', 1, 3),
(21, '11111111K', '100000000011', '2000000011', '600111121', 0, 5),
(22, '11111111L', '100000000012', '2000000012', '600111122', 0, 7),
(23, '11111111M', '100000000013', '2000000013', '600111123', 0, 9),
(24, '11111111N', '100000000014', '2000000014', '600111124', 0, 10),
(25, '11111111P', '100000000015', '2000000015', '600111125', 1, 2),
(26, '11111111Q', '100000000016', '2000000016', '600111126', 0, 4),
(27, '11111111R', '100000000017', '2000000017', '600111127', 0, 6),
(28, '11111111S', '100000000018', '2000000018', '600111128', 0, 8),
(29, '11111111T', '100000000019', '2000000019', '600111129', 1, 2),
(30, '11111111U', '100000000020', '2000000020', '600111130', 0, 4);

-- =====================================================
-- EMPRESA
-- =====================================================

INSERT INTO Empresa (siglas, nombre, inicioConvenio, urlConvenio, idCoordinador) VALUES
('GOOGLE', 'Google Spain', '2024-01-10 10:00:00', 'https://google.com/convenio', 1),
('INDRA', 'Indra Sistemas', '2024-02-15 09:00:00', 'https://indra.com/convenio', 3),
('NTTDAT', 'NTT Data', '2024-03-20 11:00:00', 'https://nttdata.com/convenio', 1),
('ACENTR', 'Accenture', '2024-01-05 08:00:00', 'https://accenture.com/convenio', 4),
('CAPGEM', 'Capgemini', '2024-04-01 12:00:00', 'https://capgemini.com/convenio', 5),
('IBMESP', 'IBM España', '2024-05-02 13:00:00', 'https://ibm.com/convenio', 3),
('AMAZON', 'Amazon Tech', '2024-02-22 14:00:00', 'https://amazon.com/convenio', NULL),
('ORACLE', 'Oracle España', '2024-03-11 10:00:00', 'https://oracle.com/convenio', 1),
('TELEFO', 'Telefonica Tech', '2024-06-01 10:30:00', 'https://telefonica.com/convenio', 4),
('MERCAD', 'Mercadona IT', '2024-07-01 09:15:00', 'https://mercadona.es/convenio', 5);

-- =====================================================
-- EMPRESA_ALUMNO
-- =====================================================

INSERT INTO Empresa_Alumno (idEmpresa, idAlumno) VALUES
(1,11),(1,12),
(2,13),(2,14),
(3,15),(3,16),
(4,17),(4,18),
(5,19),(5,20),
(6,21),(6,22),
(7,23),(7,24),
(8,25),(8,26),
(9,27),(9,28),
(10,29),(10,30);

-- =====================================================
-- CONTACTO
-- =====================================================

INSERT INTO Contacto (tfnoContacto, nombreContacto, titular, correo, idEmpresa) VALUES
('911111111', 'Pedro Garcia', 'RRHH', 'pedro.garcia@google.com', 1),
('922222222', 'Ana Ruiz', 'CTO', 'ana.ruiz@indra.com', 2),
('933333333', 'Miguel Torres', 'Responsable IT', 'miguel.torres@nttdata.com', 3),
('944444444', 'Laura Perez', 'Manager', 'laura.perez@accenture.com', 4),
('955555555', 'Alberto Diaz', 'Director', 'alberto.diaz@capgemini.com', 5),
('966666666', 'Marta Leon', 'CEO', 'marta.leon@ibm.com', 6),
('977777777', 'Clara Sanchez', 'RRHH', 'clara.sanchez@amazon.com', 7),
('988888888', 'Raul Martin', 'Tech Lead', 'raul.martin@oracle.com', 8),
('999999999', 'Sonia Vega', 'Manager', 'sonia.vega@telefonica.com', 9),
('900000000', 'Victor Ruiz', 'CTO', 'victor.ruiz@mercadona.es', 10);

-- =====================================================
-- ANEXO_IV
-- =====================================================

INSERT INTO Anexo_IV (idAlumno) VALUES
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30);

-- =====================================================
-- MODULO
-- =====================================================

INSERT INTO Modulo (nombre, sigla, color) VALUES
('Bases de Datos', 'BBDD', '#FF5733'),
('Programacion', 'PROG', '#33FF57'),
('Lenguaje de Marcas', 'LMSGI', '#3357FF'),
('Entornos de Desarrollo', 'EEDD', '#F1C40F'),
('Sistemas Informaticos', 'SI', '#8E44AD'),
('Empresa e Iniciativa Emprendedora', 'EIE', '#16A085'),
('Despliegue de Aplicaciones Web', 'DAW', '#E74C3C'),
('Desarrollo Web Cliente', 'DWEC', '#2ECC71'),
('Desarrollo Web Servidor', 'DWES', '#3498DB'),
('Diseño de Interfaces Web', 'DIW', '#1ABC9C'),
('Acceso a Datos', 'AD', '#C0392B'),
('Programacion Multimedia', 'PMDM', '#9B59B6');

-- =====================================================
-- ACTIVIDAD
-- =====================================================

INSERT INTO Actividad (titulo, descripcion, idCoordinador) VALUES
('Crear API REST', 'Desarrollo de una API REST con Spring Boot', 1),
('Diseño Web Responsive', 'Creacion de una interfaz responsive completa', 1),
('Sistema de Login', 'Autenticacion de usuarios con JWT', 3),
('Dockerizacion', 'Dockerizar aplicacion web completa', 3),
('Modelo Relacional', 'Diseño de base de datos relacional', 4),
('Deploy VPS', 'Despliegue en servidor Linux', 5),
('Testing Backend', 'Pruebas unitarias y de integracion', 3),
('Microservicios', 'Arquitectura con microservicios', 4),
('CRUD Laravel', 'Aplicacion CRUD con Laravel', 1),
('Frontend React', 'Aplicacion frontend con React', 5);

-- =====================================================
-- TAREA
-- =====================================================

INSERT INTO Tarea
(codigo_auto, titulo, fecha_inicio, fecha_fin, descripcion, calificacion, comentario, idAlumno)
VALUES
('24-25_DAW_T1', 'Login Web', '2024-09-01 08:00:00', '2024-09-10 14:00:00', 'Crear login completo con validacion.', 'notable', 'Buen trabajo.', 11),
('24-25_DAW_T2', 'CRUD Usuarios', '2024-09-05 08:00:00', '2024-09-15 14:00:00', 'CRUD completo de usuarios.', 'excelente', 'Muy completo.', 12),
('24-25_DAM_T1', 'API Productos', '2024-09-06 08:00:00', '2024-09-18 14:00:00', 'API REST de productos.', 'bien', 'Correcto.', 13),
('24-25_DAM_T2', 'JWT Auth', '2024-09-08 08:00:00', '2024-09-22 14:00:00', 'Sistema de autenticacion JWT.', 'notable', 'Buen planteamiento.', 14),
('24-25_ASIR_T1', 'Servidor Linux', '2024-09-07 08:00:00', '2024-09-20 14:00:00', 'Configuracion de Ubuntu Server.', 'superado', 'Aceptable.', 15),
('24-25_ASIR_T2', 'Docker App', '2024-09-09 08:00:00', '2024-09-24 14:00:00', 'Dockerizacion de aplicacion.', 'excelente', 'Muy profesional.', 16),
('24-25_SMR_T1', 'Red Local', '2024-09-11 08:00:00', '2024-09-25 14:00:00', 'Configuracion de red local.', 'bien', 'Correcto.', 17),
('24-25_SMR_T2', 'Soporte Tecnico', '2024-09-12 08:00:00', '2024-09-26 14:00:00', 'Resolucion de incidencias.', 'superado', 'Bien resuelto.', 18),
('24-25_MKP_T1', 'Campaña Digital', '2024-09-15 08:00:00', '2024-09-30 14:00:00', 'Campaña de marketing digital.', 'notable', 'Buena presentacion.', 19),
('24-25_CI_T1', 'Analisis Mercado', '2024-09-16 08:00:00', '2024-10-01 14:00:00', 'Analisis de mercado internacional.', 'bien', 'Adecuado.', 20),
('24-25_DAW_T3', 'Frontend React', '2024-10-01 08:00:00', '2024-10-12 14:00:00', 'Frontend con componentes React.', 'excelente', 'Muy limpio.', 21),
('24-25_DAW_T4', 'Deploy Cloud', '2024-10-03 08:00:00', '2024-10-15 14:00:00', 'Despliegue en la nube.', 'notable', 'Buen despliegue.', 22),
('24-25_DAM_T3', 'Acceso a Datos', '2024-10-05 08:00:00', '2024-10-18 14:00:00', 'Conexion con base de datos.', 'superado', 'Funciona correctamente.', 23),
('24-25_ASIR_T3', 'Firewall', '2024-10-07 08:00:00', '2024-10-20 14:00:00', 'Configuracion firewall.', 'bien', 'Correcto.', 24),
('24-25_DAW_T5', 'Microservicio', '2024-10-10 08:00:00', '2024-10-25 14:00:00', 'Microservicio en Java.', 'excelente', 'Muy buena arquitectura.', 25);

-- =====================================================
-- TAREA_ACTIVIDAD
-- =====================================================

INSERT INTO Tarea_Actividad (idTarea, idActividad) VALUES
(1,3),(1,1),
(2,9),(2,5),
(3,1),(3,7),
(4,3),(4,8),
(5,6),(5,4),
(6,4),(6,6),
(7,5),(7,6),
(8,7),(8,2),
(9,2),(9,10),
(10,5),(10,9),
(11,10),(11,2),
(12,6),(12,4),
(13,1),(13,5),
(14,6),(14,7),
(15,8),(15,1);

-- =====================================================
-- MODULO_ACTIVIDAD
-- =====================================================

INSERT INTO Modulo_Actividad (idModulo, idActividad) VALUES
(1,5),
(2,1),
(2,3),
(3,2),
(4,7),
(5,6),
(6,9),
(7,4),
(8,10),
(9,1),
(9,8),
(10,2),
(11,5),
(12,10);

-- =====================================================
-- MODULO_CURSO
-- =====================================================

INSERT INTO Modulo_Curso (idModulo, idCurso) VALUES
(1,1),(2,1),(3,1),(4,1),(5,1),
(6,2),(7,2),(8,2),(9,2),(10,2),
(1,3),(2,3),(11,3),(12,4),
(5,5),(7,6),
(3,7),(5,8),
(6,9),(10,10);

-- =====================================================
-- MODULO_PROFESOR
-- =====================================================

INSERT INTO Modulo_Profesor (idModulo, idProfesor) VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5),
(6,6),
(7,7),
(8,8),
(9,9),
(10,10),
(11,1),
(12,3);

-- =====================================================
-- MODULO_ALUMNO_CURSA
-- =====================================================

INSERT INTO Modulo_Alumno_Cursa (idModulo, idAlumno) VALUES
(1,11),(2,11),(3,11),
(1,12),(2,12),(4,12),
(2,13),(11,13),
(2,14),(12,14),
(5,15),(7,15),
(5,16),(7,16),
(3,17),(5,17),
(3,18),(5,18),
(6,19),(10,19),
(6,20),(10,20),
(8,21),(9,21),
(8,22),(9,22),
(1,23),(11,23),
(5,24),(7,24),
(8,25),(9,25),
(2,26),(12,26),
(5,27),(7,27),
(3,28),(5,28),
(8,29),(9,29),
(1,30),(2,30);

-- =====================================================
-- MODULO_ALUMNO_PENDIENTE
-- =====================================================

INSERT INTO Modulo_Alumno_Pendiente (idModulo, idAlumno) VALUES
(1,13),
(2,14),
(3,15),
(4,16),
(5,17),
(6,18),
(7,19),
(8,20),
(9,21),
(10,22),
(11,23),
(12,24);

-- =====================================================
-- MODULO_TAREA_REVISION
-- =====================================================

INSERT INTO Modulo_Tarea_Revision (idModulo, idTarea, revisada, observaciones) VALUES
(2,1,1,'Login revisado correctamente.'),
(1,2,1,'CRUD correcto y bien estructurado.'),
(9,3,1,'API funcional.'),
(2,4,1,'Autenticacion correcta.'),
(5,5,0,'Falta documentacion.'),
(7,6,1,'Docker correcto.'),
(5,7,1,'Red local configurada.'),
(4,8,0,'Pendiente de ampliar pruebas.'),
(10,9,1,'Campaña clara.'),
(6,10,1,'Analisis suficiente.'),
(8,11,1,'Frontend limpio.'),
(7,12,1,'Deploy correcto.'),
(11,13,0,'Falta control de errores.'),
(5,14,1,'Firewall bien configurado.'),
(9,15,1,'Microservicio correcto.');

-- =====================================================
-- CICLO_EMPRESA
-- =====================================================

INSERT INTO Ciclo_Empresa (idCiclo, idEmpresa, tutor) VALUES
(1,1,'Pedro Garcia'),
(1,2,'Ana Ruiz'),
(1,3,'Miguel Torres'),
(2,3,'Miguel Torres'),
(2,4,'Laura Perez'),
(2,5,'Alberto Diaz'),
(3,5,'Alberto Diaz'),
(3,6,'Marta Leon'),
(4,7,'Clara Sanchez'),
(4,8,'Raul Martin'),
(5,9,'Sonia Vega'),
(6,10,'Victor Ruiz');

-- =====================================================
-- CONFIGURACION
-- =====================================================

INSERT INTO Configuracion (
    dias_aviso_caducidad,
    tiempo_finalizacion_convenio,
    urlConvenio
) VALUES
(30,4,'https://dualex.es/convenios');

ALTER TABLE Coordinador
ADD general BIT(1) NOT NULL DEFAULT 0;

UPDATE Coordinador
SET general = 1
WHERE idCoordinador = (
    SELECT idUsuario
    FROM Usuario
    WHERE correo = 'dev.coordinador_general@dualex.es'
);
