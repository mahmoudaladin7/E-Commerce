import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateActiveCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.findOrCreateActiveCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    let subtotalCents = 0;
    const detailed = items.map((it) => {
      const lineTotal = it.quantity * it.product.priceCents;
      subtotalCents += lineTotal;
      return {
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPriceCents: it.product.priceCents,
        currency: it.product.currency,
        name: it.product.name,
        lineTotalCents: lineTotal,
        stockQty: it.product.stockQty,
      };
    });
    return {
      cartId: cart.id,
      items: detailed,
      subtotalCents,
      currency: detailed[0]?.currency ?? 'USD',
    };
  }

  async setItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.findOrCreateActiveCart(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.active)
      throw new NotFoundException('Product not found');
    if (quantity < 0) throw new BadRequestException('Invalid quantity');

    if (quantity === 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      return this.getCart(userId);
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity },
    });

    return this.getCart(userId);
  }
  async removeItem(userId: string, productId: string) {
    const cart = await this.findOrCreateActiveCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
    return this.getCart(userId);
  }
  async clear(userId: string) {
    const cart = await this.findOrCreateActiveCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
