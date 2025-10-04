interface Trade {
  id: string;
  sno?: number;
  entry: string;
  reason: string;
  tp: string;
  sl: string;
  result: string;
  learning: string;
  assetPair: string;
  createdAt: string;
}

interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
}

export const calculateStats = (trades: Trade[]): TradeStats => {
  const totalTrades = trades.length;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;

  trades.forEach(trade => {
    const result = trade.result.toLowerCase();
    if (result.includes('win') || result.includes('profit')) {
      winningTrades++;
    } else if (result.includes('loss') || result.includes('lose')) {
      losingTrades++;
    } else {
      breakevenTrades++;
    }
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
  };
};

export const exportToCSV = (trades: Trade[]) => {
  const stats = calculateStats(trades);

  // CSV Headers
  const headers = [
    'S.No',
    'Asset Pair',
    'Entry',
    'Take Profit',
    'Stop Loss',
    'Result',
    'Reason',
    'Learning',
    'Date',
  ];

  // Stats rows
  const statsRows = [
    ['STATISTICS'],
    ['Total Trades', stats.totalTrades],
    ['Winning Trades', stats.winningTrades],
    ['Losing Trades', stats.losingTrades],
    ['Breakeven Trades', stats.breakevenTrades],
    ['Win Rate', `${stats.winRate.toFixed(2)}%`],
    [], // Empty row for separation
    ['TRADES DATA'],
  ];

  // Trade rows
  const tradeRows = trades.map(trade => [
    trade.sno || '',
    trade.assetPair || '',
    trade.entry || '',
    trade.tp || '',
    trade.sl || '',
    trade.result || '',
    trade.reason || '',
    trade.learning || '',
    new Date(trade.createdAt).toLocaleDateString(),
  ]);

  // Combine everything
  const allRows = [
    ...statsRows.map(row => row.join(',')),
    headers.join(','),
    ...tradeRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ];

  // Create CSV content
  const csvContent = allRows.join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `trading_journal_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (trades: Trade[]) => {
  const stats = calculateStats(trades);

  // Create a simple HTML representation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trading Journal Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #666;
          padding-bottom: 10px;
        }
        .stats {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .stat-item {
          padding: 10px;
          background: white;
          border-radius: 3px;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #333;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .export-date {
          text-align: right;
          color: #666;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>Trading Journal Export</h1>
      <div class="export-date">Exported on: ${new Date().toLocaleDateString()}</div>
      
      <div class="stats">
        <h2>Trading Statistics</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Total Trades</div>
            <div class="stat-value">${stats.totalTrades}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Winning Trades</div>
            <div class="stat-value" style="color: #22c55e;">${stats.winningTrades}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Losing Trades</div>
            <div class="stat-value" style="color: #ef4444;">${stats.losingTrades}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Breakeven Trades</div>
            <div class="stat-value">${stats.breakevenTrades}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value">${stats.winRate.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <h2>Trade History</h2>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Asset Pair</th>
            <th>Entry</th>
            <th>TP</th>
            <th>SL</th>
            <th>Result</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${trades.map(trade => `
            <tr>
              <td>${trade.sno || ''}</td>
              <td>${trade.assetPair || ''}</td>
              <td>${trade.entry || ''}</td>
              <td>${trade.tp || ''}</td>
              <td>${trade.sl || ''}</td>
              <td>${trade.result || ''}</td>
              <td>${new Date(trade.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
