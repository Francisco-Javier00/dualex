import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { EmpresaDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private empresasMock: EmpresaDTO[] = [
    { id: 1, siglas: 'FGL', nombre: 'Fundación Gloria López', convenioUrl: 'https://fgl.es/convenio.pdf', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'María Pérez', numeroContacto: '600000001' },
    { id: 2, siglas: 'TKS', nombre: 'Tech Skills S.L.', convenioUrl: 'https://tks.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Carlos Gómez', numeroContacto: '600000002' },
    { id: 3, siglas: 'INF', nombre: 'Informatika Norte', convenioUrl: 'https://inf.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Laura Ruiz', numeroContacto: '600000003' },
    { id: 4, siglas: 'NXT', nombre: 'Next Services', convenioUrl: 'https://nxt.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Pedro Sánchez', numeroContacto: '600000004' },
    { id: 5, siglas: 'SYN', nombre: 'Synapse Works', convenioUrl: 'https://syn.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Ana Torres', numeroContacto: '600000005' },
    {
      id: 6,
      siglas: 'BIZ',
      nombre: 'BizDev Labs',
      convenioUrl: 'https://biz.example.com/convenio',
      inicioConvenio: '01/09/2025',
      finConvenio: '30/06/2026',
      contacto: 'Javier León',
      numeroContacto: '600000006',
      contactosAdicionales: [
        { contacto: 'Marta Gil', numeroContacto: '600001101' },
        { contacto: 'Sergio Vidal', numeroContacto: '600001102' },
        { contacto: 'Lucía Navarro', numeroContacto: '600001103' }
      ]
    },
    { id: 7, siglas: 'EDU', nombre: 'EduTech Center', convenioUrl: 'https://edu.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Carmen Díaz', numeroContacto: '600000007' },
    { id: 8, siglas: 'RND', nombre: 'Ronda Digital', convenioUrl: 'https://rnd.example.com/convenio', inicioConvenio: '01/09/2025', finConvenio: '30/06/2026', contacto: 'Miguel Ortiz', numeroContacto: '600000008' }
  ];

  obtenerEmpresasDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtradas = this.empresasMock;

    if (search) {
      filtradas = filtradas.filter(empresa =>
        empresa.siglas.toLowerCase().includes(search) ||
        empresa.nombre.toLowerCase().includes(search) ||
        empresa.convenioUrl.toLowerCase().includes(search) ||
        empresa.inicioConvenio.toLowerCase().includes(search) ||
        empresa.finConvenio.toLowerCase().includes(search) ||
        empresa.contacto.toLowerCase().includes(search) ||
        empresa.numeroContacto.toLowerCase().includes(search) ||
        (empresa.contactosAdicionales?.some((contacto: any) =>
          contacto.contacto.toLowerCase().includes(search) ||
          contacto.numeroContacto.toLowerCase().includes(search)
        ) ?? false)
      );
    }

    if (dataTablesParameters.order && dataTablesParameters.order.length > 0) {
      const orderColumnIndex = dataTablesParameters.order[0].column;
      const orderDir = dataTablesParameters.order[0].dir;
      const columnName = dataTablesParameters.columns[orderColumnIndex]?.data;

      if (columnName) {
        filtradas = [...filtradas].sort((a: any, b: any) => {
          const valA = a[columnName]?.toString().toLowerCase() ?? '';
          const valB = b[columnName]?.toString().toLowerCase() ?? '';
          if (valA < valB) return orderDir === 'asc' ? -1 : 1;
          if (valA > valB) return orderDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return of({
      draw: dataTablesParameters.draw,
      recordsTotal: this.empresasMock.length,
      recordsFiltered: filtradas.length,
      data: filtradas.slice(start, start + length)
    }).pipe(delay(400));
  }

  agregarEmpresa(empresa: Omit<EmpresaDTO, 'id'>): void {
    const nextId = this.empresasMock.length > 0 ? Math.max(...this.empresasMock.map(e => e.id)) + 1 : 1;
    this.empresasMock = [{ id: nextId, ...empresa }, ...this.empresasMock];
  }

  actualizarEmpresa(id: number, empresa: Omit<EmpresaDTO, 'id'>): void {
    this.empresasMock = this.empresasMock.map(actual => actual.id === id ? { id, ...empresa } : actual);
  }

  eliminarEmpresa(id: number): void {
    this.empresasMock = this.empresasMock.filter(empresa => empresa.id !== id);
  }
}
