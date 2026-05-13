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

  constructor(private fb: FormBuilder) {
    this.empresaForm = this.fb.group({
      siglas: ['', [Validators.required, Validators.maxLength(6)]],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      convenioUrl: ['', [Validators.required, Validators.maxLength(100)]],
      inicioConvenio: ['', Validators.required],
      finConvenio: [{value: '', disabled: true}],
      contacto: ['', [Validators.required, Validators.maxLength(50)]],
      numeroContacto: ['', [Validators.required, Validators.maxLength(15)]],
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
      this.empresaForm.reset();
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
      contacto: [nombre, [Validators.required, Validators.maxLength(50)]],
      numeroContacto: [telefono, [Validators.required, Validators.maxLength(15)]]
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
    // Si viene en formato DD/MM/YYYY
    if (valor.includes('/')) {
      const partes = valor.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    // Si ya viene en formato YYYY-MM-DD (de la base de datos a veces)
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
    }
  }
}
