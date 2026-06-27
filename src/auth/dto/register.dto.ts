import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  // Kullanıcı adı: harf, rakam, alt çizgi — 3-20 karakter, opsiyonel
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Kullanıcı adı 3-20 karakter, sadece harf/rakam/alt çizgi içerebilir',
  })
  username?: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  email: string;

  // Türkiye formatında telefon: +90 veya 0 ile başlayan 10 haneli
  @IsString()
  @IsOptional()
  @Matches(/^(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, {
    message: 'Geçerli bir Türkiye telefon numarası girin (05XX XXX XX XX)',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  birthDate?: string; // ISO date string: YYYY-MM-DD

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;
}
