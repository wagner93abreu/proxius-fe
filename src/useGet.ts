/* import { useState } from 'react';

export default function useGet() {
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [resposta, setResposta] = useState<[] | null>(null);

    async function getDados<T>({url, token} : 
        {url: string, token?: string}) {
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
            const resposta = await fetch(`http://localhost:8080/${url}`, {
                method: 'GET',
                headers
            })
            setSucesso(true);
            const respostaConvertida = await resposta.json();
            setResposta(respostaConvertida.token);
        } catch (erro) {
        setErro('Não foi possível enviar os dados');
    }
}

return {getDados, sucesso, erro, resposta}
} */



import { useEffect, useState } from "react";
import { localApiURL } from "./http";

export default function useGet<T>({url, token} : {url : string, token?: string}){
    const [dados, setDados] = useState<T | null>(null);
    const [erro, setErro] = useState('');

    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    useEffect(() => {
        fetch(`${localApiURL}${url}`, {
                method: 'GET',
                headers
            }).then(
            resposta => resposta.json()
            
        ).then(dados => setDados(dados)).catch((erro => setErro(erro)))
        
    }, [url])
    //console.log("resposta wag: " + dados)
    return {dados, erro}
}
