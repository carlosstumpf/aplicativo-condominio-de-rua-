/**
 * Payment Receipt Generator
 * Generate payment receipts in multiple formats (HTML, PDF, plain text)
 */

export interface PaymentReceiptData {
  receiptId: string;
  receiptDate: Date;
  paymentDate: Date;
  
  // Payer info
  moradorId: number;
  moradorName: string;
  moradorEmail: string;
  moradorPhone?: string;
  
  // Condominium info
  condominiumName: string;
  condominiumCNPJ?: string;
  condominiumAddress?: string;
  condominiumPhone?: string;
  
  // Payment details
  billingId: number;
  billingDescription: string;
  billingDueDate: Date;
  
  amount: number;
  paymentMethod: "pix" | "boleto" | "transfer";
  transactionId?: string;
  
  // PIX specific
  pixKey?: string;
  pixQRCode?: string;
  
  // Boleto specific
  boletoBarcode?: string;
  
  // Bank transfer specific
  bankName?: string;
  bankAccount?: string;
  bankRoutingNumber?: string;
}

/**
 * Generate HTML receipt
 */
export function generateHTMLReceipt(data: PaymentReceiptData): string {
  const formattedAmount = data.amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const paymentMethodLabel = {
    pix: "PIX",
    boleto: "Boleto Bancário",
    transfer: "Transferência Bancária",
  }[data.paymentMethod];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Pagamento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0a7ea4 0%, #0a5f7a 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .info-label {
      color: #666;
      font-weight: 500;
    }
    .info-value {
      color: #333;
      font-weight: 600;
    }
    .amount-box {
      background: #f0f9ff;
      border-left: 4px solid #0a7ea4;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .amount-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: 700;
      color: #0a7ea4;
    }
    .status-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px 30px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Pagamento Confirmado</h1>
      <p>Recibo de Pagamento</p>
    </div>
    
    <div class="content">
      <!-- Condominium Info -->
      <div class="section">
        <div class="section-title">Condomínio</div>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${data.condominiumName}</span>
        </div>
        ${data.condominiumCNPJ ? `
        <div class="info-row">
          <span class="info-label">CNPJ:</span>
          <span class="info-value">${data.condominiumCNPJ}</span>
        </div>
        ` : ""}
      </div>

      <!-- Payer Info -->
      <div class="section">
        <div class="section-title">Morador</div>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${data.moradorName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.moradorEmail}</span>
        </div>
      </div>

      <!-- Payment Details -->
      <div class="section">
        <div class="section-title">Detalhes do Pagamento</div>
        <div class="info-row">
          <span class="info-label">Descrição:</span>
          <span class="info-value">${data.billingDescription}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vencimento:</span>
          <span class="info-value">${data.billingDueDate.toLocaleDateString("pt-BR")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Método:</span>
          <span class="info-value">${paymentMethodLabel}</span>
        </div>
        ${data.transactionId ? `
        <div class="info-row">
          <span class="info-label">Transação:</span>
          <span class="info-value">${data.transactionId}</span>
        </div>
        ` : ""}
      </div>

      <!-- Amount -->
      <div class="amount-box">
        <div class="amount-label">Valor Pago</div>
        <div class="amount-value">${formattedAmount}</div>
        <div class="status-badge">Pago</div>
      </div>

      <!-- Receipt Info -->
      <div class="section">
        <div class="section-title">Recibo</div>
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${data.receiptId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.receiptDate.toLocaleDateString("pt-BR")} às ${data.receiptDate.toLocaleTimeString("pt-BR")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data do Pagamento:</span>
          <span class="info-value">${data.paymentDate.toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Este é um recibo automático gerado pelo sistema de gestão do condomínio.</p>
      <p>Guarde este comprovante para sua segurança.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text receipt
 */
export function generatePlainTextReceipt(data: PaymentReceiptData): string {
  const formattedAmount = data.amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const paymentMethodLabel = {
    pix: "PIX",
    boleto: "Boleto Bancário",
    transfer: "Transferência Bancária",
  }[data.paymentMethod];

  return `
RECIBO DE PAGAMENTO
═══════════════════════════════════════════════════════════

✓ PAGAMENTO CONFIRMADO

CONDOMÍNIO
───────────────────────────────────────────────────────────
Nome: ${data.condominiumName}
${data.condominiumCNPJ ? `CNPJ: ${data.condominiumCNPJ}` : ""}

MORADOR
───────────────────────────────────────────────────────────
Nome: ${data.moradorName}
Email: ${data.moradorEmail}

DETALHES DO PAGAMENTO
───────────────────────────────────────────────────────────
Descrição: ${data.billingDescription}
Vencimento: ${data.billingDueDate.toLocaleDateString("pt-BR")}
Método: ${paymentMethodLabel}
${data.transactionId ? `Transação: ${data.transactionId}` : ""}

VALOR PAGO
───────────────────────────────────────────────────────────
${formattedAmount}

RECIBO
───────────────────────────────────────────────────────────
Número: ${data.receiptId}
Data: ${data.receiptDate.toLocaleDateString("pt-BR")} às ${data.receiptDate.toLocaleTimeString("pt-BR")}
Data do Pagamento: ${data.paymentDate.toLocaleDateString("pt-BR")}

═══════════════════════════════════════════════════════════
Este é um recibo automático gerado pelo sistema de gestão do condomínio.
Guarde este comprovante para sua segurança.
  `;
}

/**
 * Generate receipt ID
 */
export function generateReceiptId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${timestamp}-${random}`;
}

/**
 * Format payment receipt data for display
 */
export function formatReceiptData(data: PaymentReceiptData): {
  receiptId: string;
  receiptDate: string;
  paymentDate: string;
  moradorName: string;
  amount: string;
  billingDescription: string;
  paymentMethod: string;
} {
  const paymentMethodLabel = {
    pix: "PIX",
    boleto: "Boleto Bancário",
    transfer: "Transferência Bancária",
  }[data.paymentMethod];

  return {
    receiptId: data.receiptId,
    receiptDate: data.receiptDate.toLocaleDateString("pt-BR"),
    paymentDate: data.paymentDate.toLocaleDateString("pt-BR"),
    moradorName: data.moradorName,
    amount: data.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    billingDescription: data.billingDescription,
    paymentMethod: paymentMethodLabel,
  };
}
