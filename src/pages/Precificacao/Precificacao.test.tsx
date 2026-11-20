import React from "react";
import { act, render, screen } from "@testing-library/react";
import Precificacao from ".";
import http from "../../http";
import IPrecificacao from "../../types/IPrecificacao";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token" } },
}));
jest.mock("./Modal", () => () => null);
jest.mock("@mui/x-data-grid", () => ({
    DataGrid: ({ rows }: { rows: IPrecificacao[] }) => (
        <div>{rows.map(row => <span key={row.id}>{row.cupom}</span>)}</div>
    ),
}));

const get = http.get as jest.MockedFunction<typeof http.get>;
const price = (cupom: string): IPrecificacao => ({
    id: 1, idproduto: 4, valor: 100, moeda: "BRL", data: "",
    cupom, linkpgto: "", active: true,
});

beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({ data: [] });
    jest.spyOn(window, "alert").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

test("waits for the product ID before fetching authenticated prices", async () => {
    const { rerender } = render(<Precificacao idProd="" />);
    expect(get).not.toHaveBeenCalled();
    get.mockResolvedValue({ data: [price("PRODUTO-4")] });

    rerender(<Precificacao idProd="4" />);

    expect(await screen.findByText("PRODUTO-4")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("precificacao/produto/4", expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
    }));
    expect(get).toHaveBeenCalledTimes(1);
});

test("clears old prices and fetches again when the selected product changes", async () => {
    get.mockResolvedValueOnce({ data: [price("PRODUTO-4")] });
    const { rerender } = render(<Precificacao idProd="4" />);
    await screen.findByText("PRODUTO-4");
    get.mockResolvedValueOnce({ data: [price("PRODUTO-5")] });

    rerender(<Precificacao idProd="5" />);

    expect(screen.queryByText("PRODUTO-4")).not.toBeInTheDocument();
    expect(await screen.findByText("PRODUTO-5")).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith("precificacao/produto/5", expect.anything());
});

test("ignores a previous product's response after switching products", async () => {
    let finishOldRequest!: (response: { data: IPrecificacao[] }) => void;
    get.mockReturnValueOnce(new Promise(resolve => { finishOldRequest = resolve; }));
    const { rerender } = render(<Precificacao idProd="4" />);
    get.mockResolvedValueOnce({ data: [price("PRODUTO-5")] });
    rerender(<Precificacao idProd="5" />);
    await screen.findByText("PRODUTO-5");

    await act(async () => {
        finishOldRequest({ data: [price("PRODUTO-4")] });
    });

    expect(screen.queryByText("PRODUTO-4")).not.toBeInTheDocument();
    expect(screen.getByText("PRODUTO-5")).toBeInTheDocument();
});

test("clears prices without requesting an invalid URL when the product is deselected", async () => {
    get.mockResolvedValueOnce({ data: [price("PRODUTO-4")] });
    const { rerender } = render(<Precificacao idProd="4" />);
    await screen.findByText("PRODUTO-4");

    rerender(<Precificacao idProd="" />);

    expect(screen.queryByText("PRODUTO-4")).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(1);
});
