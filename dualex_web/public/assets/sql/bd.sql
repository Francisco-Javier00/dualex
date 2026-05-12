USE `proyectosevg_BD1-05`;

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
USE `proyectosevg_BD1-05`;

-- =====================================================
-- USUARIOS
-- =====================================================

INSERT INTO Usuarios (nombre, apellidos, correo, tipo) VALUES
('Juan', 'Martinez Lopez', 'juan@fp.es', 'P'),
('Lucia', 'Sanchez Ruiz', 'lucia@fp.es', 'P'),
('Carlos', 'Fernandez Gil', 'carlos@fp.es', 'P'),
('Marta', 'Lopez Perez', 'marta@fp.es', 'P'),
('Alberto', 'Ruiz Gomez', 'alberto@fp.es', 'P'),
('Sofia', 'Navarro Diaz', 'sofia@fp.es', 'P'),
('Miguel', 'Torres Leon', 'miguel@fp.es', 'P'),
('David', 'Ortega Cano', 'david@fp.es', 'P'),

('Alejandro', 'Garcia Romero', 'alex@gmail.com', 'A'),
('Paula', 'Diaz Martin', 'paula@gmail.com', 'A'),
('Andrea', 'Morales Ruiz', 'andrea@gmail.com', 'A'),
('Mario', 'Castro Perez', 'mario@gmail.com', 'A'),
('Laura', 'Santos Vega', 'laura@gmail.com', 'A'),
('Sergio', 'Molina Diaz', 'sergio@gmail.com', 'A'),
('Irene', 'Gil Navarro', 'irene@gmail.com', 'A'),
('Raul', 'Perez Torres', 'raul@gmail.com', 'A'),
('Claudia', 'Ruiz Moreno', 'claudia@gmail.com', 'A'),
('Javier', 'Suarez Leon', 'javier@gmail.com', 'A'),
('Elena', 'Romero Gil', 'elena@gmail.com', 'A'),
('Pablo', 'Jimenez Vera', 'pablo@gmail.com', 'A'),
('Hugo', 'Cruz Ramos', 'hugo@gmail.com', 'A'),
('Nerea', 'Mendez Soto', 'nerea@gmail.com', 'A'),
('Adrian', 'Vega Cano', 'adrian@gmail.com', 'A'),
('Cristina', 'Lopez Diaz', 'cristina@gmail.com', 'A'),
('Ruben', 'Castillo Perez', 'ruben@gmail.com', 'A');

-- =====================================================
-- PROFESOR
-- =====================================================

INSERT INTO Profesor VALUES
(1),(2),(3),(4),(5),(6),(7),(8);

-- =====================================================
-- COORDINADOR
-- =====================================================

INSERT INTO Coordinador VALUES
(1),(2),(3),(4);

-- =====================================================
-- CICLOS
-- =====================================================

INSERT INTO Ciclos (nombre, siglas, idCoordinador) VALUES
('Desarrollo de Aplicaciones Web', 'DAW', 1),
('Desarrollo de Aplicaciones Multiplataforma', 'DAM', 2),
('Administracion de Sistemas Informaticos', 'ASIR', 3),
('Sistemas Microinformaticos', 'SMR', 4),
('Marketing y Publicidad', 'MKP', 1);

-- =====================================================
-- CURSOS
-- =====================================================

INSERT INTO Cursos (nombre, anio_escolar, idCiclo) VALUES
('1º DAW', '24-25', 1),
('2º DAW', '24-25', 1),
('1º DAM', '24-25', 2),
('2º DAM', '24-25', 2),
('1º ASIR', '24-25', 3),
('2º ASIR', '24-25', 3),
('1º SMR', '24-25', 4),
('2º SMR', '24-25', 4),
('1º MKP', '24-25', 5);

-- =====================================================
-- EMPRESA
-- =====================================================

INSERT INTO Empresa (
    siglas,
    nombre,
    inicioConvenio,
    url_Convenio,
    idCoordinador
) VALUES
('GOOGLE', 'Google Spain', '2024-01-10 10:00:00', 'https://google.com/doc1', 1),
('INDRA1', 'Indra Sistemas', '2024-02-15 09:00:00', 'https://indra.com/doc', 2),
('NTTDAT', 'NTT Data', '2024-03-20 11:00:00', 'https://nttdata.com/doc', 1),
('ACENTR', 'Accenture', '2024-01-05 08:00:00', 'https://accenture.com/doc', 3),
('CAPGEM', 'Capgemini', '2024-04-01 12:00:00', 'https://capgemini.com/doc', 2),
('IBMESP', 'IBM España', '2024-05-02 13:00:00', 'https://ibm.com/doc', 1),
('AMAZON', 'Amazon Tech', '2024-02-22 14:00:00', 'https://amazon.com/doc', 4),
('ORACLE', 'Oracle España', '2024-03-11 10:00:00', 'https://oracle.com/doc', NULL);

