import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import PastasCliente from ".";
import { isSharePointEnabled } from "../../http/sharepoint";
import userEvent from "@testing-library/user-event";

jest.mock("../ArquivosCliente", () => ({ cliforId }: { cliforId: number }) => <div>Arquivos editáveis SPE {cliforId}</div>);
jest.mock("../BibliotecaCliente", () => ({ cliforId }: { cliforId: number }) => <div>Biblioteca autenticada {cliforId}</div>);
jest.mock("../../http/sharepoint", () => ({
    isSharePointEnabled: jest.fn(() => false),
}));

const staticUrl =
    "https://rhsemcomplicacoes.sharepoint.com/:f:/s/RHsemComplicaes/IgBpUq4xTwTzS4piLxfF3VMOAbj-v4RLlpVyEsUl8vSv3yw";
const originalLocation = window.location;

beforeEach(() => {
    Object.defineProperty(window, "location", {
        configurable: true, value: { ...originalLocation, hostname: "rhsemcomplicacoes.example.com" },
    });
    delete process.env.REACT_APP_LIBRARY_ENABLED;
    (isSharePointEnabled as jest.Mock).mockReturnValue(false);
});

afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    delete process.env.REACT_APP_LIBRARY_ENABLED;
    jest.restoreAllMocks();
});

test("never opens legacy or static SharePoint URLs in local tenant mode while Embedded is disabled", () => {
    Object.defineProperty(window, "location", {
        configurable: true, value: { ...originalLocation, hostname: "a.localhost" },
    });
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<PastasCliente linkCliente="https://example.test/edit" cliforId={197} sharePointEmbeddedEnabled />);

    expect(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeDisabled();
    expect(open).not.toHaveBeenCalled();
});

test("keeps the legacy library link and editable-files behavior with the library flag off", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<PastasCliente linkCliente="https://example.test/edit" cliforId={197} sharePointEmbeddedEnabled />);

    fireEvent.click(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" }));

    expect(open).toHaveBeenCalledWith(staticUrl, "_blank");
    expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    expect(open).toHaveBeenCalledWith("https://example.test/edit", "_blank");
    expect(screen.queryByText(/Biblioteca autenticada/)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens the authenticated library only in its modal and preserves editable-files fallback", async () => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    render(<PastasCliente linkCliente="https://example.test/edit" cliforId={197} sharePointEmbeddedEnabled />);

    expect(screen.queryByText(/Biblioteca autenticada/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Biblioteca RH sem Complicações" });
    userEvent.click(button);
    const dialog = await screen.findByRole("dialog", { name: "Biblioteca RH sem Complicações" });
    expect(within(dialog).getByText("Biblioteca autenticada 197")).toBeInTheDocument();
    expect(screen.queryByText(/Arquivos editáveis SPE/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
});

test("opens editable files independently and provides the same light dialog theme", async () => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    render(<PastasCliente cliforId={198} sharePointEmbeddedEnabled />);

    expect(screen.queryByText(/Arquivos editáveis SPE/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    const dialog = await screen.findByRole("dialog", { name: "Arquivos Editáveis" });
    expect(dialog).toHaveStyle({ backgroundColor: "#fffdfa" });
    expect(within(dialog).getByText("Arquivos editáveis SPE 198")).toBeInTheDocument();
    expect(screen.queryByText(/Biblioteca autenticada/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar arquivos" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" }));
    expect(await screen.findByText("Biblioteca autenticada 198")).toBeInTheDocument();
    expect(screen.queryByText(/Arquivos editáveis SPE/)).not.toBeInTheDocument();
});

test("retains the static library when only SharePoint is enabled", async () => {
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<PastasCliente cliforId={197} sharePointEmbeddedEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" }));
    expect(open).toHaveBeenCalledWith(staticUrl, "_blank");
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    expect(await screen.findByRole("dialog", { name: "Arquivos Editáveis" })).toBeInTheDocument();
});

test.each([null, ""])("reports an unidentified client inside the library modal (%s)", async (cliforId) => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    render(<PastasCliente cliforId={cliforId} sharePointEmbeddedEnabled />);
    expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível identificar o cliente para carregar a biblioteca."
    );
    expect(screen.queryByText(/Biblioteca autenticada/)).not.toBeInTheDocument();
});

test("never redirects to legacy storage when Embedded is enabled but the client ID is missing", async () => {
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<PastasCliente linkCliente="https://example.test/legacy" cliforId={null} sharePointEmbeddedEnabled />);

    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível identificar o cliente para carregar os arquivos editáveis."
    );
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByText(/Arquivos editáveis SPE/)).not.toBeInTheDocument();
});

test.each([undefined, false])("keeps both standard links for a record without opt-in (%s), even with both global flags enabled", (enabled) => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<PastasCliente linkCliente="https://example.test/legacy" cliforId={197} sharePointEmbeddedEnabled={enabled} />);

    fireEvent.click(screen.getByRole("button", { name: "Biblioteca RH sem Complicações" }));
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    expect(open).toHaveBeenCalledWith(staticUrl, "_blank");
    expect(open).toHaveBeenCalledWith("https://example.test/legacy", "_blank");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Arquivos editáveis SPE|Biblioteca autenticada/)).not.toBeInTheDocument();
});

test("turning off the record closes Embedded content and does not expose editable actions without a legacy link", async () => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    (isSharePointEnabled as jest.Mock).mockReturnValue(true);
    const { rerender } = render(<PastasCliente cliforId={197} sharePointEmbeddedEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    expect(await screen.findByText("Arquivos editáveis SPE 197")).toBeInTheDocument();
    rerender(<PastasCliente cliforId={197} sharePointEmbeddedEnabled={false} />);
    expect(screen.queryByText(/Arquivos editáveis SPE/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeDisabled();
});
