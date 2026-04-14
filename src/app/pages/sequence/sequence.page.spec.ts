import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SequencePage } from './sequence.page';
import { StorageService } from '../../core/storage.service';
import { LobbyService } from '../../core/lobby.service';

describe('SequencePage', () => {
  let component: SequencePage;
  let fixture: ComponentFixture<SequencePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SequencePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
            navigateByUrl: jasmine.createSpy('navigateByUrl'),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
        { provide: LobbyService, useValue: { reportPlayerFinishedRound: () => Promise.resolve() } },
        {
          provide: StorageService,
          useValue: {
            get: () => Promise.resolve(null),
            getJson: () => Promise.resolve(null),
            set: () => Promise.resolve(),
            setJson: () => Promise.resolve(),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SequencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
