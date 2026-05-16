import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Config } from 'datatables.net';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ProfesorModalComponent } from '../modals/profesor-modal/profesor-modal.component';
import { AlertService } from '../../services/alert.service';
import { ProfesoresService } from '../../services/profesores.service';
import { ProfesorDTO } from '../../dto/dualex.dto';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, ProfesorModalComponent],
  templateUrl: './profesores.component.html',
  styleUrl: './profesores.component.css'
})
export class ProfesoresComponent implements OnInit {
  private profesoresService = inject(ProfesoresService);
  private alertService = inject(AlertService);

  @ViewChild(DatatableComponent) datatable?: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  modalCrearVisible = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  profesorEditandoId: number | null = null;
  profesorSeleccionado: ProfesorDTO | null = null;
  archivoExcelSeleccionado: File | null = null;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      lengthChange: true,
      dom: "<'d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3'<'profesores-length'l><'profesores-search'f>>rt<'d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3'ip>",
      ajax: (dataTablesParameters: any, callback: any) => {
        this.profesoresService.obtenerProfesoresDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        { data: 'nombre' },
        { data: 'apellidos' },
        { data: 'correo' },
        { data: 'rol' },
        { 
          data: 'modulos', 
          render: (data: any, type: any, row: any) => {
            if (data && data.trim() !== '') return data;
            return row?.rol === 'COORDINADOR'
              ? '<span class="text-muted opacity-50 italic small">Sin módulos asignados</span>'
              : '<span class="text-muted opacity-50 italic small">No imparte módulos</span>';
          }
        },
        { 
          data: 'ciclos', 
          render: (data: any, type: any, row: any) => {
            if (data && data.trim() !== '') return data;
            return row?.rol === 'COORDINADOR'
              ? '<span class="text-muted opacity-50 italic small">Sin ciclos coordinados</span>'
              : '<span class="text-muted opacity-50 italic small">No coordina ciclos</span>';
          }
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex justify-content-center gap-2 action-buttons">
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        emptyTable: 'No hay profesores disponibles',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ profesores',
        infoEmpty: 'Mostrando 0 a 0 de 0 profesores',
        infoFiltered: '(filtrado de _MAX_ profesores en total)',
        lengthMenu: 'Mostrar _MENU_ profesores',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron profesores',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [10, 25, 50]
    };
  }

  subirExcel(): void {
    const input = document.getElementById('profesores-excel-input') as HTMLInputElement | null;
    input?.click();
  }

  onExcelSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const archivo = input?.files?.[0] ?? null;

    if (!archivo) return;

    const nombre = archivo.name.toLowerCase();
    const esExcel = nombre.endsWith('.xls') || nombre.endsWith('.xlsx');

    if (!esExcel) {
      this.alertService.error('Formato no válido', 'Solo se permiten archivos Excel con extensión .xls o .xlsx.');
      if (input) input.value = '';
      return;
    }

    this.archivoExcelSeleccionado = archivo;
    this.alertService.exito('Archivo seleccionado', `Se ha seleccionado "${archivo.name}" correctamente.`);
    if (input) input.value = '';
  }

  crearNuevaEntrada(): void {
    this.modoFormulario = 'crear';
    this.profesorSeleccionado = null;
    this.modalCrearVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.abrirEdicionProfesor(event.data);
      return;
    }

    if (event.action === 'delete') {
      this.profesorSeleccionado = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onGuardarProfesor(profesorData: any): void {
    const obs = this.modoFormulario === 'crear'
      ? this.profesoresService.agregarProfesor(profesorData)
      : this.profesoresService.actualizarProfesor(profesorData.id, profesorData);

    obs.subscribe({
      next: () => {
        const msg = this.modoFormulario === 'crear' ? 'Profesor creado con éxito.' : 'Profesor actualizado con éxito.';
        this.alertService.exito('Éxito', msg);
        this.modalCrearVisible = false;
        this.datatable?.refrescar();
      },
      error: (err: any) => {
        const errorMsg = err.error?.error || 'Error al procesar el profesor.';
        this.alertService.error('Error', errorMsg);
      }
    });
  }

  onConfirmarBorrado(): void {
    if (!this.profesorSeleccionado) return;

    this.profesoresService.eliminarProfesor(this.profesorSeleccionado.id);
    this.alertService.exito('Profesor eliminado', `${this.profesorSeleccionado.nombre} ${this.profesorSeleccionado.apellidos} ha sido eliminado.`);
    this.modalBorradoVisible = false;
    this.profesorSeleccionado = null;
    this.refrescarTabla();
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.profesorSeleccionado = null;
  }

  onCancelarCreacion(): void {
    this.modalCrearVisible = false;
    this.profesorEditandoId = null;
    this.modoFormulario = 'crear';
  }

  abrirEdicionProfesor(profesor: ProfesorDTO): void {
    this.modoFormulario = 'editar';
    this.profesorSeleccionado = { ...profesor };
    this.modalCrearVisible = true;
  }

  private refrescarTabla(): void {
    this.datatable?.refrescar();
  }
}
