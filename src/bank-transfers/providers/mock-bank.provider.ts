import { Injectable } from '@nestjs/common';
import { IBankProvider, BankTransaction } from './bank-provider.interface';

/**
 * Geliştirme ve test ortamı için sahte banka sağlayıcısı.
 * Gerçek API olmadan eşleştirme sistemini test etmeyi sağlar.
 *
 * Gerçek banka API geldiğinde sadece bu dosyanın yerini
 * OpenBankingProvider veya CustomBankProvider alır.
 */
@Injectable()
export class MockBankProvider implements IBankProvider {
  readonly name = 'mock';

  async getTransactions(fromDate: Date, _toDate?: Date): Promise<BankTransaction[]> {
    // Gerçek API geldiğinde buradaki mock veriler kaldırılır.
    // Sipariş numaraları ve tutarlar test için statik olarak tanımlanmıştır.
    const mockData: BankTransaction[] = [
      {
        transactionId: 'MOCK-TX-001',
        senderName: 'Ahmet Yılmaz',
        description: 'BH-TESTORD sipariş ödemesi',
        amount: 1250.00,
        currency: 'TRY',
        transactionDate: new Date(),
        iban: 'TR000000000000000000000001',
      },
      {
        transactionId: 'MOCK-TX-002',
        senderName: 'Fatma Kaya',
        description: 'Sipariş no: BH-TESTORD2',
        amount: 499.90,
        currency: 'TRY',
        transactionDate: new Date(),
        iban: 'TR000000000000000000000002',
      },
    ];

    // Tarihten önceki işlemleri filtrele (gerçek API'yi simüle eder)
    return mockData.filter(tx => tx.transactionDate >= fromDate);
  }
}
