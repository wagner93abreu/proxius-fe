import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { mostrarMensagem } from "./stores/mensagem.store";

jest.mock("./AppRoutes", () => ({
    __esModule: true,
    default: () => <div>Rotas da aplicação</div>,
}));

test("mounts the shared message dialog alongside the application routes", async () => {
    render(<App />);
    expect(screen.getByText("Rotas da aplicação")).toBeInTheDocument();

    act(() => { void mostrarMensagem("Falha ao carregar os dados."); });
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Falha ao carregar os dados.");
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});
