import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlumnoDTO, CursoDTO } from '../../../dto/dualex.dto';
import { CursosService } from '../../../services/cursos.service';

@Component({
  selector: 'app-alumno-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alumno-modal.component.html',
  styleUrls: ['./alumno-modal.component.css']
})
export class AlumnoModalComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private cursosService = inject(CursosService);

  @Input() alumno: AlumnoDTO | null = null;
  @Input() visible = false;
  
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<AlumnoDTO>();

  alumnoForm: FormGroup = this.fb.group({
    id: [null],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$')]],
    nia: ['', [Validators.required, Validators.maxLength(10)]],
    nuss: ['', [Validators.required, Validators.maxLength(12)]],
    telefono: ['', [Validators.required]],
    repetidor: [false],
    idCurso: [null, [Validators.required]],
    estado: ['Activo']
  });

  cursos: CursoDTO[] = [];

  ngOnInit(): void {
    this.cursosService.getCursos().subscribe(data => {
      this.cursos = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alumno'] && this.alumno) {
      this.alumnoForm.patchValue(this.alumno);
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.alumno) {
      this.alumnoForm.reset({
        id: null,
        repetidor: false,
        estado: 'Activo'
      });
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
    }
  }
}
