#!/usr/bin/env python3
"""
Script para enviar notificações via WhatsApp após criar cobranças PIX
Integra com o servidor para enviar mensagens aos moradores
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import time

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# URL do servidor
SERVER_URL = "http://127.0.0.1:3000"

# Dados dos moradores com números de WhatsApp
# Formato: { "moradorId": int, "nome": str, "whatsapp": str, "valor": float }
MORADORES = [
    {
        "moradorId": 1,
        "nome": "Carlos Henrique",
        "whatsapp": "5511999999999",  # Formato: 55 + DDD + número
        "valor": 350.00,
        "descricao": "Mensalidade 2026-04"
    },
    {
        "moradorId": 2,
        "nome": "João Silva",
        "whatsapp": "5511988888888",
        "valor": 350.00,
        "descricao": "Mensalidade 2026-04"
    },
    {
        "moradorId": 3,
        "nome": "Maria Santos",
        "whatsapp": "5511977777777",
        "valor": 350.00,
        "descricao": "Mensalidade 2026-04"
    },
]

# Delay entre envios (em segundos) para evitar rate limit
DELAY_ENTRE_ENVIOS = 2

# ============================================================================
# FUNÇÕES
# ============================================================================

def criar_cobranca(morador_id: int, valor: float, descricao: str) -> Tuple[bool, Dict]:
    """Cria uma cobrança PIX para um morador"""
    
    vencimento = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    cobranca_data = {
        "moradorId": morador_id,
        "tipo": "PIX",
        "valor": valor,
        "vencimento": vencimento,
        "descricao": descricao
    }
    
    try:
        response = requests.post(
            f"{SERVER_URL}/api/cobrancas/create",
            json=cobranca_data,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            resultado = response.json()
            return True, resultado
        else:
            erro = response.json() if response.headers.get('content-type') == 'application/json' else response.text
            return False, {"error": str(erro)}
            
    except Exception as e:
        return False, {"error": str(e)}

def enviar_whatsapp(morador_id: int, nome: str, whatsapp: str, valor: float, 
                    pix_copy_paste: str = None, pix_qr_code: str = None) -> Tuple[bool, Dict]:
    """
    Envia notificação via WhatsApp com dados da cobrança
    
    Args:
        morador_id: ID do morador
        nome: Nome do morador
        whatsapp: Número do WhatsApp (formato: 55DDNNNNNNNNN)
        valor: Valor da cobrança
        pix_copy_paste: Código PIX para copiar e colar
        pix_qr_code: QR Code do PIX
    
    Returns:
        (sucesso: bool, dados: dict)
    """
    
    # Formatar mensagem
    mensagem = f"""🏠 *Cobrança de Condomínio*

Olá {nome}! 👋

Sua cobrança foi gerada com sucesso!

💰 *Valor:* R$ {valor:.2f}
📅 *Vencimento:* {(datetime.now() + timedelta(days=7)).strftime('%d/%m/%Y')}
📝 *Descrição:* Mensalidade do condomínio

*Pague via PIX:*"""
    
    if pix_copy_paste:
        mensagem += f"""

📋 *Copia e Cola:*
```
{pix_copy_paste}
```"""
    
    mensagem += """

