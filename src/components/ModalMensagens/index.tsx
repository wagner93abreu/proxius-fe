import { useSyncExternalStore } from "react";
import { assinarMensagens, fecharMensagem, getMensagemAtual } from "../../stores/mensagem.store";
import ModalErro from "../ModalErro";

export default function ModalMensagens() {
    const mensagem = useSyncExternalStore(assinarMensagens, getMensagemAtual);

    return (
        <ModalErro
            open={mensagem !== null}
            message={mensagem?.message ?? ""}
            severity={mensagem?.severity}
            onClose={fecharMensagem}
        />
    );
}
