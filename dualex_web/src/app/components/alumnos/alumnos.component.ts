import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { AlumnoModalComponent } from '../modals/alumno-modal/alumno-modal.component';
import { AlumnosService } from '../../services/alumnos.service';
import { ModulosService } from '../../services/modulos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CursosService } from '../../services/cursos.service';
import { AlumnoDTO, CursoDTO } from '../../dto/dualex.dto';
import { AlertService } from '../../services/alert.service';
import { Config } from 'datatables.net';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, AlumnoModalComponent],
  templateUrl: './alumnos.component.html'
})
export class AlumnosComponent implements OnInit, OnDestroy {
  private alumnosService = inject(AlumnosService);
  private modulosService = inject(ModulosService);
  private profesoresService = inject(ProfesoresService);
  private cursosService = inject(CursosService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  modalAlumnoVisible = false;
  alumnoSeleccionado: AlumnoDTO | null = null;
  moduloId: string | null = null;
  nombreModulo: string | null = null;
  moduloObj: any = null;

  // Lista de cursos que el coordinador gestiona
  cursosGestionados: number[] = [];
  todosLosCursos: CursoDTO[] = [];
  cursosAgrupados: { [ciclo: string]: CursoDTO[] } = {};
  cursosFiltradosIds: number[] = [];

  private suscripcionUsuario?: Subscription;
  rolUsuarioActual: string | null = null;

  get puedeGestionarAlumnos(): boolean {
    return this.rolUsuarioActual === 'COORDINADOR';
  }

  ngOnInit(): void {
    this.suscripcionUsuario = this.authService.perfilUsuario$.subscribe(perfil => {
      this.rolUsuarioActual = perfil?.rol ?? null;
    });

    const usuarioActual = this.authService.currentUserValue;

    // Si es coordinador, obtenemos sus cursos antes de inicializar la tabla
    if (usuarioActual && usuarioActual.rol === 'COORDINADOR' && usuarioActual.email) {
      this.profesoresService.getProfesorByEmail(usuarioActual.email).subscribe({
        next: (profesor) => {
          this.cursosService.getCursosByProfesor(profesor.id).subscribe({
            next: (cursos: CursoDTO[]) => {
              // Parse cycles coordinated by the coordinator (e.g. "DAW, DAM")
              const ciclosCoordinados = profesor.ciclos ? profesor.ciclos.split(',').map((c: string) => c.trim()) : [];
              
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

              this.procesarParametrosRuta();
            },
            error: () => this.procesarParametrosRuta() // Continuar aunque falle
          });
        },
        error: () => this.procesarParametrosRuta()
      });
    } else {
      this.procesarParametrosRuta();
    }
  }

  getCiclosKeys(): string[] {
    return Object.keys(this.cursosAgrupados).sort();
  }

  onFiltroChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    this.cursosFiltradosIds = [];

    if (value === 'all') {
      // Sin filtro adicional, usa los cursos gestionados por defecto
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

  private procesarParametrosRuta(): void {
    this.route.queryParamMap.subscribe(params => {
      this.moduloId = params.get('moduloId');
      this.nombreModulo = null;
      this.moduloObj = null;

      if (this.moduloId) {
        this.modulosService.getModuloById(Number(this.moduloId)).subscribe((mod: any) => {
          this.nombreModulo = mod.nombre;
          this.moduloObj = mod;
        });
      }

      setTimeout(() => {
        this.inicializarTabla();
      }, 100);
    });
  }

  inicializarTabla(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        if (this.moduloId) {
          dataTablesParameters.idModulo = this.moduloId;
        }

        const usuarioActual = this.authService.currentUserValue;
        if (usuarioActual && usuarioActual.email) {
          dataTablesParameters.emailProfesor = usuarioActual.email;
        }

        if (this.cursosFiltradosIds.length > 0) {
          dataTablesParameters.idsCursos = this.cursosFiltradosIds;
        } else if (this.cursosGestionados.length > 0) {
          dataTablesParameters.idsCursos = this.cursosGestionados;
        }

        this.alumnosService.obtenerAlumnosDataTables(dataTablesParameters).subscribe((resp: any) => {
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
        { data: 'email' },
        { data: 'nombreCurso', defaultContent: '<span class="text-muted">Sin curso</span>' },
        { data: 'nia' },
        { data: 'nuss' },
        { data: 'dni' },
        { data: 'telefono' },
        {
          data: null,
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-outline-success shadow-sm" data-action="tasks" title="Ver Tareas">
                <i class="fa-solid fa-clipboard-list"></i>
              </button>
              ${this.puedeGestionarAlumnos ? `
                <button class="btn btn-sm btn-outline-primary shadow-sm" data-action="edit" title="Editar">
                  <i class="fa-solid fa-user-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger shadow-sm" data-action="delete" title="Eliminar">
                  <i class="fa-solid fa-user-minus"></i>
                </button>
              ` : ''}
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
        processing: 'Sincronizando...',
        search: 'Buscar alumno:',
        zeroRecords: 'No se encontraron coincidencias',
        paginate: {
          first: 'Primero',
          last: 'Ãšltimo',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50]
    };
  }

  crearNuevo(): void {
    if (!this.puedeGestionarAlumnos) {
      return;
    }
    this.alumnoSeleccionado = null;
    this.modalAlumnoVisible = true;
  }

  importarExcel(): void {
    if (!this.puedeGestionarAlumnos) {
      return;
    }
    this.alertService.informacion('Importar Excel', 'AquÃ­ podrÃ¡s seleccionar un archivo Excel (.xls o .xlsx) para cargar alumnos de forma masiva.');
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      if (!this.puedeGestionarAlumnos) {
        return;
      }
      this.alumnoSeleccionado = { ...event.data };
      this.modalAlumnoVisible = true;
    } else if (event.action === 'delete') {
      if (!this.puedeGestionarAlumnos) {
        return;
      }
      this.alumnoSeleccionado = event.data;
      this.modalBorradoVisible = true;
    } else if (event.action === 'tasks') {
      this.router.navigate(['/tareas', event.data.id]);
    }
  }

  onConfirmarBorrado(): void {
    if (!this.puedeGestionarAlumnos) {
      return;
    }
    if (this.alumnoSeleccionado) {
      this.alumnosService.deleteAlumno(this.alumnoSeleccionado.id).subscribe(() => {
        this.alertService.exito('Alumno Eliminado', `El estudiante ${this.alumnoSeleccionado?.nombre} ha sido dado de baja correctamente.`);
        this.datatable.refrescar();
        this.modalBorradoVisible = false;
        this.alumnoSeleccionado = null;
      });
    }
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.alumnoSeleccionado = null;
  }

  onGuardarAlumno(alumno: AlumnoDTO): void {
    if (!this.puedeGestionarAlumnos) {
      return;
    }
    if (alumno.id) {
      this.alumnosService.updateAlumno(alumno).subscribe({
        next: () => {
          this.alertService.exito('Alumno Actualizado', `Los datos de ${alumno.nombre} se han guardado correctamente.`);
          this.datatable.refrescar();
          this.modalAlumnoVisible = false;
          this.alumnoSeleccionado = null;
        },
        error: (err) => {
          this.alertService.error('Error al Actualizar', err.error?.message || 'No se pudieron guardar los cambios del alumno.');
        }
      });
    } else {
      this.alumnosService.createAlumno(alumno).subscribe({
        next: () => {
          this.alertService.exito('Alumno Registrado', `El estudiante ${alumno.nombre} ha sido dado de alta.`);
          this.datatable.refrescar();
          this.modalAlumnoVisible = false;
          this.alumnoSeleccionado = null;
        },
        error: (err) => {
          this.alertService.error('Error al Registrar', err.error?.message || 'No se pudo dar de alta al alumno.');
        }
      });
    }
  }

  onCerrarModal(): void {
    this.modalAlumnoVisible = false;
    this.alumnoSeleccionado = null;
  }

  ngOnDestroy(): void {
    this.suscripcionUsuario?.unsubscribe();
  }
}
