import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('sepay', () => {
  return {
    apiUrl: process.env.SEPAY_API_URL ?? 'https://my.sepay.vn/userapi',
    apiKey: process.env.SEPAY_API_KEY,
    bankBin: process.env.SEPAY_BANK_BIN,
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER,
    accountName: process.env.SEPAY_ACCOUNT_NAME,
  };
});
