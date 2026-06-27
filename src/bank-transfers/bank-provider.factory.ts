import { Injectable } from '@nestjs/common';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { IBankProvider } from './providers/bank-provider.interface';
import { MockBankProvider } from './providers/mock-bank.provider';
import { OpenBankingProvider } from './providers/open-banking.provider';

@Injectable()
export class BankProviderFactory {
  constructor(private readonly settingsService: SiteSettingsService) {}

  async getProvider(): Promise<IBankProvider> {
    const settings = await this.settingsService.getSettings();
    const ps = settings.paymentSettings || {};
    const bankConfig = ps.bankApiConfig || {};

    const provider = bankConfig.provider || 'mock';
    const mode = bankConfig.mode || 'test';

    if (provider === 'open_banking' && bankConfig.enabled && bankConfig.apiBaseUrl) {
      return new OpenBankingProvider({
        apiBaseUrl: bankConfig.apiBaseUrl,
        clientId: bankConfig.clientId || '',
        clientSecret: bankConfig.clientSecret || '',
        accountIban: ps.iban || bankConfig.accountIban || '',
        mode: mode === 'live' ? 'live' : 'test',
      });
    }

    // Varsayılan: Mock (API bilgileri girilene kadar)
    return new MockBankProvider();
  }
}
