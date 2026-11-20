import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import http from "../../../http";
import IProduto, { formatDuracaoAcesso } from "../../../types/IProduto";
import ModalProduto from ".";

jest.mock("../../../http", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock("../../Precificacao", () => () => <div>Precificação</div>);

const mockedHttp = http as jest.Mocked<typeof http>;
const createObjectURL = jest.fn();
const revokeObjectURL = jest.fn();
Object.assign(URL, { createObjectURL, revokeObjectURL });

const produto: IProduto = {
    id: 4,
    origem: "ORIGEM",
    nome: "Admissão",
    descricao: "Produto de teste",
    regras: "",
    active: true,
    duracaoAcessoQuantidade: 30,
    duracaoAcessoUnidade: "DIA",
};

test("formats default access durations for product listings", () => {
    expect(formatDuracaoAcesso(30, "DIA")).toBe("30 dias");
    expect(formatDuracaoAcesso(1, "MES")).toBe("1 mês");
    expect(formatDuracaoAcesso(null, null)).toBe("Sem expiração");
});

beforeEach(() => {
    jest.clearAllMocks();
    createObjectURL.mockReturnValue("blob:produto");
    mockedHttp.post.mockResolvedValue({ data: produto } as never);
    mockedHttp.put.mockResolvedValue({ data: produto } as never);
    mockedHttp.delete.mockResolvedValue({ status: 204 } as never);
    jest.spyOn(window, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function preencherCadastro() {
    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "ORIGEM" } });
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Admissão" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Produto de teste" } });
}

function selecionarArquivo(arquivo: File) {
    const input = screen.getByLabelText("Foto do produto (opcional)");
    fireEvent.change(input, { target: { files: [arquivo] } });
    return input;
}

test("creates active products with no expiration by default", async () => {
    render(<ModalProduto open handleClose={jest.fn()} produtos={[]} id={[]} tipo="cadastra" />);

    expect(screen.getByLabelText("Sem expiração")).toBeChecked();
    expect(screen.getByRole("switch", { name: "Ativo" })).toBeChecked();
    preencherCadastro();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(mockedHttp.post).toHaveBeenCalledWith(
        "produtos",
        expect.objectContaining({
            duracaoAcessoQuantidade: null,
            duracaoAcessoUnidade: null,
            active: true,
            videoUrl: "",
            detalhes: "",
        }),
        expect.anything()
    ));
});

