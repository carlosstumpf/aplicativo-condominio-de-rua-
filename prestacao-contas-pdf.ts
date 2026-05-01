/**
 * Prestação de Contas PDF Generator
 * Generates a professional financial statement PDF
 */

export interface PrestacaoContasData {
  periodo: {
    mes: string;
    dataInicio: string;
    dataFim: string;
  };
  resumo: {
    saldoAnterior: number;
    receitas: number;
    despesas: number;
    saldoAtual: number;
  };
  despesasCategoria: Array<{
    categoria: string;
    total: number;
    count: number;
  }>;
  despesas: Array<{
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    comprovante?: string;
  }>;
  cobrancas: Array<{
    id: number;
    moradorNome: string;
    valor: number;
    status: string;
    vencimento: string;
  }>;
  moradores: {
    total: number;
    emAtraso: number;
  };
}

/**
 * Format currency to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate HTML for the Prestação de Contas
 * Can be converted to PDF using tools like Puppeteer or WeasyPrint
 */
export function generatePrestacaoContasHTML(data: PrestacaoContasData): string {
  const isNegativeBalance = data.resumo.saldoAtual < 0;
  const hasDelay = data.moradores.emAtraso > 0;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prestação de Contas - ${data.periodo.mes}/2026</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background: #f5f5f5;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      margin: 20px auto;
      padding: 40px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #0a7ea4;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .date {
      font-size: 12px;
      color: #999;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #0a7ea4;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ddd;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-item {
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .summary-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .summary-value {
      font-size: 18px;
      font-weight: bold;
      color: #0a7ea4;
    }
    
    .summary-value.positive {
      color: #22c55e;
    }
    
    .summary-value.negative {
      color: #ef4444;
    }
    
    .warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #92400e;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    
    thead {
      background: #f5f5f5;
      border-bottom: 2px solid #0a7ea4;
    }
    
    th {
      padding: 10px;
      text-align: left;
      font-weight: bold;
      color: #0a7ea4;
    }
    
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    
    tbody tr:hover {
      background: #fafafa;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        background: white;
      }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="title">Prestação de Contas</div>
      <div class="subtitle">${data.periodo.mes} de 2026</div>
      <div class="date">Período: ${formatDate(data.periodo.dataInicio)} a ${formatDate(data.periodo.dataFim)}</div>
      <div class="date">Gerado em: ${formatDate(new Date().toISOString().split("T")[0])}</div>
    </div>

    <!-- Summary Section -->
    <div class="section">
      <div class="section-title">Resumo Financeiro</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Saldo Anterior</div>
          <div class="summary-value">${formatCurrency(data.resumo.saldoAnterior)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Receitas</div>
          <div class="summary-value positive">${formatCurrency(data.resumo.receitas)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Despesas</div>
          <div class="summary-value negative">-${formatCurrency(data.resumo.despesas)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Saldo Atual</div>
          <div class="summary-value ${isNegativeBalance ? "negative" : "positive"}">
            ${formatCurrency(data.resumo.saldoAtual)}
          </div>
        </div>
      </div>
    </div>

    <!-- Warning if negative balance -->
    ${
      isNegativeBalance
        ? `
    <div class="warning">
      ⚠️ Saldo negativo. Receitas insuficientes para cobrir despesas.
    </div>
    `
        : ""
    }

    <!-- Expenses by Category -->
    ${
      data.despesasCategoria && data.despesasCategoria.length > 0
        ? `
    <div class="section">
      <div class="section-title">Despesas por Categoria</div>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="text-center">Quantidade</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.despesasCategoria
            .map(
              (item) => `
          <tr>
            <td>${item.categoria}</td>
            <td class="text-center">${item.count}</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- Detailed Expenses -->
    ${
      data.despesas && data.despesas.length > 0
        ? `
    <div class="section">
      <div class="section-title">Detalhamento de Despesas</div>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th class="text-center">Data</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${data.despesas
            .map(
              (item) => `
          <tr>
            <td>${item.descricao}</td>
            <td>${item.categoria}</td>
            <td class="text-center">${formatDate(item.data)}</td>
            <td class="text-right">${formatCurrency(item.valor)}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- Charges Summary -->
    ${
      data.cobrancas && data.cobrancas.length > 0
        ? `
    <div class="section">
      <div class="section-title">Cobranças do Período</div>
      <table>
        <thead>
          <tr>
            <th>Morador</th>
            <th>Status</th>
            <th class="text-center">Vencimento</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${data.cobrancas
            .map(
              (item) => `
          <tr>
            <td>${item.moradorNome}</td>
            <td>${item.status}</td>
            <td class="text-center">${formatDate(item.vencimento)}</td>
            <td class="text-right">${formatCurrency(item.valor)}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- Residents Summary -->
    <div class="section">
      <div class="section-title">Resumo de Moradores</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Total de Moradores</div>
          <div class="summary-value">${data.moradores.total}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Em Atraso</div>
          <div class="summary-value ${hasDelay ? "negative" : "positive"}">
            ${data.moradores.emAtraso}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Documento gerado automaticamente pelo sistema de gestão de condomínio.</p>
      <p>⚠️ Versão provisória - Aguardando reconciliação bancária.</p>
    </div>
  </div>
</body>
</html>
  `;
}
