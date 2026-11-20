import styled from "styled-components";
import logo from "./logo.png";
import { Step, StepLabel, Stepper } from "@mui/material";
import { useState } from 'react';
import Botao from "../../components/Botao";
import CampoDigitacao from "../../components/CampoDigitacao";
import IClinica from "../../types/IClinica";
import usePost from "../../usePost";
import { useNavigate } from "react-router-dom";
import { mostrarMensagem } from "../../stores/mensagem.store";

const Imagem = styled.img`
  padding: 2em 0;
`;

interface PropsCustomizadas {
    cor: string
}

const StepCustomizada = styled.div<PropsCustomizadas>`
    background-color: ${({cor}) => cor};
    width: 16px;
    height: 16px;
    border-radius: 50%;
`

const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: var(--cinza);
`;

const Formulario = styled.form`
  width: 70%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BotaoCustomizado = styled(Botao)`
  width: 50%;
`;

const Container = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 30% 65%;
  justify-content: space-between
`;


export default function Cadastro() {
    const [etapaAtiva, setEtapaAtiva] = useState(0);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [senhaVerificada, setSenhaVerificada] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [pais, setPais] = useState('');
    const [cidade, setidade] = useState('');
    const [bairro, setBairro] = useState('');
    const [numero, setNumero] = useState('');
    const [uf, setUf] = useState('');
    const [complemento, setComplemento] = useState('');
    const {cadastrarDados, erro, sucesso} = usePost();
    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // previne o envio padrão do formulário

      
        const clinica: IClinica = {
            email: email,
            nome: nome,
            senha: senha,
            endereco: {
                pais: pais,
                cidade: cidade,
                bairro: bairro,
                cep: cep,
                logradouro: logradouro,
                numero: numero,
                complemento: complemento,
                uf: uf
            }
        }

        if (etapaAtiva !== 0) {
            try {
                cadastrarDados({url: 'clinica', dados: clinica});
                navigate('/login');
            } catch (erro) {
                erro && mostrarMensagem('Erro ao cadastrar os dados', "error")
            }
        }

        setEtapaAtiva(etapaAtiva + 1); // atualiza o uf da etapa para a próxima etapa
    }


    return (
        <>
        <Imagem src={logo} alt="Logo da Voll" />
        <Stepper activeStep={etapaAtiva}>
            <Step>
                <StepLabel 
                StepIconComponent={(props) => (
                    <StepCustomizada cor={props.active ? 'lightblue' : 'lightgray'} />
                )}
                />
            </Step>
            <Step>
            <StepLabel 
                StepIconComponent={(props) => (
                    <StepCustomizada cor={props.active ? 'lightblue' : 'lightgray'} />
                )}
                />
            </Step>
        </Stepper>

        {etapaAtiva === 0 ? (
                <>
                    <Titulo>Primeiro, alguns dados básicos:</Titulo>
                    <Formulario onSubmit={handleSubmit}>
                        <CampoDigitacao
                            tipo="text"
                            label="Nome"
                            valor={nome}
                            placeholder="Insira seu nome"
                            onChange={setNome}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="text"
                            label="CNPJ"
                            valor={cnpj}
                            placeholder="Insira seu cnpj"
                            onChange={setCnpj}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="email"
                            label="Email"
                            valor={email}
                            placeholder="Insira o endereço de e-mail para login"
                            onChange={setEmail}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="password"
                            label="Senha"
                            valor={senha}
                            placeholder="Digite sua senha"
                            onChange={setSenha}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="password"
                            label="Confirme a senha"
                            valor={senhaVerificada}
                            placeholder="Confirme sua senha"
                            onChange={setSenhaVerificada}
                            required={true}
                        />
                        <BotaoCustomizado type="submit">Avançar</BotaoCustomizado>
                    </Formulario>
                </>) : (
                <>
                    <Titulo>Agora, os dados técnicos:</Titulo>
                    <Formulario onSubmit={handleSubmit}>
                        <CampoDigitacao
                            tipo="tel"
                            label="Telefone"
                            valor={telefone}
                            placeholder="(DDD) XXXXX-XXXX"
                            onChange={setTelefone}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="number"
                            label="CEP"
                            valor={cep}
                            placeholder="Insira o CEP"
                            onChange={setCep}
                            required={true}
                        />
                        <CampoDigitacao
                            tipo="text"
                            label="Rua"
                            valor={logradouro}
                            placeholder="Rua"
                            onChange={setLogradouro}
                            required={true}
                        />
                        <Container>
                            <CampoDigitacao
                                tipo="number"
                                valor={numero}
                                placeholder="Número"
                                onChange={setNumero}
                                required={true}
                            />
                            <CampoDigitacao
                                tipo="text"
                                valor={complemento}
                                placeholder="Complemento"
                                onChange={setComplemento}
                                required={true}
                            />
                            <CampoDigitacao
                                tipo="text"
                                valor={uf}
                                placeholder="Estado"
                                onChange={setUf}
                                required={true}
                            />
                        </Container>
                        <BotaoCustomizado type="submit">Cadastrar</BotaoCustomizado>
                    </Formulario>
                </>
    )
    
} 
</> 
)
}