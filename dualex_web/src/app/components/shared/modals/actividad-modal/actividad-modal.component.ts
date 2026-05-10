import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActividadDTO } from '../../../../dto/dualex.dto';

/**
 * ActividadModalComponent
 * Modal reutilizable para CREAR o MODIFICAR una actividad del catálogo maestro.
 * Utiliza formularios reactivos de Angular para la validación y captura de datos.
 */
@Component({
  selector: 'app-actividad-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './actividad-modal.component.html',
  styleUrl: './actividad-modal.component.css'
})
export class ActividadModalComponent implements OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);

  // PROPIEDADES DE ENTRADA
  @Input() visible = false;                  // Controla la visibilidad del modal
  @Input() actividad: ActividadDTO | null = null; // Si se recibe, el modal entra en modo edición

  // EVENTOS DE SALIDA
  @Output() visibleChange = new EventEmitter<boolean>(); // Emisor para vinculación bidireccional
  @Output() guardarEvent = new EventEmitter<ActividadDTO>(); // Emite los datos al guardar
  @Output() cancelarEvent = new EventEmitter<void>();        // Emite al cerrar sin guardar

  // Formulario reactivo
  actividadForm: FormGroup;

  constructor() {
    // Inicialización de la estructura del formulario
    this.actividadForm = this.fb.group({
      id: [null],
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required]],
      modulo: ['', [Validators.required]]
    });
  }

  /**
   * Ciclo de vida: Se activa cuando cambian las entradas (visible o actividad).
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia la visibilidad, gestionamos el scroll del body
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }

    // Si recibimos una actividad para editar, cargamos sus datos en el formulario
    if (changes['actividad'] && this.actividad) {
      this.actividadForm.patchValue(this.actividad);
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.actividad) {
      // Si abrimos el modal para crear (sin actividad), reseteamos el formulario
      this.actividadForm.reset();
    }
  }

  /**
   * Bloquea o libera el scroll de la página de fondo.
   */
  private toggleBodyScroll(isVisible: boolean): void {
    if (isVisible) {
      this.renderer.addClass(document.documentElement, 'modal-open');
      this.renderer.addClass(document.body, 'modal-open');
    } else {
      this.renderer.removeClass(document.documentElement, 'modal-open');
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  /**
   * Envía los datos capturados al componente padre si el formulario es válido.
   */
  onSubmit(): void {
    if (this.actividadForm.valid) {
      this.guardarEvent.emit(this.actividadForm.value);
      this.cerrar();
    } else {
      // Marcamos los campos como 'touched' para mostrar los errores de validación en la UI
      this.actividadForm.markAllAsTouched();
    }
  }

  /**
   * Cierra el modal y notifica al padre.
   */
  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelarEvent.emit();
    this.toggleBodyScroll(false);
  }

  /**
   * Limpieza de seguridad al destruir el componente.
   */
  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }
}
