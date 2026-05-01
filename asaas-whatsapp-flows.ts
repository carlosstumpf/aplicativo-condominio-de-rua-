/**
 * Asaas WhatsApp Flows Integration
 * Generates dynamic payment flows with Asaas links
 */

import {
  criarOuAtualizarFlow,
  salvarFlowInteracao,
} from "./whatsapp-flows-db";
import { gerarPixAsaas, gerarBoletoAsaas } from "./asaas-service";

/**
 * Create dynamic payment flow with Asaas PIX and Boleto
 */
export async function criarFlowPagamentoDinamico(
  condominioId: number,
  moradorId: number,
  data: {
    flowId: string;
    customerId: string;
    valor: number;
    descricao: string;
    dataVencimento: Date;
    nomeMoreador: string;
  }
) {
  try {
    // Generate PIX
    const pixResult = await gerarPixAsaas(
      condominioId,
      moradorId,
      {
        customerId: data.customerId,
        valor: data.valor,
        descricao: data.descricao,
        dataVencimento: data.dataVencimento,
      }
    );

    if (!pixResult.sucesso) {
      throw new Error("Failed to generate PIX");
    }

    // Generate Boleto
    const boletoResult = await gerarBoletoAsaas(
      condominioId,
      moradorId,
      {
        customerId: data.customerId,
        valor: data.valor,
        descricao: data.descricao,
        dataVencimento: data.dataVencimento,
      }
    );

    if (!boletoResult.sucesso) {
      throw new Error("Failed to generate Boleto");
    }

    // Create flow definition with payment options
    const flowDefinicao = {
      version: "3.0",
      screens: [
        {
          id: "payment_welcome",
          title: "Pagamento de Mensalidade",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: `Olá ${data.nomeMoreador}!`,
              },
              {
                type: "TextBody",
                text: `Sua mensalidade de R$ ${data.valor.toFixed(2)} vence em ${data.dataVencimento.toLocaleDateString("pt-BR")}`,
              },
              {
                type: "TextBody",
                text: "Escolha a forma de pagamento:",
              },
              {
                type: "ButtonGroup",
                buttons: [
                  {
                    id: "pix_btn",
                    text: "💰 Pagar com PIX",
                    style: "FILLED",
                  },
                  {
                    id: "boleto_btn",
                    text: "📋 Pagar com Boleto",
                    style: "FILLED",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "pix_screen",
          title: "Pagamento PIX",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: "Escaneie o QR Code",
              },
              {
                type: "TextBody",
                text: "Ou copie a chave PIX abaixo:",
              },
              {
                type: "TextBody",
                text: data.descricao,
              },
              {
                type: "TextInput",
                input_type: "text",
                name: "pix_key",
                label: "Chave PIX",
                value: pixResult.chave,
                readonly: true,
              },
              {
                type: "ButtonGroup",
                buttons: [
                  {
                    id: "pix_confirm",
                    text: "✓ Pagamento Realizado",
                    style: "FILLED",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "boleto_screen",
          title: "Pagamento Boleto",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: "Código de Barras",
              },
              {
                type: "TextBody",
                text: "Copie o código abaixo para pagar no seu banco:",
              },
              {
                type: "TextInput",
                input_type: "text",
                name: "barcode",
                label: "Código de Barras",
                value: boletoResult.barcode,
                readonly: true,
              },
              {
                type: "TextBody",
                text: `Vencimento: ${data.dataVencimento.toLocaleDateString("pt-BR")}`,
              },
              {
                type: "ButtonGroup",
                buttons: [
                  {
                    id: "boleto_confirm",
                    text: "✓ Pagamento Realizado",
                    style: "FILLED",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "success_screen",
          title: "Sucesso",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: "✓ Pagamento Iniciado",
              },
              {
                type: "TextBody",
                text: "Obrigado! Seu pagamento foi registrado.",
              },
              {
                type: "TextBody",
                text: "Você receberá uma confirmação em breve.",
              },
            ],
          },
        },
      ],
    };

    // Create flow in database
    const flow = await criarOuAtualizarFlow({
      condominioId,
      flowId: data.flowId,
      nome: `Pagamento: ${data.descricao}`,
      descricao: `Pagamento de R$ ${data.valor.toFixed(2)} via PIX e Boleto`,
      definicao: flowDefinicao,
      tipo: "pagamento",
    });

    return {
      sucesso: true,
      flow,
      pix: {
        qrCode: pixResult.qrCode,
        chave: pixResult.chave,
        link: pixResult.link,
      },
      boleto: {
        url: boletoResult.url,
        barcode: boletoResult.barcode,
        link: boletoResult.link,
      },
    };
  } catch (error) {
    console.error("Error creating dynamic payment flow:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create support flow with payment options
 */
export async function criarFlowSuporteDinamico(
  condominioId: number,
  flowId: string,
  nomeMoreador: string
) {
  try {
    const flowDefinicao = {
      version: "3.0",
      screens: [
        {
          id: "support_welcome",
          title: "Central de Suporte",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: `Olá ${nomeMoreador}!`,
              },
              {
                type: "TextBody",
                text: "Como podemos ajudar?",
              },
              {
                type: "ButtonGroup",
                buttons: [
                  {
                    id: "pagar_btn",
                    text: "💰 Pagar Mensalidade",
                    style: "FILLED",
                  },
                  {
                    id: "saldo_btn",
                    text: "📊 Consultar Saldo",
                    style: "FILLED",
                  },
                  {
                    id: "comunicados_btn",
                    text: "📢 Comunicados",
                    style: "FILLED",
                  },
                  {
                    id: "manutencao_btn",
                    text: "🔧 Solicitar Manutenção",
                    style: "FILLED",
                  },
                  {
                    id: "admin_btn",
                    text: "👨‍💼 Falar com Admin",
                    style: "FILLED",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "manutencao_screen",
          title: "Solicitar Manutenção",
          layout: {
            type: "SingleColumnLayout",
            children: [
              {
                type: "TextHeading",
                text: "Qual é o problema?",
              },
              {
                type: "SelectionList",
                name: "categoria",
                items: [
                  { id: "agua", title: "💧 Vazamento de Água" },
                  { id: "eletrica", title: "⚡ Problema Elétrico" },
                  { id: "porta", title: "🚪 Porta/Fechadura" },
                  { id: "parede", title: "🧱 Parede/Pintura" },
                  { id: "outro", title: "❓ Outro" },
                ],
              },
              {
                type: "TextInput",
                input_type: "text",
                name: "descricao",
                label: "Descreva o problema",
              },
              {
                type: "ButtonGroup",
                buttons: [
                  {
                    id: "submit_manutencao",
                    text: "Enviar Solicitação",
                    style: "FILLED",
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const flow = await criarOuAtualizarFlow({
      condominioId,
      flowId,
      nome: "Central de Suporte",
      descricao: "Menu de suporte com opções de pagamento, saldo e manutenção",
      definicao: flowDefinicao,
      tipo: "suporte",
    });

    return {
      sucesso: true,
      flow,
    };
  } catch (error) {
    console.error("Error creating support flow:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log flow interaction with payment data
 */
export async function registrarInteracaoPagamento(
  condominioId: number,
  flowId: number,
  numeroWhatsapp: string,
  dados: {
    tipo: "PIX" | "BOLETO";
    valor: number;
    descricao: string;
    asaasPaymentId: string;
  }
) {
  try {
    const interacao = await salvarFlowInteracao({
      condominioId,
      flowId,
      numeroWhatsapp,
      respostas: {
        tipo_pagamento: dados.tipo,
        valor: dados.valor,
        descricao: dados.descricao,
        asaas_payment_id: dados.asaasPaymentId,
      },
      status: "concluido",
      resultado: "pagamento_iniciado",
    });

    return {
      sucesso: true,
      interacao,
    };
  } catch (error) {
    console.error("Error logging payment interaction:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format payment message for WhatsApp
 */
export function formatarMensagemPagamento(
  tipo: "PIX" | "BOLETO",
  dados: {
    valor: number;
    descricao: string;
    vencimento: Date;
    qrCode?: string;
    chave?: string;
    barcode?: string;
  }
): string {
  if (tipo === "PIX") {
    return `💰 *Pagamento via PIX*

Valor: R$ ${dados.valor.toFixed(2)}
Descrição: ${dados.descricao}
Vencimento: ${dados.vencimento.toLocaleDateString("pt-BR")}

*Chave PIX:*
\`${dados.chave}\`

Copie e cole no seu app de banco!`;
  } else {
    return `📋 *Pagamento via Boleto*

Valor: R$ ${dados.valor.toFixed(2)}
Descrição: ${dados.descricao}
Vencimento: ${dados.vencimento.toLocaleDateString("pt-BR")}

*Código de Barras:*
\`${dados.barcode}\`

Copie e cole no seu banco!`;
  }
}
