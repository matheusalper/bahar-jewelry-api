import { Injectable, Logger } from '@nestjs/common';
import { IBankProvider, BankTransaction } from './bank-provider.interface';

/**
 * Türkiye Açık Bankacılık (PSD2 / BKM OpenBanking) entegrasyonu için şablon.
 *
 * API bilgileri geldiğinde doldurun:
 * - apiBaseUrl: Bankanın açık bankacılık API uç noktası
 * - clientId / clientSecret: OAuth2 kimlik bilgileri
 * - accountIban: Hesap hareketlerini çekeceğiniz IBAN
 *
 * Her banka farklı format döndürebilir; normalize() metodu
 * ham veriyi BankTransaction standart formatına çevirir.
 */
@Injectable()
export class OpenBankingProvider implements IBankProvider {
  readonly name = 'open_banking';
  private readonly logger = new Logger(OpenBankingProvider.name);

  constructor(private readonly config: {
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    accountIban: string;
    mode: 'test' | 'live';
  }) {}

  async getTransactions(fromDate: Date, toDate?: Date): Promise<BankTransaction[]> {
    const to = toDate || new Date();
    this.logger.log(`[${this.config.mode}] ${fromDate.toISOString()} — ${to.toISOString()} arasındaki işlemler çekiliyor`);

    // TODO: Aşağıdaki adımları gerçek API bilgileriyle doldurun.
    // 1. OAuth2 token al:
    //    POST {apiBaseUrl}/oauth/token  { clientId, clientSecret, grant_type: 'client_credentials' }
    // 2. Hesap hareketlerini çek:
    //    GET {apiBaseUrl}/accounts/{accountIban}/transactions?fromDate=...&toDate=...
    //    Authorization: Bearer {token}
    // 3. Ham veriyi normalize et:
    //    return rawData.map(this.normalize)

    // Gerçek API entegrasyonu tamamlanana kadar boş dizi döndür.
    this.logger.warn('OpenBankingProvider henüz yapılandırılmadı. Gerçek API bilgilerini ekleyin.');
    return [];
  }

  /**
   * Bankanın döndürdüğü ham veriyi standart BankTransaction formatına çevirir.
   * Her bankanın field isimleri farklı olabilir — bu metodu uyarlayın.
   */
  private normalize(raw: any): BankTransaction {
    return {
      transactionId: raw.id || raw.transactionId || raw.referenceNumber,
      senderName: raw.debtorName || raw.senderName || raw.counterPartyName || '',
      description: raw.remittanceInformation || raw.description || raw.narrative || '',
      amount: parseFloat(raw.amount?.value || raw.amount || '0'),
      currency: raw.amount?.currency || raw.currency || 'TRY',
      transactionDate: new Date(raw.bookingDate || raw.transactionDate || raw.valueDate),
      iban: raw.debtorAccount?.iban || raw.senderIban || '',
    };
  }
}
