import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DatatableComponent } from './datatable.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DatatableComponent', () => {
  let component: DatatableComponent;
  let fixture: ComponentFixture<DatatableComponent>;

  beforeEach(async () => {
    // Arrange
    await TestBed.configureTestingModule({
      imports: [DatatableComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DatatableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    // Assert
    expect(component.dtOptions).toEqual({});
    expect(component.columnTitles).toEqual([]);
    expect(component.tableId).toBeDefined();
  });

  it('should safely call refrescar if dtElement is undefined', () => {
    // Act & Assert
    // Should not throw
    expect(() => component.refrescar()).not.toThrow();
  });

  it('should safely call ngOnDestroy if jQuery is undefined', () => {
    // Act & Assert
    // Should not throw if $ is undefined globally
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
