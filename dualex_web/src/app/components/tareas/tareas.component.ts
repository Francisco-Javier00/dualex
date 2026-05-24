import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { TareasService } from '../../services/tareas.service';
import { Tarea } from '../../dto/dualex.dto';
import { AuthService } from '../../auth/services/auth.service';

/**
 * TareasComponent
 * Componente que muestra el listado de tareas (cuaderno del alumno).
 * Puede funcionar como un listado global o filtrado por un alumno específico
 * si recibe el parámetro 'alumnoId' en la URL.
 */
@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmarBorradoModalComponent],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css']
})
export class TareasComponent implements OnInit {
  // Inyección de servicios
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tareasService = inject(TareasService);
  private authService = inject(AuthService);
  
  // ESTADO DEL COMPONENTE
  modalBorradoVisible = false;           // Controla el modal de confirmación
  tareaSeleccionada: Tarea | null = null; // Tarea que se pretende borrar o editar
  tareas: Tarea[] = [];                 // Lista de tareas cargadas
  alumnoId: number | null = null;       // ID del alumno si la ruta es /tareas/:alumnoId
  esProfesor = false;                   // Flag para saber si es perfil profesor

  /**
   * Inicialización: Suscripción a los parámetros de la ruta para detectar cambios dinámicos.
   */
  ngOnInit(): void {
    this.esProfesor = this.authService.currentUserValue?.rol === 'PROFESOR';
    this.route.paramMap.subscribe(params => {
      const id = params.get('alumnoId');
      this.alumnoId = id ? +id : null;
      this.cargarTareas();
    });
  }

  /**
   * Carga de Datos: Decide si llamar al listado global o al filtrado por alumno.
   */
  cargarTareas(): void {
    if (this.alumnoId) {
      // Vista filtrada por alumno
      this.tareasService.getTareasByAlumno(this.alumnoId).subscribe(data => {
        this.tareas = data;
      });
    } else {
      // Vista global (Coordinador / Profesor)
      this.tareasService.getTareas().subscribe(data => {
        this.tareas = data;
      });
    }
  }

  /**
   * Helper de UI: Retorna las clases de Bootstrap según el texto de la calificación.
   * Utiliza variantes '-subtle' para un diseño más moderno y legible.
   */
  getCalificacionClases(calificacion: string): string {
    switch(calificacion) {
      case 'Bien': return 'bg-success-subtle border-success text-success';
      case 'Superado': return 'bg-success-subtle border-success text-success';
      case 'No Superado': return 'bg-danger-subtle border-danger text-danger';
      case 'Notable': return 'bg-info-subtle border-info text-info';
      case 'Excelente': return 'bg-primary-subtle border-primary text-primary';
      case 'Sin Calificar': return 'bg-white border-secondary text-secondary';
      default: return 'bg-light border-secondary text-dark';
    }
  }

  /**
   * Elimina las etiquetas HTML de un texto y limpia las entidades HTML comunes.
   */
  stripHtmlTags(html?: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Navegación al formulario de creación.
   */
  crearTarea(): void {
    if (this.alumnoId) {
      this.router.navigate(['/tarea/nueva'], { queryParams: { alumnoId: this.alumnoId } });
    } else {
      this.router.navigate(['/tarea/nueva']);
    }
  }

  /**
   * Navegación al formulario de edición/vista de una tarea específica.
   */
  verTarea(tarea: Tarea): void {
    this.router.navigate(['/tarea', tarea.id]);
  }

  /**
   * Activa el flujo de borrado mostrando el modal de confirmación.
   */
  eliminarTarea(tarea: Tarea): void {
    this.tareaSeleccionada = tarea;
    this.modalBorradoVisible = true;
  }

  /**
   * Ejecuta el borrado real tras la confirmación del usuario en el modal.
   */
  onConfirmarBorrado(): void {
    if (this.tareaSeleccionada) {
      this.tareasService.deleteTarea(this.tareaSeleccionada.id).subscribe(() => {
        this.cargarTareas(); // Recargamos la lista tras el borrado
      });
    }
    this.modalBorradoVisible = false;
    this.tareaSeleccionada = null;
  }

  /**
   * Cierra el modal de borrado sin realizar ninguna acción.
   */
  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.tareaSeleccionada = null;
  }
}
