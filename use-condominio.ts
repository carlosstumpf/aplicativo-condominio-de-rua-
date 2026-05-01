import { createContext, useContext, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface CondominioContextType {
  // Moradores
  moradores: any[];
  moradoresLoading: boolean;
  refreshMoradores: () => Promise<void>;

  // Cobranças
  cobrancas: any[];
  cobrancasLoading: boolean;
  refreshCobrancas: (filtros?: any) => Promise<void>;

  // Despesas
  despesas: any[];
  despesasLoading: boolean;
  refreshDespesas: (filtros?: any) => Promise<void>;

  // Chamados
  chamados: any[];
  chamadosLoading: boolean;
  refreshChamados: (filtros?: any) => Promise<void>;

  // Relatórios
  resumoMes: any;
  resumoLoading: boolean;
  refreshResumo: (mesReferencia: string) => Promise<void>;
}

const CondominioContext = createContext<CondominioContextType | undefined>(undefined);

export function CondominioProvider({ children }: { children: ReactNode }) {
  const [moradores, setMoradores] = useState<any[]>([]);
  const [moradoresLoading, setMoradoresLoading] = useState(false);

  const [cobrancas, setCobrancas] = useState<any[]>([]);
  const [cobrancasLoading, setCobrancasLoading] = useState(false);

  const [despesas, setDespesas] = useState<any[]>([]);
  const [despesasLoading, setDespesasLoading] = useState(false);

  const [chamados, setChamados] = useState<any[]>([]);
  const [chamadosLoading, setChamadosLoading] = useState(false);

  const [resumoMes, setResumoMes] = useState<any>(null);
  const [resumoLoading, setResumoLoading] = useState(false);

  // tRPC queries
  const moradoresQuery = trpc.moradores.list.useQuery();
  const cobrancasQuery = trpc.cobrancas.list.useQuery({ status: undefined });
  const despesasQuery = trpc.despesas.list.useQuery({ categoria: undefined });
  const chamadosQuery = trpc.chamados.list.useQuery({ status: undefined });

  const refreshMoradores = async () => {
    try {
      setMoradoresLoading(true);
      const data = await moradoresQuery.refetch();
      if (data.data) {
        setMoradores(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh moradores:", error);
    } finally {
      setMoradoresLoading(false);
    }
  };

  const refreshCobrancas = async (filtros?: any) => {
    try {
      setCobrancasLoading(true);
      const data = await cobrancasQuery.refetch();
      if (data.data) {
        setCobrancas(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh cobrancas:", error);
    } finally {
      setCobrancasLoading(false);
    }
  };

  const refreshDespesas = async (filtros?: any) => {
    try {
      setDespesasLoading(true);
      const data = await despesasQuery.refetch();
      if (data.data) {
        setDespesas(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh despesas:", error);
    } finally {
      setDespesasLoading(false);
    }
  };

  const refreshChamados = async (filtros?: any) => {
    try {
      setChamadosLoading(true);
      const data = await chamadosQuery.refetch();
      if (data.data) {
        setChamados(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh chamados:", error);
    } finally {
      setChamadosLoading(false);
    }
  };

  const refreshResumo = async (mesReferencia: string) => {
    try {
      setResumoLoading(true);
      // This will be called from the relatorios query
      setResumoMes({ mesReferencia });
    } catch (error) {
      console.error("Failed to refresh resumo:", error);
    } finally {
      setResumoLoading(false);
    }
  };

  return (
    <CondominioContext.Provider
      value={{
        moradores,
        moradoresLoading,
        refreshMoradores,
        cobrancas,
        cobrancasLoading,
        refreshCobrancas,
        despesas,
        despesasLoading,
        refreshDespesas,
        chamados,
        chamadosLoading,
        refreshChamados,
        resumoMes,
        resumoLoading,
        refreshResumo,
      }}
    >
      {children}
    </CondominioContext.Provider>
  );
}

export function useCondominio() {
  const context = useContext(CondominioContext);
  if (!context) {
    throw new Error("useCondominio must be used within CondominioProvider");
  }
  return context;
}
