# Webhook CSV Export - Quick Start Guide

## What is CSV Export?

CSV Export lets you download webhook data as a spreadsheet file for analysis in Excel, Google Sheets, or other tools.

## Quick Start

### 1. Search for Webhooks

1. Go to **Webhooks** tab
2. Tap **Webhook History**
3. Search for payment ID or customer ID
4. Results appear with export button

### 2. Export Results

1. Tap **📥 Exportar CSV** button
2. Choose export options (optional):
   - Date format (ISO, BR, US)
   - Delimiter (comma, semicolon)
   - Include error messages
3. Tap **Exportar CSV**
4. File downloads automatically

### 3. Open in Excel

1. Open downloaded CSV file
2. Excel auto-detects format
3. Data appears in columns
4. Ready for analysis

## Common Tasks

### Export Payment Webhooks

1. Search: `pay_123`
2. Results show all webhooks for that payment
3. Tap **📥 Exportar CSV**
4. File downloads

### Export Failed Webhooks

1. Search: `pay_` (shows all)
2. Look for red "✗ Falhou" status
3. Tap **📥 Exportar CSV**
4. File contains only search results

### Export for Analysis

1. Search: `cust_456`
2. Tap **📥 Exportar CSV**
3. Choose **Ponto-vírgula** (;) for European Excel
4. Choose **BR** for Brazilian date format
5. Tap **Exportar CSV**

## Export Options

### Date Format

| Format | Example |
|--------|---------|
| ISO | 2026-04-27T10:00:00Z |
| BR | 27/04/2026 10:00 |
| US | 4/27/2026 10:00 AM |

**Tip**: Use BR format if opening in European Excel

### Delimiter

| Delimiter | Use |
|-----------|-----|
| Vírgula (,) | US/UK Excel |
| Ponto-vírgula (;) | European Excel |
| Tab | Data analysis tools |

**Tip**: Use semicolon for European systems

### Include Error Messages

- ✓ **Sim** - Shows why webhooks failed (recommended)
- ✗ **Não** - Smaller file, less detail

## CSV Columns

| Column | Meaning |
|--------|---------|
| ID | Webhook record number |
| Evento | What happened (payment.received, etc.) |
| ID Pagamento | Payment ID from Asaas |
| ID Cliente | Customer ID from Asaas |
| Status | Current status |
| Resultado | Success ✓ or Failed ✗ |
| Recebido em | When received |
| Processado em | When processed |
| Mensagem de Erro | Error details (if failed) |

## Example Workflow

### Find Failed Payments

1. Search: `pay_`
2. See results with statuses
3. Tap **📥 Exportar CSV**
4. Choose options:
   - Date: **BR** (Brazilian)
   - Delimiter: **Ponto-vírgula** (;)
   - Include errors: **Sim** (Yes)
5. Tap **Exportar CSV**
6. File: `webhooks_2026-04-27.csv`

### Open in Excel

1. Open Excel
2. File → Open → Select CSV file
3. Data imports automatically
4. Columns appear:
   - A: ID
   - B: Evento
   - C: ID Pagamento
   - D: ID Cliente
   - E: Status
   - F: Resultado
   - G: Recebido em
   - H: Processado em
   - I: Mensagem de Erro

### Analyze Data

1. Sort by "Resultado" to see failures
2. Filter by "Evento" to see specific types
3. Group by "Status" to count
4. Create charts for visualization

## Tips & Tricks

### 1. Preview Before Export

Large exports take longer. Search first to see count.

### 2. Use Partial IDs

- `pay_` → All payments
- `cust_` → All customers
- `123` → Anything with "123"

### 3. Choose Right Delimiter

- **Comma (,)**: US/UK systems
- **Semicolon (;)**: Europe, Brazil
- **Tab**: Data analysis

### 4. Include Error Messages

Always include errors to understand failures:

```
Error: Invalid payload JSON
Error: Timeout
Error: Rate limit exceeded
```

### 5. Use Date Format

- **ISO**: International standard, always works
- **BR**: Familiar for Brazilian users
- **US**: For US systems

## Troubleshooting

### "No results found"

**Cause**: Search didn't find webhooks.

**Solution**:
1. Check payment/customer ID
2. Try partial ID (e.g., `pay_`)
3. Verify ID exists in Asaas

### Export button disabled

**Cause**: No search results.

**Solution**:
1. Perform a search first
2. Wait for results to load
3. Try different search term

### File won't open in Excel

**Cause**: Wrong delimiter or encoding.

**Solution**:
1. Try different delimiter (semicolon for Europe)
2. Open in text editor first
3. Check file isn't corrupted
4. Try importing as CSV

### Date format wrong

**Cause**: Excel locale mismatch.

**Solution**:
1. Choose **BR** format for Brazil
2. Choose **US** format for US
3. Format column in Excel manually
4. Use ISO format for compatibility

### Special characters broken

**Cause**: Encoding issue.

**Solution**:
1. Ensure file is UTF-8
2. Try different delimiter
3. Open in text editor
4. Check system locale

## File Size

| Records | File Size |
|---------|-----------|
| 10 | ~1 KB |
| 100 | ~10 KB |
| 1000 | ~50 KB |
| 5000 | ~250 KB |

**Tip**: Use date filters to reduce file size

## Security

- Only admins can export
- Files contain payment IDs (keep secure)
- Don't share files with sensitive data
- Delete files after use

## Next Steps

- [Full Documentation](./docs/WEBHOOK_CSV_EXPORT.md)
- [Webhook Search](./WEBHOOK_SEARCH_QUICKSTART.md)
- [Webhook Dashboard](./WEBHOOK_ADMIN_QUICKSTART.md)

## Need Help?

- Check error message in app
- Read [Full Documentation](./docs/WEBHOOK_CSV_EXPORT.md)
- Contact support with webhook ID
