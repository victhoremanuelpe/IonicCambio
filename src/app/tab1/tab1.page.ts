import { Component, OnInit } from '@angular/core';
import { HistoryService } from '../services/history.service';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss']
})
export class Tab1Page implements OnInit {
  conversionHistory: { conversion: string; timestamp: string }[] = [];

  constructor( private historyService: HistoryService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.conversionHistory = this.historyService.getHistory();
  }

  deleteHistoryItem(index: number): void {
    this.historyService.deleteHistoryItem(index);
    this.loadHistory();
  }
}
