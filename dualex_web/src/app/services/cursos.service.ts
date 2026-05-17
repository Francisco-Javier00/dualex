import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CursoDTO } from '../dto/dualex.dto';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de la gestión integral de Cursos académicos dentro de los ciclos formativos.
 * Se comunica con la API PHP para realizar operaciones CRUD y consultas específicas.
 */
@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Cursos`;

  constructor() { }

  /**
   * Obtiene el listado completo de todos los cursos registrados en la plataforma.
   * 
   * @returns Un `Observable` con un array de objetos `CursoDTO`.
   */
  getCursos(): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene todos los cursos que pertenecen a un ciclo formativo específico.
   * 
   * @param idCiclo Identificador único del ciclo formativo.
   * @returns Un `Observable` con un array de `CursoDTO` filtrados por el ciclo indicado.
   */
  getCursosByCiclo(idCiclo: number): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listar&idCiclo=${idCiclo}`);
  }

  /**
   * Registra un nuevo curso en el sistema.
   * 
   * @param curso Objeto con los datos del curso (nombre, turno, ciclo asociado, etc.).
   * @returns Un `Observable` con el curso recién creado devuelto por el servidor.
   */
  addCurso(curso: CursoDTO): Observable<CursoDTO> {
    return this.http.post<CursoDTO>(`${this.API_URL}&m=crear`, curso);
  }

  /**
   * Actualiza la información de un curso existente.
   * 
   * @param id Identificador único del curso a editar.
   * @param curso Objeto `CursoDTO` con los datos actualizados.
   * @returns Un `Observable` con la respuesta de la modificación.
   */
  updateCurso(id: number, curso: CursoDTO): Observable<CursoDTO> {
    return this.http.put<CursoDTO>(`${this.API_URL}&m=actualizar&id=${id}`, curso);
  }

  /**
   * Elimina un curso de la base de datos.
   * 
   * @param id Identificador del curso a eliminar.
   * @returns Un `Observable` booleano que confirma el éxito de la operación.
   */
  deleteCurso(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Obtiene los cursos en los que un profesor específico imparte algún módulo.
   * 
   * @param idProfesor Identificador del profesor.
   * @returns Un `Observable` con la lista de cursos relevantes para el profesor.
   */
  getCursosByProfesor(idProfesor: number): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listarPorProfesor&idProfesor=${idProfesor}`);
  }
}
