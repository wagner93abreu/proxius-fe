import { useEffect, useState } from "react";
import { localApiURL } from "./http";

export default function useFetch<T>({url} : {url : string}){
    const [dados, setDados] = useState<T | null>(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        fetch(`${localApiURL}${url}`).then(
            resposta => resposta.json()
        ).then(dados => setDados(dados)).catch((erro => setErro(erro)))
    }, [url])

    return {dados, erro}
}