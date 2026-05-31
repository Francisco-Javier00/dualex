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

/**
 * Componente para la gestión de Alumnos.
 * 
 * Muestra una tabla interactiva con la lista de alumnos, permite filtrar por ciclo/curso,
 * y ofrece acciones para crear, editar, eliminar o importar alumnos masivamente,
 * dependiendo de los permisos del usuario (Coordinador vs Profesor).
 */
@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, AlumnoModalComponent, ImportarAlumnosModalComponent],
  templateUrl: './alumnos.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    .modal-content {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border: none;
      overflow: hidden;
    }
    .modal-header {
      padding: 1.5rem 2rem !important;
      border-bottom: 1px solid #f0f0f0 !important;
    }
    .modal-body {
      padding: 2rem 2.25rem !important;
    }
    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
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
  esCoordinadorSinCiclo = false;

  private suscripcionUsuario?: Subscription;
  rolUsuarioActual: string | null = null;

  get puedeGestionarAlumnos(): boolean {
    if (this.esCoordinadorSinCiclo) return false;
    // Desde "Mis Módulos" (con moduloId), ningún coordinador gestiona
    if (this.moduloId) return false;
    return (this.rolUsuarioActual === 'COORDINADOR' || this.rolUsuarioActual === 'COORDINADOR_GENERAL');
  }
  
  get esSoloLectura(): boolean {
    // Desde "Mis Módulos" (con moduloId), todos son solo lectura
    if (this.moduloId) return true;
    // Los coordinadores (general y local) no son solo lectura en gestión
    return this.rolUsuarioActual !== 'COORDINADOR' && this.rolUsuarioActual !== 'COORDINADOR_GENERAL';
  }

  get columnTitles(): string[] {
    const base = [' ', 'Nombre', 'Apellidos', 'Correo', 'Curso/Ciclo', 'Repetidor'];
    if (!this.esSoloLectura) {
      base.push('DNI', 'NUSS', 'NIA', 'Teléfono', 'Empresa asignada');
    }
    base.push('Acciones');
    return base;
  }

  private construirColumnas(): any[] {
    const rol = this.rolUsuarioActual;
    const puedeGestionar = this.puedeGestionarAlumnos;
    
    // Si es solo lectura (Profesor), ocultamos datos sensibles
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
      { data: 'nombre', width: ocultarSensibles ? '18%' : '10%', responsivePriority: 2 },
      { data: 'apellidos', width: ocultarSensibles ? '26%' : '12%', responsivePriority: 3 },
      { data: 'email', width: ocultarSensibles ? '30%' : '12%', responsivePriority: 4 },
      { data: 'nombreCurso', className: 'text-nowrap', defaultContent: '<span class="text-muted">Sin curso</span>', width: ocultarSensibles ? '10%' : '8%', responsivePriority: 5 },
      {
        data: 'repetidor',
        className: 'text-center',
        width: ocultarSensibles ? '10%' : '7%',
        responsivePriority: 6,
        render: (data: any) => {
          const isRepetidor = Number(data) === 1 || data === true;
          return isRepetidor 
            ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2 py-1">Sí</span>'
            : '<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-1">No</span>';
        }
      }
    ];
    
    // Desde "Mis Módulos" o Profesor: ocultar sensibles
    if (!ocultarSensibles) {
      cols.push(
        { data: 'dni', className: 'text-nowrap', width: '7%', responsivePriority: 9 },
        { data: 'nuss', className: 'text-nowrap', width: '7%', responsivePriority: 8 },
        { data: 'nia', className: 'text-nowrap', width: '7%', responsivePriority: 7 },
        { data: 'telefono', className: 'text-nowrap', width: '8%', responsivePriority: 10 },
        { 
          data: 'nombreEmpresa', 
          className: 'text-nowrap', 
          defaultContent: '<span class="text-muted">Sin empresa</span>', 
          width: '16%', 
          responsivePriority: 11 
        }
      );
    }
    cols.push({
      data: null,
      className: 'text-center align-middle',
      orderable: false,
      searchable: false,
      width: '6%',
      responsivePriority: 6,
      render: (_data: any, _type: string, row: any) => `
        <div class="d-flex gap-2 justify-content-center">
          ${(rol === 'PROFESOR' || this.moduloId) ? `
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

    // Si hay un usuario en sesión, obtenemos sus cursos antes de inicializar la tabla
    if (usuarioActual && usuarioActual.email) {
      this.profesoresService.getProfesorByEmail(usuarioActual.email).subscribe({
        next: (profesor) => {
          // Parse cycles coordinated by the coordinator (e.g. "DAW, DAM")
          const ciclosCoordinados = profesor.ciclos ? profesor.ciclos.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
          this.ciclosCoordinados = ciclosCoordinados;
          
          const hasModuloId = this.route.snapshot.queryParamMap.has('moduloId');
          this.esCoordinadorSinCiclo = !usuarioActual.esGeneral && (usuarioActual.rol === 'COORDINADOR') && ciclosCoordinados.length === 0 && !hasModuloId;

          if (this.esCoordinadorSinCiclo) {
            this.procesarParametrosRuta();
            return;
          }

          this.cursosService.getCursosByProfesor(profesor.id).subscribe({
            next: (cursos: CursoDTO[]) => {
              // Only keep courses whose siglasCiclo is coordinated by the coordinator, UNLESS they are general coordinators OR viewing a specific module OR just a professor
              let cursosFiltrados = cursos;
              const hasModuloId = this.route.snapshot.queryParamMap.has('moduloId');
              if (usuarioActual.rol === 'COORDINADOR' && ciclosCoordinados.length > 0 && !hasModuloId) {
                  cursosFiltrados = cursos.filter(c => c.siglasCiclo && ciclosCoordinados.includes(c.siglasCiclo));
              }

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
        error: () => {
          this.ciclosCoordinados = [];
          const hasModuloId = this.route.snapshot.queryParamMap.has('moduloId');
          this.esCoordinadorSinCiclo = !usuarioActual.esGeneral && (usuarioActual.rol === 'COORDINADOR') && !hasModuloId;
          this.procesarParametrosRuta();
        }
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

  mostrarPopupCurso = false;
  popupCursosDisponibles: CursoDTO[] = [];

  private procesarParametrosRuta(): void {
    this.route.queryParamMap.subscribe(params => {
      this.moduloId = params.get('moduloId');
      this.nombreModulo = null;
      this.moduloObj = null;

      if (this.moduloId) {
        this.modulosService.getModuloById(Number(this.moduloId)).subscribe((mod: any) => {
          this.nombreModulo = mod.nombre;
          this.moduloObj = mod;

          // Si el módulo tiene ciclos asignados, filtramos el desplegable por ciclo
          if (mod.ciclos) {
            const moduloCiclos = mod.ciclos.split(',').map((c: string) => c.trim().toUpperCase());
            
            // Filtramos para mostrar solo los cursos que pertenecen a los ciclos donde se imparte el módulo
            this.todosLosCursos = this.todosLosCursos.filter(c => c.siglasCiclo && moduloCiclos.includes(c.siglasCiclo.toUpperCase()));
            
            // Re-agrupar para actualizar las opciones del HTML
            this.cursosAgrupados = {};
            this.todosLosCursos.forEach(c => {
              const cicloKey = c.siglasCiclo || 'Sin ciclo';
              if (!this.cursosAgrupados[cicloKey]) {
                this.cursosAgrupados[cicloKey] = [];
              }
              this.cursosAgrupados[cicloKey].push(c);
            });
          }

          if (this.rolUsuarioActual === 'COORDINADOR' || this.rolUsuarioActual === 'COORDINADOR_GENERAL' || this.rolUsuarioActual === 'PROFESOR') {
            this.popupCursosDisponibles = [...this.todosLosCursos];
            this.mostrarPopupCurso = true;
          }
          this.inicializarTabla();
        });
      } else {
        // Mostrar popup de selección si no estamos en módulo
        if (this.rolUsuarioActual === 'COORDINADOR' || this.rolUsuarioActual === 'COORDINADOR_GENERAL' || this.rolUsuarioActual === 'PROFESOR') {
          this.popupCursosDisponibles = [];
          this.mostrarPopupCurso = true;
        }
        setTimeout(() => {
          this.inicializarTabla();
        }, 100);
      }
    });
  }

  seleccionarCursoNivel(nivel: '1' | '2'): void {
    const cursosNivel = this.todosLosCursos.filter(c => c.nombre.trim().startsWith(nivel));
    this.cursosFiltradosIds = cursosNivel.map(c => c.id);
    this.mostrarPopupCurso = false;
    if (this.datatable) {
      this.datatable.refrescar(false);
    }
  }

  seleccionarCursoEspecifico(cursoId: number): void {
    this.cursosFiltradosIds = [cursoId];
    this.mostrarPopupCurso = false;
    if (this.datatable) {
      this.datatable.refrescar(false);
    }
  }

  inicializarTabla(): void {
    this.dtOptions = {
      order: [],
      responsive: true,
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        if (this.esCoordinadorSinCiclo) {
          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
          });
          return;
        }

        if (this.moduloId) {
          dataTablesParameters.idModulo = this.moduloId;
        }

        const usuarioActual = this.authService.currentUserValue;
        if (usuarioActual && usuarioActual.email) {
          dataTablesParameters.emailProfesor = usuarioActual.email;
        }

        // Enviar filtros de curso solo si no estamos viendo un módulo en concreto (donde queremos ver todo el módulo por defecto)
        // O si el usuario ha seleccionado explícitamente un filtro en el desplegable (cursosFiltradosIds > 0)
        if (this.cursosFiltradosIds.length > 0) {
          dataTablesParameters.idsCursos = this.cursosFiltradosIds;
        } else if (this.cursosGestionados.length > 0 && !this.moduloId) {
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
