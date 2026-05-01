/**
 * Webhook Export Button Component
 * Export webhook search results to CSV
 */

import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface WebhookExportData {
  id: number;
  event: string;
  asaasPaymentId: string;
  asaasCustomerId?: string;
  status: string;
  success: number;
  errorMessage?: string;
  receivedAt: Date;
  processedAt: Date;
}

interface WebhookExportButtonProps {
  /**
   * Data to export
   */
  data: WebhookExportData[];
  /**
   * Callback when export is complete
   */
  onExportComplete?: (filename: string) => void;
  /**
   * Callback on error
   */
  onError?: (error: string) => void;
  /**
   * Button text
   */
  label?: string;
  /**
   * Show as compact button
   */
  compact?: boolean;
  /**
   * Disable button
   */
  disabled?: boolean;
}

/**
 * Export button for webhook data
 */
export function WebhookExportButton({
  data,
  onExportComplete,
  onError,
  label = "📥 Exportar CSV",
  compact = false,
  disabled = false,
}: WebhookExportButtonProps) {
  const colors = useColors();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (data.length === 0) {
      onError?.("Nenhum dado para exportar");
      return;
    }

    setIsExporting(true);

    try {
      // Generate CSV content
      const csv = generateCSV(data);

      // Create blob
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      // Generate filename
      const filename = `webhooks_${new Date().toISOString().split("T")[0]}.csv`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportComplete?.(filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao exportar";
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    return (
      <Pressable
        onPress={handleExport}
        disabled={disabled || isExporting || data.length === 0}
        style={({ pressed }) => ({
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: disabled || data.length === 0 ? colors.border : colors.primary,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "white",
            }}
          >
            📥
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handleExport}
      disabled={disabled || isExporting || data.length === 0}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: disabled || data.length === 0 ? colors.border : colors.primary,
        alignItems: "center",
        gap: 8,
        flexDirection: "row",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {isExporting ? (
        <>
          <ActivityIndicator size="small" color="white" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "white",
            }}
          >
            Exportando...
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 16 }}>📥</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "white",
            }}
          >
            {label}
          </Text>
          {data.length > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              ({data.length})
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}

/**
 * Export options modal/sheet
 */
interface WebhookExportOptionsProps {
  /**
   * Data to export
   */
  data: WebhookExportData[];
  /**
   * Callback when export is complete
   */
  onExportComplete?: (filename: string) => void;
  /**
   * Callback on error
   */
  onError?: (error: string) => void;
  /**
   * Callback to close modal
   */
  onClose?: () => void;
}

export function WebhookExportOptions({
  data,
  onExportComplete,
  onError,
  onClose,
}: WebhookExportOptionsProps) {
  const colors = useColors();
  const [dateFormat, setDateFormat] = useState<"ISO" | "BR" | "US">("ISO");
  const [delimiter, setDelimiter] = useState<"," | ";">(";");
  const [includeErrors, setIncludeErrors] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const csv = generateCSVWithOptions(data, {
        dateFormat,
        delimiter,
        includeErrors,
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const filename = `webhooks_${new Date().toISOString().split("T")[0]}.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportComplete?.(filename);
      onClose?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao exportar";
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View
      style={{
        gap: 16,
        padding: 16,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.foreground,
        }}
      >
        Opções de Exportação
      </Text>

      {/* Date Format */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: colors.foreground,
          }}
        >
          Formato de Data
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["ISO", "BR", "US"] as const).map((format) => (
            <Pressable
              key={format}
              onPress={() => setDateFormat(format)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: dateFormat === format ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: dateFormat === format ? colors.primary : colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: dateFormat === format ? "white" : colors.foreground,
                }}
              >
                {format}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Delimiter */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: colors.foreground,
          }}
        >
          Separador
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([",", ";"] as const).map((delim) => (
            <Pressable
              key={delim}
              onPress={() => setDelimiter(delim)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: delimiter === delim ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: delimiter === delim ? colors.primary : colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: delimiter === delim ? "white" : colors.foreground,
                }}
              >
                {delim === "," ? "Vírgula" : "Ponto-vírgula"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Include Errors */}
      <Pressable
        onPress={() => setIncludeErrors(!includeErrors)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: includeErrors ? colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {includeErrors && (
            <Text style={{ fontSize: 12, color: "white", fontWeight: "bold" }}>✓</Text>
          )}
        </View>
        <Text
          style={{
            fontSize: 13,
            color: colors.foreground,
          }}
        >
          Incluir Mensagens de Erro
        </Text>
      </Pressable>

      {/* Export Button */}
      <Pressable
        onPress={handleExport}
        disabled={isExporting}
        style={({ pressed }) => ({
          paddingVertical: 12,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "white",
            }}
          >
            📥 Exportar CSV
          </Text>
        )}
      </Pressable>

      {/* Cancel Button */}
      <Pressable
        onPress={onClose}
        disabled={isExporting}
        style={({ pressed }) => ({
          paddingVertical: 12,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Cancelar
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Generate CSV from webhook data
 */
function generateCSV(data: WebhookExportData[]): string {
  const headers = [
    "ID",
    "Evento",
    "ID Pagamento",
    "ID Cliente",
    "Status",
    "Resultado",
    "Recebido em",
    "Processado em",
    "Mensagem de Erro",
  ];

  const rows = data.map((record) => [
    record.id.toString(),
    record.event,
    record.asaasPaymentId,
    record.asaasCustomerId || "",
    record.status,
    record.success === 1 ? "Sucesso" : "Falhou",
    new Date(record.receivedAt).toISOString(),
    new Date(record.processedAt).toISOString(),
    record.errorMessage || "",
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(";"),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  return csvContent;
}

/**
 * Generate CSV with custom options
 */
function generateCSVWithOptions(
  data: WebhookExportData[],
  options: {
    dateFormat: "ISO" | "BR" | "US";
    delimiter: "," | ";";
    includeErrors: boolean;
  }
): string {
  const { dateFormat, delimiter, includeErrors } = options;

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    switch (dateFormat) {
      case "BR":
        return d.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      case "US":
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      default:
        return d.toISOString();
    }
  };

  const headers = [
    "ID",
    "Evento",
    "ID Pagamento",
    "ID Cliente",
    "Status",
    "Resultado",
    "Recebido em",
    "Processado em",
  ];

  if (includeErrors) {
    headers.push("Mensagem de Erro");
  }

  const rows = data.map((record) => {
    const row = [
      record.id.toString(),
      record.event,
      record.asaasPaymentId,
      record.asaasCustomerId || "",
      record.status,
      record.success === 1 ? "Sucesso" : "Falhou",
      formatDate(record.receivedAt),
      formatDate(record.processedAt),
    ];

    if (includeErrors) {
      row.push(record.errorMessage || "");
    }

    return row;
  });

  const csvContent = [
    headers.map((h) => `"${h}"`).join(delimiter),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(delimiter)
    ),
  ].join("\n");

  return csvContent;
}
