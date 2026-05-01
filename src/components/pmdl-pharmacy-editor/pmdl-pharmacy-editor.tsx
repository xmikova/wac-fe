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
  tag: 'pmdl-pharmacy-editor',
  styleUrl: 'pmdl-pharmacy-editor.css',
  shadow: true,
})
export class PmdlPharmacyEditor {
  @Prop() medicineId: string;
  @Prop() pharmacyId: string;
  @Prop() apiBase: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() medicine: Medicine;
  @State() errorMessage: string;
  @State() isValid: boolean = false;

  async componentWillLoad() {
    if (this.medicineId && this.medicineId !== '@new') {
      await this.loadMedicine();
    } else {
      this.medicine = {
        id: '@new',
        name: '',
        activeSubstance: '',
        dosage: '',
        batchNumber: '',
        expiryDate: '',
        minStock: 0,
        currentStock: 0,
      };
    }
  }

  private async loadMedicine() {
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/medicines/${this.medicineId}`);
      if (response.ok) {
        this.medicine = await response.json();
        this.isValid = true;
      } else {
        this.errorMessage = `Chyba pri načítaní lieku: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba pri načítaní lieku: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async saveMedicine() {
    if (!this.medicine?.name?.trim()) {
      this.errorMessage = 'Názov lieku je povinný';
      return;
    }

    try {
      const url =
        this.medicineId === '@new'
          ? `${this.apiBase}/pharmacy/${this.pharmacyId}/medicines`
          : `${this.apiBase}/pharmacy/${this.pharmacyId}/medicines/${this.medicineId}`;

      const method = this.medicineId === '@new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.medicine),
      });

      if (response.ok) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Chyba pri ukladaní: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba pri ukladaní: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async deleteMedicine() {
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/medicines/${this.medicineId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Chyba pri mazaní: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba pri mazaní: ${err.message || 'neznáma chyba'}`;
    }
  }

  private update(field: keyof Medicine, value: string | number) {
    this.medicine = { ...this.medicine, [field]: value };
    this.isValid = !!this.medicine.name?.trim();
  }

  render() {
    if (this.errorMessage && !this.medicine) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    return (
      <Host>
        <h2 class="title">{this.medicineId === '@new' ? 'Nový liek' : 'Upraviť liek'}</h2>

        {this.errorMessage && <div class="error">{this.errorMessage}</div>}

        <form class="form">
          <md-filled-text-field
            label="Názov lieku *"
            required
            value={this.medicine?.name}
            oninput={(ev: InputEvent) => this.update('name', (ev.target as HTMLInputElement).value)}
          >
            <md-icon slot="leading-icon">medication</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Účinná látka"
            value={this.medicine?.activeSubstance}
            oninput={(ev: InputEvent) => this.update('activeSubstance', (ev.target as HTMLInputElement).value)}
          >
            <md-icon slot="leading-icon">science</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dávkovanie"
            value={this.medicine?.dosage}
            oninput={(ev: InputEvent) => this.update('dosage', (ev.target as HTMLInputElement).value)}
          >
            <md-icon slot="leading-icon">colorize</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Číslo šarže"
            value={this.medicine?.batchNumber}
            oninput={(ev: InputEvent) => this.update('batchNumber', (ev.target as HTMLInputElement).value)}
          >
            <md-icon slot="leading-icon">tag</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dátum expirácie (RRRR-MM-DD)"
            value={this.medicine?.expiryDate}
            oninput={(ev: InputEvent) => this.update('expiryDate', (ev.target as HTMLInputElement).value)}
          >
            <md-icon slot="leading-icon">event</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Minimálne množstvo na sklade"
            type="number"
            value={String(this.medicine?.minStock ?? 0)}
            oninput={(ev: InputEvent) => this.update('minStock', Number((ev.target as HTMLInputElement).value))}
          >
            <md-icon slot="leading-icon">inventory_2</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Aktuálne množstvo na sklade"
            type="number"
            value={String(this.medicine?.currentStock ?? 0)}
            oninput={(ev: InputEvent) => this.update('currentStock', Number((ev.target as HTMLInputElement).value))}
          >
            <md-icon slot="leading-icon">warehouse</md-icon>
          </md-filled-text-field>
        </form>

        <md-divider inset></md-divider>

        <div class="actions">
          <md-filled-tonal-button disabled={this.medicineId === '@new'} onClick={() => this.deleteMedicine()}>
            <md-icon slot="icon">delete</md-icon>
            Vymazať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>Zrušiť</md-outlined-button>
          <md-filled-button disabled={!this.isValid} onClick={() => this.saveMedicine()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}
