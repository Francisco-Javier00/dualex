import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocsViewerComponent } from './docs-viewer.component';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

describe('DocsViewerComponent', () => {
  let component: DocsViewerComponent;
  let fixture: ComponentFixture<DocsViewerComponent>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocsViewerComponent],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => 'frontend' } } } 
        }
      ]
    })
    .compileComponents();
  });

  const setupComponent = (tipo: string) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: { get: () => tipo } } }
    });
    fixture = TestBed.createComponent(DocsViewerComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(DomSanitizer);
    spyOn(sanitizer, 'bypassSecurityTrustResourceUrl').and.callThrough();
    fixture.detectChanges();
  };

  it('should create for frontend', () => {
    setupComponent('frontend');
    expect(component).toBeTruthy();
    expect(component.titulo).toBe('Frontend – TypeDoc');
    expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('/assets/docs/frontend/index.html');
  });

  it('should create for backend', () => {
    setupComponent('backend');
    expect(component).toBeTruthy();
    expect(component.titulo).toBe('API Backend – phpDocumentor');
    expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('/assets/docs/backend/index.html');
  });
});
