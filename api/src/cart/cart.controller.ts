import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddOrUpdateCartItemDto } from './dto/cart-item.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private svc: CartService) {}

  @Get()
  meCart(@Param() _unused: any, @Body() _b: any, req?: any) {
    return this.svc.getCart(req.user.sub);
  }

  @Post('items')
  setItem(@Body() dto: AddOrUpdateCartItemDto, req?: any) {
    return this.svc.setItemQuantity(req.user.sub, dto.productId, dto.quantity);
  }

  @Patch('items/:productId')
  update(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    req?: any,
  ) {
    return this.svc.setItemQuantity(req.user.sub, productId, Number(quantity));
  }

  @Delete('items/:productId')
  remove(@Param('productId') productId: string, req?: any) {
    return this.svc.removeItem(req.user.sub, productId);
  }

  @Delete('clear')
  clear(req?: any) {
    return this.svc.clear(req.user.sub);
  }
}
