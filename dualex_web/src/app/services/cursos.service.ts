import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CursoDTO } from '../dto/dualex.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Cursos`;

  constructor() { }

  getCursos(): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listar`);
  }

  getCursosByCiclo(idCiclo: number): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listar&idCiclo=${idCiclo}`);
  }

  addCurso(curso: CursoDTO): Observable<CursoDTO> {
    return this.http.post<CursoDTO>(`${this.API_URL}&m=crear`, curso);
  }

  updateCurso(id: number, curso: CursoDTO): Observable<CursoDTO> {
    return this.http.put<CursoDTO>(`${this.API_URL}&m=actualizar&id=${id}`, curso);
  }

  deleteCurso(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  getCursosByProfesor(idProfesor: number): Observable<CursoDTO[]> {
    return this.http.get<CursoDTO[]>(`${this.API_URL}&m=listarPorProfesor&idProfesor=${idProfesor}`);
  }
}
