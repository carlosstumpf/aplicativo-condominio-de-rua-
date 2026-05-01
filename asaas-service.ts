/**
 * Asaas Service
 * Handles payment generation and management via Asaas API
 */

import axios from "axios";
import {
  obterConfigAsaas,
  salvarCustomerAsaas,
  salvarPagamentoAsaas,
  obterPagamentosMorador,
  obterEstatisticasPagamentos,
} from "./asaas-db";

const ASAAS_API_PRODUCAO = "https://api.asaas.com/v3";
const ASAAS_API_TESTE = "https://sandbox.asaas.com/v3";

/**
 * Get Asaas API URL based on environment
 */
function obterUrlAsaas(ambiente: string): string {
  return ambiente === "teste" ? ASAAS_API_TESTE : ASAAS_API_PRODUCAO;
}

/**
 * Create customer in Asaas
 */
export async function criarCustomerAsaas(
  condominioId: number,
  moradorId: number,
  data: {
    nome: string;
    email: string;
    cpfCnpj: string;
    telefone?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }
) {
  try {
    const config = await obterConfigAsaas(condominioId);

    if (!config || !config.ativo) {
      throw new Error("Asaas not configured");
    }

    const url = obterUrlAsaas(config.ambiente);

    const response = await axios.post(
      `${url}/customers`,
      {
        name: data.nome,
        email: data.email,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ""),
        phone: data.telefone?.replace(/\D/g, ""),
        address: data.endereco,
        addressNumber: data.numero,
        complement: data.complemento,
        province: data.bairro,
        city: data.cidade,
        state: data.estado,
        postalCode: data.cep?.replace(/\D/g, ""),
      },
      {
        headers: {
          "access-token": config.apiKey,
        },
      }
    );

    // Save customer locally
    await salvarCustomerAsaas({
      condominioId,
      moradorId,
      asaasCustomerId: response.data.id,
      nome: data.nome,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      telefone: data.telefone,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
    });

    return {
      sucesso: true,
      customerId: response.data.id,
    };
  } catch (error) {
    console.error("Error creating Asaas customer:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create payment (cobrança) in Asaas
 */
export async function criarPagamentoAsaas(
  condominioId: number,
  moradorId: number,
  data: {
    customerId: string;
    valor: number;
    descricao: string;
    dataVencimento: Date;
    tipo: "PIX" | "BOLETO" | "CREDIT_CARD";
    notificarCliente?: boolean;
  }
) {
  try {
    const config = await obterConfigAsaas(condominioId);

    if (!config || !config.ativo) {
      throw new Error("Asaas not configured");
    }

    const url = obterUrlAsaas(config.ambiente);

    const response = await axios.post(
      `${url}/payments`,
      {
        customer: data.customerId,
        billingType: data.tipo,
        value: data.valor,
        description: data.descricao,
        dueDate: data.dataVencimento.toISOString().split("T")[0],
        notifyCustomer: data.notificarCliente !== false,
      },
      {
        headers: {
          "access-token": config.apiKey,
        },
      }
    );

    // Save payment locally
    await salvarPagamentoAsaas({
      condominioId,
      moradorId,
      asaasPaymentId: response.data.id,
      asaasCustomerId: data.customerId,
      descricao: data.descricao,
      valor: data.valor,
      status: response.data.status,
      tipo: data.tipo,
      dataVencimento: new Date(response.data.dueDate),
      pixQrCode: response.data.pixQrCode,
      pixCopyPaste: response.data.pixCopyPaste,
      boletoUrl: response.data.bankSlipUrl,
      boletoBarcode: response.data.barCode,
      linkPagamento: response.data.invoiceUrl,
      metadados: {
        asaasResponse: response.data,
      },
    });

    return {
      sucesso: true,
      pagamentoId: response.data.id,
      pixQrCode: response.data.pixQrCode,
      pixCopyPaste: response.data.pixCopyPaste,
      boletoUrl: response.data.bankSlipUrl,
      boletoBarcode: response.data.barCode,
      linkPagamento: response.data.invoiceUrl,
    };
  } catch (error) {
    console.error("Error creating Asaas payment:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get payment details
 */
export async function obterDetalhePagamentoAsaas(
  condominioId: number,
  pagamentoId: string
) {
  try {
    const config = await obterConfigAsaas(condominioId);

    if (!config || !config.ativo) {
      throw new Error("Asaas not configured");
    }

    const url = obterUrlAsaas(config.ambiente);

    const response = await axios.get(`${url}/payments/${pagamentoId}`, {
      headers: {
        "access-token": config.apiKey,
      },
    });

    return {
      sucesso: true,
      pagamento: {
        id: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        descricao: response.data.description,
        dataVencimento: response.data.dueDate,
        dataPagamento: response.data.paymentDate,
        tipo: response.data.billingType,
        pixQrCode: response.data.pixQrCode,
        pixCopyPaste: response.data.pixCopyPaste,
        boletoUrl: response.data.bankSlipUrl,
        boletoBarcode: response.data.barCode,
      },
    };
  } catch (error) {
    console.error("Error getting payment details:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate PIX payment link
 */
export async function gerarPixAsaas(
  condominioId: number,
  moradorId: number,
  data: {
    customerId: string;
    valor: number;
    descricao: string;
    dataVencimento: Date;
  }
) {
  try {
    const resultado = await criarPagamentoAsaas(condominioId, moradorId, {
      customerId: data.customerId,
      valor: data.valor,
      descricao: data.descricao,
      dataVencimento: data.dataVencimento,
      tipo: "PIX",
    });

    if (!resultado.sucesso) {
      return resultado;
    }

    return {
      sucesso: true,
      tipo: "PIX",
      qrCode: resultado.pixQrCode,
      chave: resultado.pixCopyPaste,
      link: resultado.linkPagamento,
      pagamentoId: resultado.pagamentoId,
    };
  } catch (error) {
    console.error("Error generating PIX:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate Boleto payment link
 */
export async function gerarBoletoAsaas(
  condominioId: number,
  moradorId: number,
  data: {
    customerId: string;
    valor: number;
    descricao: string;
    dataVencimento: Date;
  }
) {
  try {
    const resultado = await criarPagamentoAsaas(condominioId, moradorId, {
      customerId: data.customerId,
      valor: data.valor,
      descricao: data.descricao,
      dataVencimento: data.dataVencimento,
      tipo: "BOLETO",
    });

    if (!resultado.sucesso) {
      return resultado;
    }

    return {
      sucesso: true,
      tipo: "BOLETO",
      url: resultado.boletoUrl,
      barcode: resultado.boletoBarcode,
      link: resultado.linkPagamento,
      pagamentoId: resultado.pagamentoId,
    };
  } catch (error) {
    console.error("Error generating Boleto:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Test Asaas connection
 */
export async function testarConexaoAsaas(
  condominioId: number,
  apiKey: string,
  ambiente: "teste" | "producao"
) {
  try {
    const url = obterUrlAsaas(ambiente);

    const response = await axios.get(`${url}/myAccount`, {
      headers: {
        "access-token": apiKey,
      },
    });

    return {
      sucesso: true,
      conta: response.data.name,
      email: response.data.email,
      cpfCnpj: response.data.cpfCnpj,
    };
  } catch (error) {
    console.error("Error testing Asaas connection:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get payment statistics
 */
export async function obterEstatisticasAsaas(condominioId: number) {
  try {
    return await obterEstatisticasPagamentos(condominioId);
  } catch (error) {
    console.error("Error getting Asaas statistics:", error);
    return {
      total: 0,
      recebidos: 0,
      pendentes: 0,
      atrasados: 0,
      valorTotal: 0,
      valorRecebido: 0,
      taxaRecebimento: 0,
    };
  }
}

/**
 * Process webhook from Asaas
 */
export async function processarWebhookAsaas(payload: any) {
  try {
    const evento = payload.event;
    const payment = payload.payment;

    if (!payment || !payment.id) {
      throw new Error("Invalid webhook payload");
    }

    // Aqui você processaria o webhook
    // Por exemplo, atualizar status do pagamento no banco de dados

    return {
      sucesso: true,
      evento,
      pagamentoId: payment.id,
    };
  } catch (error) {
    console.error("Error processing Asaas webhook:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
