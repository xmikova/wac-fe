import { Component, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'pmdl-pharmacy-app',
  styleUrl: 'pmdl-pharmacy-app.css',
  shadow: true,
})
export class PmdlPharmacyApp {
  @State() private relativePath = '';
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;
  @Prop() pharmacyId: string = 'pmdl-pharmacy';

  componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      toRelative(new URL((ev as any).destination.url).pathname);
    });

    toRelative(location.pathname);
  }

  render() {
    let element = 'list';
    let medicineId = '@new';
    let orderId = '@new';
    let activeTab = 'medicines';

    // Normalize relativePath (remove trailing slash)
    const path = this.relativePath.replace(/\/$/, '');

    // Handle medicine routes
    if (path.startsWith('medicine/')) {
      element = 'editor';
      medicineId = path.split('/')[1];
    }
    // Handle orders - be specific, check longer paths first
    else if (path.startsWith('orders/') && path.includes('/edit')) {
      element = 'orders-editor';
      const parts = path.split('/');
      orderId = parts[1];
    }
    else if (path === 'orders/new') {
      element = 'orders-editor';
      orderId = '@new';
    }
    else if (path.startsWith('orders/')) {
      element = 'orders-detail';
      const parts = path.split('/');
      orderId = parts[1];
    }
    else if (path === 'orders') {
      element = 'orders-list';
      activeTab = 'orders';
    }
    // Dispensing routes
    else if (path === 'dispensings/new') {
      element = 'dispensing-editor';
      activeTab = 'dispensings';
    }
    else if (path === 'dispensings') {
      element = 'dispensings-list';
      activeTab = 'dispensings';
    }
    else {
      element = 'list';
      activeTab = 'medicines';
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    const isEditorView = element === 'editor' || element === 'orders-editor' || element === 'orders-detail' || element === 'dispensing-editor';

    return (
      <Host>
        {isEditorView ? (
          // editor/detail views - no tabs
          <>
            {element === 'editor' ? (
              <pmdl-pharmacy-editor
                medicine-id={medicineId}
                pharmacy-id={this.pharmacyId}
                api-base={this.apiBase}
                oneditor-closed={() => navigate('./list')}
              ></pmdl-pharmacy-editor>
            ) : element === 'orders-editor' ? (
              <pmdl-pharmacy-order-editor
                pharmacyId={this.pharmacyId}
                basePath={this.basePath}
                apiBase={this.apiBase}
                orderId={orderId}
              ></pmdl-pharmacy-order-editor>
            ) : element === 'orders-detail' ? (
              <pmdl-pharmacy-order-detail
                pharmacyId={this.pharmacyId}
                basePath={this.basePath}
                apiBase={this.apiBase}
                orderId={orderId}
              ></pmdl-pharmacy-order-detail>
            ) : element === 'dispensing-editor' ? (
              <pmdl-pharmacy-dispensing-editor
                pharmacyId={this.pharmacyId}
                basePath={this.basePath}
                apiBase={this.apiBase}
              ></pmdl-pharmacy-dispensing-editor>
            ) : null}
          </>
        ) : (
          // list views - with tabs
          <>
            <md-tabs class="tabs-header">
              <md-primary-tab
                class={activeTab === 'medicines' ? 'active' : ''}
                active={activeTab === 'medicines'}
                onClick={() => navigate('./')}
              >
                Lieky
              </md-primary-tab>
              <md-primary-tab
                class={activeTab === 'orders' ? 'active' : ''}
                active={activeTab === 'orders'}
                onClick={() => navigate('./orders')}
              >
                Objednávky
              </md-primary-tab>
              <md-primary-tab
                class={activeTab === 'dispensings' ? 'active' : ''}
                active={activeTab === 'dispensings'}
                onClick={() => navigate('./dispensings')}
              >
                Výdaj
              </md-primary-tab>
            </md-tabs>
            {element === 'list' ? (
              <pmdl-pharmacy-list
                api-base={this.apiBase}
                pharmacy-id={this.pharmacyId}
                onentry-clicked={(ev: CustomEvent<string>) => navigate('./medicine/' + ev.detail)}
              ></pmdl-pharmacy-list>
            ) : element === 'orders-list' ? (
              <pmdl-pharmacy-orders-list
                pharmacyId={this.pharmacyId}
                basePath={this.basePath}
                apiBase={this.apiBase}
              ></pmdl-pharmacy-orders-list>
            ) : element === 'dispensings-list' ? (
              <pmdl-pharmacy-dispensings-list
                pharmacyId={this.pharmacyId}
                basePath={this.basePath}
                apiBase={this.apiBase}
              ></pmdl-pharmacy-dispensings-list>
            ) : null}
          </>
        )}
      </Host>
    );
  }
}