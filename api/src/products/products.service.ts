import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  priceCents: true,
  currency: true,
  sku: true,
  stockQty: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProductSummary = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_SELECT;
}>;
type SortKey = NonNullable<QueryProductsDto['sort']>;

const SORT_MAP: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  price_asc: [{ priceCents: Prisma.SortOrder.asc }],
  price_desc: [{ priceCents: Prisma.SortOrder.desc }],
  newest: [{ createdAt: Prisma.SortOrder.desc }],
};

@Injectable()
export class ProductsService {
  private readonly defaultTake = 20;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductSummary> {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.prisma.product.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        currency: dto.currency ?? 'USD',
        sku: dto.sku,
        stockQty: dto.stockQty,
        active: dto.active ?? true,
      },
      select: PRODUCT_SELECT,
    });
  }

  async findAll(query: QueryProductsDto) {
    const where = this.buildWhere(query);
    const orderBy = this.resolveOrderBy(query.sort);
    const take = query.limit ?? this.defaultTake;

    const findManyArgs: Prisma.ProductFindManyArgs = {
      where,
      orderBy,
      select: PRODUCT_SELECT,
      take,
    };

    if (query.cursor) {
      findManyArgs.cursor = { id: query.cursor };
      findManyArgs.skip = 1;
    } else {
      findManyArgs.skip = query.offset ?? 0;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany(findManyArgs),
      this.prisma.product.count({ where }),
    ]);

    const nextCursor =
      items.length === take && items.length > 0
        ? items[items.length - 1].id
        : undefined;

    return { data: items, total, nextCursor };
  }

  async findOne(id: string): Promise<ProductSummary> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductSummary> {
    await this.ensureExists(id);
    const data: Prisma.ProductUpdateInput = { ...dto };

    if (dto.name) {
      data.slug = await this.generateUniqueSlug(dto.name, id);
    }

    return this.prisma.product.update({
      where: { id },
      data,
      select: PRODUCT_SELECT,
    });
  }

  async remove(id: string): Promise<ProductSummary> {
    await this.ensureExists(id);
    return this.prisma.product.delete({
      where: { id },
      select: PRODUCT_SELECT,
    });
  }

  private buildWhere(query: QueryProductsDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    const trimmedSearch = query.search?.trim();

    if (trimmedSearch) {
      where.OR = [
        { name: { contains: trimmedSearch, mode: 'insensitive' } },
        { description: { contains: trimmedSearch, mode: 'insensitive' } },
        { sku: { contains: trimmedSearch, mode: 'insensitive' } },
      ];
    }

    if (query.minPriceCents != null || query.maxPriceCents != null) {
      const priceFilter: Prisma.IntFilter = {};
      if (query.minPriceCents != null) priceFilter.gte = query.minPriceCents;
      if (query.maxPriceCents != null) priceFilter.lte = query.maxPriceCents;
      where.priceCents = priceFilter;
    }

    return where;
  }

  private resolveOrderBy(
    sort?: QueryProductsDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput[] | undefined {
    if (!sort) return undefined;
    return SORT_MAP[sort];
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Product not found');
  }

  private async generateUniqueSlug(name: string, ignoreId?: string) {
    const base = this.slugify(name);
    let slug = base;
    let counter = 1;

    while (
      await this.prisma.product.findFirst({
        where: {
          slug,
          ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
        },
        select: { id: true },
      })
    ) {
      counter += 1;
      slug = `${base}-${counter}`;
    }

    return slug;
  }

  private slugify(input: string) {
    const base = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || `product-${Date.now()}`;
  }
}
