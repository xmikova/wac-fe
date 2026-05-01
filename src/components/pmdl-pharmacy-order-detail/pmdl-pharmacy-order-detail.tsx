import { Component, Prop, State, Host, h } from '@stencil/core';
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
  @State() errorMessage: string = '';
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
      this.errorMessage = 'Chyba pri načítaní objednávky';
    }
  }

  async setStatus(status: OrderStatus) {
    try {
      const payload = { status };
      this.order = await this.api!.updateOrderStatus({ pharmacyId: this.pharmacyId, orderId: this.orderId, updateOrderStatusRequest: payload });
    } catch (e) {
      console.error('setStatus', e);
      this.errorMessage = 'Zmena stavu sa nepodarila';
    }
  }

  async delete() {
    try {
      await this.api!.deleteOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
      const ordersBasePath = this.basePath.replace(/\/$/, '');
      location.href = `${ordersBasePath}/orders`;
    } catch (e) {
      console.error('delete order', e);
      this.errorMessage = 'Objednávku sa nepodarilo odstrániť';
    }
  }

  goBack() {
    const ordersBasePath = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${ordersBasePath}/orders`);
  }

  goToEdit() {
    const ordersBasePath = this.basePath.replace(/\/$/, '');
    window.navigation.navigate(`${ordersBasePath}/orders/${this.order!.id}/edit`);
  }

  render() {
    if (this.errorMessage && !this.order) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    if (!this.order) {
      return <Host><div>Načítavam...</div></Host>;
    }

    return (
      <Host>
        <h2 class="title">Objednávka {this.order.id}</h2>

        {this.errorMessage && <div class="error">{this.errorMessage}</div>}

        <div class="details-meta">
          <div class="details-row">
            <strong>Stav:</strong> <span class="status-badge">{this.order.status}</span>
          </div>
          <div class="details-row">
            <strong>Vytvorené:</strong> {this.order.createdAt.toLocaleString()}
          </div>
          <div class="details-row">
            <strong>Upravené:</strong> {this.order.updatedAt!.toLocaleString()}
          </div>
          <div class="details-row">
            <strong>Tvorca:</strong> {this.order.createdBy || '-'}
          </div>
          {this.order.notes && (
            <div class="details-row">
              <strong>Poznámka:</strong> {this.order.notes}
            </div>
          )}
        </div>

        <md-divider inset></md-divider>

        <h3 class="section-title">Položky</h3>
        {(this.order.items || []).length === 0 ? (
          <div class="empty-state">Žiadne položky</div>
        ) : (
          <md-list>
            {(this.order.items || []).map((it: OrderItem) => (
              <md-list-item>
                <div slot="headline">{it.medicineName || it.medicineId}</div>
                <div slot="supporting-text">
                  {it.quantity} {it.unit} @ {it.unitPrice} = {it.totalPrice}
                </div>
                <md-icon slot="start">shopping_cart_checkout</md-icon>
              </md-list-item>
            ))}
          </md-list>
        )}

        <md-divider inset class="section-divider"></md-divider>

        <h3 class="section-title compact">Zmena stavu</h3>
        <div class="status-actions">
          <md-filled-button onClick={() => this.setStatus(OrderStatus.Confirmed)}>
            <md-icon slot="icon">check_circle</md-icon>
            Potvrdiť
          </md-filled-button>
          <md-filled-button onClick={() => this.setStatus(OrderStatus.Delivered)}>
            <md-icon slot="icon">local_shipping</md-icon>
            Doručené
          </md-filled-button>
          <md-filled-tonal-button onClick={() => this.setStatus(OrderStatus.Cancelled)}>
            <md-icon slot="icon">cancel</md-icon>
            Zrušiť
          </md-filled-tonal-button>
        </div>

        <md-divider inset class="section-divider"></md-divider>

        <div class="actions">
          <md-filled-tonal-button onClick={() => this.delete()}>
            <md-icon slot="icon">delete</md-icon>
            Vymazať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button onClick={() => this.goBack()}>Späť</md-outlined-button>
          <md-filled-button onClick={() => this.goToEdit()}>
            <md-icon slot="icon">edit</md-icon>
            Upraviť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}