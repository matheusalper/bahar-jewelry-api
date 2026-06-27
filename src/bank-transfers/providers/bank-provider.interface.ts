export interface BankTransaction {
  transactionId: string;
  senderName: string;
  description: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  iban?: string;
}

export interface IBankProvider {
  readonly name: string;
  /**
   * Belirli tarihten itibaren gelen havale hareketlerini getirir.
   * Gerçek API'lerde OAuth / API Key ile yetkilendirme yapılır.
   */
  getTransactions(fromDate: Date, toDate?: Date): Promise<BankTransaction[]>;
}
