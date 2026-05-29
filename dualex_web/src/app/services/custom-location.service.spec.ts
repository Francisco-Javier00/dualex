import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LocationStrategy } from '@angular/common';
import { Router, NavigationEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { CustomLocation } from './custom-location.service';

describe('CustomLocation', () => {
  let service: CustomLocation;
  let routerSpy: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<Event>;

  beforeEach(() => {
    routerEventsSubject = new Subject<Event>();
    const mockRouter = {
      events: routerEventsSubject.asObservable(),
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };
    
    const locationStrategySpy = jasmine.createSpyObj('LocationStrategy', ['path', 'prepareExternalUrl', 'pushState', 'replaceState', 'forward', 'back', 'getBaseHref', 'onPopState']);
    locationStrategySpy.path.and.returnValue('/');
    locationStrategySpy.getBaseHref.and.returnValue('/');

    TestBed.configureTestingModule({
      providers: [
        CustomLocation,
        { provide: Router, useValue: mockRouter },
        { provide: LocationStrategy, useValue: locationStrategySpy }
      ]
    });
  });

  it('should be created', fakeAsync(() => {
    service = TestBed.inject(CustomLocation);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    tick();
    expect(service).toBeTruthy();
  }));

  it('should navigate to root if history is empty on back()', fakeAsync(() => {
    service = TestBed.inject(CustomLocation);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    // Arrange (wait for timeout in constructor)
    tick();

    // Act
    service.back();

    // Assert
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  }));

  it('should navigate to previous url in history on back()', fakeAsync(() => {
    service = TestBed.inject(CustomLocation);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    // Arrange (wait for timeout in constructor)
    tick();
    
    // Simulate navigation to add to history
    routerEventsSubject.next(new NavigationEnd(1, '/page1', '/page1'));
    routerEventsSubject.next(new NavigationEnd(2, '/page2', '/page2'));

    // Act
    service.back();

    // Assert
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/page1');
  }));
});
