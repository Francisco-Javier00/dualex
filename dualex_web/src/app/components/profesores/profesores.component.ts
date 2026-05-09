import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Config } from 'datatables.net';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { AlertService } from '../../services/alert.service';
import { ProfesoresMockService } from '../../services/profesores-mock.service';
import { ProfesorDTO } from '../../dto/dualex.dto';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './profesores.component.html',
  styleUrl: './profesores.component.css'
})
export class ProfesoresComponent implements OnInit {
  private profesoresMockService = inject(ProfesoresMockService);
  private alertService = inject(AlertService);

  @ViewChild(DatatableComponent) datatable?: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  profesorSeleccionado: ProfesorDTO | null = null;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      lengthChange: true,
      dom: "<'d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3'<'profesores-length'l><'profesores-search'f>>rt<'d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3'ip>",
      ajax: (dataTablesParameters: any, callback: any) => {
        this.profesoresMockService.obtenerProfesoresDataTables(dataTablesParameters).subscribe(resp => {
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
        { data: 'modulos' },
        { data: 'ciclos' },
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
    this.alertService.informacion('Subir Excel', 'Aquí se conectará la importación masiva de profesores desde un archivo Excel.');
  }

  crearNuevaEntrada(): void {
    this.alertService.informacion('Nueva entrada', 'Aquí se abrirá el formulario para crear un nuevo profesor.');
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.alertService.informacion('Editar profesor', `Editando a ${event.data.nombre} ${event.data.apellidos}.`);
      return;
    }

    if (event.action === 'delete') {
      this.profesorSeleccionado = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onConfirmarBorrado(): void {
    if (!this.profesorSeleccionado) return;

    this.profesoresMockService.eliminarProfesor(this.profesorSeleccionado.id);
    this.alertService.exito('Profesor eliminado', `${this.profesorSeleccionado.nombre} ${this.profesorSeleccionado.apellidos} ha sido eliminado.`);
    this.modalBorradoVisible = false;
    this.profesorSeleccionado = null;
    this.refrescarTabla();
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.profesorSeleccionado = null;
  }

  private refrescarTabla(): void {
    this.datatable?.dtElement?.dtInstance.then((dtInstance: any) => {
      dtInstance.ajax.reload(null, false);
    });
  }
}
