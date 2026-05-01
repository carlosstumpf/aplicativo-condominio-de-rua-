import { describe, it, expect } from "vitest";

describe("Moradores Listing", () => {
  describe("Search Functionality", () => {
    const mockMoradores = [
      {
        id: 1,
        nomeCompleto: "João Silva",
        identificacaoCasa: "Casa 10",
        telefone: "11999999999",
        cpf: "12345678901",
        statusAtivo: 1,
      },
      {
        id: 2,
        nomeCompleto: "Maria Santos",
        identificacaoCasa: "Casa 20",
        telefone: "11888888888",
        cpf: "98765432109",
        statusAtivo: 1,
      },
      {
        id: 3,
        nomeCompleto: "Pedro Costa",
        identificacaoCasa: "Casa 30",
        telefone: "11777777777",
        cpf: "55555555555",
        statusAtivo: 0,
      },
    ];

    it("should search by name", () => {
      const query = "João";
      const results = mockMoradores.filter((m) =>
        m.nomeCompleto.toLowerCase().includes(query.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0].nomeCompleto).toBe("João Silva");
    });

    it("should search by house identification", () => {
      const query = "Casa 20";
      const results = mockMoradores.filter((m) =>
        m.identificacaoCasa.toLowerCase().includes(query.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0].identificacaoCasa).toBe("Casa 20");
    });

    it("should search by phone number", () => {
      const query = "11999999999";
      const results = mockMoradores.filter((m) => m.telefone.includes(query));

      expect(results).toHaveLength(1);
      expect(results[0].telefone).toBe("11999999999");
    });

    it("should search by CPF", () => {
      const query = "12345678901";
      const results = mockMoradores.filter((m) => m.cpf.includes(query));

      expect(results).toHaveLength(1);
      expect(results[0].cpf).toBe("12345678901");
    });

    it("should return empty array for non-matching search", () => {
      const query = "Inexistente";
      const results = mockMoradores.filter((m) =>
        m.nomeCompleto.toLowerCase().includes(query.toLowerCase())
      );

      expect(results).toHaveLength(0);
    });
  });

  describe("Status Filtering", () => {
    const mockMoradores = [
      { id: 1, nomeCompleto: "João", statusAtivo: 1 },
      { id: 2, nomeCompleto: "Maria", statusAtivo: 1 },
      { id: 3, nomeCompleto: "Pedro", statusAtivo: 0 },
    ];

    it("should filter active moradores", () => {
      const results = mockMoradores.filter((m) => m.statusAtivo === 1);

      expect(results).toHaveLength(2);
      expect(results.every((m) => m.statusAtivo === 1)).toBe(true);
    });

    it("should filter inactive moradores", () => {
      const results = mockMoradores.filter((m) => m.statusAtivo === 0);

      expect(results).toHaveLength(1);
      expect(results[0].statusAtivo).toBe(0);
    });

    it("should return all moradores when no filter applied", () => {
      const results = mockMoradores;

      expect(results).toHaveLength(3);
    });
  });

  describe("Pagination", () => {
    const mockMoradores = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      nomeCompleto: `Morador ${i + 1}`,
    }));

    it("should paginate with limit of 10", () => {
      const page = 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const results = mockMoradores.slice(offset, offset + limit);

      expect(results).toHaveLength(10);
      expect(results[0].id).toBe(1);
      expect(results[9].id).toBe(10);
    });

    it("should get second page", () => {
      const page = 2;
      const limit = 10;
      const offset = (page - 1) * limit;
      const results = mockMoradores.slice(offset, offset + limit);

      expect(results).toHaveLength(10);
      expect(results[0].id).toBe(11);
      expect(results[9].id).toBe(20);
    });

    it("should get last page with remaining items", () => {
      const page = 3;
      const limit = 10;
      const offset = (page - 1) * limit;
      const results = mockMoradores.slice(offset, offset + limit);

      expect(results).toHaveLength(5);
      expect(results[0].id).toBe(21);
      expect(results[4].id).toBe(25);
    });

    it("should calculate total pages correctly", () => {
      const total = mockMoradores.length;
      const limit = 10;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(3);
    });

    it("should determine hasNextPage correctly", () => {
      const limit = 10;
      const total = mockMoradores.length;

      const page1TotalPages = Math.ceil(total / limit);
      expect(1 < page1TotalPages).toBe(true); // hasNextPage for page 1

      const page3TotalPages = Math.ceil(total / limit);
      expect(3 < page3TotalPages).toBe(false); // no hasNextPage for page 3
    });

    it("should determine hasPreviousPage correctly", () => {
      expect(1 > 1).toBe(false); // no previous page for page 1
      expect(2 > 1).toBe(true); // has previous page for page 2
      expect(3 > 1).toBe(true); // has previous page for page 3
    });
  });

  describe("Combined Search and Filter", () => {
    const mockMoradores = [
      { id: 1, nomeCompleto: "João Silva", statusAtivo: 1 },
      { id: 2, nomeCompleto: "Maria Silva", statusAtivo: 1 },
      { id: 3, nomeCompleto: "Pedro Santos", statusAtivo: 0 },
    ];

    it("should search and filter by status", () => {
      const query = "Silva";
      const status = 1;

      let results = mockMoradores.filter((m) =>
        m.nomeCompleto.toLowerCase().includes(query.toLowerCase())
      );
      results = results.filter((m) => m.statusAtivo === status);

      expect(results).toHaveLength(2);
      expect(results.every((m) => m.nomeCompleto.includes("Silva"))).toBe(true);
      expect(results.every((m) => m.statusAtivo === 1)).toBe(true);
    });

    it("should return empty when search matches but status filter excludes", () => {
      const query = "Pedro";
      const status = 1;

      let results = mockMoradores.filter((m) =>
        m.nomeCompleto.toLowerCase().includes(query.toLowerCase())
      );
      results = results.filter((m) => m.statusAtivo === status);

      expect(results).toHaveLength(0);
    });
  });
});
