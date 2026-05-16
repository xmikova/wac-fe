import { Component, Prop, State, Host, h } from '@stencil/core';

interface Medicine {
  id: string;
  name: string;
  currentStock: number;
}

interface DispensingForm {
  medicineId: string;
  quantity: number;
  department: string;
  dispensedBy: string;
  note: string;
}

@Component({
  tag: 'pmdl-pharmacy-dispensing-editor',
  styleUrl: 'pmdl-pharmacy-dispensing-editor.css',
  shadow: true,
})
export class PmdlPharmacyDispensingEditor {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;

  @State() medicines: Medicine[] = [];
  @State() form: DispensingForm = {
    medicineId: '',
    quantity: 1,
    department: '',
    dispensedBy: '',
    note: '',
  };
  @State() errorMessage: string = '';
  @State() saving: boolean = false;

  async componentWillLoad() {
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/medicines`);
      if (response.ok) {
        this.medicines = await response.json();
      }
    } catch (e) {
      console.error('load medicines', e);
    }
  }

  get selectedMedicine(): Medicine | undefined {
    return this.medicines.find(m => m.id === this.form.medicineId);
  }

  validate(): string | null {
    if (!this.form.medicineId) return 'Vyberte liek';
    if (!this.form.quantity || this.form.quantity <= 0) return 'Množstvo musí byť väčšie ako 0';
    if (!this.form.department.trim()) return 'Zadajte oddelenie';
    if (!this.form.dispensedBy.trim()) return 'Zadajte meno vydávajúceho';
    const med = this.selectedMedicine;
    if (med && this.form.quantity > med.currentStock) {
      return `Nedostatok zásob. Dostupné: ${med.currentStock} ks`;
    }
    return null;
  }

  async save() {
    const error = this.validate();
    if (error) {
      this.errorMessage = error;
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    try {
      const response = await fetch(`${this.apiBase}/pharmacy/${this.pharmacyId}/dispensings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '@new',
          medicineId: this.form.medicineId,
          quantity: Number(this.form.quantity),
          department: this.form.department,
          dispensedBy: this.form.dispensedBy,
          note: this.form.note,
        }),
      });
      if (response.ok) {
        this.goBack();
      } else {
        const body = await response.json().catch(() => ({}));
        this.errorMessage = body.message || 'Chyba pri ukladaní výdaja';
      }
    } catch (e) {
      console.error('save dispensing', e);
      this.errorMessage = 'Chyba pri ukladaní výdaja';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    const base = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${base}/dispensings`);
  }

  render() {
    const med = this.selectedMedicine;
    return (
      <Host>
        <h2 class="title">Nový výdaj lieku</h2>

        {this.errorMessage && <div class="error">{this.errorMessage}</div>}

        <form class="form" onSubmit={(e) => { e.preventDefault(); this.save(); }}>
          <md-filled-select
            label="Liek *"
            onchange={(ev: Event) => {
              const val = (ev.target as HTMLSelectElement).value;
              this.form = { ...this.form, medicineId: val };
            }}
          >
            <md-select-option value="" selected={!this.form.medicineId} aria-label="Vyberte liek">
              <div slot="headline">— Vyberte liek —</div>
            </md-select-option>
            {this.medicines.map(m => (
              <md-select-option
                key={m.id}
                value={m.id}
                selected={this.form.medicineId === m.id}
              >
                <div slot="headline">{m.name} (sklad: {m.currentStock} ks)</div>
              </md-select-option>
            ))}
          </md-filled-select>

          {med && (
            <div class="stock-info">
              Dostupné zásoby: <strong>{med.currentStock} ks</strong>
            </div>
          )}

          <md-filled-text-field
            label="Množstvo *"
            type="number"
            min="1"
            max={med ? String(med.currentStock) : undefined}
            value={String(this.form.quantity)}
            oninput={(ev: InputEvent) =>
              (this.form = { ...this.form, quantity: parseInt((ev.target as HTMLInputElement).value) || 1 })
            }
          >
            <md-icon slot="leading-icon">numbers</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Oddelenie *"
            value={this.form.department}
            oninput={(ev: InputEvent) =>
              (this.form = { ...this.form, department: (ev.target as HTMLInputElement).value })
            }
          >
            <md-icon slot="leading-icon">apartment</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Vydal/a *"
            value={this.form.dispensedBy}
            oninput={(ev: InputEvent) =>
              (this.form = { ...this.form, dispensedBy: (ev.target as HTMLInputElement).value })
            }
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Poznámka"
            value={this.form.note}
            oninput={(ev: InputEvent) =>
              (this.form = { ...this.form, note: (ev.target as HTMLInputElement).value })
            }
          >
            <md-icon slot="leading-icon">note</md-icon>
          </md-filled-text-field>
        </form>

        <md-divider inset></md-divider>

        <div class="actions">
          <span class="stretch-fill"></span>
          <md-outlined-button onClick={() => this.goBack()} disabled={this.saving}>
            Zrušiť
          </md-outlined-button>
          <md-filled-button onClick={() => this.save()} disabled={this.saving}>
            <md-icon slot="icon">save</md-icon>
            {this.saving ? 'Ukladám...' : 'Zaznamenať výdaj'}
          </md-filled-button>
        </div>
      </Host>
    );
  }
}
