import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProfesorDTO, CicloDTO, ModuloDTO } from '../../../dto/dualex.dto';
import { CiclosService } from '../../../services/ciclos.service';
import { ModulosService } from '../../../services/modulos.service';

@Component({
  selector: 'app-profesor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesor-modal.component.html',
  styleUrls: ['./profesor-modal.component.css']
})
export class ProfesorModalComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private modulosService = inject(ModulosService);

  private _profesor: any | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';
  
  ciclosBD: CicloDTO[] = [];
  modulosBD: ModuloDTO[] = [];
  modulosPorCiclo: Record<string, ModuloDTO[]> = {};
  filtroCiclos: string = '';
  ciclosExpandidos: string[] = []; // Control visual de qué ciclo está abierto
  modulosSeleccionadosIds: number[] = [];

  @Input() set profesor(val: any | null) {
    this._profesor = val;
    if (val) {
      this.syncProfesor(val);
    } else if (this.modo === 'crear') {
      this.resetForm();
    }
  }

  get profesor(): any | null {
    return this._profesor;
  }

  @Input() ciclosDisponibles: string[] = [];
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  nuevoProfesor: any = {
    nombre: '',
    apellidos: '',
    correo: '',
    rol: 'PROFESOR',
    ciclos: [] as string[],
    modulos: [] as string[]
  };

  ngOnInit(): void {
    this.cargarDatos();
    // Si ya había datos al inicializar, sincronizamos
    if (this.profesor) this.syncProfesor(this.profesor);
  }

  private cargarDatos(): void {
    this.ciclosService.getCiclos().subscribe(ciclos => {
      this.ciclosBD = ciclos;
      if (ciclos.length === 0) {
        this.modulosBD = [];
        this.modulosPorCiclo = {};
        this.sincronizarIdsModulosSeleccionados();
        this.refrescarEstadoVisual();
        return;
      }

      forkJoin(ciclos.map(ciclo => this.modulosService.getModulosPorCiclo(ciclo.siglas))).subscribe(modulosPorCiclo => {
        const indexById = new Map<number, ModuloDTO>();
        this.modulosPorCiclo = {};

        ciclos.forEach((ciclo, index) => {
          const modulos = modulosPorCiclo[index] ?? [];
          this.modulosPorCiclo[ciclo.siglas] = modulos.map(modulo => ({
            ...modulo,
            ciclo: ciclo.siglas
          }));

          modulos.forEach(modulo => indexById.set(modulo.id, modulo));
        });

        this.modulosBD = Array.from(indexById.values());
        this.sincronizarIdsModulosSeleccionados();
        this.refrescarEstadoVisual();
      });
    });
  }


  private normalizarClave(valor: string): string {
    return (valor || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  getModulosPorCiclo(siglasCiclo: string): ModuloDTO[] {
    return this.modulosPorCiclo[siglasCiclo] ?? [];
  }

  obtenerSiglaModulo(modulo: Partial<ModuloDTO> | any): string {
    return (modulo?.siglas ?? modulo?.sigla ?? '')
      .toString()
      .trim();
  }

  obtenerModuloPorId(moduloId: number): ModuloDTO | undefined {
    return this.modulosBD.find(m => m.id === moduloId);
  }

  tieneModulos(cicloSiglas: string): boolean {
    return this.getModulosPorCiclo(cicloSiglas).length > 0;
  }

  contarModulos(cicloSiglas: string): number {
    return this.getModulosPorCiclo(cicloSiglas).length;
  }

  private normalizarLista(valor: string[] | string | null | undefined): string[] {
    if (Array.isArray(valor)) {
      return [...new Set(valor.map(item => item.trim()).filter(Boolean))];
    }

    if (typeof valor === 'string' && valor.trim() !== '') {
      return [...new Set(valor.split(',').map(item => item.trim()).filter(Boolean))];
    }

    return [];
  }

  private syncProfesor(profesor: any): void {
    const listaCiclos = this.normalizarLista(profesor.ciclos);
    const listaModulos = this.normalizarLista(profesor.modulos);
    const rol = profesor.rol || 'PROFESOR';

    this.nuevoProfesor = {
      id: profesor.id,
      nombre: profesor.nombre || '',
      apellidos: profesor.apellidos || '',
      correo: profesor.correo || '',
      rol,
      ciclos: rol === 'COORDINADOR' ? listaCiclos : [],
      modulos: listaModulos
    };
    this.sincronizarIdsModulosSeleccionados();
    this.refrescarEstadoVisual();
  }

  private sincronizarIdsModulosSeleccionados(): void {
    const idsDesdeSiglas = this.modulosBD
      .filter(modulo => this.nuevoProfesor.modulos.includes(this.obtenerSiglaModulo(modulo)))
      .map(modulo => modulo.id);
    this.modulosSeleccionadosIds = idsDesdeSiglas;
  }

  private getCiclosDeModulos(siglasModulos: string[]): string[] {
    const ciclos: string[] = [];

    for (const [siglasCiclo, modulos] of Object.entries(this.modulosPorCiclo)) {
      if (modulos.some(modulo => siglasModulos.includes(this.obtenerSiglaModulo(modulo)))) {
        ciclos.push(siglasCiclo);
      }
    }

    return [...new Set(ciclos)];
  }

  private refrescarEstadoVisual(): void {
    if (!this.profesor && this.modo === 'crear') {
      return;
    }

    const ciclosBase = this.nuevoProfesor.rol === 'COORDINADOR'
      ? this.nuevoProfesor.ciclos
      : [];
    const ciclosPorModulos = this.getCiclosDeModulos(this.nuevoProfesor.modulos);

    this.ciclosExpandidos = [...new Set([
      ...this.ciclosExpandidos,
      ...ciclosBase,
      ...ciclosPorModulos
    ])];
  }

  private resetForm(): void {
    this.nuevoProfesor = {
      nombre: '',
      apellidos: '',
      correo: '',
      rol: 'PROFESOR',
      ciclos: [],
      modulos: []
    };
    this.ciclosBD = [];
    this.modulosBD = [];
    this.modulosPorCiclo = {};
    this.ciclosExpandidos = [];
    this.modulosSeleccionadosIds = [];
    this.filtroCiclos = '';
  }

  onToggleCiclo(cicloSiglas: string, checked: boolean): void {
    const esCoordinador = this.nuevoProfesor.rol === 'COORDINADOR';

    if (!esCoordinador) {
      // En rol profesor el ciclo solo se usa para desplegar módulos.
      this.ciclosExpandidos = checked
        ? [...new Set([...this.ciclosExpandidos, cicloSiglas])]
        : this.ciclosExpandidos.filter(c => c !== cicloSiglas);
      return;
    }

    if (checked) {
      if (!this.nuevoProfesor.ciclos.includes(cicloSiglas)) {
        this.nuevoProfesor.ciclos.push(cicloSiglas);
      }
      this.ciclosExpandidos = [...new Set([...this.ciclosExpandidos, cicloSiglas])];
    } else {
      // Si desmarcamos, contraemos y quitamos coordinación.
      this.nuevoProfesor.ciclos = this.nuevoProfesor.ciclos.filter((c: string) => c !== cicloSiglas);
      this.ciclosExpandidos = this.ciclosExpandidos.filter(c => c !== cicloSiglas);
    }

  }

  isCicloExpandido(siglas: string): boolean {
    return this.ciclosExpandidos.includes(siglas);
  }

  isCicloSeleccionado(siglas: string): boolean {
    return this.nuevoProfesor.ciclos.includes(siglas);
  }

  debeMostrarModulos(siglas: string): boolean {
    return this.nuevoProfesor.rol === 'COORDINADOR'
      ? (this.isCicloSeleccionado(siglas) || this.isCicloExpandido(siglas))
      : this.isCicloExpandido(siglas);
  }

  private limpiarModulosHuerfanos(): void {
    this.nuevoProfesor.modulos = this.nuevoProfesor.modulos.filter((modSiglas: string) => {
      const modulo = this.modulosBD.find(m => m.siglas === modSiglas);
      return modulo && this.nuevoProfesor.ciclos.includes(modulo.ciclo);
    });
  }

  get ciclosSeleccionadosCount(): number {
    return this.nuevoProfesor.ciclos.length;
  }

  get modulosSeleccionadosCount(): number {
    if (this.nuevoProfesor.rol === 'COORDINADOR') {
      return this.modulosSeleccionadosIds.length;
    }

    return this.modulosSeleccionadosIds.length;
  }

  get ciclosVisiblesCount(): number {
    return this.ciclosBD.filter(ciclo =>
      !this.filtroCiclos ||
      ciclo.nombre.toLowerCase().includes(this.filtroCiclos.toLowerCase()) ||
      ciclo.siglas.toLowerCase().includes(this.filtroCiclos.toLowerCase())
    ).length;
  }

  private marcarModulosDeCiclo(cicloSiglas: string, marcar: boolean): void {
    const modulosDelCiclo = this.getModulosPorCiclo(cicloSiglas).map(m => this.obtenerSiglaModulo(m));

    if (marcar) {
      this.nuevoProfesor.modulos = [...new Set([
        ...this.nuevoProfesor.modulos,
        ...modulosDelCiclo
      ])];
      return;
    }

    this.nuevoProfesor.modulos = this.nuevoProfesor.modulos.filter((sigla: string) => !modulosDelCiclo.includes(sigla));
  }

  onToggleModulo(moduloSiglas: string, checked: boolean): void {
    if (checked) {
      if (!this.nuevoProfesor.modulos.includes(moduloSiglas)) {
        this.nuevoProfesor.modulos.push(moduloSiglas);
      }
      const modulo = this.modulosBD.find(m => this.obtenerSiglaModulo(m) === moduloSiglas);
      if (modulo && !this.modulosSeleccionadosIds.includes(modulo.id)) {
        this.modulosSeleccionadosIds.push(modulo.id);
      }
    } else {
      this.nuevoProfesor.modulos = this.nuevoProfesor.modulos.filter((m: string) => m !== moduloSiglas);
      const modulo = this.modulosBD.find(m => this.obtenerSiglaModulo(m) === moduloSiglas);
      if (modulo) {
        this.modulosSeleccionadosIds = this.modulosSeleccionadosIds.filter(id => id !== modulo.id);
      }
    }
  }

  onRolChange(rol: 'PROFESOR' | 'COORDINADOR'): void {
    this.nuevoProfesor.rol = rol;
    this.sincronizarIdsModulosSeleccionados();
  }

  onGuardar(): void {
    // VALIDACIÓN: coordinador implica ciclo y módulos derivados de ese ciclo.
    const ciclosFinales = this.nuevoProfesor.rol === 'COORDINADOR'
      ? Array.from(new Set(this.nuevoProfesor.ciclos as string[]))
      : [];
    const modulosIdsDesdeSiglas = this.nuevoProfesor.modulos
      .map((sigla: string): number | undefined => this.modulosBD.find(modulo => this.obtenerSiglaModulo(modulo) === sigla)?.id)
      .filter((id: number | undefined): id is number => typeof id === 'number');
    const modulosIdsFinales = Array.from(new Set([
      ...this.modulosSeleccionadosIds,
      ...modulosIdsDesdeSiglas
    ]));

    const payload = {
      ...this.nuevoProfesor,
      ciclos: ciclosFinales,
      modulos: [...new Set(
        modulosIdsFinales
          .map((moduloId: number) => this.obtenerModuloPorId(moduloId))
          .filter((modulo): modulo is ModuloDTO => Boolean(modulo))
          .map(modulo => this.obtenerSiglaModulo(modulo))
      )],
      modulosIds: modulosIdsFinales
    };
    this.guardar.emit(payload);
  }
}
