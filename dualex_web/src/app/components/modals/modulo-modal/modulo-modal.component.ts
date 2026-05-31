import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO, CicloDTO, CursoDTO } from '../../../dto/dualex.dto';
import { CiclosService } from '../../../services/ciclos.service';
import { CursosService } from '../../../services/cursos.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-modulo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modulo-modal.component.html',
  styleUrls: ['./modulo-modal.component.css']
})
export class ModuloModalComponent implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private ciclosService = inject(CiclosService);
  private cursosService = inject(CursosService);
  private alertService = inject(AlertService);

  @Input() visible = false;
  @Input() modulo: any | null = null;
  @Input() ciclosCoordinados: string[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardarEvent = new EventEmitter<any>();
  @Output() cancelarEvent = new EventEmitter<void>();

  todosLosCiclos: CicloDTO[] = [];
  ciclos: CicloDTO[] = [];
  cursos: CursoDTO[] = [];
  cursosFiltrados: CursoDTO[] = [];
  moduloForm: FormGroup;

  constructor() {
    this.moduloForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      sigla: ['', [Validators.required, Validators.maxLength(5)]],
      idCiclo: [null, [Validators.required]],
      idCurso: [null, [Validators.required]],
      color: ['#4e73df', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarCiclos();
    this.cargarCursos();

    // Reaccionar a cambios en el ciclo seleccionado para filtrar cursos
    this.moduloForm.get('idCiclo')?.valueChanges.subscribe(idCiclo => {
      this.filtrarCursos(idCiclo);
    });
  }

  cargarCiclos(): void {
    this.ciclosService.getCiclos().subscribe(ciclos => {
      this.todosLosCiclos = ciclos;
      this.aplicarFiltroCiclos();
    });
  }

  aplicarFiltroCiclos(): void {
    if (this.ciclosCoordinados && this.ciclosCoordinados.length > 0) {
      this.ciclos = this.todosLosCiclos.filter(c => this.ciclosCoordinados.includes(c.siglas));
    } else {
      this.ciclos = [...this.todosLosCiclos];
    }

    if (this.ciclos.length === 1) {
      // Auto-seleccionar el único ciclo disponible
      if (!this.moduloForm.get('idCiclo')?.value) {
        this.moduloForm.get('idCiclo')?.setValue(this.ciclos[0].id);
      }
    }
  }

  cargarCursos(): void {
    this.cursosService.getCursos().subscribe(cursos => {
      this.cursos = cursos;
      const currentCiclo = this.moduloForm.get('idCiclo')?.value;
      if (currentCiclo) {
        this.filtrarCursos(currentCiclo);
        // Asegurar que se asigne el curso después de cargar la lista completa
        if (this.modulo && this.modulo.idCurso) {
          this.moduloForm.get('idCurso')?.setValue(this.modulo.idCurso);
        }
      }
    });
  }

  filtrarCursos(idCiclo: number | null): void {
    if (!idCiclo) {
      this.cursosFiltrados = [];
    } else {
      this.cursosFiltrados = this.cursos.filter(
        c => c.idCiclo === idCiclo || (c as any).idCiclo === Number(idCiclo)
      );
    }

    // Solo resetear si los cursos ya están cargados y el ID seleccionado ya no es válido en el nuevo ciclo
    if (this.cursos.length > 0) {
      const currentCursoId = this.moduloForm.get('idCurso')?.value;
      if (currentCursoId) {
        const remainsValid = this.cursosFiltrados.some(c => c.id === currentCursoId);
        if (!remainsValid) {
          this.moduloForm.get('idCurso')?.setValue(null);
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }

    if (changes['ciclosCoordinados']) {
      this.aplicarFiltroCiclos();
    }

    if (changes['modulo'] && this.modulo) {
      this.moduloForm.patchValue({
        id: this.modulo.id,
        nombre: this.modulo.nombre,
        sigla: this.modulo.sigla,
        idCiclo: this.modulo.idCiclo,
        idCurso: this.modulo.idCurso,
        color: this.modulo.color || '#4e73df'
      });
      if (this.modulo.idCiclo) {
        this.filtrarCursos(this.modulo.idCiclo);
        this.moduloForm.get('idCurso')?.setValue(this.modulo.idCurso);
      }
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.modulo) {
      const autoCicloId = this.ciclos.length === 1 ? this.ciclos[0].id : null;
      this.moduloForm.reset({
        color: '#4e73df',
        idCiclo: autoCicloId
      });
      if (autoCicloId) {
        this.filtrarCursos(autoCicloId);
      } else {
        this.cursosFiltrados = [];
      }
    }
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
    if (this.moduloForm.valid) {
      this.guardarEvent.emit(this.moduloForm.value);
    } else {
      this.moduloForm.markAllAsTouched();
      this.alertService.advertencia('Formulario Incompleto', 'Por favor, rellena todos los campos obligatorios.');
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
