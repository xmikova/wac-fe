import { Component, Prop, State, Host, h } from '@stencil/core';

interface Dispensing {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  department: string;
  dispensedBy: string;
  dispensedAt: string;
  note?: string;
}

@Component({
  tag: 'pmdl-pharmacy-dispensings-list',
  styleUrl: 'pmdl-pharmacy-dispensings-list.css',
  shadow: true,
})
export class PmdlPharmacyDispensingsList {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;
  @State() dispensings: Dispensing[] = [];
  @State() errorMessage: string = '';

  async componentWillLoad() {
    await this.load();
  }

  async load() {
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/dispensings`);
      if (response.ok) {
        this.dispensings = await response.json();
      } else {
        this.errorMessage = 'Chyba pri načítaní výdajov';
      }
    } catch (e) {
      console.error('load dispensings', e);
      this.errorMessage = 'Chyba pri načítaní výdajov';
      this.dispensings = [];
    }
  }

  navigateToNew() {
    const base = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${base}/dispensings/new`);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' });
  }

  render() {
    return (
      <Host>
        <div class="header">
          <h2 class="title">Výdaj liekov</h2>
          <md-filled-icon-button onClick={() => this.navigateToNew()}>
            <md-icon>add</md-icon>
          </md-filled-icon-button>
        </div>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : this.dispensings.length === 0 ? (
          <div class="empty">Žiadne záznamy o výdaji liekov</div>
        ) : (
          <md-list>
            {this.dispensings.map(d => (
              <md-list-item>
                <div slot="headline">
                  {d.medicineName}
                  <span class="qty-pill">{d.quantity} ks</span>
                </div>
                <div slot="supporting-text">
                  <span class="meta">{d.department} · {d.dispensedBy} · {this.formatDate(d.dispensedAt)}</span>
                  {d.note && <span class="note"> — {d.note}</span>}
                </div>
                <md-icon slot="start">medication</md-icon>
              </md-list-item>
            ))}
          </md-list>
        )}
      </Host>
    );
  }
}
