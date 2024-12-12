import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private storageKey: string = 'conversionHistory';
  private maxHistorySize: number = 15;

  constructor() {
    const savedHistory = localStorage.getItem(this.storageKey);
    if (savedHistory) {
      this.conversionHistory = JSON.parse(savedHistory);
    }
  }

  private conversionHistory: { conversion: string; timestamp: string }[] = [];

  addConversion(conversion: string): void {
    const timestamp = new Date().toLocaleString();
    this.conversionHistory.unshift({ conversion, timestamp });

    if (this.conversionHistory.length > this.maxHistorySize) {
      this.conversionHistory.pop();
    }

    this.saveHistoryToLocalStorage();
  }

  getHistory(): { conversion: string; timestamp: string }[] {
    return this.conversionHistory;
  }

  deleteHistoryItem(index: number): void {
    this.conversionHistory.splice(index, 1);
    this.saveHistoryToLocalStorage();
  }


  private saveHistoryToLocalStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.conversionHistory));
  }
}
