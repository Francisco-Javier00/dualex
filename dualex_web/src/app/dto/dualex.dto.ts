/**
 * Archivo central de DTOs e Interfaces para el tipado estricto en el Frontend.
 * 
 * Define las estructuras de datos devueltas por la API y usadas internamente
 * por los componentes y servicios de la aplicación Dualex.
 */
export interface AlertaDTO {
  id: string;
  tipo: 'info' | 'warning' | 'success' | 'danger';
  titulo: string;
  mensaje: string;
  fecha: Date;
  autoCierre?: boolean;
  duracion?: number; // milisegundos
}

export interface PerfilUsuarioDTO {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  esGeneral?: boolean;
}

export interface JwtPayload {
  iat?: number;
  exp?: number;
  data: {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    roles: string[];
    esGeneral?: boolean;
    foto?: string;
  };
}

export interface CategoriaDTO {
  titulo: string;
  icono: string;
  imagen: string;
  colorIcono?: string;
  ruta?: string;
}

export interface ModuloProfesorDTO {
  idModulo: number;
  nombre: string;
  sigla: string;
  color: string;
  numAlumnos?: number;
  numActividades?: number;
}

export interface TareaDTO {
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
  revisadoProfesor?: boolean;
  comentarioProfesor?: string;
  revisionesModulos?: ModuloRevisionDTO[];
  idAlumno?: number;
  codigo_auto?: string;
  documento?: string;
}

export interface ModuloRevisionDTO {
  modulo: string;
  revisado: boolean;
  comentario?: string;
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
  nombreCurso?: string; // Para mostrar en tablas
  numTareas?: number;
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
}

export interface CursoDTO {
  id: number;
  nombre: string;
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
  cargo?: string;
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
  cargo?: string;
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
