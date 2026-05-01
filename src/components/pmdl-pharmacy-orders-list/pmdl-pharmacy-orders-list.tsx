import { Component, Prop, State, h } from '@stencil/core';
import { PharmacyOrdersApi, Configuration } from '../../api/ambulance-wl';

@Component({
  tag: 'pmdl-pharmacy-orders-list',
  styleUrl: 'pmdl-pharmacy-orders-list.css',
  shadow: true,
})
export class PmdlPharmacyOrdersList {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @State() orders: any[] = [];
  api = new PharmacyOrdersApi(new Configuration({ basePath: '/api' }));

  async componentWillLoad() {
    await this.load();
  }

  async load() {
    try {
      this.orders = await this.api.getOrders({ pharmacyId: this.pharmacyId });
    } catch (e) {
      console.error('load orders', e);
      this.orders = [];
    }
  }

  render() {
    const ordersBasePath = this.basePath.replace(/\/$/, '');

    return (
      <div>
        <div class="header">
          <h3>Orders · {this.pharmacyId}</h3>
          <a class="btn" href={`${ordersBasePath}/orders/new`}>New order</a>
        </div>
        <div class="list">
          {this.orders.length === 0 && <div>No orders</div>}
          {this.orders.map(o => (
            <div class="row">
              <a href={`${ordersBasePath}/orders/${o.id}`}>{o.id}</a>
              <span class="status">{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}