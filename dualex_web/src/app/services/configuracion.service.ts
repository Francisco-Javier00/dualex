import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConfiguracionDTO } from '../dto/dualex.dto';

/**
 * Servicio para gestionar la configuración global desde la base de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);

  // URL de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php`;

  /**
   * Obtiene la configuración actual de la plataforma desde la base de datos (e.g. curso escolar activo, umbrales).
   * 
   * @returns Un `Observable` que emite el objeto `ConfiguracionDTO` con los ajustes globales.
   */
  getConfiguracion(): Observable<ConfiguracionDTO> {
    return this.http.get<ConfiguracionDTO>(`${this.API_URL}?c=Configuracion&m=obtenerConfiguracion`);
  }

  /**
   * Actualiza y persiste los valores de configuración en la base de datos.
   * 
   * @param config Objeto `ConfiguracionDTO` con los nuevos valores a guardar.
   * @returns Un `Observable` con la confirmación de la actualización por parte del servidor.
   */
  updateConfiguracion(config: ConfiguracionDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Configuracion&m=actualizarConfiguracion`, config);
  }
}
