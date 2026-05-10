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

export interface ProfesorDTO {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: 'PROFESOR' | 'COORDINADOR';
  modulos: string;
  ciclos: string;
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
  contactosAdicionales?: ContactoEmpresaDTO[];
}

export interface ContactoEmpresaDTO {
  contacto: string;
  numeroContacto: string;
}
