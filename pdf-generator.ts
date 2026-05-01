import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

export interface MoradorInadimplente {
  id: number;
  nome: string;
  casa: string;
  bloco?: string;
  telefone: string;
  email: string;
  totalDevido: number;
  cobrancasVencidas: number;
  diasAtraso: number;
  ultimoPagamento?: string;
  dataCadastro: string;
}

export interface RelatorioInadimplentesData {
  condominioNome: string;
  dataGeracao: string;
  moradores: MoradorInadimplente[];
  totalMoradores: number;
  totalDevido: number;
  geradoPor: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    fontSize: 10,
    color: "#555",
  },
  summaryBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    fontSize: 11,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    color: "#fff",
    padding: 8,
    fontWeight: "bold",
    fontSize: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 8,
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    padding: 5,
  },
  tableRowAlternate: {
    backgroundColor: "#f9f9f9",
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    fontSize: 9,
    color: "#666",
    textAlign: "center",
  },
  riskHigh: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  riskMedium: {
    color: "#f57c00",
    fontWeight: "bold",
  },
  currency: {
    textAlign: "right",
  },
  center: {
    textAlign: "center",
  },
});

export function generateInadimplentesPDF(data: RelatorioInadimplentesData) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getRiskLevel = (diasAtraso: number) => {
    if (diasAtraso > 30) return "ALTO";
    if (diasAtraso > 15) return "MÉDIO";
    return "BAIXO";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.condominioNome}</Text>
          <Text style={styles.subtitle}>Relatório de Moradores Inadimplentes</Text>
          <View style={styles.infoRow}>
            <Text>Data de Geração: {formatDate(data.dataGeracao)}</Text>
            <Text>Gerado por: {data.geradoPor}</Text>
          </View>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Resumo Executivo</Text>
          <View style={styles.summaryRow}>
            <Text>Total de Moradores Inadimplentes:</Text>
            <Text style={{ fontWeight: "bold" }}>{data.totalMoradores}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Valor Total em Atraso:</Text>
            <Text style={{ fontWeight: "bold" }}>{formatCurrency(data.totalDevido)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Média por Morador:</Text>
            <Text style={{ fontWeight: "bold" }}>
              {formatCurrency(data.totalDevido / data.totalMoradores)}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Morador</Text>
            <Text style={styles.tableHeaderCell}>Casa</Text>
            <Text style={styles.tableHeaderCell}>Valor Devido</Text>
            <Text style={styles.tableHeaderCell}>Dias Atraso</Text>
            <Text style={styles.tableHeaderCell}>Risco</Text>
          </View>

          {data.moradores.map((morador, index) => (
            <View
              key={morador.id}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlternate]}
            >
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{morador.nome}</Text>
              <Text style={styles.tableCell}>
                {morador.casa}
                {morador.bloco && ` / ${morador.bloco}`}
              </Text>
              <Text style={[styles.tableCell, styles.currency]}>
                {formatCurrency(morador.totalDevido)}
              </Text>
              <Text style={[styles.tableCell, styles.center]}>{morador.diasAtraso}</Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.center,
                  getRiskLevel(morador.diasAtraso) === "ALTO"
                    ? styles.riskHigh
                    : getRiskLevel(morador.diasAtraso) === "MÉDIO"
                      ? styles.riskMedium
                      : {},
                ]}
              >
                {getRiskLevel(morador.diasAtraso)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Este relatório foi gerado automaticamente pelo sistema de gestão de condomínio.</Text>
          <Text>Para mais informações, entre em contato com a administração.</Text>
        </View>
      </Page>
    </Document>
  );
}

export function generateDetalhePDFContent(data: RelatorioInadimplentesData): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getRiskLevel = (diasAtraso: number) => {
    if (diasAtraso > 30) return "ALTO";
    if (diasAtraso > 15) return "MÉDIO";
    return "BAIXO";
  };

  let html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Inadimplentes</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          color: #1a1a1a;
          font-size: 24px;
        }
        .header h2 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 16px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #555;
        }
        .summary-box {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .summary-box h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #1a1a1a;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 20px;
        }
        thead {
          background-color: #003366;
          color: white;
        }
        th {
          padding: 8px;
          text-align: left;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 2px solid #000;
        }
        td {
          padding: 8px;
          font-size: 10px;
          border-bottom: 1px solid #ddd;
        }
        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .currency {
          text-align: right;
        }
        .center {
          text-align: center;
        }
        .risk-high {
          color: #d32f2f;
          font-weight: bold;
        }
        .risk-medium {
          color: #f57c00;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 9px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.condominioNome}</h1>
          <h2>Relatório de Moradores Inadimplentes</h2>
          <div class="info-row">
            <span>Data de Geração: ${formatDate(data.dataGeracao)}</span>
            <span>Gerado por: ${data.geradoPor}</span>
          </div>
        </div>

        <div class="summary-box">
          <h3>Resumo Executivo</h3>
          <div class="summary-row">
            <span>Total de Moradores Inadimplentes:</span>
            <strong>${data.totalMoradores}</strong>
          </div>
          <div class="summary-row">
            <span>Valor Total em Atraso:</span>
            <strong>${formatCurrency(data.totalDevido)}</strong>
          </div>
          <div class="summary-row">
            <span>Média por Morador:</span>
            <strong>${formatCurrency(data.totalDevido / data.totalMoradores)}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="flex: 1.5">Morador</th>
              <th>Casa</th>
              <th>Telefone</th>
              <th>Email</th>
              <th class="currency">Valor Devido</th>
              <th class="center">Dias Atraso</th>
              <th class="center">Risco</th>
            </tr>
          </thead>
          <tbody>
            ${data.moradores
              .map(
                (morador) => `
              <tr>
                <td>${morador.nome}</td>
                <td>${morador.casa}${morador.bloco ? ` / ${morador.bloco}` : ""}</td>
                <td>${morador.telefone}</td>
                <td>${morador.email}</td>
                <td class="currency">${formatCurrency(morador.totalDevido)}</td>
                <td class="center">${morador.diasAtraso}</td>
                <td class="center ${getRiskLevel(morador.diasAtraso) === "ALTO" ? "risk-high" : getRiskLevel(morador.diasAtraso) === "MÉDIO" ? "risk-medium" : ""}">
                  ${getRiskLevel(morador.diasAtraso)}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Este relatório foi gerado automaticamente pelo sistema de gestão de condomínio.</p>
          <p>Para mais informações, entre em contato com a administração.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function generateInadimplentesPDFHTML(data: RelatorioInadimplentesData): string {
  return generateDetalhePDFContent(data);
}
