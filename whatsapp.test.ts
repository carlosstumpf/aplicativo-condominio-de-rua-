/**
 * WhatsApp Integration Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  configurarWhatsapp,
  obterConfigWhatsapp,
  salvarMensagem,
  obterMensagensConversa,
  atualizarStatusMensagem,
  criarMenuTemplate,
  obterMenus,
  obterOuCriarConversa,
  salvarInteracao,
  obterEstatisticasWhatsapp,
} from "@/server/_core/whatsapp-db";

describe("WhatsApp Integration", () => {
  const mockConfig = {
    condominioId: 1,
    numeroWhatsapp: "+55 11 99999-9999",
    twilioAccountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    twilioAuthToken: "auth_token_here",
    twilioPhoneNumber: "+1234567890",
  };

  describe("Configuration", () => {
    it("should configure WhatsApp", async () => {
      const result = await configurarWhatsapp(mockConfig);

      expect(result).toBeDefined();
      expect(result?.numeroWhatsapp).toBe(mockConfig.numeroWhatsapp);
      expect(result?.ativo).toBe(true);
    });

    it("should get WhatsApp configuration", async () => {
      await configurarWhatsapp(mockConfig);

      const result = await obterConfigWhatsapp(mockConfig.condominioId);

      expect(result).toBeDefined();
      expect(result?.numeroWhatsapp).toBe(mockConfig.numeroWhatsapp);
    });

    it("should update existing configuration", async () => {
      await configurarWhatsapp(mockConfig);

      const updated = await configurarWhatsapp({
        ...mockConfig,
        numeroWhatsapp: "+55 11 88888-8888",
      });

      expect(updated?.numeroWhatsapp).toBe("+55 11 88888-8888");
    });

    it("should handle missing configuration", async () => {
      const result = await obterConfigWhatsapp(99999);

      expect(result).toBeNull();
    });
  });

  describe("Messages", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should save outgoing message", async () => {
      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Olá! Teste de mensagem",
        direcao: "enviada",
      });

      expect(result).toBeDefined();
      expect(result?.conteudo).toBe("Olá! Teste de mensagem");
      expect(result?.direcao).toBe("enviada");
      expect(result?.status).toBe("pendente");
    });

    it("should save incoming message", async () => {
      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: "+55 11 99999-0001",
        numeroDestinatario: mockConfig.numeroWhatsapp,
        conteudo: "Resposta do morador",
        direcao: "recebida",
      });

      expect(result?.direcao).toBe("recebida");
    });

    it("should get conversation messages", async () => {
      await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Mensagem 1",
        direcao: "enviada",
      });

      await salvarMensagem({
        condominioId: 1,
        numeroRemetente: "+55 11 99999-0001",
        numeroDestinatario: mockConfig.numeroWhatsapp,
        conteudo: "Resposta 1",
        direcao: "recebida",
      });

      const result = await obterMensagensConversa(1, "+55 11 99999-0001");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should update message status", async () => {
      const saved = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Teste",
        direcao: "enviada",
      });

      if (saved) {
        const updated = await atualizarStatusMensagem(saved.id, "entregue");

        expect(updated?.status).toBe("entregue");
        expect(updated?.entregueEm).toBeDefined();
      }
    });

    it("should track message delivery", async () => {
      const saved = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Teste",
        direcao: "enviada",
      });

      if (saved) {
        const updated = await atualizarStatusMensagem(
          saved.id,
          "lida",
          "SM123456789"
        );

        expect(updated?.status).toBe("lida");
        expect(updated?.messageSid).toBe("SM123456789");
      }
    });
  });

  describe("Menu Templates", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should create menu template", async () => {
      const result = await criarMenuTemplate({
        condominioId: 1,
        nome: "Menu Principal",
        descricao: "Menu de opções principais",
        mensagemInicial: "Bem-vindo! Escolha uma opção:",
        opcoes: [
          { numero: 1, titulo: "Pagar", descricao: "Pagar mensalidade" },
          { numero: 2, titulo: "Saldo", descricao: "Ver saldo" },
        ],
      });

      expect(result).toBeDefined();
      expect(result?.nome).toBe("Menu Principal");
      expect(result?.opcoes).toBeDefined();
    });

    it("should get menu templates", async () => {
      await criarMenuTemplate({
        condominioId: 1,
        nome: "Menu 1",
        mensagemInicial: "Opção 1",
        opcoes: [{ numero: 1, titulo: "Teste" }],
      });

      const result = await obterMenus(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should only get active menus", async () => {
      await criarMenuTemplate({
        condominioId: 1,
        nome: "Menu Ativo",
        mensagemInicial: "Ativo",
        opcoes: [{ numero: 1, titulo: "Teste" }],
      });

      const result = await obterMenus(1);

      result.forEach((menu) => {
        expect(menu.ativo).toBe(true);
      });
    });
  });

  describe("Conversations", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should create new conversation", async () => {
      const result = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
        nomeContato: "João Silva",
      });

      expect(result).toBeDefined();
      expect(result?.numeroWhatsapp).toBe("+55 11 99999-0001");
      expect(result?.statusConversa).toBe("ativa");
    });

    it("should get existing conversation", async () => {
      const created = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      const retrieved = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      expect(retrieved?.id).toBe(created?.id);
    });

    it("should update last interaction", async () => {
      const created = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      const updated = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      expect(updated?.ultimaInteracao.getTime()).toBeGreaterThanOrEqual(
        created?.ultimaInteracao.getTime() || 0
      );
    });
  });

  describe("Interactions", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should save interaction", async () => {
      const conversa = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      if (conversa) {
        const result = await salvarInteracao({
          condominioId: 1,
          conversaId: conversa.id,
          opcaoSelecionada: "1",
          tipo: "selecao_menu",
        });

        expect(result).toBeDefined();
        expect(result?.opcaoSelecionada).toBe("1");
      }
    });

    it("should save text interaction", async () => {
      const conversa = await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      if (conversa) {
        const result = await salvarInteracao({
          condominioId: 1,
          conversaId: conversa.id,
          resposta: "Texto livre do usuário",
          tipo: "texto_livre",
        });

        expect(result?.tipo).toBe("texto_livre");
      }
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should get WhatsApp statistics", async () => {
      await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Teste",
        direcao: "enviada",
      });

      const result = await obterEstatisticasWhatsapp(1);

      expect(result).toBeDefined();
      expect(result.totalMensagens).toBeGreaterThanOrEqual(1);
      expect(result.mensagensEnviadas).toBeGreaterThanOrEqual(1);
    });

    it("should count incoming and outgoing messages", async () => {
      await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Enviada",
        direcao: "enviada",
      });

      await salvarMensagem({
        condominioId: 1,
        numeroRemetente: "+55 11 99999-0001",
        numeroDestinatario: mockConfig.numeroWhatsapp,
        conteudo: "Recebida",
        direcao: "recebida",
      });

      const result = await obterEstatisticasWhatsapp(1);

      expect(result.mensagensEnviadas).toBeGreaterThanOrEqual(1);
      expect(result.mensagensRecebidas).toBeGreaterThanOrEqual(1);
    });

    it("should count active conversations", async () => {
      await obterOuCriarConversa({
        condominioId: 1,
        numeroWhatsapp: "+55 11 99999-0001",
      });

      const result = await obterEstatisticasWhatsapp(1);

      expect(result.conversasAtivas).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid phone numbers", async () => {
      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: "invalid",
        numeroDestinatario: "invalid",
        conteudo: "Teste",
        direcao: "enviada",
      });

      expect(result).toBeDefined();
    });

    it("should handle empty message", async () => {
      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: "+55 11 99999-0001",
        numeroDestinatario: "+55 11 99999-0002",
        conteudo: "",
        direcao: "enviada",
      });

      expect(result).toBeDefined();
    });

    it("should handle missing config", async () => {
      const result = await obterConfigWhatsapp(99999);

      expect(result).toBeNull();
    });

    it("should handle empty conversation list", async () => {
      const result = await obterMensagensConversa(99999, "+55 11 99999-0001");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Data Integrity", () => {
    beforeEach(async () => {
      await configurarWhatsapp(mockConfig);
    });

    it("should preserve message content", async () => {
      const content = "Mensagem com caracteres especiais: ñ, é, ç, 中文";

      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: content,
        direcao: "enviada",
      });

      expect(result?.conteudo).toBe(content);
    });

    it("should maintain message timestamps", async () => {
      const result = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Teste",
        direcao: "enviada",
      });

      expect(result?.criadoEm).toBeDefined();
      expect(result?.enviadoEm).toBeUndefined();
    });

    it("should track status changes", async () => {
      const saved = await salvarMensagem({
        condominioId: 1,
        numeroRemetente: mockConfig.numeroWhatsapp,
        numeroDestinatario: "+55 11 99999-0001",
        conteudo: "Teste",
        direcao: "enviada",
      });

      if (saved) {
        const step1 = await atualizarStatusMensagem(saved.id, "enviada");
        expect(step1?.enviadoEm).toBeDefined();

        const step2 = await atualizarStatusMensagem(saved.id, "entregue");
        expect(step2?.entregueEm).toBeDefined();

        const step3 = await atualizarStatusMensagem(saved.id, "lida");
        expect(step3?.lidoEm).toBeDefined();
      }
    });
  });
});
