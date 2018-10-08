import { Component, ElementRef, EventEmitter, forwardRef, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgxSelect } from '../core/ngx-select.core';
import { NgxSelectModel } from '../core/ngx-select.model';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxSelectMaterialOverlayComponent } from './overlay/ngx-select-material-overlay.component';
import { Subscription } from 'rxjs';
import { NGX_SELECT_INTL_SERVICE, NgxSelectIntlService } from '../core/ngx-select-intl.service';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ngx-select',
  templateUrl: './ngx-select-material.component.html',
  styleUrls: ['./ngx-select-material.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxSelectMaterialComponent),
      multi: true,
    },
  ]
})
export class NgxSelectMaterialComponent<T> extends NgxSelect<T> implements OnInit, OnDestroy {

  @Input()
  set options(value: NgxSelectModel<T>[]) {
    super.setOriginalOptions(value);
  }

  @Output() changedOptions: EventEmitter<NgxSelectModel<T>[]> = new EventEmitter<NgxSelectModel<T>[]>();

  overlayRef: OverlayRef;
  subscriptions: Subscription[] = [];
  isDisabled = false;

  constructor(private overlay: Overlay,
              private elementRef: ElementRef,
              @Inject(NGX_SELECT_INTL_SERVICE) intlService: NgxSelectIntlService) {
    super(intlService);
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 20,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'backdrop'
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscriptions.map(sub => sub.unsubscribe());
  }

  toggleVisibility(): void {
    if (this.visible === true) {
      this.subscriptions.map(sub => sub.unsubscribe());
      this.subscriptions = [];
      this.overlayRef.detach();
    } else {
      const overlayPortal = new ComponentPortal(NgxSelectMaterialOverlayComponent);

      const containerRef = this.overlayRef.attach(overlayPortal);

      const overlayInstance = containerRef.instance;

      overlayInstance.options$ = this.visibleOptions$;
      overlayInstance.filterControl = this.filterControl;
      const toggleSub = overlayInstance.toggleSelected.subscribe(() => {
        this.toggleAllNoneSelected();
      });
      const resetSub = overlayInstance.resetFilter.subscribe(() => {
        this.resetFilter();
      });
      const changeSub = overlayInstance.changeCheckbox.subscribe((item: NgxSelectModel<T>) => {
        this.changeCheckbox(item);
      });

      const backDropClick = this.overlayRef.backdropClick().subscribe(() => {
        this.toggleVisibility();
      });

      this.subscriptions = this.subscriptions.concat([toggleSub, resetSub, changeSub, backDropClick]);
    }

    super.toggleVisibility();
  }

  emitUpdateValues(updatedValues: NgxSelectModel<T>[]): void {
    this.changedOptions.emit(updatedValues);
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
