/**
 * Batch Billing CSV Import
 * Parse and import billing data from CSV files
 */

export interface CSVBillingRow {
  moradorId: string;
  moradorName: string;
  email: string;
  amount: string;
  dueDate: string;
  description: string;
}

export interface CSVImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  data: CSVBillingRow[];
}

/**
 * Parse CSV content
 */
export function parseCSVContent(content: string): CSVImportResult {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const result: CSVImportResult = {
    totalRows: lines.length - 1, // Exclude header
    validRows: 0,
    invalidRows: 0,
    errors: [],
    data: [],
  };

  if (lines.length < 2) {
    result.errors.push({
      row: 0,
      error: "CSV deve conter cabeçalho e pelo menos uma linha de dados",
    });
    return result;
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredColumns = ["moradorid", "moradorname", "email", "amount", "duedate", "description"];

  const missingColumns = requiredColumns.filter((col) => !header.includes(col));
  if (missingColumns.length > 0) {
    result.errors.push({
      row: 0,
      error: `Colunas obrigatórias ausentes: ${missingColumns.join(", ")}`,
    });
    return result;
  }

  // Get column indices
  const columnIndices = {
    moradorId: header.indexOf("moradorid"),
    moradorName: header.indexOf("moradorname"),
    email: header.indexOf("email"),
    amount: header.indexOf("amount"),
    dueDate: header.indexOf("duedate"),
    description: header.indexOf("description"),
  };

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((cell) => cell.trim());

    try {
      const billingRow: CSVBillingRow = {
        moradorId: row[columnIndices.moradorId],
        moradorName: row[columnIndices.moradorName],
        email: row[columnIndices.email],
        amount: row[columnIndices.amount],
        dueDate: row[columnIndices.dueDate],
        description: row[columnIndices.description],
      };

      // Validate row
      const validation = validateBillingRow(billingRow, i + 1);
      if (validation.valid) {
        result.data.push(billingRow);
        result.validRows++;
      } else {
        result.invalidRows++;
        result.errors.push({
          row: i + 1,
          error: validation.error || "Erro desconhecido",
        });
      }
    } catch (error) {
      result.invalidRows++;
      result.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Erro ao processar linha",
      });
    }
  }

  return result;
}

/**
 * Validate billing row
 */
function validateBillingRow(
  row: CSVBillingRow,
  rowNumber: number
): { valid: boolean; error?: string } {
  // Validate morador ID
  if (!row.moradorId || isNaN(parseInt(row.moradorId))) {
    return { valid: false, error: "ID do morador inválido" };
  }

  // Validate morador name
  if (!row.moradorName || row.moradorName.length === 0) {
    return { valid: false, error: "Nome do morador é obrigatório" };
  }

  // Validate email
  if (!row.email || !isValidEmail(row.email)) {
    return { valid: false, error: "Email inválido" };
  }

  // Validate amount
  const amount = parseFloat(row.amount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Valor deve ser um número maior que zero" };
  }

  // Validate due date
  const dueDate = new Date(row.dueDate);
  if (isNaN(dueDate.getTime())) {
    return { valid: false, error: "Data de vencimento inválida (use formato YYYY-MM-DD)" };
  }

  if (dueDate < new Date()) {
    return { valid: false, error: "Data de vencimento deve ser no futuro" };
  }

  // Validate description
  if (!row.description || row.description.length === 0) {
    return { valid: false, error: "Descrição é obrigatória" };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = ["moradorId", "moradorName", "email", "amount", "dueDate", "description"];
  const exampleRows = [
    ["1", "João Silva", "joao@example.com", "500.00", "2026-05-31", "Taxa de maio"],
    ["2", "Maria Santos", "maria@example.com", "500.00", "2026-05-31", "Taxa de maio"],
    ["3", "Pedro Oliveira", "pedro@example.com", "500.00", "2026-05-31", "Taxa de maio"],
  ];

  let csv = headers.join(",") + "\n";
  exampleRows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  return csv;
}

/**
 * Export import results to CSV
 */
export function exportImportResultsToCSV(result: CSVImportResult): string {
  let csv = "Resultado da Importação\n\n";
  csv += `Total de linhas,${result.totalRows}\n`;
  csv += `Linhas válidas,${result.validRows}\n`;
  csv += `Linhas inválidas,${result.invalidRows}\n\n`;

  if (result.errors.length > 0) {
    csv += "Erros\n";
    csv += "Linha,Erro\n";
    result.errors.forEach((err) => {
      csv += `${err.row},"${err.error}"\n`;
    });
    csv += "\n";
  }

  if (result.validRows > 0) {
    csv += "Dados Válidos\n";
    csv += "ID do Morador,Nome,Email,Valor,Vencimento,Descrição\n";
    result.data.forEach((row) => {
      csv += `${row.moradorId},"${row.moradorName}","${row.email}",${row.amount},${row.dueDate},"${row.description}"\n`;
    });
  }

  return csv;
}

/**
 * Format CSV import result for display
 */
export function formatCSVImportResult(result: CSVImportResult): string {
  let message = `Importação de CSV\n\n`;
  message += `Total de linhas: ${result.totalRows}\n`;
  message += `✓ Válidas: ${result.validRows}\n`;
  message += `✗ Inválidas: ${result.invalidRows}\n`;

  if (result.errors.length > 0) {
    message += `\nErros encontrados:\n`;
    result.errors.slice(0, 5).forEach((err) => {
      message += `  Linha ${err.row}: ${err.error}\n`;
    });
    if (result.errors.length > 5) {
      message += `  ... e ${result.errors.length - 5} mais\n`;
    }
  }

  return message;
}
