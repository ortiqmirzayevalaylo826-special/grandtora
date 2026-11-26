import { IsEmail, IsIn, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

// Kamida 8 belgi: katta, kichik harf, raqam, maxsus belgi
const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const NAME = /^[\p{L}\p{M}' .-]{1,60}$/u;

export class RegisterDto {
  @Matches(NAME) firstName: string;
  @Matches(NAME) lastName: string;
  @IsEmail() @MaxLength(254) email: string;
  @Matches(PW, { message: 'weak_password' }) password: string;
  @IsIn(['uz', 'ru', 'en']) locale: string;
}
export class EmailDto { @IsEmail() @MaxLength(254) email: string }
export class VerifyDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 6) @Matches(/^\d{6}$/) code: string;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) @MaxLength(72) password: string;
}
export class ResetDto extends VerifyDto {
  @Matches(PW, { message: 'weak_password' }) newPassword: string;
}
