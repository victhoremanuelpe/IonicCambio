// tab2.page.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HistoryService } from '../services/history.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  amount: number = 1;
  fromCurrency: string = 'USD';
  toCurrency: string = 'BRL';
  exchangeRateText: string = 'Buscando taxa de câmbio...';
  currencyList: { code: string; name: string }[] = [];
  countryList: { [key: string]: string } = {};
  isOffline: boolean = false;

  private readonly CACHE_KEY = 'exchange_rates';
  private cacheDuration: number = 24 * 60 * 60 * 1000; // Default value

  private readonly API_KEY = 'edda2920959129d8973cce67';

  constructor(
    private http: HttpClient,
    private historyService: HistoryService,
    private storage: Storage
  ) {
    this.initStorage();
    this.loadCacheDuration();
  }

  async initStorage() {
    await this.storage.create();
  }

  async loadCacheDuration() {
    const duration = await this.storage.get('CACHE_DURATION');
    if (duration) {
      this.cacheDuration = duration;
    }
  }

  async ngOnInit() {
    // Load default currencies
    const defaultFromCurrency = await this.storage.get('DEFAULT_FROM_CURRENCY');
    const defaultToCurrency = await this.storage.get('DEFAULT_TO_CURRENCY');

    if (defaultFromCurrency) {
      this.fromCurrency = defaultFromCurrency;
    }
    if (defaultToCurrency) {
      this.toCurrency = defaultToCurrency;
    }

    this.loadCurrencies();
    this.loadCountryList();
    this.getExchangeRate();
  }

  loadCurrencies() {
    this.http.get<{ [key: string]: string }>('/assets/currencies.json').subscribe((data) => {
      this.currencyList = Object.entries(data).map(([code, name]) => ({
        code,
        name,
      }));
    });
  }

  loadCountryList() {
    this.http.get<{ [key: string]: string }>('/assets/country-list.json').subscribe(
      (data) => {
        this.countryList = data;
      },
      (error) => {
        console.error('Erro ao carregar a lista de países:', error);
      }
    );
  }

  getFlag(currencyCode: string): string {
    const country = this.countryList[currencyCode];
    if (country) {
      return `https://flagcdn.com/48x36/${country.toLowerCase()}.png`;
    }
    return '';
  }

  loadFlag(currencyCode: string): void {
    const country = this.countryList[currencyCode];
    if (country) {
      console.log(`A bandeira para ${currencyCode} é: https://flagsapi.com/${country.toLowerCase()}/shiny/64.png`);
    }
  }

  swapCurrencies(): void {
    [this.fromCurrency, this.toCurrency] = [this.toCurrency, this.fromCurrency];
    this.getExchangeRate();
  }

  async getCachedRates(fromCurrency: string): Promise<any> {
    const cachedData = await this.storage.get(this.CACHE_KEY + '_' + fromCurrency);
    if (cachedData) {
      const now = Date.now();
      if (now - cachedData.timestamp < this.cacheDuration) {
        return cachedData.rates;
      }
    }
    return null;
  }

  async saveRatesToCache(fromCurrency: string, rates: any) {
    const cacheData = {
      rates: rates,
      timestamp: Date.now()
    };
    await this.storage.set(this.CACHE_KEY + '_' + fromCurrency, cacheData);
  }

  async getExchangeRate(event?: Event) {
    if (event) event.preventDefault();
    this.exchangeRateText = 'Buscando taxa de câmbio...';

    try {
      // Primeiro tenta buscar do cache
      const cachedRates = await this.getCachedRates(this.fromCurrency);

      if (cachedRates) {
        // Usa dados do cache
        const rate = cachedRates.conversion_rates[this.toCurrency];
        const conversion = `${this.amount} ${this.fromCurrency} = ${(this.amount * rate).toFixed(2)} ${this.toCurrency}`;
        this.exchangeRateText = conversion;
        this.historyService.addConversion(conversion);
        this.isOffline = true;
        return;
      }

      // Se não tem cache, busca da API
      const url = `https://v6.exchangerate-api.com/v6/${this.API_KEY}/latest/${this.fromCurrency}`;
      this.http.get<any>(url).subscribe(
        async (result) => {
          // Salva os novos dados no cache
          await this.saveRatesToCache(this.fromCurrency, result);

          const rate = result.conversion_rates[this.toCurrency];
          const conversion = `${this.amount} ${this.fromCurrency} = ${(this.amount * rate).toFixed(2)} ${this.toCurrency}`;
          this.exchangeRateText = conversion;
          this.historyService.addConversion(conversion);
          this.isOffline = false;
        },
        async (error) => {
          // Em caso de erro, tenta usar o último cache disponível mesmo que expirado
          const lastKnownRates = await this.storage.get(this.CACHE_KEY + '_' + this.fromCurrency);
          if (lastKnownRates) {
            const rate = lastKnownRates.rates.conversion_rates[this.toCurrency];
            const conversion = `${this.amount} ${this.fromCurrency} = ${(this.amount * rate).toFixed(2)} ${this.toCurrency}`;
            this.exchangeRateText = conversion + ' (último dado disponível)';
            this.historyService.addConversion(conversion);
            this.isOffline = true;
          } else {
            this.exchangeRateText = 'Algo deu errado e não há dados salvos';
            this.isOffline = true;
          }
        }
      );
    } catch (error) {
      this.exchangeRateText = 'Erro ao processar a conversão';
      this.isOffline = true;
    }
  }
}