-- =====================================================
-- ALUMNOS
-- =====================================================

INSERT INTO Alumnos (
    idAlumnos,
    DNI,
    NUSS,
    NIA,
    telefono,
    repetidor,
    idCurso
) VALUES
(9,  '11111111A', '100000000001', '2000000001', '600111111', 0, 2),
(10, '11111111B', '100000000002', '2000000002', '600111112', 0, 2),
(11, '11111111C', '100000000003', '2000000003', '600111113', 1, 4),
(12, '11111111D', '100000000004', '2000000004', '600111114', 0, 4),
(13, '11111111E', '100000000005', '2000000005', '600111115', 0, 6),
(14, '11111111F', '100000000006', '2000000006', '600111116', 1, 6),
(15, '11111111G', '100000000007', '2000000007', '600111117', 0, 8),
(16, '11111111H', '100000000008', '2000000008', '600111118', 0, 8),
(17, '11111111I', '100000000009', '2000000009', '600111119', 0, 2),
(18, '11111111J', '100000000010', '2000000010', '600111120', 1, 4),
(19, '11111111K', '100000000011', '2000000011', '600111121', 0, 6),
(20, '11111111L', '100000000012', '2000000012', '600111122', 0, 2),
(21, '11111111M', '100000000013', '2000000013', '600111123', 0, 4),
(22, '11111111N', '100000000014', '2000000014', '600111124', 0, 6),
(23, '11111111P', '100000000015', '2000000015', '600111125', 1, 8),
(24, '11111111Q', '100000000016', '2000000016', '600111126', 0, 2),
(25, '11111111R', '100000000017', '2000000017', '600111127', 0, 4);

-- =====================================================
-- ANEXO IV
-- =====================================================

INSERT INTO ANEXO_IV (idAlumnos) VALUES
(9),(10),(11),(12),(13),(14),(15),(16),
(17),(18),(19),(20),(21),(22),(23),(24),(25);

-- =====================================================
-- CONTACTO
-- =====================================================

INSERT INTO Contacto (
    tfnoContacto,
    nombreContacto,
    titular,
    idEmpresa
) VALUES
('911111111', 'Pedro Garcia', 'RRHH', 1),
('922222222', 'Ana Ruiz', 'CTO', 2),
('933333333', 'Miguel Torres', 'Responsable IT', 3),
('944444444', 'Laura Perez', 'Manager', 4),
('955555555', 'Alberto Diaz', 'Director', 5),
('966666666', 'Marta Leon', 'CEO', 6),
('977777777', 'Clara Sanchez', 'Recursos Humanos', 7),
('988888888', 'Raul Martin', 'Jefe Proyecto', 8);

-- =====================================================
-- MODULOS
-- =====================================================

INSERT INTO Modulos (nombre, sigla, color) VALUES
('Bases de Datos', 'BBDD', '#FF5733'),
('Programacion', 'PROG', '#33FF57'),
('Lenguaje de Marcas', 'LMSGI', '#3357FF'),
('Entornos de Desarrollo', 'EDED', '#F1C40F'),
('Sistemas Informaticos', 'SI', '#8E44AD'),
('Empresa e Iniciativa', 'EIE', '#16A085'),
('Despliegue Aplicaciones', 'DESPL', '#E74C3C'),
('DW Cliente', 'DWEC', '#2ECC71'),
('DW Servidor', 'DWES', '#3498DB'),
('Diseño Interfaces', 'DIW', '#1ABC9C');

-- =====================================================
-- ACTIVIDADES
-- =====================================================

INSERT INTO Actividades (
    titulo,
    descripcion,
    idCoordinador
) VALUES
('API REST', 'Creacion API REST Spring Boot', 1),
('Responsive Web', 'Diseño responsive completo', 1),
('JWT Login', 'Sistema autenticacion JWT', 2),
('Dockerizacion', 'Dockerizar proyecto', 2),
('Modelo Relacional', 'Diseño completo BBDD', 3),
('Deploy VPS', 'Despliegue servidor Linux', 4),
('Testing Backend', 'Pruebas unitarias backend', 2),
('Microservicios', 'Arquitectura microservicios', 3),
('Laravel CRUD', 'CRUD Laravel', 1),
('React Frontend', 'Frontend React', 4);

-- =====================================================
-- MODULO CURSO
-- =====================================================

INSERT INTO Modulo_Curso VALUES
(1,1),(2,1),(3,1),(4,1),(5,1),
(6,2),(7,2),(8,2),(9,2),(10,2);

-- =====================================================
-- MODULO PROFESOR
-- =====================================================

INSERT INTO Modulo_Profesor VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5),
(6,6),
(7,7),
(8,8),
(9,1),
(10,2);

-- =====================================================
-- MODULO ACTIVIDAD
-- =====================================================

