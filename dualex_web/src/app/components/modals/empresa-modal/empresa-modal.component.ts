import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { EmpresaDTO } from '../../../dto/dualex.dto';

@Component({
  selector: 'app-empresa-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresa-modal.component.html',
  styleUrls: ['./empresa-modal.component.css']
})
export class EmpresaModalComponent implements OnInit {
  private _empresa: EmpresaDTO | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';

  @Input() set empresa(val: EmpresaDTO | null) {
    this._empresa = val;
    if (val) {
      this.patchForm(val);
    } else if (this.modo === 'crear') {
      this.resetForm();
    }
  }

  get empresa(): EmpresaDTO | null {
    return this._empresa;
  }

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  empresaForm: FormGroup;
  
  // Patrones de validación
  urlPattern = /^https?:\/\/.*$/;
  telefonoPattern = /^[0-9+ \-]+$/;

  constructor(private fb: FormBuilder) {
    this.empresaForm = this.fb.group({
      siglas: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(6)]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      convenioUrl: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      inicioConvenio: ['', Validators.required],
      finConvenio: [{value: '', disabled: true}],
      contacto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numeroContacto: ['', [Validators.required, Validators.pattern(this.telefonoPattern), Validators.minLength(9), Validators.maxLength(15)]],
      contactosAdicionales: this.fb.array([])
    });
  }

  get contactosAdicionales(): FormArray {
    return this.empresaForm.get('contactosAdicionales') as FormArray;
  }

  ngOnInit(): void {
    if (this.empresa) this.patchForm(this.empresa);
  }

  private resetForm(): void {
    if (this.empresaForm) {
      this.empresaForm.reset({rol: 'PROFESOR'});
      this.contactosAdicionales.clear();
    }
  }

  private patchForm(empresa: EmpresaDTO): void {
    if (!this.empresaForm) return;

    this.contactosAdicionales.clear();
    this.empresaForm.patchValue({
      siglas: empresa.siglas,
      nombre: empresa.nombre,
      convenioUrl: empresa.convenioUrl,
      inicioConvenio: this.formatearFechaParaInput(empresa.inicioConvenio),
      contacto: empresa.contacto,
      numeroContacto: empresa.numeroContacto
    });

    if (empresa.contactosAdicionales && Array.isArray(empresa.contactosAdicionales)) {
      empresa.contactosAdicionales.forEach(c => this.addContacto(c.contacto, c.numeroContacto));
    }

    this.actualizarFinConvenio();
  }

  addContacto(nombre = '', telefono = ''): void {
    this.contactosAdicionales.push(this.fb.group({
      contacto: [nombre, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numeroContacto: [telefono, [Validators.required, Validators.pattern(this.telefonoPattern), Validators.minLength(9), Validators.maxLength(15)]]
    }));
  }

  removeContacto(index: number): void {
    this.contactosAdicionales.removeAt(index);
  }

  onInicioConvenioChange(): void {
    this.actualizarFinConvenio();
  }

  private actualizarFinConvenio(): void {
    const inicio = this.empresaForm.get('inicioConvenio')?.value;
    if (inicio) {
      const fecha = new Date(inicio);
      fecha.setFullYear(fecha.getFullYear() + 4);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = String(fecha.getFullYear());
      this.empresaForm.get('finConvenio')?.setValue(`${dia}/${mes}/${anio}`);
    }
  }

  private formatearFechaParaInput(valor: string): string {
    if (!valor) return '';
    if (valor.includes('/')) {
      const partes = valor.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return valor.substring(0, 10);
  }

  private formatearFechaParaGuardar(valor: string): string {
    if (!valor) return '';
    const partes = valor.split('-');
    if (partes.length === 3) {
      return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
    }
    return valor;
  }

  onSubmit(): void {
    if (this.empresaForm.valid) {
      const formValue = this.empresaForm.getRawValue();
      const payload = {
        ...formValue,
        id: this.empresa?.id || 0,
        inicioConvenio: this.formatearFechaParaGuardar(formValue.inicioConvenio),
        finConvenio: formValue.finConvenio
      };
      this.guardar.emit(payload);
    } else {
      this.empresaForm.markAllAsTouched();
    }
  }

  // Helpers para el HTML
  isInvalid(field: string): boolean {
    const control = this.empresaForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.empresaForm.get(field);
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['pattern']) {
      if (field === 'convenioUrl') return 'Introduce una URL válida (ej: https://google.com)';
      if (field.includes('numeroContacto')) return 'Solo números, espacios, - o +';
    }
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    
    return 'Campo no válido';
  }
}
