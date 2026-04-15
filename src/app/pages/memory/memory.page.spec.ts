import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MemoryPage } from './memory.page';
import { StorageService } from '../../core/storage.service';
import { LobbyService } from '../../core/lobby.service';
import { RankingService } from '../../core/ranking.service';
import { BleSessionService } from '../../core/ble-session.service';

describe('MemoryPage', () => {
  let component: MemoryPage;
  let fixture: ComponentFixture<MemoryPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MemoryPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (k: string) => (k === 'd' ? 'easy' : null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
            navigateByUrl: jasmine.createSpy('navigateByUrl'),
          },
        },
        {
          provide: StorageService,
          useValue: {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve(),
            setJson: () => Promise.resolve(),
          },
        },
        { provide: LobbyService, useValue: { reportPlayerFinishedRound: () => Promise.resolve() } },
        { provide: RankingService, useValue: { syncMyEntry: () => Promise.resolve() } },
        { provide: BleSessionService, useValue: { reportPlayerFinishedRound: () => Promise.resolve() } },
      ],
    });
    fixture = TestBed.createComponent(MemoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
