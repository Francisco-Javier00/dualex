import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Config } from 'datatables.net';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { AlumnosService } from '../../services/alumnos.service';

/**
 * Componente de vista general de alumnos para la revisión de Tareas.
 * 
 * Permite a los profesores y coordinadores visualizar rápidamente todos los alumnos
 * para navegar hacia sus tareas individuales.
 */
@Component({
  selector: 'app-tareas-todos',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent],
  templateUrl: './tareas-todos.component.html'
})
export class TareasTodosComponent implements OnInit {
  private alumnosService = inject(AlumnosService);
  private router = inject(Router);
  private location = inject(Location);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: Config = {};
  columnTitles = ['Nombre', 'Apellidos', 'Correo', 'Curso', 'Acciones'];
  cargando = true;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.alumnosService.obtenerTodosDataTables(dataTablesParameters).subscribe({
          next: (resp) => {
            this.cargando = false;
            callback({
              draw: resp.draw,
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          },
          error: () => {
            this.cargando = false;
            callback({ recordsTotal: 0, recordsFiltered: 0, data: [] });
          }
        });
      },
      columns: [
        { data: 'nombre', width: '15%' },
        { data: 'apellidos', width: '20%' },
        { data: 'email', width: '30%' },
        { data: 'nombreCurso', className: 'text-nowrap', defaultContent: '<span class="text-muted">Sin curso</span>', width: '25%' },
        {
          data: null,
          orderable: false,
          searchable: false,
          width: '10%',
          render: (_data: any, _type: string, row: any) => `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-outline-success shadow-sm" data-action="tasks" title="Ver Tareas">
                <i class="fa-solid fa-clipboard-list"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        emptyTable: 'No hay alumnos registrados',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ alumnos',
        infoEmpty: 'Mostrando 0 a 0 de 0 alumnos',
        infoFiltered: '(filtrado de _MAX_ alumnos en total)',
        lengthMenu: 'Mostrar _MENU_ alumnos',
        loadingRecords: 'Cargando datos...',
        processing: 'Cargando...',
        search: 'Buscar alumno:',
        zeroRecords: 'No se encontraron coincidencias',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50],
      responsive: true,
      autoWidth: false
    };
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'tasks') {
      this.router.navigate(['/tareas', event.data.id]);
    }
  }

  irAtras() {
    this.location.back();
  }
}
