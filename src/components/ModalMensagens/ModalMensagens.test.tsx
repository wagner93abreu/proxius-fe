import { StrictMode, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Dialog, DialogContent } from "@mui/material";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import ModalMensagens from ".";
import AlertPortal from "../AlertPortal";
import { fecharMensagem, getMensagemAtual, mostrarMensagem } from "../../stores/mensagem.store";

afterEach(() => {
    act(() => {
        while (getMensagemAtual()) fecharMensagem();
    });
    jest.useRealTimers();
});

test("queues messages created before mounting and resolves each only after dismissal", async () => {
    const firstClosed = jest.fn();
    const secondClosed = jest.fn();
    void mostrarMensagem("Erro de conexão.").then(firstClosed);
    void mostrarMensagem("Registro salvo.", "success").then(secondClosed);
    render(<ModalMensagens />);

    expect(screen.getByRole("alertdialog", { name: "Não foi possível continuar" })).toHaveTextContent("Erro de conexão.");
    expect(firstClosed).not.toHaveBeenCalled();
    expect(secondClosed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));

    await waitFor(() => expect(firstClosed).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("alertdialog", { name: "Tudo certo!" })).toHaveTextContent("Registro salvo.");
    expect(secondClosed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Fechar mensagem" }));

    await waitFor(() => expect(secondClosed).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("keeps messages visible after the originating route unmounts", async () => {
    function Origin() {
        const navigate = useNavigate();
        return <button onClick={() => {
            void mostrarMensagem("Dados salvos.", "success");
            navigate("/destino");
        }}>Salvar</button>;
    }
    render(
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<Origin />} />
                <Route path="/destino" element={<div>Destino</div>} />
            </Routes>
            <ModalMensagens />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Dados salvos.");
    expect(screen.getByText("Destino")).toBeInTheDocument();
});

test("bridges AlertPortal without duplicates in StrictMode and allows repeated identical messages", async () => {
    const onClose = jest.fn();
    function Origin() {
        const [show, setShow] = useState(true);
        return <>
            <button onClick={() => setShow(true)}>Repetir</button>
            <AlertPortal show={show} message="Verifique os dados." severity="warning" onClose={() => {
                setShow(false);
                onClose();
            }} />
        </>;
    }
    render(<StrictMode><Origin /><ModalMensagens /></StrictMode>);
    expect(await screen.findByRole("alertdialog", { name: "Atenção" })).toHaveTextContent("Verifique os dados.");
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Verifique os dados.");
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
});

test("keeps the error above an existing form dialog and restores focus on closing", async () => {
    render(<>
        <Dialog open>
            <DialogContent>
                <button onClick={() => { void mostrarMensagem("Falha no formulário."); }}>Salvar formulário</button>
            </DialogContent>
        </Dialog>
        <ModalMensagens />
    </>);
    const save = screen.getByRole("button", { name: "Salvar formulário" });
    save.focus();
    fireEvent.click(save);

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Falha no formulário.");
    expect(screen.getByRole("button", { name: "Entendi" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(save).toHaveFocus();
});

test("does not auto-dismiss portal messages and supports clicking the backdrop", async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { container } = render(<>
        <AlertPortal show message="Aviso persistente." severity="info" onClose={onClose} />
        <ModalMensagens />
    </>);
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByRole("alertdialog", { name: "Informação" })).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    const backdrop = container.ownerDocument.querySelector(".MuiDialog-container");
    if (!backdrop) throw new Error("Modal backdrop not found");
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    await act(async () => { await Promise.resolve(); });
    expect(onClose).toHaveBeenCalledTimes(1);
});