---
💡 *Dúvidas?* Digite *9* para falar com a administração.
Obrigado! 🙏"""
    
    # Dados para enviar via API
    whatsapp_data = {
        "moradorId": morador_id,
        "whatsapp": whatsapp,
        "mensagem": mensagem,
        "tipo": "cobranca_pix"
    }
    
    try:
        response = requests.post(
            f"{SERVER_URL}/api/whatsapp/send",
            json=whatsapp_data,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            resultado = response.json()
            return True, resultado
        else:
            erro = response.json() if response.headers.get('content-type') == 'application/json' else response.text
            return False, {"error": str(erro), "status_code": response.status_code}
            
    except Exception as e:
        return False, {"error": str(e)}

def processar_lote_com_whatsapp(moradores: List[Dict]) -> Dict:
    """
    Processa criação de cobranças e envio de notificações WhatsApp
    
    Args:
        moradores: Lista de dicionários com dados dos moradores
    
    Returns:
        Dicionário com estatísticas do processamento
    """
    
    resultados = {
        "total": len(moradores),
        "cobrancas_criadas": 0,
        "whatsapp_enviados": 0,
        "erros": 0,
        "detalhes": []
    }
    
    print(f"\n{'='*70}")
    print(f"📱 CRIANDO COBRANÇAS E ENVIANDO WHATSAPP")
    print(f"{'='*70}")
    print(f"Total de moradores: {len(moradores)}")
    print(f"{'='*70}\n")
    
    for idx, morador in enumerate(moradores, 1):
        morador_id = morador.get("moradorId")
        nome = morador.get("nome", "Morador")
        whatsapp = morador.get("whatsapp")
        valor = morador.get("valor", 0)
        descricao = morador.get("descricao", "Cobrança")
        
        print(f"[{idx}/{len(moradores)}] {nome}...", end=" ", flush=True)
        
        # Etapa 1: Criar cobrança
        sucesso_cobranca, dados_cobranca = criar_cobranca(
            morador_id=morador_id,
            valor=valor,
            descricao=descricao
        )
        
        if not sucesso_cobranca:
            print(f"❌ Erro ao criar cobrança")
            resultados["erros"] += 1
            resultados["detalhes"].append({
                "morador_id": morador_id,
                "nome": nome,
                "status": "erro_cobranca",
                "erro": dados_cobranca.get("error", "Erro desconhecido")
            })
            continue
        
        resultados["cobrancas_criadas"] += 1
        
        # Extrair PIX do resultado
        pix_copy_paste = None
        pix_qr_code = None
        
        if isinstance(dados_cobranca, dict):
            pix_copy_paste = dados_cobranca.get("pixCopyPaste")
            pix_qr_code = dados_cobranca.get("pixQrCode")
        
        # Etapa 2: Enviar WhatsApp
        if whatsapp:
            time.sleep(DELAY_ENTRE_ENVIOS)  # Delay para evitar rate limit
            
            sucesso_whatsapp, dados_whatsapp = enviar_whatsapp(
                morador_id=morador_id,
                nome=nome,
                whatsapp=whatsapp,
                valor=valor,
                pix_copy_paste=pix_copy_paste,
                pix_qr_code=pix_qr_code
            )
            
            if sucesso_whatsapp:
                print(f"✅ OK")
                resultados["whatsapp_enviados"] += 1
                resultados["detalhes"].append({
                    "morador_id": morador_id,
                    "nome": nome,
                    "status": "sucesso",
                    "cobranca_id": dados_cobranca.get("id") if isinstance(dados_cobranca, dict) else None,
                    "whatsapp": whatsapp
                })
            else:
                print(f"⚠️  Cobrança OK, WhatsApp falhou")
                resultados["detalhes"].append({
                    "morador_id": morador_id,
                    "nome": nome,
                    "status": "erro_whatsapp",
                    "cobranca_id": dados_cobranca.get("id") if isinstance(dados_cobranca, dict) else None,
                    "erro": dados_whatsapp.get("error", "Erro desconhecido")
                })
        else:
            print(f"⚠️  Sem WhatsApp")
            resultados["detalhes"].append({
                "morador_id": morador_id,
                "nome": nome,
                "status": "sem_whatsapp",
                "cobranca_id": dados_cobranca.get("id") if isinstance(dados_cobranca, dict) else None
            })
    
    return resultados

def exibir_relatorio(resultados: Dict):
    """Exibe relatório dos resultados"""
    
    print(f"\n{'='*70}")
    print(f"📊 RELATÓRIO FINAL")
    print(f"{'='*70}")
    print(f"Total processado: {resultados['total']}")
    print(f"✅ Cobranças criadas: {resultados['cobrancas_criadas']}")
    print(f"📱 WhatsApp enviados: {resultados['whatsapp_enviados']}")
    print(f"❌ Erros: {resultados['erros']}")
    print(f"{'='*70}\n")
    
    # Estatísticas
    if resultados['total'] > 0:
        taxa_cobranca = (resultados['cobrancas_criadas'] / resultados['total'] * 100)
        taxa_whatsapp = (resultados['whatsapp_enviados'] / resultados['cobrancas_criadas'] * 100) if resultados['cobrancas_criadas'] > 0 else 0
        print(f"Taxa de sucesso (cobranças): {taxa_cobranca:.1f}%")
        print(f"Taxa de sucesso (WhatsApp): {taxa_whatsapp:.1f}%\n")
    
    # Detalhes
    print(f"📋 DETALHES:\n")
    for detalhe in resultados['detalhes']:
        status = detalhe['status']
        nome = detalhe['nome']
        morador_id = detalhe['morador_id']
        
        if status == 'sucesso':
            print(f"  ✅ {nome} (ID {morador_id}): Cobrança e WhatsApp OK")
        elif status == 'erro_cobranca':
            print(f"  ❌ {nome} (ID {morador_id}): Erro ao criar cobrança - {detalhe.get('erro')}")
        elif status == 'erro_whatsapp':
            print(f"  ⚠️  {nome} (ID {morador_id}): Cobrança OK, WhatsApp falhou - {detalhe.get('erro')}")
        elif status == 'sem_whatsapp':
            print(f"  ⚠️  {nome} (ID {morador_id}): Sem número de WhatsApp")
    
    print()

def salvar_relatorio_json(resultados: Dict, filename: str = "relatorio_cobrancas_whatsapp.json"):
    """Salva relatório em arquivo JSON"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
        print(f"💾 Relatório salvo em: {filename}\n")
    except Exception as e:
        print(f"⚠️  Erro ao salvar relatório: {e}\n")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print(f"\n🔧 Script de Criação de Cobranças com Notificação WhatsApp")
    print(f"Servidor: {SERVER_URL}")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Verificar conexão com servidor
    try:
        response = requests.get(f"{SERVER_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Servidor respondendo\n")
        else:
            print(f"⚠️  Servidor respondeu com status {response.status_code}\n")
    except Exception as e:
        print(f"❌ Erro ao conectar com servidor: {e}")
        print(f"Certifique-se que o servidor está rodando em {SERVER_URL}\n")
        sys.exit(1)
    
    # Processar lote
    resultados = processar_lote_com_whatsapp(MORADORES)
    
    # Exibir relatório
    exibir_relatorio(resultados)
    
    # Salvar relatório
    salvar_relatorio_json(resultados)
    
    # Retornar código de saída apropriado
    sys.exit(0 if resultados['erros'] == 0 else 1)