test("loads and submits configured duration when editing a product", async () => {
    const editado = { ...produto, active: false, videoUrl: "https://youtu.be/AbCdEf_1234", detalhes: "Linha 1\nLinha 2" };
    render(<ModalProduto open handleClose={jest.fn()} produtos={[editado]} id={[4]} tipo="edita" />);

    expect(screen.getByLabelText("Sem expiração")).not.toBeChecked();
    expect(screen.getByLabelText("Nome")).toHaveValue("Admissão");
    expect(screen.getByRole("spinbutton")).toHaveValue(30);
    expect(screen.getByLabelText("Unidade da duração")).toHaveValue("DIA");
    expect(screen.getByRole("switch", { name: "Ativo" })).not.toBeChecked();
    expect(screen.getByLabelText("Link do vídeo no YouTube (opcional)")).toHaveValue(editado.videoUrl);
    expect(screen.getByLabelText("Detalhes (opcional)")).toHaveValue(editado.detalhes);
    fireEvent.change(screen.getByLabelText("Link do vídeo no YouTube (opcional)"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(mockedHttp.put).toHaveBeenCalledWith(
        "produtos",
        expect.objectContaining({
            id: "4",
            duracaoAcessoQuantidade: 30,
            duracaoAcessoUnidade: "DIA",
            active: false,
            videoUrl: "",
            detalhes: editado.detalhes,
        }),
        expect.anything()
    ));
});

test("requires a positive integer and duration unit when expiration is enabled", async () => {
    render(<ModalProduto open handleClose={jest.fn()} produtos={[]} id={[]} tipo="cadastra" />);
    preencherCadastro();
    fireEvent.click(screen.getByLabelText("Sem expiração"));
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Informe um número inteiro positivo")).toBeInTheDocument();
    expect(screen.getByText("Selecione uma unidade")).toBeInTheDocument();
    expect(mockedHttp.post).not.toHaveBeenCalled();
});

test.each([
    "https://youtube.com.evil.example/watch?v=AbCdEf_1234",
    "https://youtube.com/watch",
    "https://youtube.com/watch?v=short",
    "https://youtube.com/watch?v=AbCdEf_1234&v=AbCdEf_1234",
    "https://youtube.com:8080/watch?v=AbCdEf_1234",
    "https://usuario@youtube.com/watch?v=AbCdEf_1234",
    "https://@youtube.com/watch?v=AbCdEf_1234",
    "https:///youtube.com/watch?v=AbCdEf_1234",
    "https://youtu.be/",
    "https://www.youtube.com/playlist?list=AbCdEf_1234",
    "http://www.youtube.com/watch?v=AbCdEf_1234",
])("rejects links that do not identify a YouTube video: %s", async videoUrl => {
    render(<ModalProduto open handleClose={jest.fn()} produtos={[]} id={[]} tipo="cadastra" />);
    preencherCadastro();
    fireEvent.change(screen.getByLabelText("Link do vídeo no YouTube (opcional)"), { target: { value: videoUrl } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText(/link HTTPS válido/)).toBeInTheDocument();
    expect(mockedHttp.post).not.toHaveBeenCalled();
});

test("validates the details length and sends a supported video link trimmed", async () => {
    render(<ModalProduto open handleClose={jest.fn()} produtos={[]} id={[]} tipo="cadastra" />);
    preencherCadastro();
    const detalhes = screen.getByLabelText("Detalhes (opcional)");
    expect(detalhes).toHaveAttribute("maxlength", "60000");
    fireEvent.change(detalhes, { target: { value: "x".repeat(60001) } });
    fireEvent.change(screen.getByLabelText("Link do vídeo no YouTube (opcional)"), {
        target: { value: "  https://m.youtube.com/shorts/AbCdEf_1234?feature=share  " },
    });
    const cadastrar = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(cadastrar);
    expect(await screen.findByText("Use até 60.000 caracteres.")).toBeInTheDocument();
    expect(mockedHttp.post).not.toHaveBeenCalled();

    const texto = "<b>Texto simples</b>\n" + "x".repeat(150);
    fireEvent.change(detalhes, { target: { value: texto } });
    fireEvent.click(cadastrar);
    await waitFor(() => expect(mockedHttp.post).toHaveBeenCalledWith(
        "produtos",
        expect.objectContaining({ detalhes: texto, videoUrl: "https://m.youtube.com/shorts/AbCdEf_1234?feature=share" }),
        expect.anything(),
    ));
});

test("checks MIME and size, resets the input, and revokes a discarded local preview", () => {
    render(<ModalProduto open handleClose={jest.fn()} produtos={[]} id={[]} tipo="cadastra" />);
    selecionarArquivo(new File(["x"], "foto.svg", { type: "image/svg+xml" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG, PNG ou WebP de até 5 MiB/);
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeDisabled();
    selecionarArquivo(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.jpg", { type: "image/jpeg" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();

    const arquivo = new File(["bytes"], "foto.webp", { type: "image/webp" });
    expect(selecionarArquivo(arquivo)).toHaveValue("");
    expect(screen.getByAltText("Prévia da nova foto do produto")).toHaveAttribute("src", "blob:produto");
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Desfazer alteração da foto" }));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:produto");
    selecionarArquivo(arquivo);
    expect(createObjectURL).toHaveBeenCalledTimes(2);
});

test("retries a failed photo upload using the saved ID without creating a duplicate product", async () => {
    let rejeitarUpload!: (erro: Error) => void;
    mockedHttp.post
        .mockResolvedValueOnce({ data: { id: 19 } } as never)
        .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejeitarUpload = reject; }))
        .mockResolvedValueOnce({ status: 204 } as never);
    const fechar = jest.fn();
    render(<ModalProduto open handleClose={fechar} produtos={[]} id={[]} tipo="cadastra" />);
    preencherCadastro();
    const arquivo = new File(["bytes"], "foto.png", { type: "image/png" });
    selecionarArquivo(arquivo);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(mockedHttp.post).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(mockedHttp.post.mock.calls[0][0]).toBe("produtos");
    const [endpoint, body, config] = mockedHttp.post.mock.calls[1];
    expect(endpoint).toBe("produtos/19/foto");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(arquivo);
    expect(config?.headers).toEqual({ Authorization: expect.any(String) });
    expect(fechar).not.toHaveBeenCalled();

    await act(async () => rejeitarUpload(Object.assign(new Error("upload failed"), {
        isAxiosError: true,
        response: { status: 503 },
    })));
    expect(screen.getByRole("alert")).toHaveTextContent(/Produto salvo, mas não foi possível enviar a foto/);
    expect(screen.getByRole("alert")).toHaveTextContent(/armazenamento de fotos está indisponível neste ambiente/);
    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByAltText("Prévia da nova foto do produto")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente com a foto" }));
    await waitFor(() => expect(fechar).toHaveBeenCalledTimes(1));
    expect(mockedHttp.post.mock.calls.map(([url]) => url)).toEqual([
        "produtos", "produtos/19/foto", "produtos/19/foto",
    ]);
    expect(mockedHttp.put).not.toHaveBeenCalled();
});

test("loads the current photo with auth, retries removal after saving, and revokes its preview", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: new Blob(["bytes"], { type: "image/jpeg" }) } as never);
    mockedHttp.delete.mockRejectedValueOnce(new Error("delete failed"));
    const fechar = jest.fn();
    const produtos = [{ ...produto, fotoDisponivel: true }];
    const { rerender } = render(<ModalProduto open handleClose={fechar} produtos={produtos} id={[4]} tipo="edita" />);

    expect(await screen.findByAltText("Foto atual do produto")).toHaveAttribute("src", "blob:produto");
    expect(mockedHttp.get).toHaveBeenCalledWith("produtos/4/foto", expect.objectContaining({
        headers: { Authorization: expect.any(String) },
        responseType: "blob",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Remover foto atual" }));
    expect(screen.queryByAltText("Foto atual do produto")).not.toBeInTheDocument();
    expect(mockedHttp.delete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Produto salvo, mas não foi possível remover a foto/);
    expect(fechar).not.toHaveBeenCalled();
    expect(mockedHttp.put.mock.invocationCallOrder[0]).toBeLessThan(mockedHttp.delete.mock.invocationCallOrder[0]);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente com a foto" }));
    await waitFor(() => expect(fechar).toHaveBeenCalledTimes(1));
    expect(mockedHttp.put).toHaveBeenCalledTimes(1);
    expect(mockedHttp.delete).toHaveBeenCalledTimes(2);
    expect(mockedHttp.delete).toHaveBeenLastCalledWith("produtos/4/foto", {
        headers: { Authorization: expect.any(String) },
    });
    rerender(<ModalProduto open={false} handleClose={fechar} produtos={produtos} id={[4]} tipo="edita" />);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:produto");
});

test("keeps the photo controls visible when the storage service rejects the preview", async () => {
    mockedHttp.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 503 } });
    render(<ModalProduto open handleClose={jest.fn()} produtos={[{ ...produto, fotoDisponivel: true }]} id={[4]} tipo="edita" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/armazenamento de fotos está indisponível neste ambiente/);
    expect(screen.getByLabelText("Foto do produto (opcional)")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
});
