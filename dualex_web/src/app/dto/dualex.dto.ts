export interface Alerta {
  id: string;
  tipo: 'info' | 'warning' | 'success' | 'danger';
  titulo: string;
  mensaje: string;
  fecha: Date;
  autoCierre?: boolean;
  duracion?: number; // milisegundos
}

export interface PerfilUsuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  foto?: string;
  rol: string;
  esGeneral?: boolean;
}

export interface JwtPayload {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  foto?: string;
  roles: {
    global?: string;
    dualex?: string;
    [key: string]: string | undefined;
  };
  esGeneral?: boolean;
  exp?: number;
  iat?: number;
}

export interface Categoria {
  titulo: string;
  icono: string;
  imagen: string;
  colorIcono?: string;
  ruta?: string;
}

export interface ModuloProfesor {
  idModulo: number;
  nombre: string;
  sigla: string;
  color: string;
  numAlumnos?: number;
  numActividades?: number;
}

export interface Tarea {
  id: number;
  modulos: { sigla: string; color: string }[];
  titulo: string;
  fechaLimite: string;
  calificacion: string;
  progreso: {
    actual: number;
    total: number;
  };
  fechaIni?: string;
  fechaFin?: string;
  descripcion?: string;
  actividadesSeleccionadas?: number[];
  evaluacionEmpresa?: string;
  comentarioEmpresa?: string;
  moduloEvaluacion?: string;
  revisadoProfesor?: boolean;
  comentarioProfesor?: string;
  revisionesModulos?: ModuloRevision[];
  idAlumno?: number;
  codigo_auto?: string;
}

export interface ModuloRevision {
  modulo: string;
  revisado: boolean;
}

export interface ActividadDTO {
  id: number;
  titulo: string;
  descripcion: string;
  modulo: string;
  idModulo?: number;
  idModulos?: number[];
}

export interface AlumnoDTO {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  nia: string;
  nuss: string;
  dni: string;
  telefono: string;
  repetidor: boolean;
  idCurso: number;
  idEmpresa?: number;
  estado?: 'Activo' | 'Inactivo';
  nombreCurso?: string; // Para mostrar en tablas
}

export interface ModuloDTO {
  id: number;
  nombre: string;
  siglas: string;
  ciclo: string;
}

export interface CicloDTO {
  id?: number;
  nombre: string;
  siglas: string;
  grado?: string;
  cursos?: string;
  anoEscolar?: string;
  colorFondo1?: string;
  colorTexto1?: string;
  colorFondo2?: string;
  colorTexto2?: string;
}

export interface CursoDTO {
  id: number;
  nombre: string;
  curso: number;
  anoEscolar: string;
  anio_escolar?: string;
  ciclo: string;
  siglasCiclo?: string;
  idCiclo?: number;
  grado?: string;
}

export interface ContactoEmpresaDTO {
  contacto: string;
  numeroContacto: string;
  correo: string;
}

export interface EmpresaDTO {
  id: number;
  siglas: string;
  nombre: string;
  convenioUrl: string;
  inicioConvenio: string;
  finConvenio: string;
  contacto: string;
  numeroContacto: string;
  correo: string;
  ciclos?: string;
  contactosAdicionales?: ContactoEmpresaDTO[];
  ciclosInfo?: { siglas: string, tutor: string }[];
}

export interface ProfesorDTO {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: 'PROFESOR' | 'COORDINADOR';
  modulos: string;
  ciclos: string;
}


export interface ConfiguracionDTO {
  diasAvisoCaducidad: number;
  tiempoFinalizacionConvenio: number;
  urlConvenio: string;
}
