import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import http from "./http";
import { PublicPhotoConfigProvider, usePublicPhotoBaseUrl } from "./PublicPhotoConfig";

jest.mock("./http", () => ({ __esModule: true, default: { get: jest.fn() } }));

function Photo() {
    const url = usePublicPhotoBaseUrl();
    return <span>{url ? `${url}1/foto_perfil.png` : "sem foto"}</span>;
}

beforeEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: { hostname: "rhsc.localhost" } });
    (http.get as jest.Mock).mockReset();
});

test("utiliza a URL recebida em tempo de execução e adiciona a barra", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: { publicPhotoBaseUrl: "https://fotos.example.test/base" } });
    render(<PublicPhotoConfigProvider><Photo /></PublicPhotoConfigProvider>);
    expect(await screen.findByText("https://fotos.example.test/base/1/foto_perfil.png")).toBeInTheDocument();
    expect(http.get).toHaveBeenCalledWith("public-config");
});

test("informa falha e permite tentar novamente", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    (http.get as jest.Mock).mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce({ data: { publicPhotoBaseUrl: "https://fotos.example.test/" } });
    render(<PublicPhotoConfigProvider><Photo /></PublicPhotoConfigProvider>);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("sem foto")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tentar novamente"));
    expect(await screen.findByText("https://fotos.example.test/1/foto_perfil.png")).toBeInTheDocument();
    log.mockRestore();
});
