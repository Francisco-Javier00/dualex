import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ModuloModalComponent } from '../modals/modulo-modal/modulo-modal.component';
import { ModulosService } from '../../services/modulos.service';
import { AlertService } from '../../services/alert.service';
import { ModuloDTO, CursoDTO } from '../../dto/dualex.dto';
import { Config } from 'datatables.net';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CursosService } from '../../services/cursos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, ModuloModalComponent],
  templateUrl: './modulos.component.html'
})
export class ModulosComponent implements OnInit, OnDestroy {
  private modulosService = inject(ModulosService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private profesoresService = inject(ProfesoresService);
  private cursosService = inject(CursosService);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  modalModuloVisible = false;
  moduloSeleccionado: ModuloDTO | null = null;

  // Lista de cursos que el coordinador gestiona
  cursosGestionados: number[] = [];
  todosLosCursos: CursoDTO[] = [];
  cursosAgrupados: { [ciclo: string]: CursoDTO[] } = {};
  cursosFiltradosIds: number[] = [];
  ciclosCoordinados: string[] = [];

  private suscripcionUsuario?: Subscription;
  rolUsuarioActual: string | null = null;

  ngOnInit(): void {
    this.suscripcionUsuario = this.authService.perfilUsuario$.subscribe(perfil => {
      this.rolUsuarioActual = perfil?.rol ?? null;
    });

    const usuarioActual = this.authService.currentUserValue;

    // Si es coordinador, obtenemos sus cursos antes de inicializar/cargar la tabla
    if (usuarioActual && usuarioActual.rol === 'COORDINADOR' && usuarioActual.email) {
      this.profesoresService.getProfesorByEmail(usuarioActual.email).subscribe({
        next: (profesor) => {
          this.cursosService.getCursosByProfesor(profesor.id).subscribe({
            next: (cursos: CursoDTO[]) => {
              // Parse cycles coordinated by the coordinator (e.g. "DAW, DAM")
              const ciclosCoordinados = profesor.ciclos ? profesor.ciclos.split(',').map((c: string) => c.trim()) : [];
              this.ciclosCoordinados = ciclosCoordinados;
              
              // Only keep courses whose siglasCiclo is coordinated by the coordinator
              const cursosFiltrados = cursos.filter(c => c.siglasCiclo && ciclosCoordinados.includes(c.siglasCiclo));

              this.todosLosCursos = cursosFiltrados;
              this.cursosGestionados = cursosFiltrados.map(c => c.id);

              // Agrupar cursos por ciclo (usando siglasCiclo para brevedad)
              this.cursosAgrupados = {};
              cursosFiltrados.forEach(c => {
                const cicloKey = c.siglasCiclo || 'Sin ciclo';
                if (!this.cursosAgrupados[cicloKey]) {
                  this.cursosAgrupados[cicloKey] = [];
                }
                this.cursosAgrupados[cicloKey].push(c);
              });

              // Refrescar tabla para que recoja los cursos cargados
              this.datatable.refrescar(false);
            }
          });
        }
      });
    }

    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        if (this.cursosFiltradosIds.length > 0) {
          dataTablesParameters.idsCursos = this.cursosFiltradosIds;
        } else if (this.cursosGestionados.length > 0) {
          dataTablesParameters.idsCursos = this.cursosGestionados;
        }

        this.modulosService.obtenerModulosDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        { 
          data: 'color',
          className: 'text-center',
          render: (data: any) => `
            <div class="d-flex justify-content-center">
              <div class="rounded-circle shadow-sm" style="width: 18px; height: 18px; background-color: ${data || '#4e73df'}"></div>
            </div>
          `
        },
        { 
          data: 'nombre',
          render: (data: any) => `<span class="fw-medium text-dark">${data}</span>`
        },
        { data: 'sigla', className: 'text-center text-muted' },
        { 
          data: 'cicloCompleto',
          className: 'text-center text-muted',
          render: (data: any) => data || 'Sin asignar'
        },
        { 
          data: 'cursoCompleto',
          className: 'text-center text-muted',
          render: (data: any) => data || 'Sin asignar'
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: 'text-center',
          render: () => `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-outline-primary shadow-sm edit-btn" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm delete-btn" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        emptyTable: 'No hay módulos registrados',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ módulos',
        infoEmpty: 'Mostrando 0 a 0 de 0 módulos',
        infoFiltered: '(filtrado de _MAX_ módulos en total)',
        lengthMenu: 'Mostrar _MENU_ módulos',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron módulos',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50]
    };
  }

  crearNuevo(): void {
    this.moduloSeleccionado = null;
    this.modalModuloVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.moduloSeleccionado = { ...event.data };
      this.modalModuloVisible = true;
    } else if (event.action === 'delete') {
      this.moduloSeleccionado = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onGuardarModulo(modulo: any): void {
    if (modulo.id) {
      this.modulosService.updateModulo(modulo).subscribe({
        next: () => {
          this.alertService.exito('Actualizado', 'Módulo actualizado correctamente.');
          this.modalModuloVisible = false;
          this.recargarTabla();
        },
        error: (err) => this.alertService.error('Error', err.error?.message || 'Fallo al actualizar')
      });
    } else {
      this.modulosService.createModulo(modulo).subscribe({
        next: () => {
          this.alertService.exito('Creado', 'Nuevo módulo registrado con éxito.');
          this.modalModuloVisible = false;
          this.recargarTabla();
        },
        error: (err) => this.alertService.error('Error', err.error?.message || 'Fallo al crear')
      });
    }
  }

  onConfirmarBorrado(): void {
    if (this.moduloSeleccionado) {
      this.modulosService.deleteModulo(this.moduloSeleccionado.id).subscribe(() => {
        this.alertService.exito('Eliminado', 'El módulo ha sido eliminado.');
        this.recargarTabla();
        this.modalBorradoVisible = false;
        this.moduloSeleccionado = null;
      });
    }
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.moduloSeleccionado = null;
  }

  private recargarTabla(): void {
    this.datatable.refrescar();
  }

  getCiclosKeys(): string[] {
    return Object.keys(this.cursosAgrupados).sort();
  }

  onFiltroChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    this.cursosFiltradosIds = [];

    if (value === 'all') {
      // Sin filtro adicional
    } else if (value.startsWith('ciclo:')) {
      const cicloKey = value.substring(6);
      const cursosCiclo = this.cursosAgrupados[cicloKey] || [];
      this.cursosFiltradosIds = cursosCiclo.map(c => c.id);
    } else if (value.startsWith('curso:')) {
      const cursoId = Number(value.substring(6));
      this.cursosFiltradosIds = [cursoId];
    }

    this.datatable.refrescar(false);
  }

  ngOnDestroy(): void {
    this.suscripcionUsuario?.unsubscribe();
  }
}
