import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadDTO } from '../../../../dto/dualex.dto';

/**
 * SeleccionActividadesModalComponent
 * Modal especializado para la gestión de relaciones Muchos a Muchos (M:N).
 * Permite al usuario filtrar el catálogo completo de actividades y seleccionar
 * cuáles están vinculadas a la tarea que está editando.
 */
@Component({
  selector: 'app-seleccion-actividades-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seleccion-actividades-modal.component.html',
  styleUrl: './seleccion-actividades-modal.component.css'
})
export class SeleccionActividadesModalComponent implements OnInit, OnDestroy, OnChanges {
  // Renderer2 permite manipular clases del body/html de forma compatible con SSR
  private renderer = inject(Renderer2);

  // ENTRADAS
  @Input() visible = false;                       // Control de visibilidad desde el padre
  @Input() todasLasActividades: ActividadDTO[] = []; // El catálogo maestro completo
  @Input() seleccionadas: number[] = [];           // Array de IDs ya vinculados

  // SALIDAS
  @Output() visibleChange = new EventEmitter<boolean>(); // Emisor para [(visible)]
  @Output() seleccionChange = new EventEmitter<number[]>(); // Emisor para cambios en la lista de IDs

  // ESTADO LOCAL
  busqueda = '';                        // Texto del buscador
  actividadesFiltradas: ActividadDTO[] = []; // Lista reducida tras aplicar el filtro

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    // Al arrancar, mostramos todas las actividades disponibles
    this.actividadesFiltradas = this.todasLasActividades;
  }

  /**
   * Se ejecuta cada vez que el padre cambia alguna propiedad de entrada.
   */
  ngOnChanges(): void {
    this.filtrar();          // Re-filtramos por si han cambiado las actividades base
    this.toggleBodyScroll(); // Bloqueamos o liberamos el scroll según visibilidad
  }

  /**
   * Evita que el usuario pueda hacer scroll en la página principal 
   * mientras el modal está abierto.
   */
  private toggleBodyScroll(): void {
    if (this.visible) {
      this.renderer.addClass(document.documentElement, 'modal-open');
      this.renderer.addClass(document.body, 'modal-open');
    } else {
      this.renderer.removeClass(document.documentElement, 'modal-open');
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  /**
   * Aplica un filtro de texto sobre el catálogo de actividades.
   * Busca coincidencias en el Título o en el Módulo asociado.
   */
  filtrar(): void {
    const term = this.busqueda.toLowerCase().trim();
    this.actividadesFiltradas = this.todasLasActividades.filter(a =>
      a.titulo.toLowerCase().includes(term) ||
      a.modulo.toLowerCase().includes(term)
    );
  }

  /**
   * Helper para la UI: Determina si una actividad específica está en la lista de seleccionadas.
   */
  estaSeleccionada(id: number): boolean {
    return this.seleccionadas?.includes(id) || false;
  }

  /**
   * Lógica de Selección (Toggle):
   * Si la actividad ya estaba seleccionada, la quita. Si no, la añade.
   * Emite el nuevo array de IDs al componente padre.
   */
  toggle(id: number): void {
    if (!this.seleccionadas) this.seleccionadas = [];
    
    const index = this.seleccionadas.indexOf(id);
    if (index > -1) {
      this.seleccionadas.splice(index, 1); // Quitar
    } else {
      this.seleccionadas.push(id);         // Añadir
    }
    
    // Emitimos una copia del array para que Angular detecte el cambio de referencia
    this.seleccionChange.emit([...this.seleccionadas]);
  }

  /**
   * Cierra el modal y comunica el cambio al padre.
   */
  cerrar(): void {
    this.visible = false;
    this.toggleBodyScroll();
    this.visibleChange.emit(false);
  }

  /**
   * Limpieza de seguridad al destruir el componente del DOM.
   */
  ngOnDestroy(): void {
    this.renderer.removeClass(document.documentElement, 'modal-open');
    this.renderer.removeClass(document.body, 'modal-open');
  }
}
