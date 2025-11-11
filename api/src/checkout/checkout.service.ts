import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { ConfigService } from '@nestjs/config';
import { StripeProvider } from '../payments/providers/stripe.provider';
import { PaypalProvider } from '../payments/providers/paypal.provider';
import { Provider } from '@prisma/client';

@Injectable()
export class CheckoutService {
  private stripe: StripeProvider;
  private paypal: PaypalProvider;

  constructor(
    private prisma: PrismaService,
    private cart: CartService,
    cfg: ConfigService,
  ) {
    this.stripe = new StripeProvider(cfg);
    this.paypal = new PaypalProvider(cfg);
  }
  async start(
    userId: string,
    provider: 'STRIPE' | 'PAYPAL',
    returnUrl?: string,
    cancelUrl?: string,
  ) {
    // Compute totals from current cart
    const summary = await this.cart.getCart(userId);
    if (summary.items.length === 0)
      throw new BadRequestException('Cart is empty');

    // Create Order + OrderItems snapshot + Payment
    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          userId,
          totalCents: summary.subtotalCents,
          currency: summary.currency,
        },
      });

      await tx.orderItem.createMany({
        data: summary.items.map((i) => ({
          orderId: o.id,
          productId: i.productId,
          nameSnapshot: i.name,
          priceCents: i.unitPriceCents,
          quantity: i.quantity,
        })),
      });

      await tx.payment.create({
        data: {
          orderId: o.id,
          provider: provider as Provider,
          amountCents: summary.subtotalCents,
          currency: summary.currency,
        },
      });

      return o;
    });

    // Provider init
    if (provider === 'STRIPE') {
      const { clientSecret, id } = await this.stripe.createPaymentIntent(
        summary.subtotalCents,
        summary.currency,
        { orderId: order.id, userId },
      );
      await this.prisma.payment.update({
        where: { orderId: order.id },
        data: { providerRef: id },
      });
      return { provider: 'STRIPE', clientSecret, orderId: order.id };
    }

    // PayPal expects decimals
    const amount = (summary.subtotalCents / 100).toFixed(2);
    const { id, approvalUrl } = await this.paypal.createOrder(
      amount,
      summary.currency,
      returnUrl ?? 'https://example.com/paypal/return',
      cancelUrl ?? 'https://example.com/paypal/cancel',
    );
    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: { providerRef: id },
    });
    return { provider: 'PAYPAL', approvalUrl, orderId: order.id };
  }
}
