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
  @Prop() orderId!: string;
  @State() order: Order | null = null;
  api = new PharmacyOrdersApi(new Configuration({ basePath: '/api' }));

  async componentWillLoad() {
    await this.load();
  }

  async load() {
    try {
      this.order = await this.api.getOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
    } catch (e) {
      console.error(e);
    }
  }

  async setStatus(status: OrderStatus) {
    try {
      const payload = { status };
      this.order = await this.api.updateOrderStatus({ pharmacyId: this.pharmacyId, orderId: this.orderId, updateOrderStatusRequest: payload });
    } catch (e) {
      console.error('setStatus', e);
      alert('Failed to update status');
    }
  }

  render() {
    const ordersBasePath = this.basePath.replace(/\/$/, '');

    if (!this.order) return <div>Loading...</div>;
    return (
      <div>
        <h3>Order {this.order.id}</h3>
        <div>Status: <strong>{this.order.status}</strong></div>
        <div>Created: {this.order.createdAt}</div>
        <div>Updated: {this.order.updatedAt}</div>
        <div>Created by: {this.order.createdBy}</div>
        <h4>Items</h4>
        <ul>
          {(this.order.items || []).map((it: OrderItem) => (
            <li>{it.medicineName || it.medicineId} — {it.quantity} {it.unit} @ {it.unitPrice} = {it.totalPrice}</li>
          ))}
        </ul>
        <div class="status-actions">
          <button onClick={() => this.setStatus(OrderStatus.Confirmed)}>Confirm</button>
          <button onClick={() => this.setStatus(OrderStatus.Delivered)}>Mark Delivered</button>
          <button onClick={() => this.setStatus(OrderStatus.Cancelled)}>Cancel</button>
        </div>
        <div class="nav">
          <a href={`${ordersBasePath}/orders`}>Back</a>
          <a href={`${ordersBasePath}/orders/${this.order.id}/edit`}>Edit</a>
        </div>
      </div>
    );
  }
}