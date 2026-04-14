import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { Tab1Page } from './tab1.page';
import { StorageService } from '../core/storage.service';
import { UserProfileService } from '../core/user-profile.service';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tab1Page],
      imports: [IonicModule.forRoot(), ExploreContainerComponentModule],
      providers: [
        {
          provide: StorageService,
          useValue: {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve(),
          },
        },
        {
          provide: UserProfileService,
          useValue: {
            refreshFromStorage: () => Promise.resolve(),
            getDisplayNameStream: () => ({
              subscribe: (fn: (s: string) => void) => {
                fn('Campeón');
                return { unsubscribe: () => {} };
              },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
