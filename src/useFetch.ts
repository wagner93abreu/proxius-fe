import { useEffect, useState } from "react";
import { localApiURL, tenantRequestHeaders } from "./http";

export default function useFetch<T>({url} : {url : string}){
    const [dados, setDados] = useState<T | null>(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        fetch(`${localApiURL}${url}`, { headers: tenantRequestHeaders() }).then(
            resposta => resposta.json()
        ).then(dados => setDados(dados)).catch((erro => setErro(erro)))
    }, [url])

    return {dados, erro}
}