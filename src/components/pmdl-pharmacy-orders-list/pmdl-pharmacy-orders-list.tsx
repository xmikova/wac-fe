import { Component, Prop, State, Host, h } from '@stencil/core';
import { PharmacyOrdersApi, Configuration, OrderStatus } from '../../api/ambulance-wl';

@Component({
  tag: 'pmdl-pharmacy-orders-list',
  styleUrl: 'pmdl-pharmacy-orders-list.css',
  shadow: true,
})
export class PmdlPharmacyOrdersList {
  @Prop() pharmacyId!: string;
  @Prop() basePath: string = '';
  @Prop() apiBase!: string;
  @State() orders: any[] = [];
  @State() errorMessage: string = '';
  api?: PharmacyOrdersApi;

  async componentWillLoad() {
    this.api = new PharmacyOrdersApi(new Configuration({ basePath: this.apiBase || '/api' }));
    await this.load();
  }

  async load() {
    try {
      this.orders = await this.api!.getOrders({ pharmacyId: this.pharmacyId });
    } catch (e) {
      console.error('load orders', e);
      this.errorMessage = 'Chyba pri načítaní objednávok';
      this.orders = [];
    }
  }

  navigateToNew() {
    const basePath = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${basePath}/orders/new`);
  }

  navigateToDetail(orderId: string) {
    const basePath = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${basePath}/orders/${orderId}`);
  }

    getStatusLabel(status: OrderStatus | null | undefined): string {
    switch (status) {
      case OrderStatus.Created:
        return 'Vytvorená';
      case OrderStatus.Confirmed:
        return 'Potvrdená';
      case OrderStatus.Delivered:
        return 'Doručená';
      case OrderStatus.Cancelled:
        return 'Zrušená';
      default:
        return '-';
    }
  }

  render() {
    return (
      <Host>
        <div class="header">
          <h2 class="title">Zoznam objednávok</h2>
          <md-filled-icon-button onClick={() => this.navigateToNew()}>
            <md-icon>add</md-icon>
          </md-filled-icon-button>
        </div>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : this.orders.length === 0 ? (
          <div class="error">Žiadne objednávky</div>
        ) : (
          <md-list>
            {this.orders.map(order => (
              <md-list-item onClick={() => this.navigateToDetail(order.id)}>
                <div slot="headline">Objednávka: {order.id}</div>
                <div slot="supporting-text">Stav: {this.getStatusLabel(order.status)} | Vytvoril: {order.createdBy}</div>
                <md-icon slot="start">shopping_cart</md-icon>
                <md-icon slot="end">chevron_right</md-icon>
              </md-list-item>
            ))}
          </md-list>
        )}
      </Host>
    );
  }
}