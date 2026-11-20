import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AtalhosAreaCliente from ".";
import userEvent from "@testing-library/user-event";

jest.mock("../AgendarSessao", () => () => <div>Agendamento</div>);
jest.mock("../Comentarios", () => () => <div>Comentários do cliente</div>);
jest.mock("../ArquivosCliente", () => ({ cliforId }: { cliforId: number }) => <div>Arquivos do cliente {cliforId}</div>);
jest.mock("../BibliotecaCliente", () => ({ cliforId }: { cliforId: number }) => <div>Biblioteca do cliente {cliforId}</div>);
jest.mock("../../http/sharepoint", () => ({ isSharePointEnabled: () => true }));
jest.mock("../../http/bibliotecas", () => ({ isLibraryEnabled: () => true }));

test.each([
    ["Biblioteca RH sem Complicações", "Biblioteca do cliente 197"],
    ["Arquivos Editáveis", "Arquivos do cliente 197"],
])("opens and closes %s from the mobile files shortcut", async (buttonName, content) => {
    render(
        <AtalhosAreaCliente atendenteId={1} atendente="Mentora" fotoAtendente=""
            cliforId={197} sharePointEmbeddedEnabled cardId="2" usuarioNome="Cliente" usuarioId={9} />
    );
    expect(screen.queryByText(content)).not.toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Pastas do cliente" }));
    const selection = await screen.findByRole("dialog");
    userEvent.click(within(selection).getByRole("button", { name: buttonName }));
    const explorer = await screen.findByRole("dialog", { name: buttonName });
    expect(within(explorer).getByText(content)).toBeInTheDocument();
    fireEvent.click(within(explorer).getByRole("button", { name: "Fechar", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: buttonName })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: buttonName })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Fechar", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Pastas do cliente" })).toHaveFocus());
});

test("mobile legacy records can open the standard library without a customer editable link", async () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<AtalhosAreaCliente atendenteId={null} atendente="" fotoAtendente=""
        cliforId={197} cardId={null} usuarioNome="Cliente" usuarioId={9} />);
    fireEvent.click(screen.getByRole("button", { name: "Pastas do cliente" }));
    const selection = await screen.findByRole("dialog");
    fireEvent.click(within(selection).getByRole("button", { name: "Biblioteca RH sem Complicações" }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("rhsemcomplicacoes.sharepoint.com"), "_blank");
    expect(within(selection).getByRole("button", { name: "Arquivos Editáveis" })).toBeDisabled();
    expect(screen.queryByText("Arquivos do cliente 197")).not.toBeInTheDocument();
    open.mockRestore();
});
