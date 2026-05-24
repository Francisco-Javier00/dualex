import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ActividadDTO, CicloDTO, ModuloDTO } from '../../../dto/dualex.dto';
import { AlertService } from '../../../services/alert.service';
import { CiclosService } from '../../../services/ciclos.service';
import { ModulosService } from '../../../services/modulos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ProfesoresService } from '../../../services/profesores.service';

// Validador personalizado para asegurar que el array de idModulos no esté vacío
export function arrayNotEmptyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isArray = Array.isArray(control.value);
    const isEmpty = !isArray || control.value.length === 0;
    return isEmpty ? { arrayEmpty: true } : null;
  };
}

interface NodoCiclo {
  id: number;
  nombre: string;
  siglas: string;
  modulos: ModuloDTO[];
  expanded?: boolean;
}

@Component({
  selector: 'app-actividad-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './actividad-modal.component.html',
  styleUrl: './actividad-modal.component.css'
})
export class ActividadModalComponent implements OnChanges, OnDestroy, OnInit {
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private alertService = inject(AlertService);
  private ciclosService = inject(CiclosService);
  private modulosService = inject(ModulosService);
  private authService = inject(AuthService);
  private profesoresService = inject(ProfesoresService);

  @Input() visible = false;
  @Input() actividad: ActividadDTO | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardarEvent = new EventEmitter<ActividadDTO>();
  @Output() cancelarEvent = new EventEmitter<void>();

  actividadForm: FormGroup;

  // Árbol jerárquico
  arbolCiclos: NodoCiclo[] = [];
  cargandoArbol = false;
  esCoordinador = false;

  constructor() {
    this.actividadForm = this.fb.group({
      id: [null],
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(60)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      idModulos: [[], [arrayNotEmptyValidator()]] // Array de IDs de módulos seleccionados
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.esCoordinador = user?.rol === 'COORDINADOR';
    this.cargarDatosArbol();
  }

  /**
   * Carga en paralelo la lista de ciclos y módulos para poblar el árbol.
   */
  cargarDatosArbol(): void {
    this.cargandoArbol = true;
    const user = this.authService.currentUserValue;

    if (user && user.rol === 'COORDINADOR') {
      forkJoin({
        ciclos: this.ciclosService.getCiclos(),
        modulos: this.modulosService.getModulos(),
        profesor: this.profesoresService.getProfesorByEmail(user.email)
      }).subscribe({
        next: ({ ciclos, modulos, profesor }) => {
          const ciclosAsociados = profesor && profesor.ciclos
            ? profesor.ciclos.split(',').map((s: string) => s.trim().toUpperCase())
            : [];

          const ciclosFiltrados = ciclos.filter(c => ciclosAsociados.includes(c.siglas.toUpperCase()));

          this.arbolCiclos = ciclosFiltrados.map((c: CicloDTO) => ({
            id: c.id || 0,
            nombre: c.nombre,
            siglas: c.siglas,
            expanded: true, // Auto-expand coordinator's cycles
            modulos: modulos.filter((m: ModuloDTO) => m.ciclo === c.siglas)
          }));
          this.cargandoArbol = false;
          
          if (this.actividad) {
            this.sincronizarCheckboxesEdicion();
          }
        },
        error: () => {
          this.cargandoArbol = false;
          this.alertService.error('Error del Servidor', 'No se pudieron recuperar las asignaturas y ciclos formativos.');
        }
      });
    } else {
      forkJoin({
        ciclos: this.ciclosService.getCiclos(),
        modulos: this.modulosService.getModulos()
      }).subscribe({
        next: ({ ciclos, modulos }) => {
          this.arbolCiclos = ciclos.map((c: CicloDTO) => ({
            id: c.id || 0,
            nombre: c.nombre,
            siglas: c.siglas,
            expanded: false,
            modulos: modulos.filter((m: ModuloDTO) => m.ciclo === c.siglas)
          }));
          this.cargandoArbol = false;
          
          if (this.actividad) {
            this.sincronizarCheckboxesEdicion();
          }
        },
        error: () => {
          this.cargandoArbol = false;
          this.alertService.error('Error del Servidor', 'No se pudieron recuperar las asignaturas y ciclos formativos.');
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }

    if (changes['actividad'] && this.actividad) {
      this.actividadForm.patchValue({
        id: this.actividad.id,
        titulo: this.actividad.titulo,
        descripcion: this.actividad.descripcion
      });
      this.sincronizarCheckboxesEdicion();
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.actividad) {
      this.actividadForm.reset({
        id: null,
        titulo: '',
        descripcion: '',
        idModulos: []
      });
    }
  }

  sincronizarCheckboxesEdicion(): void {
    if (!this.actividad) return;

    let arrayIds: number[] = [];
    const rawIds = (this.actividad as any).idModulos;

    if (Array.isArray(rawIds)) {
      arrayIds = rawIds.map(num => typeof num === 'string' ? parseInt(num, 10) : num);
    } else if (typeof rawIds === 'string' && rawIds.trim() !== '') {
      arrayIds = rawIds.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
    } else if (typeof rawIds === 'number') {
      arrayIds = [rawIds];
    }

    this.actividadForm.patchValue({ idModulos: arrayIds });

    // Expandimos automáticamente aquellos ciclos que tengan al menos un módulo seleccionado
    if (this.arbolCiclos && this.arbolCiclos.length > 0) {
      this.arbolCiclos.forEach(ciclo => {
        const tieneModulosSeleccionados = ciclo.modulos.some(m => arrayIds.includes(m.id));
        if (tieneModulosSeleccionados) {
          ciclo.expanded = true;
        }
      });
    }
  }

  /**
   * Expande o colapsa el nodo de un ciclo al pulsar sobre él.
   */
  toggleCiclo(ciclo: NodoCiclo): void {
    ciclo.expanded = !ciclo.expanded;
  }

  isModuloSelected(idModulo: any): boolean {
    const seleccionados: any[] = this.actividadForm.get('idModulos')?.value || [];
    return seleccionados.some(id => Number(id) === Number(idModulo));
  }

  /**
   * Gestiona la selección y deselección de un checkbox de módulo.
   */
  toggleModuloSelection(idModulo: any): void {
    const control = this.actividadForm.get('idModulos');
    if (!control) return;

    const targetId = Number(idModulo);
    let seleccionados: number[] = [...control.value].map(id => Number(id));

    if (seleccionados.includes(targetId)) {
      seleccionados = seleccionados.filter(id => id !== targetId);
    } else {
      seleccionados.push(targetId);
    }

    control.setValue(seleccionados);
    control.markAsDirty();
    control.markAsTouched();
  }

  private toggleBodyScroll(isVisible: boolean): void {
    if (isVisible) {
      this.renderer.addClass(document.documentElement, 'modal-open');
      this.renderer.addClass(document.body, 'modal-open');
    } else {
      this.renderer.removeClass(document.documentElement, 'modal-open');
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  onSubmit(): void {
    if (this.actividadForm.valid) {
      this.guardarEvent.emit(this.actividadForm.value);
      this.cerrar();
    } else {
      this.actividadForm.markAllAsTouched();
      const controlModulos = this.actividadForm.get('idModulos');
      if (controlModulos && controlModulos.errors?.['arrayEmpty']) {
        this.alertService.advertencia('Falta Asignatura', 'Debe seleccionar al menos un módulo formativo/asignatura del árbol para registrar la actividad.');
      } else {
        this.alertService.advertencia('Formulario Incompleto', 'Por favor, rellene los campos obligatorios del formulario.');
      }
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelarEvent.emit();
    this.toggleBodyScroll(false);
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }
}
