import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { AlumnoModalComponent } from '../modals/alumno-modal/alumno-modal.component';
import { ImportarAlumnosModalComponent } from '../modals/importar-alumnos-modal/importar-alumnos-modal.component';
import { AlumnosService } from '../../services/alumnos.service';
import { ModulosService } from '../../services/modulos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CursosService } from '../../services/cursos.service';
import { AlumnoDTO, CursoDTO } from '../../dto/dualex.dto';
import { AlertService } from '../../services/alert.service';
import { Config } from 'datatables.net';
import 'datatables.net-responsive-bs5';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, AlumnoModalComponent, ImportarAlumnosModalComponent],
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
  private location = inject(Location);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: any = {};
  modalBorradoVisible = false;
  modalAlumnoVisible = false;
  modalImportarVisible = false;
  importandoExcel = false;
  alumnoSeleccionado: AlumnoDTO | null = null;
  moduloId: string | null = null;
  nombreModulo: string | null = null;
  moduloObj: any = null;

  // Lista de cursos que el coordinador gestiona
  cursosGestionados: number[] = [];
  todosLosCursos: CursoDTO[] = [];
  cursosAgrupados: { [ciclo: string]: CursoDTO[] } = {};
  cursosFiltradosIds: number[] = [];
  ciclosCoordinados: string[] = [];

  private suscripcionUsuario?: Subscription;
  rolUsuarioActual: string | null = null;

  get puedeGestionarAlumnos(): boolean {
    // Desde "Mis Módulos" (con moduloId), ningún coordinador gestiona
    if (this.moduloId) return false;
    return this.rolUsuarioActual === 'COORDINADOR' && !this.authService.currentUserValue?.esGeneral;
  }
  
  get esSoloLectura(): boolean {
    // Desde "Mis Módulos" (con moduloId), todos son solo lectura
    if (this.moduloId) return true;
    // El coordinador normal NO es solo lectura
    if (this.rolUsuarioActual === 'COORDINADOR' && !this.authService.currentUserValue?.esGeneral) {
      return false;
    }
    // Profesor y Coordinador General son solo lectura
    return this.rolUsuarioActual === 'PROFESOR' || (this.rolUsuarioActual === 'COORDINADOR' && !!this.authService.currentUserValue?.esGeneral);
  }

  get columnTitles(): string[] {
    const base = [' ', 'Nombre', 'Apellidos', 'Correo', 'Curso/Ciclo'];
    if (!this.esSoloLectura) {
      base.push('DNI', 'NUSS', 'NIA', 'Teléfono');
    }
    base.push('Acciones');
    return base;
  }

  private construirColumnas(): any[] {
    const rol = this.rolUsuarioActual;
    const esGeneral = this.authService.currentUserValue?.esGeneral;
    const puedeGestionar = this.puedeGestionarAlumnos;
    
    // Si es solo lectura (Profesor o Coordinador General), ocultamos datos sensibles
    const ocultarSensibles = this.esSoloLectura;
    
    const cols: any[] = [
      {
        title: ' ',
        className: 'dtr-control all',
        orderable: false,
        data: null,
        defaultContent: '',
        responsivePriority: 1
      },
      { data: 'nombre', width: '12%', responsivePriority: 2 },
      { data: 'apellidos', width: '18%', responsivePriority: 3 },
      { data: 'email', width: '22%', responsivePriority: 4 },
      { data: 'nombreCurso', defaultContent: '<span class="text-muted">Sin curso</span>', width: '12%', responsivePriority: 5 },
    ];
    
    // Desde "Mis Módulos" o Profesor/Coord General: ocultar sensibles
    if (!ocultarSensibles) {
      cols.push(
        { data: 'dni', width: '10%', responsivePriority: 9 },
        { data: 'nuss', width: '10%', responsivePriority: 8 },
        { data: 'nia', width: '10%', responsivePriority: 7 },
        { data: 'telefono', width: '10%', responsivePriority: 10 }
      );
    }
    cols.push({
      data: null,
      className: 'text-center align-middle',
      orderable: false,
      searchable: false,
      width: '8%',
      responsivePriority: 6,
      render: () => `
        <div class="d-flex gap-2 justify-content-center">
          ${(rol === 'PROFESOR' || (rol === 'COORDINADOR' && (esGeneral || this.moduloId))) ? `
            <button class="btn btn-sm btn-outline-success shadow-sm" data-action="tasks" title="Ver Tareas">
              <i class="fa-solid fa-clipboard-list"></i>
            </button>
          ` : ''}
          ${puedeGestionar ? `
            <button class="btn btn-sm btn-outline-primary shadow-sm" data-action="edit" title="Editar">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger shadow-sm" data-action="delete" title="Eliminar">
              <i class="fa-solid fa-user-minus"></i>
            </button>
          ` : ''}
        </div>
      `
    });
    return cols;
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
      order: [],
      responsive: true,
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
      columns: this.construirColumnas(),
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
    this.modalImportarVisible = true;
  }

  onCerrarImportar(): void {
    this.modalImportarVisible = false;
  }

  onConfirmarImportar(event: { file: File, idCurso: number }): void {
    this.importandoExcel = true;
    this.alumnosService.importarAlumnosExcel(event.file, event.idCurso).subscribe({
      next: (res) => {
        this.importandoExcel = false;
        this.modalImportarVisible = false;

        let msg = `Se han importado ${res.imported} alumnos correctamente.`;
        if (res.skipped > 0) {
          msg += ` Se han omitido ${res.skipped} alumnos porque ya existían.`;
        }

        if (res.errors && res.errors.length > 0) {
          // Si hay errores, los mostramos y no autolimpiamos para que el usuario pueda revisarlos
          const errorDetails = res.errors.slice(0, 5).join('\n');
          const errorCount = res.errors.length;
          this.alertService.advertencia(
            'Importación con Observaciones',
            `${msg} Sin embargo, se detectaron ${errorCount} errores en el proceso. Primeros errores:\n${errorDetails}`,
            false,
            8000
          );
          console.warn('Errores de importación:', res.errors);
        } else {
          this.alertService.exito('Importación Exitosa', msg);
        }

        this.datatable.refrescar();
      },
      error: (err) => {
        this.importandoExcel = false;
        this.alertService.error(
          'Error al importar',
          err.error?.message || err.error?.error || 'No se pudo procesar el archivo de alumnos.'
        );
      }
    });
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

  irAtras() {
    this.location.back();
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
