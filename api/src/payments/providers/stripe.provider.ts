import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

export class StripeProvider {
  private stripe: Stripe;

  constructor(cfg: ConfigService) {
    this.stripe = new Stripe(cfg.get<string>('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2024-06-20' as any,
    });
  }

  async createPaymentIntent(
    amountCents: number,
    currency: string,
    metadata: Record<string, string>,
  ) {
    const pi = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: pi.client_secret!, id: pi.id };
  }
  verifyWebhook(rawBody: string, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
