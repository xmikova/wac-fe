import { Component, Host, Prop, State, h } from '@stencil/core';

declare global {
  interface Window {
    navigation: any;
  }
}

@Component({
  tag: 'pmdl-pharmacy-app',
  styleUrl: 'pmdl-pharmacy-app.css',
  shadow: true,
})
export class PmdlPharmacyApp {
  @State() private relativePath = '';
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
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

    if (this.relativePath.startsWith('medicine/')) {
      element = 'editor';
      medicineId = this.relativePath.split('/')[1];
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    return (
      <Host>
        {element === 'editor' ? (
          <pmdl-pharmacy-editor
            medicine-id={medicineId}
            pharmacy-id={this.pharmacyId}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./list')}
          ></pmdl-pharmacy-editor>
        ) : (
          <pmdl-pharmacy-list
            api-base={this.apiBase}
            pharmacy-id={this.pharmacyId}
            onentry-clicked={(ev: CustomEvent<string>) => navigate('./medicine/' + ev.detail)}
          ></pmdl-pharmacy-list>
        )}
      </Host>
    );
  }
}
