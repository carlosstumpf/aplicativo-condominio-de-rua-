import { View, Text } from "react-native";

export interface StatusBadgeProps {
  type: "pago" | "pendente" | "vencido" | "ativo" | "inativo" | "baixo" | "médio" | "alto";
  label: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function StatusBadge({ type, label, size = "md", showIcon = true }: StatusBadgeProps) {
  const getStyles = () => {
    switch (type) {
      case "pago":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/20",
          icon: "✓",
        };
      case "pendente":
        return {
          bg: "bg-orange-500/10",
          text: "text-orange-600",
          border: "border-orange-500/20",
          icon: "⏳",
        };
      case "vencido":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
          icon: "⚠️",
        };
      case "ativo":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          border: "border-blue-500/20",
          icon: "●",
        };
      case "inativo":
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
          icon: "○",
        };
      case "baixo":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/20",
          icon: "✓",
        };
      case "médio":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-600",
          border: "border-yellow-500/20",
          icon: "◆",
        };
      case "alto":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
          icon: "●",
        };
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
          icon: "•",
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          padding: "px-2 py-1",
          text: "text-xs",
        };
      case "lg":
        return {
          padding: "px-4 py-2",
          text: "text-base",
        };
      default:
        return {
          padding: "px-3 py-1.5",
          text: "text-sm",
        };
    }
  };

  const styles = getStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      className={`${styles.bg} ${sizeStyles.padding} rounded-full border ${styles.border} flex-row items-center gap-1`}
    >
      {showIcon && <Text className={`${styles.text} font-bold`}>{styles.icon}</Text>}
      <Text className={`${styles.text} font-semibold ${sizeStyles.text}`}>{label}</Text>
    </View>
  );
}

export interface AlertBadgeProps {
  type: "info" | "warning" | "error" | "success";
  message: string;
  animated?: boolean;
}

export function AlertBadge({ type, message, animated = false }: AlertBadgeProps) {
  const getStyles = () => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
          icon: "🔴",
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-600",
          border: "border-yellow-500/20",
          icon: "🟡",
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/20",
          icon: "🟢",
        };
      default:
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          border: "border-blue-500/20",
          icon: "ℹ️",
        };
    }
  };

  const styles = getStyles();

  return (
    <View
      className={`${styles.bg} ${animated ? "animate-pulse" : ""} px-4 py-3 rounded-lg border ${styles.border} flex-row items-center gap-3`}
    >
      <Text className="text-xl">{styles.icon}</Text>
      <Text className={`${styles.text} font-medium flex-1`}>{message}</Text>
    </View>
  );
}

export interface CountBadgeProps {
  count: number;
  label: string;
  type?: "default" | "success" | "warning" | "error";
}

export function CountBadge({ count, label, type = "default" }: CountBadgeProps) {
  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "warning":
        return "bg-orange-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <View className="items-center gap-1">
      <View className={`${getStyles()} rounded-full w-12 h-12 items-center justify-center`}>
        <Text className="text-lg font-bold">{count}</Text>
      </View>
      <Text className="text-xs text-muted text-center">{label}</Text>
    </View>
  );
}

export interface ProgressIndicatorProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  type?: "success" | "warning" | "error";
}

