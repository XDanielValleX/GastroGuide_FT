import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortsFeedComponent } from './reels';

describe('ShortsFeedComponent', () => {
  let component: ShortsFeedComponent;
  let fixture: ComponentFixture<ShortsFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShortsFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortsFeedComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
