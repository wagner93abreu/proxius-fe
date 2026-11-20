import { useState } from "react";
import { Checkbox, FormControlLabel, FormGroup, Modal, Switch } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import CampoDigitacao from "../../../components/CampoDigitacao";
import Botao from "../../../components/Botao";
import Subtitulo from "../../../components/Subtitulo";
import usePost from "../../../usePost";
import autenticaStore from "../../../stores/autentica.store";
import IUsuario from "../../../types/IUsuario";
import CampoSelect from "../../../components/CampoSelect";
import http from "../../../http";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30vw;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--branco);
  border: none;
  border-radius: 16px;
  padding: 1em 5em;
`;

const Container = styled.div`
text-align: left;
`

const ContainerSwitch = styled.div`
text-align: center;
`

const TextoSwitch = styled.p`
color: var(--cinza);
`

const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`

const ContainerEndereco = styled.div`
display: grid;
grid-template-columns: 2fr 1fr;
grid-gap: 0 1em;
`

export default function ModalCadastro({ open, handleClose }: { open: boolean, handleClose: () => void }) {
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [nome, setNome] = useState("");
    const [sobrenome, setSobrenome] = useState("");
    const [papel, setPapel] = useState("");
    const [password, setPassword] = useState("");
    const [senhaVerificada, setSenhaVerificada] = useState("");
    const {cadastrarDados} = usePost();
    const {usuario} = autenticaStore;    

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const user: IUsuario = {
            login: login,
            email: email,
            password: password,
            nome: nome,
            papel: papel,
            active: true    

        }

        const axiosConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${usuario.token}`,
            },
          };

        http.post('login', user, axiosConfig)
        .then(resposta => {            
            //console.log("Cadastro efetuado com sucesso!")
            //console.log(JSON.stringify(resposta))

        })
        .catch(erro => {
          //console.log("erro" + erro)
            mostrarMensagem(erro, "error")
          
        })
    }

    const papeis = ["", "CLIENTE", "COLABORADOR", "ATENDIMENTO", "ADMIN"]

    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado>
                    <Titulo>Cadastre o especialista inserindo os dados abaixo:</Titulo>
                    <form onSubmit={handleSubmit}>
                        <Container>
                            <CampoDigitacao required={true} tipo="text" label="Login" valor={login} placeholder="Digite seu login" onChange={setLogin} />
                            <CampoDigitacao required={true} tipo="text" label="Nome" valor={nome} placeholder="Digite seu nome" onChange={setNome} />
                            <CampoDigitacao required={true} tipo="text" label="Sobrenome" valor={sobrenome} placeholder="Digite seu sobrenome" onChange={setSobrenome} />
                            <CampoDigitacao required={true} tipo="email" label="Email" valor={email} placeholder="Digite seu email" onChange={setEmail} />
                            <CampoDigitacao required={true} tipo="password" label="Senha" valor={password} placeholder="Digite sua senha" onChange={setPassword} />
                            <CampoDigitacao required={true} tipo="password" label="Repita a senha" valor={senhaVerificada} placeholder="Digite sua senha novamente" onChange={setSenhaVerificada} />
                            <CampoSelect required={true} label="Papel" valor={papel} itens={papeis} onChange={value => setPapel(value)} />
                                                     
                        </Container>

                        {/* <Subtitulo>Papel:</Subtitulo>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox onChange={handleChange} value="CLIENTE" />} label="Cliente" />
                            <FormControlLabel control={<Checkbox onChange={handleChange} value="COLABORADOR" />} label="Colaborador" />
                            <FormControlLabel control={<Checkbox onChange={handleChange} value="ADMIN" />} label="Admin" />

                        </FormGroup> */}

                        <BotaoCustomizado>Cadastrar</BotaoCustomizado>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}