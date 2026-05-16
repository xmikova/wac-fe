import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';

interface Medicine {
  id: string;
  name: string;
  activeSubstance: string;
  dosage: string;
  batchNumber: string;
  expiryDate: string;
  minStock: number;
  currentStock: number;
}

@Component({
  tag: 'pmdl-pharmacy-list',
  styleUrl: 'pmdl-pharmacy-list.css',
  shadow: true,
})
export class PmdlPharmacyList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() pharmacyId: string;
  @State() medicines: Medicine[] = [];
  @State() errorMessage: string;

  async componentWillLoad() {
    await this.loadMedicines();
  }

  private async loadMedicines() {
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/medicines`);
      if (response.ok) {
        this.medicines = await response.json();
      } else {
        this.errorMessage = `Chyba pri načítaní liekov: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba pri načítaní liekov: ${err.message || 'neznáma chyba'}`;
    }
  }

  private isLowStock(medicine: Medicine): boolean {
    return medicine.currentStock < medicine.minStock;
  }

  private isExpiringSoon(medicine: Medicine): boolean {
    if (!medicine.expiryDate) return false;
    const expiry = new Date(medicine.expiryDate);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry < threeMonths;
  }

  render() {
    return (
      <Host>
        <div class="header">
          <h2 class="title">Zoznam liekov</h2>
          <md-filled-icon-button onclick={() => this.entryClicked.emit('@new')}>
            <md-icon>add</md-icon>
          </md-filled-icon-button>
        </div>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="list">
            {this.medicines.map(medicine => (
              <div class="card" onClick={() => this.entryClicked.emit(medicine.id)}>
                <div class="card-icon">
                  <md-icon>medication</md-icon>
                </div>
                <div class="card-body">
                  <div class="card-headline">{medicine.name}</div>
                  <div class="card-sub">
                    <span class="meta">{medicine.activeSubstance} · {medicine.dosage}</span>
                    <span class={`pill ${this.isLowStock(medicine) ? 'pill-warn' : 'pill-ok'}`}>
                      {medicine.currentStock} ks
                    </span>
                    {this.isExpiringSoon(medicine) && <span class="pill pill-danger">⚠ expiruje</span>}
                  </div>
                </div>
                <md-icon class="card-chevron">chevron_right</md-icon>
              </div>
            ))}
          </div>
        )}
      </Host>
    );
  }
}
