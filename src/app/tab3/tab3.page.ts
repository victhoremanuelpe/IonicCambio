// tab3.page.ts
import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit {
  cacheDuration: number = 24 * 60 * 60 * 1000; // Default 1 day in milliseconds
  currentSelection: string = '1day';
  currencyList: { code: string; name: string }[] = [];
  defaultFromCurrency: string = 'USD';
  defaultToCurrency: string = 'BRL';
  countryList: { [key: string]: string } = {};
  isLoading: boolean = true;

  constructor(
    private storage: Storage,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    try {
      this.isLoading = true;
      await this.initStorage();
      await this.loadCacheDuration();
      await this.loadDefaultCurrencies();
      await this.loadCurrencies();
      await this.loadCountryList();
    } finally {
      this.isLoading = false;
    }
  }

  private async initStorage() {
    await this.storage.create();
  }

  async loadCurrencies() {
    return new Promise<void>((resolve) => {
      this.http.get<{ [key: string]: string }>('assets/currencies.json').subscribe({
        next: (data) => {
          this.currencyList = Object.entries(data).map(([code, name]) => ({
            code,
            name,
          }));
          console.log('Currencies loaded:', this.currencyList.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading currencies:', error);
          resolve();
        }
      });
    });
  }

  loadCountryList() {
    return new Promise<void>((resolve) => {
      this.http.get<{ [key: string]: string }>('assets/country-list.json').subscribe({
        next: (data) => {
          this.countryList = data;
          console.log('Countries loaded:', Object.keys(this.countryList).length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading country list:', error);
          resolve();
        }
      });
    });
  }

  getFlag(currencyCode: string): string {
    const country = this.countryList[currencyCode];
    if (country) {
      return `https://flagcdn.com/48x36/${country.toLowerCase()}.png`;
    }
    return '';
  }

  async loadCacheDuration() {
    const savedDuration = await this.storage.get('CACHE_DURATION');
    if (savedDuration) {
      this.cacheDuration = savedDuration;
      if (savedDuration === 24 * 60 * 60 * 1000) {
        this.currentSelection = '1day';
      } else if (savedDuration === 7 * 24 * 60 * 60 * 1000) {
        this.currentSelection = '1week';
      } else if (savedDuration === 30 * 24 * 60 * 60 * 1000) {
        this.currentSelection = '1month';
      }
    }
  }

  async loadDefaultCurrencies() {
    const fromCurrency = await this.storage.get('DEFAULT_FROM_CURRENCY');
    const toCurrency = await this.storage.get('DEFAULT_TO_CURRENCY');

    if (fromCurrency) {
      this.defaultFromCurrency = fromCurrency;
    }
    if (toCurrency) {
      this.defaultToCurrency = toCurrency;
    }
  }

  async updateCacheDuration(event: any) {
    const selection = event.detail.value;
    let duration: number;

    switch (selection) {
      case '1day':
        duration = 24 * 60 * 60 * 1000;
        break;
      case '1week':
        duration = 7 * 24 * 60 * 60 * 1000;
        break;
      case '1month':
        duration = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        duration = 24 * 60 * 60 * 1000;
    }

    this.cacheDuration = duration;
    await this.storage.set('CACHE_DURATION', duration);

    // Clear existing cache when duration changes
    const keys = await this.storage.keys();
    for (const key of keys) {
      if (key.startsWith('exchange_rates_')) {
        await this.storage.remove(key);
      }
    }
  }

  async updateDefaultFromCurrency(event: any) {
    const currency = event.detail.value;
    this.defaultFromCurrency = currency;
    await this.storage.set('DEFAULT_FROM_CURRENCY', currency);
  }

  async updateDefaultToCurrency(event: any) {
    const currency = event.detail.value;
    this.defaultToCurrency = currency;
    await this.storage.set('DEFAULT_TO_CURRENCY', currency);
  }
}
