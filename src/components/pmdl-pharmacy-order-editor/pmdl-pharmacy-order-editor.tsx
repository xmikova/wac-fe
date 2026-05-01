import { Component, Prop, State, h } from '@stencil/core';
import { PharmacyOrdersApi, Configuration, Order, OrderItem, OrderStatus } from '../../api/ambulance-wl';

@Component({
  tag: 'pmdl-pharmacy-order-editor',
  styleUrl: 'pmdl-pharmacy-order-editor.css',
  shadow: true,
})
export class PmdlPharmacyOrderEditor {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;
  @Prop() orderId?: string; // "new" or undefined => create
  @State() order: Partial<Order> = { items: [] as OrderItem[] };
  api?: PharmacyOrdersApi;

  async componentWillLoad() {
    this.api = new PharmacyOrdersApi(new Configuration({ basePath: this.apiBase || '/api' }));
    if (this.orderId && this.orderId !== '@new') {
      try {
        this.order = await this.api!.getOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
      } catch (e) {
        console.error(e);
      }
    } else {
      this.order = {
        id: '@new',
        pharmacyId: this.pharmacyId,
        items: [],
        status: OrderStatus.Created as any,
        createdAt: new Date(),
        createdBy: 'user-1',
        notes: '',
      };
    }
  }

  addItem() {
    (this.order.items as OrderItem[]).push({
      medicineId: '',
      medicineName: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      totalPrice: 0,
    });
    this.order = { ...this.order };
  }

  removeItem(idx: number) {
    (this.order.items as OrderItem[]).splice(idx, 1);
    this.order = { ...this.order };
  }

  updateItem(idx: number, key: keyof OrderItem, value: any) {
    const items = (this.order.items as OrderItem[]).slice();
    // @ts-ignore
    items[idx][key] = value;
    items[idx].totalPrice = items[idx].quantity * items[idx].unitPrice;
    this.order = { ...this.order, items };
  }

  async save() {
    try {
      const ordersBasePath = this.basePath.replace(/\/$/, '');
      const payload = {
        ...this.order,
        pharmacyId: this.pharmacyId,
      } as Order;
      let res;
      if (!this.orderId || this.orderId === '@new' || payload.id === '@new') {
        res = await this.api!.createOrder({ pharmacyId: this.pharmacyId, order: payload });
        // navigate to detail
        location.href = `${ordersBasePath}/orders/${res.id}`;
      } else {
        res = await this.api!.updateOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId, order: payload });
        location.href = `${ordersBasePath}/orders/${res.id}`;
      }
    } catch (e) {
      console.error('save order', e);
      alert('Objednávku sa nepodarilo uložiť');
    }
  }

  render() {
    const items = (this.order.items || []) as OrderItem[];
    return (
      <div>
        <h3>{this.orderId && this.orderId !== '@new' ? 'Upraviť objednávku' : 'Nová objednávka'}</h3>
        <h4>Položky</h4>
        <div>
          {items.map((it, idx) => (
            <div class="item-row">
              <input placeholder="medicineId" value={it.medicineId} onInput={e => this.updateItem(idx, 'medicineId', (e.target as any).value)} />
              <input placeholder="name" value={it.medicineName} onInput={e => this.updateItem(idx, 'medicineName', (e.target as any).value)} />
              <input type="number" value={it.quantity} onInput={e => this.updateItem(idx, 'quantity', parseInt((e.target as any).value || '0'))} />
              <input placeholder="unit" value={it.unit} onInput={e => this.updateItem(idx, 'unit', (e.target as any).value)} />
              <input type="number" step="0.01" value={it.unitPrice} onInput={e => this.updateItem(idx, 'unitPrice', parseFloat((e.target as any).value || '0'))} />
              <span>{it.totalPrice?.toFixed(2) || '0.00'}</span>
              <button onClick={() => this.removeItem(idx)}>Odstrániť</button>
            </div>
          ))}
        </div>
        <button onClick={() => this.addItem()}>Pridať položku</button>
        <label>Poznámka
          <textarea value={this.order.notes || ''} onInput={e => (this.order = { ...this.order, notes: (e.target as any).value })} />
        </label>
        <div class="actions">
          <button onClick={() => this.save()}>Uložiť</button>
          <a href={`${this.basePath.replace(/\/$/, '')}/orders`}>Späť</a>
        </div>
      </div>
    );
  }
}