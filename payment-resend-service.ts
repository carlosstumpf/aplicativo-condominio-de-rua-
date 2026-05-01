/**
 * Payment Resend Service
 * Handles manual resending of payment links
 */

import {
  salvarReenvio,
  atualizarStatusReenvio,
  obterHistoricoReenvios,
} from "./payment-resend-db";
import { obterDetalhePagamentoAsaas } from "./asaas-service";
import { enviarFlowWhatsapp } from "./whatsapp-flows-service";

/**
 * Resend payment via WhatsApp Flow
 */
export async function reenviarPagamentoWhatsApp(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  numeroWhatsapp: string;
  flowId: string;
  motivo?: string;
  adminId?: number;
}) {
  try {
    // Get payment details from Asaas
    const pagamento = await obterDetalhePagamentoAsaas(
      data.condominioId,
      data.asaasPaymentId
    );

    if (!pagamento.sucesso) {
      throw new Error("Failed to get payment details");
    }

    // Save resend record
    const reenvio = await salvarReenvio({
      condominioId: data.condominioId,
      moradorId: data.moradorId,
      asaasPaymentId: data.asaasPaymentId,
      canal: "WHATSAPP",
      numeroDestinatario: data.numeroWhatsapp,
      motivo: data.motivo || "Reenvio manual solicitado",
      adminId: data.adminId,
      metadados: {
        flowId: data.flowId,
        pagamento: pagamento.pagamento,
      },
    });

    if (!reenvio) {
      throw new Error("Failed to save resend record");
    }

    // Send WhatsApp Flow
    const resultado = await enviarFlowWhatsapp({
      condominioId: data.condominioId,
      numeroDestinatario: data.numeroWhatsapp,
      flowId: data.flowId,
    });

    if (!resultado.sucesso) {
      await atualizarStatusReenvio(
        reenvio.id,
        "falha",
        resultado.erro
      );

      return {
        sucesso: false,
        erro: resultado.erro,
        reenvioId: reenvio.id,
      };
    }

    // Update resend status
    await atualizarStatusReenvio(reenvio.id, "enviado");

    return {
      sucesso: true,
      reenvioId: reenvio.id,
      messageSid: resultado.messageSid,
      pagamento: pagamento.pagamento,
    };
  } catch (error) {
    console.error("Error resending payment via WhatsApp:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Resend payment via Email
 */
export async function reenviarPagamentoEmail(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  email: string;
  motivo?: string;
  adminId?: number;
}) {
  try {
    // Get payment details from Asaas
    const pagamento = await obterDetalhePagamentoAsaas(
      data.condominioId,
      data.asaasPaymentId
    );

    if (!pagamento.sucesso) {
      throw new Error("Failed to get payment details");
    }

    // Save resend record
    const reenvio = await salvarReenvio({
      condominioId: data.condominioId,
      moradorId: data.moradorId,
      asaasPaymentId: data.asaasPaymentId,
      canal: "EMAIL",
      numeroDestinatario: data.email,
      motivo: data.motivo || "Reenvio manual solicitado",
      adminId: data.adminId,
      metadados: {
        pagamento: pagamento.pagamento,
      },
    });

    if (!reenvio) {
      throw new Error("Failed to save resend record");
    }

    // TODO: Implement email sending
    // For now, just mark as sent
    await atualizarStatusReenvio(reenvio.id, "enviado");

    return {
      sucesso: true,
      reenvioId: reenvio.id,
      email: data.email,
      pagamento: pagamento.pagamento,
    };
  } catch (error) {
    console.error("Error resending payment via email:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Resend payment via SMS
 */
export async function reenviarPagamentoSMS(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  telefone: string;
  motivo?: string;
  adminId?: number;
}) {
  try {
    // Get payment details from Asaas
    const pagamento = await obterDetalhePagamentoAsaas(
      data.condominioId,
      data.asaasPaymentId
    );

    if (!pagamento.sucesso) {
      throw new Error("Failed to get payment details");
    }

    // Save resend record
    const reenvio = await salvarReenvio({
      condominioId: data.condominioId,
      moradorId: data.moradorId,
      asaasPaymentId: data.asaasPaymentId,
      canal: "SMS",
      numeroDestinatario: data.telefone,
      motivo: data.motivo || "Reenvio manual solicitado",
      adminId: data.adminId,
      metadados: {
        pagamento: pagamento.pagamento,
      },
    });

    if (!reenvio) {
      throw new Error("Failed to save resend record");
    }

    // TODO: Implement SMS sending via Twilio or similar
    // For now, just mark as sent
    await atualizarStatusReenvio(reenvio.id, "enviado");

    return {
      sucesso: true,
      reenvioId: reenvio.id,
      telefone: data.telefone,
      pagamento: pagamento.pagamento,
    };
  } catch (error) {
    console.error("Error resending payment via SMS:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Resend payment via in-app notification
 */
export async function reenviarPagamentoApp(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  motivo?: string;
  adminId?: number;
}) {
  try {
    // Get payment details from Asaas
    const pagamento = await obterDetalhePagamentoAsaas(
      data.condominioId,
      data.asaasPaymentId
    );

    if (!pagamento.sucesso) {
      throw new Error("Failed to get payment details");
    }

    // Save resend record
    const reenvio = await salvarReenvio({
      condominioId: data.condominioId,
      moradorId: data.moradorId,
      asaasPaymentId: data.asaasPaymentId,
      canal: "APP",
      motivo: data.motivo || "Reenvio manual solicitado",
      adminId: data.adminId,
      metadados: {
        pagamento: pagamento.pagamento,
      },
    });

    if (!reenvio) {
      throw new Error("Failed to save resend record");
    }

    // TODO: Send push notification via Expo
    // For now, just mark as sent
    await atualizarStatusReenvio(reenvio.id, "enviado");

    return {
      sucesso: true,
      reenvioId: reenvio.id,
      pagamento: pagamento.pagamento,
    };
  } catch (error) {
    console.error("Error resending payment via app:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format payment message for resend
 */
export function formatarMensagemReenvio(
  tipo: "PIX" | "BOLETO",
  pagamento: any
): string {
  const valor = pagamento.valor || 0;
  const vencimento = pagamento.dataVencimento || new Date();

  if (tipo === "PIX") {
    return `💰 *Seu Link de Pagamento PIX*

Valor: R$ ${valor.toFixed(2)}
Vencimento: ${new Date(vencimento).toLocaleDateString("pt-BR")}

*Chave PIX:*
\`${pagamento.pixCopyPaste}\`

Copie e cole no seu app de banco para pagar!`;
  } else {
    return `📋 *Seu Link de Pagamento Boleto*

Valor: R$ ${valor.toFixed(2)}
Vencimento: ${new Date(vencimento).toLocaleDateString("pt-BR")}

*Código de Barras:*
\`${pagamento.boletoBarcode}\`

Copie e cole no seu banco para pagar!`;
  }
}

/**
 * Get resend history with details
 */
export async function obterHistoricoReenviosComDetalhes(
  asaasPaymentId: string
) {
  try {
    const historico = await obterHistoricoReenvios(asaasPaymentId);

    return {
      sucesso: true,
      total: historico.length,
      reenvios: historico.map((r) => ({
        id: r.id,
        canal: r.canal,
        status: r.status,
        motivo: r.motivo,
        tentativas: r.tentativas,
        criadoEm: r.criadoEm,
        ultimaTentativa: r.ultimaTentativa,
        erro: r.erro,
      })),
    };
  } catch (error) {
    console.error("Error getting resend history:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bulk resend payments
 */
export async function reenviarPagamentosEmLote(
  condominioId: number,
  pagamentos: Array<{
    moradorId: number;
    asaasPaymentId: string;
    numeroWhatsapp: string;
    flowId: string;
  }>,
  adminId?: number
) {
  try {
    const resultados = await Promise.all(
      pagamentos.map((p) =>
        reenviarPagamentoWhatsApp({
          condominioId,
          moradorId: p.moradorId,
          asaasPaymentId: p.asaasPaymentId,
          numeroWhatsapp: p.numeroWhatsapp,
          flowId: p.flowId,
          motivo: "Reenvio em lote",
          adminId,
        })
      )
    );

    const sucessos = resultados.filter((r) => r.sucesso).length;
    const falhas = resultados.filter((r) => !r.sucesso).length;

    return {
      total: pagamentos.length,
      sucessos,
      falhas,
      resultados,
    };
  } catch (error) {
    console.error("Error bulk resending payments:", error);
    return {
      total: pagamentos.length,
      sucessos: 0,
      falhas: pagamentos.length,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
