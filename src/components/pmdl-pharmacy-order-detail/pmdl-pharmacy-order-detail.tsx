import { Component, Prop, State, h } from '@stencil/core';
import { PharmacyOrdersApi, Configuration, OrderStatus, Order, OrderItem } from '../../api/ambulance-wl';

@Component({
  tag: 'pmdl-pharmacy-order-detail',
  styleUrl: 'pmdl-pharmacy-order-detail.css',
  shadow: true,
})
export class PmdlPharmacyOrderDetail {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;
  @Prop() orderId!: string;
  @State() order: Order | null = null;
  api?: PharmacyOrdersApi;

  async componentWillLoad() {
    this.api = new PharmacyOrdersApi(new Configuration({ basePath: this.apiBase || '/api' }));
    await this.load();
  }

  async load() {
    try {
      this.order = await this.api!.getOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
    } catch (e) {
      console.error(e);
    }
  }

  async setStatus(status: OrderStatus) {
    try {
      const payload = { status };
      this.order = await this.api!.updateOrderStatus({ pharmacyId: this.pharmacyId, orderId: this.orderId, updateOrderStatusRequest: payload });
    } catch (e) {
      console.error('setStatus', e);
      alert('Failed to update status');
    }
  }

  async delete() {
    try {
      await this.api!.deleteOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
      const ordersBasePath = this.basePath.replace(/\/$/, '');
      location.href = `${ordersBasePath}/orders`;
    } catch (e) {
      console.error('delete order', e);
      alert('Objednávku sa nepodarilo odstrániť');
    }
  }

  render() {
    const ordersBasePath = this.basePath.replace(/\/$/, '');

    if (!this.order) return <div>Načítavam...</div>;
    return (
      <div>
        <h3>Objednávka {this.order.id}</h3>
        <div>Stav: <strong>{this.order.status}</strong></div>
        <div>Vytvorené: {this.order.createdAt.toLocaleString()}</div>
        <div>Upravené: {this.order.updatedAt!.toLocaleString()}</div>
        <div>Vytvoril: {this.order.createdBy}</div>
        <h4>Položky</h4>
        <ul>
          {(this.order.items || []).map((it: OrderItem) => (
            <li>{it.medicineName || it.medicineId} — {it.quantity} {it.unit} @ {it.unitPrice} = {it.totalPrice}</li>
          ))}
        </ul>
        <div class="status-actions">
          <button onClick={() => this.setStatus(OrderStatus.Confirmed)}>Potvrdiť objednávku</button>
          <button onClick={() => this.setStatus(OrderStatus.Delivered)}>Označiť ako doručené</button>
          <button onClick={() => this.setStatus(OrderStatus.Cancelled)}>Zrušiť objednávku</button>
        </div>
        <div class="nav">
          <a href={`${ordersBasePath}/orders`}>Späť</a>
          <a href={`${ordersBasePath}/orders/${this.order.id}/edit`}>Upraviť objednávku</a>
          <button class="delete-btn" onClick={() => this.delete()}>Odstrániť objednávku</button>
        </div>
      </div>
    );
  }
}