import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * ConfirmarBorradoModalComponent
 * Un modal reutilizable de seguridad que obliga al usuario a escribir una "palabra clave"
 * para confirmar acciones destructivas (como eliminar alumnos o tareas).
 */
@Component({
  selector: 'app-confirmar-borrado-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-borrado-modal.component.html',
  styleUrl: './confirmar-borrado-modal.component.css'
})
export class ConfirmarBorradoModalComponent implements OnChanges, OnDestroy {
  // Renderer2 se utiliza para manipular el DOM de forma segura (añadir/quitar clases al body)
  private renderer = inject(Renderer2);

  // PROPIEDADES DE ENTRADA (Configuración del modal)
  @Input() visible: boolean = false; // Controla si el modal se muestra
  @Input() titulo: string = 'Eliminar'; // Título de la cabecera
  @Input() mensaje: string = '¿Estás seguro de que deseas eliminar este elemento?'; // Cuerpo del mensaje
  @Input() palabraClave: string = 'confirmar'; // Palabra que el usuario debe escribir para habilitar el botón

  // EVENTOS DE SALIDA (Comunicación con el padre)
  @Output() confirmarEvent = new EventEmitter<void>(); // Se emite al pulsar el botón de borrado (si es válido)
  @Output() cancelarEvent = new EventEmitter<void>();  // Se emite al cerrar o cancelar

  // Variable vinculada al input de texto del modal
  textoInput: string = '';

  /**
   * Getter que valida si lo escrito por el usuario coincide con la palabra clave.
   * Ignora mayúsculas/minúsculas y espacios laterales.
   */
  get puedeConfirmar(): boolean {
    return this.textoInput.toLowerCase().trim() === this.palabraClave.toLowerCase().trim();
  }

  /**
   * Ciclo de vida: Se ejecuta cada vez que cambian las @Input properties.
   * Aquí gestionamos el bloqueo del scroll del body cuando el modal se abre.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      const isVisible = changes['visible'].currentValue;
      if (isVisible) {
        // Resetear el input al abrir
        this.textoInput = '';
        // Bloquear scroll de la página de fondo
        this.renderer.addClass(document.documentElement, 'modal-open');
        this.renderer.addClass(document.body, 'modal-open');
      } else {
        // Liberar scroll al cerrar
        this.renderer.removeClass(document.documentElement, 'modal-open');
        this.renderer.removeClass(document.body, 'modal-open');
      }
    }
  }

  /**
   * Lógica de Confirmación
   */
  onConfirmar(): void {
    if (this.puedeConfirmar) {
      this.renderer.removeClass(document.documentElement, 'modal-open');
      this.renderer.removeClass(document.body, 'modal-open');
      this.confirmarEvent.emit();
      this.textoInput = '';
    }
  }

  /**
   * Lógica de Cancelación
   */
  onCancelar(): void {
    this.textoInput = '';
    this.renderer.removeClass(document.documentElement, 'modal-open');
    this.renderer.removeClass(document.body, 'modal-open');
    this.cancelarEvent.emit();
  }

  /**
   * Limpieza de seguridad al destruir el componente
   */
  ngOnDestroy(): void {
    this.renderer.removeClass(document.documentElement, 'modal-open');
    this.renderer.removeClass(document.body, 'modal-open');
  }
}
