export interface VietQRConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
}

export function generateVietQRUrl({
  bankId,
  accountNo,
  accountName,
  amount,
  orderCode,
}: VietQRConfig): string {
  const cleanBankId = encodeURIComponent(bankId || '970422');
  const cleanAccountNo = encodeURIComponent(accountNo || '0987654321');
  const cleanAccountName = encodeURIComponent(accountName || 'THE CYBER COFFEE SOC');
  const addInfo = encodeURIComponent(`ORDER_${orderCode}`);
  
  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${cleanAccountName}`;
}
