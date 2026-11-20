import { useState } from 'react';
import { mostrarMensagem } from "./stores/mensagem.store";
import { localApiURL } from "./http";

export default function usePost() {
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [resposta, setResposta] = useState('');

    async function cadastrarDados<T>({url, dados, token} : 
        {url: string, dados: T, token?: string}) {
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
            const resposta = await fetch(`${localApiURL}${url}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(dados)
            })
            setSucesso(true);
            const respostaConvertida = await resposta.json();
            setResposta(respostaConvertida.token);
            mostrarMensagem("cadastro efetuado com sucesso!: " + resposta, "success")
            //console.log("resposta")
            //console.log(resposta)
        } catch (erro) {
        setErro('Não foi possível enviar os dados');
    }
}

return {cadastrarDados, sucesso, erro, resposta}
}
