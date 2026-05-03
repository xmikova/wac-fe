import { Component, Prop, State, Host, h } from '@stencil/core';
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
    @Prop() orderId?: string;
    @State() order: Partial<Order> = { items: [] as OrderItem[] };
    @State() errorMessage: string = '';
    api?: PharmacyOrdersApi;

    async componentWillLoad() {
        this.api = new PharmacyOrdersApi(new Configuration({ basePath: this.apiBase || '/api' }));
        if (this.orderId && this.orderId !== '@new') {
            try {
                this.order = await this.api!.getOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId });
            } catch (e) {
                console.error(e);
                this.errorMessage = 'Chyba pri načítaní objednávky';
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

    validate(): string | null {
        const items = this.order!.items as OrderItem[];

        if (!items.length) {
            return 'Objednávka musí obsahovať aspoň jednu položku';
        }

        for (const it of items) {
            if (!it.medicineId && !it.medicineName) {
                return 'Položka musí mať ID alebo názov lieku';
            }

            if (!it.quantity || it.quantity <= 0) {
                return 'Množstvo musí byť väčšie ako 0';
            }

            if (it.unitPrice == null || it.unitPrice < 0) {
                return 'Cena musí byť nezáporná';
            }
        }

        return null;
    }

    async save() {
        const error = this.validate();
        if (error) {
            this.errorMessage = error;
            return;
        }

        try {
            const ordersBasePath = this.basePath.replace(/\/$/, '');
            const payload = {
                ...this.order,
                pharmacyId: this.pharmacyId,
            } as Order;
            let res;
            if (!this.orderId || this.orderId === '@new' || payload.id === '@new') {
                res = await this.api!.createOrder({ pharmacyId: this.pharmacyId, order: payload });
                location.href = `${ordersBasePath}/orders/${res.id}`;
            } else {
                res = await this.api!.updateOrder({ pharmacyId: this.pharmacyId, orderId: this.orderId, order: payload });
                location.href = `${ordersBasePath}/orders/${res.id}`;
            }
        } catch (e) {
            console.error('save order', e);
            this.errorMessage = 'Objednávku sa nepodarilo uložiť';
        }
    }

    goBack() {
        const ordersBasePath = this.basePath.replace(/\/$/, '');
        if (this.orderId && this.orderId !== '@new') {
            window.navigation.navigate(`${ordersBasePath}/orders/${this.orderId}`);
        } else {
            window.navigation.navigate(`${ordersBasePath}/orders`);
        }
    }

    get totalOrderPrice(): number {
        return (this.order?.items || []).reduce((sum, it) => {
            return sum + it.totalPrice!;
        }, 0);
    }

    render() {
        const items = (this.order.items || []) as OrderItem[];
        return (
            <Host>
                <h2 class="title">{this.orderId && this.orderId !== '@new' ? 'Upraviť objednávku' : 'Nová objednávka'}</h2>

                {this.errorMessage && <div class="error">{this.errorMessage}</div>}

                <form class="form">
                    <md-filled-text-field
                        label="Poznámka"
                        multiline
                        rows="3"
                        value={this.order.notes || ''}
                        oninput={(ev: InputEvent) => (this.order = { ...this.order, notes: (ev.target as HTMLInputElement).value })}
                    >
                        <md-icon slot="leading-icon">note</md-icon>
                    </md-filled-text-field>
                </form>

                <h3 class="section-title">Položky</h3>
                {items.length === 0 ? (
                    <div class="empty-state">Žiadne položky</div>
                ) : (
                    <div>
                        {items.map((it, idx) => (
                            <div class="item-row">
                                <md-filled-text-field
                                    label="ID lieku"
                                    value={it.medicineId}
                                    oninput={(ev: InputEvent) => this.updateItem(idx, 'medicineId', (ev.target as HTMLInputElement).value)}
                                />
                                <md-filled-text-field
                                    label="Názov"
                                    value={it.medicineName}
                                    oninput={(ev: InputEvent) => this.updateItem(idx, 'medicineName', (ev.target as HTMLInputElement).value)}
                                />
                                <md-filled-text-field
                                    label="Množstvo"
                                    type="number"
                                    value={String(it.quantity || 0)}
                                    oninput={(ev: InputEvent) => this.updateItem(idx, 'quantity', parseInt((ev.target as HTMLInputElement).value || '0'))}
                                />
                                <md-filled-text-field
                                    label="Cena za jednotku"
                                    type="number"
                                    step="0.01"
                                    value={String(it.unitPrice || 0)}
                                    oninput={(ev: InputEvent) => this.updateItem(idx, 'unitPrice', parseFloat((ev.target as HTMLInputElement).value || '0'))}
                                />
                                <div class="item-summary">
                                    <span class="item-total">Spolu: {(it.totalPrice || 0).toFixed(2)}€</span>
                                    <md-filled-tonal-button onClick={() => this.removeItem(idx)} class="remove-item-button">
                                        <md-icon slot="icon">delete</md-icon>
                                    </md-filled-tonal-button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <md-divider inset></md-divider>

                <div class="order-total">
                    <strong>Celková cena:</strong>
                    <span>{this.totalOrderPrice}€</span>
                </div>

                <md-filled-button onClick={() => this.addItem()} class="add-item-button">
                    <md-icon slot="icon">add</md-icon>
                    Pridať položku
                </md-filled-button>

                <md-divider inset class="section-divider"></md-divider>

                <div class="actions">
                    <span class="stretch-fill"></span>
                    <md-outlined-button onClick={() => this.goBack()}>Zrušiť</md-outlined-button>
                    <md-filled-button onClick={() => this.save()}>
                        <md-icon slot="icon">save</md-icon>
                        Uložiť
                    </md-filled-button>
                </div>
            </Host>
        );
    }
}