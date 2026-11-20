import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModalErro from ".";

test("shows an accessible themed error and focuses its confirmation", () => {
    render(<ModalErro open message="Confira seus dados." onClose={jest.fn()} />);

    expect(screen.getByRole("alertdialog", { name: "Não foi possível continuar" }))
        .toHaveAccessibleDescription("Confira seus dados.");
    expect(screen.getByRole("button", { name: "Entendi" })).toHaveFocus();
});

test("allows dismissing with confirmation, close icon and Escape", () => {
    const onClose = jest.fn();
    render(<ModalErro open message="Erro de conexão." onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar mensagem de erro" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape", code: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(3);
});

test("does not render a closed dialog", async () => {
    const { rerender } = render(<ModalErro open message="Erro." onClose={jest.fn()} />);
    rerender(<ModalErro open={false} message="Erro." onClose={jest.fn()} />);

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});