export function ProgressIndicator({
  value,
  max,
  label,
  showPercentage = true,
  type = "success",
}: ProgressIndicatorProps) {
  const percentage = (value / max) * 100;

  const getColor = () => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <View className="gap-2">
      {label && (
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {showPercentage && (
            <Text className="text-xs text-muted font-semibold">{percentage.toFixed(0)}%</Text>
          )}
        </View>
      )}
      <View className="h-2 bg-surface rounded-full overflow-hidden border border-border">
        <View
          className={`h-full ${getColor()} rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </View>
    </View>
  );
}

export interface RiskIndicatorProps {
  level: "baixo" | "médio" | "alto";
  diasAtraso?: number;
  cobrancasVencidas?: number;
}

export function RiskIndicator({ level, diasAtraso, cobrancasVencidas }: RiskIndicatorProps) {
  const getStyles = () => {
    switch (level) {
      case "alto":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
          icon: "🔴",
          label: "Risco Alto",
        };
      case "médio":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-600",
          border: "border-yellow-500/20",
          icon: "🟡",
          label: "Risco Médio",
        };
      default:
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/20",
          icon: "🟢",
          label: "Risco Baixo",
        };
    }
  };

  const styles = getStyles();

  return (
    <View className={`${styles.bg} px-4 py-3 rounded-lg border ${styles.border} gap-2`}>
      <View className="flex-row items-center gap-2">
        <Text className="text-xl">{styles.icon}</Text>
        <Text className={`${styles.text} font-bold`}>{styles.label}</Text>
      </View>
      {(diasAtraso !== undefined || cobrancasVencidas !== undefined) && (
        <View className="flex-row gap-4 text-xs">
          {diasAtraso !== undefined && (
            <Text className={styles.text}>
              {diasAtraso} dia{diasAtraso !== 1 ? "s" : ""} de atraso
            </Text>
          )}
          {cobrancasVencidas !== undefined && (
            <Text className={styles.text}>
              {cobrancasVencidas} cobrança{cobrancasVencidas !== 1 ? "s" : ""} vencida{cobrancasVencidas !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export interface DebtSummaryBadgeProps {
  totalDevido: number;
  cobrancasVencidas: number;
  diasAtraso: number;
}

export function DebtSummaryBadge({
  totalDevido,
  cobrancasVencidas,
  diasAtraso,
}: DebtSummaryBadgeProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <View className="bg-red-500/10 rounded-lg p-4 border border-red-500/20 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-red-600">⚠️ DÉBITO PENDENTE</Text>
        <StatusBadge type="vencido" label={`${cobrancasVencidas} vencida${cobrancasVencidas !== 1 ? "s" : ""}`} size="sm" />
      </View>

      <Text className="text-2xl font-bold text-red-600">{formatCurrency(totalDevido)}</Text>

      <View className="flex-row gap-4 text-xs">
        <View>
          <Text className="text-red-600/70">Dias de Atraso</Text>
          <Text className="text-red-600 font-bold">{diasAtraso}</Text>
        </View>
        <View>
          <Text className="text-red-600/70">Cobranças Vencidas</Text>
          <Text className="text-red-600 font-bold">{cobrancasVencidas}</Text>
        </View>
      </View>
    </View>
  );
}

export interface PaymentStatusSummaryProps {
  pago: number;
  pendente: number;
  vencido: number;
}

export function PaymentStatusSummary({ pago, pendente, vencido }: PaymentStatusSummaryProps) {
  const total = pago + pendente + vencido;
  const pagoPercent = (pago / total) * 100;
  const pendentePercent = (pendente / total) * 100;
  const vencidoPercent = (vencido / total) * 100;

  return (
    <View className="gap-3">
      <View className="flex-row justify-between">
        <CountBadge count={pago} label="Pago" type="success" />
        <CountBadge count={pendente} label="Pendente" type="warning" />
        <CountBadge count={vencido} label="Vencido" type="error" />
      </View>

      <View className="h-2 bg-surface rounded-full overflow-hidden flex-row border border-border">
        {pagoPercent > 0 && (
          <View
            className="bg-green-500 h-full"
            style={{ width: `${pagoPercent}%` }}
          />
        )}
        {pendentePercent > 0 && (
          <View
            className="bg-orange-500 h-full"
            style={{ width: `${pendentePercent}%` }}
          />
        )}
        {vencidoPercent > 0 && (
          <View
            className="bg-red-500 h-full"
            style={{ width: `${vencidoPercent}%` }}
          />
        )}
      </View>

      <View className="flex-row justify-between text-xs">
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-muted">{pagoPercent.toFixed(0)}% Pago</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-orange-500" />
          <Text className="text-muted">{pendentePercent.toFixed(0)}% Pendente</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-red-500" />
          <Text className="text-muted">{vencidoPercent.toFixed(0)}% Vencido</Text>
        </View>
      </View>
    </View>
  );
}
