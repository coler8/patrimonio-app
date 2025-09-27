import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDetallado } from './historial-detallado';

describe('HistorialDetallado', () => {
  let component: HistorialDetallado;
  let fixture: ComponentFixture<HistorialDetallado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDetallado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialDetallado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
