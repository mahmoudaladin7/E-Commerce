import * as paypal from 'paypal-rest-sdk';
import { ConfigService } from '@nestjs/config';

export class PaypalProvider {
  constructor(cfg: ConfigService) {
    paypal.configure({
      mode: cfg.get<string>('PAYPAL_MODE', 'sandbox'),
      client_id: cfg.get<string>('PAYPAL_CLIENT_ID', ''),
      client_secret: cfg.get<string>('PAYPAL_CLIENT_SECRET', ''),
    });
  }
  createOrder(
    amount: string,
    currency: string,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<{ id: string; approvalUrl: string }> {
    return new Promise((resolve, reject) => {
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          { amount: { value: amount, currency_code: currency } },
        ],
        application_context: { return_url: returnUrl, cancel_url: cancelUrl },
      } as any;

      paypal.order.create(payload, (err, order) => {
        if (err) return reject(err);
        const approval = order.links.find(
          (l: any) => l.rel === 'approve',
        )?.href;
        resolve({ id: order.id, approvalUrl: approval });
      });
    });
  }
}
