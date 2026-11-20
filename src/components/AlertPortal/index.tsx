import { useEffect, useRef } from "react";
import { mostrarMensagem, TipoMensagem } from "../../stores/mensagem.store";

interface AlertPortalProps {
    show: boolean;
    message: string;
    severity: TipoMensagem;
    onClose: () => void;
}

export default function AlertPortal({ show, message, severity, onClose }: AlertPortalProps) {
    const anterior = useRef({ show: false, message: "", severity });

    useEffect(() => {
        const mudou = !anterior.current.show || anterior.current.message !== message || anterior.current.severity !== severity;
        anterior.current = { show, message, severity };
        if (show && mudou) {
            void mostrarMensagem(message, severity).then(onClose);
        }
    }, [show, message, severity, onClose]);

    return null;
}
