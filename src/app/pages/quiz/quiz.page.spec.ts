import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizPage } from './quiz.page';
import { StorageService } from '../../core/storage.service';

describe('QuizPage', () => {
  let component: QuizPage;
  let fixture: ComponentFixture<QuizPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuizPage],
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
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: StorageService,
          useValue: {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve(),
            setJson: () => Promise.resolve(),
            getJson: () => Promise.resolve(null),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(QuizPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
