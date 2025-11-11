import { IsIn, IsOptional, IsString } from 'class-validator';

export class StartCheckoutDto {
  @IsIn(['STRIPE', 'PAYPAL'])
  provider!: 'STRIPE' | 'PAYPAL';

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