INSERT INTO Modulo_Actividad VALUES
(1,5),
(2,1),
(2,3),
(7,4),
(8,2),
(9,6),
(9,7),
(9,8),
(10,9),
(8,10);

-- =====================================================
-- MODULO ALUMNO CURSA
-- =====================================================

INSERT INTO Modulo_Alumno_Cursa VALUES
(1,9),(2,9),(3,9),
(1,10),(2,10),
(2,11),(3,11),
(4,12),(5,12),
(6,13),(7,13),
(8,14),(9,14),
(10,15),
(1,16),(2,16),
(3,17),(4,17),
(5,18),(6,18),
(7,19),(8,19),
(9,20),(10,20);

-- =====================================================
-- MODULO ALUMNO PENDIENTE
-- =====================================================

INSERT INTO Modulo_Alumno_Pendiente VALUES
(1,11),
(2,12),
(3,13),
(4,14),
(5,15),
(6,16),
(7,17),
(8,18);

-- =====================================================
-- TAREAS
-- =====================================================

INSERT INTO Tareas (
    codigo_auto,
    titulo,
    fecha_inicio,
    fecha_fin,
    descripcion,
    calificacion,
    comentario,
    idAlumno
) VALUES
('24-25_DAW_T1', 'Login Web', '2024-09-01 08:00:00', '2024-09-10 14:00:00', 'Crear login', 'notable', 'Muy bien', 9),
('24-25_DAW_T2', 'CRUD Usuarios', '2024-09-05 08:00:00', '2024-09-15 14:00:00', 'CRUD completo', 'sobresaliente', 'Perfecto', 10),
('24-25_DAM_T1', 'API Productos', '2024-09-06 08:00:00', '2024-09-18 14:00:00', 'API REST', 'bien', 'Correcto', 11),
('24-25_ASIR_T1', 'Servidor Linux', '2024-09-07 08:00:00', '2024-09-20 14:00:00', 'Ubuntu Server', 'suficiente', 'Mejorable', 12),
('24-25_DAW_T3', 'JWT Auth', '2024-09-08 08:00:00', '2024-09-22 14:00:00', 'JWT completo', 'notable', 'Muy seguro', 13),
('24-25_DAW_T4', 'Docker App', '2024-09-09 08:00:00', '2024-09-24 14:00:00', 'Dockerizar app', 'sobresaliente', 'Excelente', 14),
('24-25_DAW_T5', 'Deploy AWS', '2024-09-10 08:00:00', '2024-09-28 14:00:00', 'Despliegue cloud', 'bien', 'Correcto', 15),
('24-25_DAW_T6', 'Frontend React', '2024-09-11 08:00:00', '2024-09-29 14:00:00', 'Frontend React', 'insuficiente', 'Faltan vistas', 16),
('24-25_DAW_T7', 'Laravel CRUD', '2024-09-12 08:00:00', '2024-10-01 14:00:00', 'CRUD Laravel', 'notable', 'Buen trabajo', 17),
('24-25_DAW_T8', 'Microservicios', '2024-09-13 08:00:00', '2024-10-03 14:00:00', 'Arquitectura distribuida', 'sobresaliente', 'Excelente arquitectura', 18);

-- =====================================================
-- TAREA ACTIVIDAD
-- =====================================================

INSERT INTO Tarea_Actividad VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5),
(6,6),
(7,7),
(8,8),
(9,9),
(10,10);

-- =====================================================
-- MODULO TAREA REVISION
-- =====================================================

INSERT INTO Modulo_Tarea_Revision VALUES
(2,1,1,'Todo correcto'),
(2,2,1,'Excelente'),
(9,3,1,'API correcta'),
(5,4,0,'Falta documentacion'),
(9,5,1,'Muy seguro'),
(7,6,1,'Docker correcto'),
(8,7,1,'Buen deploy'),
(10,8,0,'Mejorar diseño'),
(9,9,1,'CRUD completo'),
(9,10,1,'Arquitectura limpia');

-- =====================================================
-- CICLO EMPRESA
-- =====================================================

INSERT INTO Ciclo_Empresa VALUES
(1,1,'Pedro Garcia'),
(1,2,'Ana Ruiz'),
(1,3,'Miguel Torres'),
(2,4,'Laura Perez'),
(2,5,'Alberto Diaz'),
(3,6,'Marta Leon'),
(4,7,'Clara Sanchez'),
(5,8,'Raul Martin');

-- =====================================================
-- EMPRESA ALUMNOS
-- =====================================================

INSERT INTO Empresa_Alumnos VALUES
(1,9),
(1,10),
(2,11),
(2,12),
(3,13),
(3,14),
(4,15),
(4,16),
(5,17),
(5,18),
(6,19),
(6,20),
(7,21),
(7,22),
(8,23),
(8,24);

-- =====================================================
-- CONFIGURACION
-- =====================================================

INSERT INTO Configuracion VALUES
(30,4);