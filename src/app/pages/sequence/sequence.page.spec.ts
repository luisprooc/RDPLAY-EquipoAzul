import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SequencePage } from './sequence.page';

describe('SequencePage', () => {
  let component: SequencePage;
  let fixture: ComponentFixture<SequencePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SequencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
