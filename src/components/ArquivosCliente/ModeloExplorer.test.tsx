import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ArquivosCliente from ".";
import http from "../../http";
import * as sharepoint from "../../http/sharepoint";
import * as modelos from "../../http/modelosArquivo";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../http/sharepoint", () => ({
    ...jest.requireActual("../../http/sharepoint"), listFiles: jest.fn(), getCapabilities: jest.fn(),
}));
jest.mock("../../http/modelosArquivo", () => ({
    ...jest.requireActual("../../http/modelosArquivo"), listModelos: jest.fn(),
    startModeloCopy: jest.fn(), getModeloCopy: jest.fn(),
}));

afterEach(() => {
    localStorage.clear();
    delete process.env.REACT_APP_MODEL_CATALOG_ENABLED;
});

test("opens the copied destination inside the normal editable files explorer and can return to root", async () => {
    process.env.REACT_APP_MODEL_CATALOG_ENABLED = "true";
    localStorage.setItem("userID", "9");
    localStorage.setItem("authToken", "test-token");
    localStorage.setItem("model-copy:9:197", JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key: "existing-key",
        operation: { id: "op-1", estado: "PENDENTE" },
    }));
    (http.get as jest.Mock).mockImplementation((path: string) => Promise.resolve({
        data: path.startsWith("usuarios") ? { papel: "ADMIN" } : { id: 197, nomecomercial: "Cliente" },
    }));
    (modelos.getModeloCopy as jest.Mock).mockResolvedValue({
        id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destination", nomePastaDestino: "Admissão entregue",
    });
    (sharepoint.getCapabilities as jest.Mock).mockResolvedValue({
        linksEnabled: true, canUpload: true, canDelete: true, maxFileSizeBytes: 10485760,
    });
    (sharepoint.listFiles as jest.Mock).mockImplementation((_id, parentId) => Promise.resolve(
        parentId === "destination" ? [{
            id: "document", name: "Contrato copiado.docx", folder: null, size: 2048,
            webUrl: null, contentType: null, lastModifiedDateTime: null,
        }] : []
    ));
    render(<ArquivosCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta de destino" }));
    expect(await screen.findByText("Contrato copiado.docx")).toBeInTheDocument();
    expect(sharepoint.listFiles).toHaveBeenLastCalledWith(197, "destination");
    expect(screen.getByLabelText("Editar Contrato copiado.docx")).toBeInTheDocument();
    expect(screen.getByLabelText("Visualizar Contrato copiado.docx")).toBeInTheDocument();
    expect(screen.getByLabelText("Baixar Contrato copiado.docx")).toBeInTheDocument();
    expect(screen.getByLabelText("Excluir Contrato copiado.docx")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Arquivos Editáveis" }));
    await waitFor(() => expect(sharepoint.listFiles).toHaveBeenLastCalledWith(197, undefined));
    expect(modelos.startModeloCopy).not.toHaveBeenCalled();
});
