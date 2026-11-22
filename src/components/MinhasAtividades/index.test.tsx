import { render, screen, within } from "@testing-library/react";
import MinhasAtividades from "./index";
import http from "../../http";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({ __esModule: true, default: { usuario: "test-token" } }));
jest.mock("../../stores/mensagem.store", () => ({ mostrarMensagem: jest.fn() }));

it("renders multiline task descriptions as text instead of an autosizing textarea", async () => {
    localStorage.setItem("userID", "test-user");
    const description = "Primeira linha\nSegunda linha " + "x".repeat(200);
    (http.get as jest.Mock).mockImplementation((url: string) => {
        if (url.startsWith("clifor/")) return Promise.resolve({ data: [{ id: 197 }] });
        if (url.startsWith("card/")) return Promise.resolve({ data: [{
            id: "test-card", nome: "Cliente", statusId: 8, tasks: [{
                id: "test-task", description, visible: 1, done: false,
                createdAt: "2026-01-01T00:00:00", sessao: "",
            }],
        }] });
        if (url.startsWith("usuarios")) return Promise.resolve({ data: { content: [] } });
        return Promise.resolve({ data: [] });
    });
    const { container } = render(<MinhasAtividades />);
    const text = await screen.findByText((_, element) =>
        element?.tagName === "DIV" && element.textContent === description);
    expect(text.textContent).toBe(description);
    expect(text).toHaveStyle({ whiteSpace: "pre-wrap", overflowWrap: "anywhere" });
    const cell = text.closest("td")!;
    expect(within(cell).queryByRole("textbox")).not.toBeInTheDocument();
    expect(container.querySelector("textarea")).toBeNull();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    localStorage.removeItem("userID");
});
