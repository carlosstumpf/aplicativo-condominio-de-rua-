#!/usr/bin/env python3
"""
Script para criar cobranças PIX em lote para múltiplos moradores
Automatiza o processo de geração de cobranças mensais
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# URL do servidor
SERVER_URL = "http://127.0.0.1:3000"

# Dados dos moradores para criar cobranças
# Formato: { "moradorId": int, "valor": float, "descricao": str }
MORADORES = [
    {"moradorId": 1, "valor": 350.00, "descricao": "Mensalidade 2026-04"},
    {"moradorId": 2, "valor": 350.00, "descricao": "Mensalidade 2026-04"},
    {"moradorId": 3, "valor": 350.00, "descricao": "Mensalidade 2026-04"},
]

# Data de vencimento (padrão: 7 dias a partir de hoje)
DIAS_VENCIMENTO = 7

# Tipo de cobrança (PIX ou BOLETO)
TIPO_COBRANCA = "PIX"

# ============================================================================
# FUNÇÕES
# ============================================================================

def calcular_vencimento(dias: int = DIAS_VENCIMENTO) -> str:
    """Calcula data de vencimento em formato YYYY-MM-DD"""
    data_vencimento = datetime.now() + timedelta(days=dias)
    return data_vencimento.strftime("%Y-%m-%d")

def criar_cobranca(morador_id: int, valor: float, descricao: str, tipo: str = "PIX") -> Tuple[bool, Dict]:
    """
    Cria uma cobrança para um morador
    
    Args:
        morador_id: ID do morador
        valor: Valor da cobrança
        descricao: Descrição da cobrança
        tipo: Tipo de cobrança (PIX ou BOLETO)
    
    Returns:
        (sucesso: bool, dados: dict)
    """
    
    vencimento = calcular_vencimento()
    
    # Preparar dados da cobrança
    cobranca_data = {
        "moradorId": morador_id,
        "tipo": tipo,
        "valor": valor,
        "vencimento": vencimento,
        "descricao": descricao
    }
    
    try:
        # Fazer requisição POST para criar cobrança
        # Nota: Ajuste o endpoint conforme a configuração real do servidor
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
            return False, {"error": str(erro), "status_code": response.status_code}
            
    except requests.exceptions.Timeout:
        return False, {"error": "Timeout na requisição (30s)"}
    except requests.exceptions.ConnectionError:
        return False, {"error": f"Não conseguiu conectar ao servidor: {SERVER_URL}"}
    except Exception as e:
        return False, {"error": str(e)}

def processar_lote(moradores: List[Dict]) -> Dict:
    """
    Processa criação de cobranças para múltiplos moradores
    
    Args:
        moradores: Lista de dicionários com dados dos moradores
    
    Returns:
        Dicionário com estatísticas do processamento
    """
    
    resultados = {
        "total": len(moradores),
        "sucesso": 0,
        "erro": 0,
        "detalhes": []
    }
    
    print(f"\n{'='*70}")
    print(f"🔄 CRIANDO COBRANÇAS PIX EM LOTE")
    print(f"{'='*70}")
    print(f"Total de moradores: {len(moradores)}")
    print(f"Tipo: {TIPO_COBRANCA}")
    print(f"Vencimento: {calcular_vencimento()}")
    print(f"{'='*70}\n")
    
    for idx, morador in enumerate(moradores, 1):
        morador_id = morador.get("moradorId")
        valor = morador.get("valor", 0)
        descricao = morador.get("descricao", "Cobrança")
        
        print(f"[{idx}/{len(moradores)}] Morador ID {morador_id}...", end=" ", flush=True)
        
        sucesso, dados = criar_cobranca(
            morador_id=morador_id,
            valor=valor,
            descricao=descricao,
            tipo=TIPO_COBRANCA
        )
        
        if sucesso:
            print(f"✅ OK")
            resultados["sucesso"] += 1
            resultados["detalhes"].append({
                "morador_id": morador_id,
                "status": "sucesso",
                "dados": dados
            })
        else:
            print(f"❌ ERRO")
            resultados["erro"] += 1
            resultados["detalhes"].append({
                "morador_id": morador_id,
                "status": "erro",
                "erro": dados.get("error", "Erro desconhecido")
            })
    
    return resultados

def exibir_relatorio(resultados: Dict):
    """Exibe relatório dos resultados"""
    
    print(f"\n{'='*70}")
    print(f"📊 RELATÓRIO FINAL")
    print(f"{'='*70}")
    print(f"Total processado: {resultados['total']}")
    print(f"✅ Sucesso: {resultados['sucesso']}")
    print(f"❌ Erro: {resultados['erro']}")
    print(f"Taxa de sucesso: {(resultados['sucesso']/resultados['total']*100):.1f}%")
    print(f"{'='*70}\n")
    
    # Detalhes de erros
    erros = [d for d in resultados['detalhes'] if d['status'] == 'erro']
    if erros:
        print(f"⚠️  ERROS ENCONTRADOS:\n")
        for erro_detail in erros:
            print(f"  • Morador {erro_detail['morador_id']}: {erro_detail['erro']}")
        print()
    
    # Detalhes de sucessos
    sucessos = [d for d in resultados['detalhes'] if d['status'] == 'sucesso']
    if sucessos:
        print(f"✅ COBRANÇAS CRIADAS COM SUCESSO:\n")
        for sucesso_detail in sucessos:
            morador_id = sucesso_detail['morador_id']
            dados = sucesso_detail['dados']
            
            # Tentar extrair informações úteis
            if isinstance(dados, dict):
                cobranca_id = dados.get('id', 'N/A')
                pix_copy = dados.get('pixCopyPaste', 'N/A')
                if pix_copy != 'N/A':
                    pix_copy = pix_copy[:40] + "..."
                print(f"  • Morador {morador_id}: ID {cobranca_id}")
                if pix_copy != 'N/A':
                    print(f"    PIX: {pix_copy}")
            else:
                print(f"  • Morador {morador_id}: {dados}")
        print()

def salvar_relatorio_json(resultados: Dict, filename: str = "relatorio_cobrancas.json"):
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
    print(f"\n🔧 Script de Criação em Lote de Cobranças PIX")
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
    resultados = processar_lote(MORADORES)
    
    # Exibir relatório
    exibir_relatorio(resultados)
    
    # Salvar relatório
    salvar_relatorio_json(resultados)
    
    # Retornar código de saída apropriado
    sys.exit(0 if resultados['erro'] == 0 else 1)
