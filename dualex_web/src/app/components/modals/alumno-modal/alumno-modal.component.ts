import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AlumnoDTO, CursoDTO, EmpresaDTO } from '../../../dto/dualex.dto';
import { AlertService } from '../../../services/alert.service';
import { CursosService } from '../../../services/cursos.service';
import { EmpresasService } from '../../../services/empresas.service';

@Component({
  selector: 'app-alumno-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alumno-modal.component.html',
  styleUrls: ['./alumno-modal.component.css']
})
export class AlumnoModalComponent implements OnInit, OnChanges, OnDestroy {
  private renderer = inject(Renderer2);
  private fb = inject(FormBuilder);

  private cursosService = inject(CursosService);
  private empresasService = inject(EmpresasService);
  private alertService = inject(AlertService);

  @Input() alumno: AlumnoDTO | null = null;
  @Input() visible = false;
  @Input() cursosCoordinados: number[] = [];
  @Input() ciclosCoordinados: string[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<AlumnoDTO>();

  alumnoForm: FormGroup = this.fb.group({
    id: [null],
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
    dni: ['', [Validators.required, this.dniValidator()]],
    nia: ['', [Validators.required, Validators.maxLength(10)]],
    nuss: ['', [Validators.maxLength(12)]],
    telefono: ['', [Validators.required, Validators.maxLength(15)]],
    repetidor: [false],
    idCurso: [null, [Validators.required]],
    idEmpresa: [null]
  });

  // Validador de DNI / NIE español (Algoritmo oficial)
  private dniValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const dniRegexp = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
      const nieRegexp = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

      if (!dniRegexp.test(value) && !nieRegexp.test(value)) {
        return { dniFormato: true };
      }

      let nie = value.toUpperCase()
        .replace('X', '0')
        .replace('Y', '1')
        .replace('Z', '2');

      const letter = value.substr(-1).toUpperCase();
      const charIndex = parseInt(nie.substr(0, 8)) % 23;

      if (validChars.charAt(charIndex) !== letter) {
        return { letraInvalida: true };
      }

      return null;
    };
  }

  todosLosCursos: CursoDTO[] = [];
  cursos: CursoDTO[] = [];
  todasLasEmpresas: EmpresaDTO[] = [];
  empresas: EmpresaDTO[] = [];

  ngOnInit(): void {
    // Carga de Cursos
    this.cursosService.getCursos().subscribe(data => {
      this.todosLosCursos = data.map(c => ({ ...c, id: Number(c.id) }));
      this.aplicarFiltroCursos();
      if (this.alumno) this.aplicarDatosAlumno();
    });

    // Carga de Empresas
    this.empresasService.getEmpresas().subscribe((data: EmpresaDTO[]) => {
      this.todasLasEmpresas = data.map((e: EmpresaDTO) => ({ ...e, id: Number(e.id) }));
      this.aplicarFiltroEmpresas();
      if (this.alumno) this.aplicarDatosAlumno();
    });
  }

  aplicarFiltroCursos(): void {
    if (this.cursosCoordinados && this.cursosCoordinados.length > 0) {
      this.cursos = this.todosLosCursos.filter(c => this.cursosCoordinados.includes(c.id));
    } else {
      this.cursos = [...this.todosLosCursos];
    }
  }

  aplicarFiltroEmpresas(): void {
    if (this.ciclosCoordinados && this.ciclosCoordinados.length > 0) {
      this.empresas = this.todasLasEmpresas.filter(e => {
        const siglasEmpresa = e.ciclosInfo ? e.ciclosInfo.map((c: any) => c.siglas) : [];
        return siglasEmpresa.some((s: string) => this.ciclosCoordinados.includes(s));
      });
    } else {
      this.empresas = [...this.todasLasEmpresas];
    }
  }

  private aplicarDatosAlumno(): void {
    if (this.alumno) {
      const alumnoData = { ...this.alumno };
      if (alumnoData.idCurso) alumnoData.idCurso = Number(alumnoData.idCurso);
      if (alumnoData.idEmpresa) alumnoData.idEmpresa = Number(alumnoData.idEmpresa);

      // Mantenemos el pequeño retardo para asegurar que Angular ha renderizado los <option>
      setTimeout(() => {
        this.alumnoForm.patchValue(alumnoData);
      }, 50);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cursosCoordinados']) {
      this.aplicarFiltroCursos();
    }

    if (changes['ciclosCoordinados']) {
      this.aplicarFiltroEmpresas();
    }

    if (changes['alumno'] && this.alumno) {
      this.aplicarDatosAlumno();
    }
    
    if (changes['visible']) {
      this.toggleBodyScroll(this.visible);
      if (!this.visible) {
        this.alumnoForm.reset({
          repetidor: false,
          idCurso: null,
          idEmpresa: null
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
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

  onCerrar(): void {
    this.cerrar.emit();
  }

  onGuardar(): void {
    if (this.alumnoForm.valid) {
      this.guardar.emit(this.alumnoForm.value);
    } else {
      this.alumnoForm.markAllAsTouched();
      this.alertService.advertencia('Formulario Incompleto', 'Por favor, revisa los campos marcados en rojo antes de continuar.');
    }
  }
}
