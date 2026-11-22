import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React, { useState } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IClifor from "../../../types/IClifor";
import { useForm, Controller } from "react-hook-form";
import InputMask from "react-input-mask";
import Select from 'react-select';
import { countries } from "../../../customFunctions/paises";
import { cidadeEstado } from "../../../customFunctions/cidadeEstado";
import { removeNotNumber, transformDate } from "../../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80vw;
  max-height: 90vh;
  overflow-y: auto;
  background-color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 1em 5em;
    ${managementDialogStyles}
`;

const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`
const Campo = styled.input`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`
const InputMaskCustomizado = styled(InputMask)`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`
const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
`

const CampoSelect = styled.select`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`
const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #242424
`
const ContainerInput = styled.div`
    width: 100%
`

const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

export default function ModalEdita({ editaOpen, editaHandleClose, clientefornecedor, id }: { editaOpen: boolean, editaHandleClose: () => void, clientefornecedor: IClifor[], id: GridRowId[] }) {

    const [nomesocial, setNomesocial] = useState("");
    const [nomecomercial, setNomecomercial] = useState("");
    const [cpfcnpj, setCpfcnpj] = useState("");
    const [preencheu, setPreencheu] = useState(false);
    const {usuario} = autenticaStore;
    const [pais, setPais] = useState("");

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const [selectedState, setSelectedState] = useState<{ value: string } | null>(null);
    const [output, setOutput] = useState("");
    const { register, handleSubmit, reset, formState:{errors}, watch, setValue, control} = useForm();
    const watchTipoCadastro = watch('tipoCadastro');
    const maskCpfCnpj = watchTipoCadastro === 'FISICA' ? '999.999.999-99' : '99.999.999/9999-99';

    const cityOptions = () => {        
        
        if (selectedState && selectedState.value != null) {
            const estadoCidades = cidadeEstado.cidades.find(estadoCidades => estadoCidades[0] === selectedState.value);
            if (estadoCidades && Array.isArray(estadoCidades[1])) {
                return estadoCidades[1].flat(2).map(cidade => ({ value: cidade, label: cidade }));
            }
        }
        return [];
    
    };

    React.useEffect(() => {
        if(watchTipoCadastro === 'FISICA'){
            setValue("tipoCadastro", 'FISICA' );
            //setValue("cpfcnpj", '' );
            setNomesocial('Nome')
            setNomecomercial('Sobrenome')
            setCpfcnpj("CPF")
        }else{
            setValue("tipoCadastro", 'JURIDICA' );
            //setValue("cpfcnpj", '' );
            setNomesocial('Nome Fantasia')
            setNomecomercial('Razão Social')
            setCpfcnpj("CNPJ")
        }

    }, [watchTipoCadastro]);

    if(editaOpen && !preencheu){
        const cliforEdita = clientefornecedor.find(item => item.id === id[0]);
        setPais(cliforEdita?.endereco.pais ? cliforEdita.endereco.pais : "")
        setValue('tipoCadastro', cliforEdita?.cpfcnpj ? (removeNotNumber(cliforEdita.cpfcnpj).length == 14 ? "JURIDICA" : "FISICA") : "")
        setValue('nomesocial', cliforEdita?.nomesocial ? cliforEdita.nomesocial : "")
        setValue('nomecomercial', cliforEdita?.nomecomercial ? cliforEdita.nomecomercial : "")
        setValue('cpfcnpj', cliforEdita?.cpfcnpj ? cliforEdita.cpfcnpj : "")
        setValue('inscricaoestadual', cliforEdita?.inscricaoestadual ? cliforEdita.inscricaoestadual : "")
        setValue('inscricaomunicipal', cliforEdita?.inscricaomunicipal ? cliforEdita.inscricaomunicipal : "")
        setValue('email', cliforEdita?.email ? cliforEdita.email : "")
        setValue('telefone', cliforEdita?.telefone ? cliforEdita.telefone : "")
        setValue('datanascimento', cliforEdita?.datanascimento ? cliforEdita.datanascimento : "")
        setValue('tipoGenero', cliforEdita?.genero ? cliforEdita.genero : "")
        setValue('escolaridade', cliforEdita?.escolaridade ? cliforEdita.escolaridade : "")
        setValue('formacaoacademica', cliforEdita?.formacaoacademica ? cliforEdita.formacaoacademica : "")
        setValue('estadoCivil', cliforEdita?.estadocivil ? cliforEdita.estadocivil : "")
        setValue('ocupacao', cliforEdita?.ocupacao ? cliforEdita.ocupacao : "")
        setValue('linkedinlink', cliforEdita?.linkedinlink ? cliforEdita.linkedinlink : "")
        setValue('linkedinfotolink', cliforEdita?.linkedinfotolink ? cliforEdita.linkedinfotolink : "")
        setValue('tipoclifor', cliforEdita?.clifor ? cliforEdita.clifor : "")
        setValue('sharePointEmbeddedEnabled', cliforEdita?.sharePointEmbeddedEnabled === true)
        setValue('pais', cliforEdita?.endereco.pais ? cliforEdita.endereco.pais : "")
        setValue('cep', cliforEdita?.endereco.cep ? cliforEdita.endereco.cep : "")         
        setValue('uf', cliforEdita?.endereco.uf ? cliforEdita.endereco.uf : "")
        setSelectedState({ value: cliforEdita?.endereco.uf ? cliforEdita.endereco.uf : "" })
        setValue('cidade', cliforEdita?.endereco.cidade ? cliforEdita.endereco.cidade : "")
        setValue('bairro', cliforEdita?.endereco.bairro ? cliforEdita.endereco.bairro : "")
        setValue('logradouro', cliforEdita?.endereco.logradouro ? cliforEdita.endereco.logradouro : "")
        setValue('complemento', cliforEdita?.endereco.complemento ? cliforEdita.endereco.complemento : "")
        setValue('numero', cliforEdita?.endereco.numero ? cliforEdita.endereco.numero : "")    
        setValue('idusuario', cliforEdita?.idusuario ? cliforEdita.idusuario : "")
        setPreencheu(true)
    }
         
    if(!editaOpen && preencheu){
        reset()
        setPreencheu(false)
        
    }    

    function editaClifor(data: any){
        const clientefornecedor: IClifor = {
            id: id[0],
            active: true,
            sharePointEmbeddedEnabled: data.sharePointEmbeddedEnabled === true,
            nomesocial: data.nomesocial,
            nomecomercial: data.nomecomercial,
            cpfcnpj: removeNotNumber(data.cpfcnpj),
            inscricaoestadual: data.inscricaoestadual,
            inscricaomunicipal: data.inscricaomunicipal,
            email: data.email,
            telefone: data.telefone,
            datanascimento: data.datanascimento != "" ? transformDate(data.datanascimento) : null,
            genero: data.tipoGenero,
            escolaridade: data.escolaridade,
            formacaoacademica: data.formacaoacademica,
            estadocivil: data.estadoCivil,
            ocupacao: data.ocupacao,
            linkedinlink: data.linkedinlink,
            linkedinfotolink: data.linkedinfotolink,
            clifor: data.tipoclifor,
            idusuario: data.idusuario,
            endereco: {
                pais: data.pais.value,
                cep: removeNotNumber(data.cep),
                uf: data.uf.value,
                cidade: data.cidade.value,
                bairro: data.bairro,
                logradouro: data.logradouro,
                complemento: data.complemento,
                numero: data.numero
            },
 
        }
        /* setOutput(JSON.stringify(clientefornecedor, null, 2)); */

        http.put("clifor",clientefornecedor ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("Alteração efetuada com sucesso!", "success")
            editaHandleClose()
        })
        .catch(erro => {            
            mostrarMensagem("ERRO:" + erro, "error")
        })     

    }    

    const Close =() => {
        reset()
        editaHandleClose()   
    }
   
    return (
        <>
            <Modal
                open={editaOpen}
                onClose={() => Close()}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado>
                    <form onSubmit={handleSubmit(editaClifor)}>
                    <Titulo>Edita Cliente e Fornecedor:</Titulo>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Rotulo>
                                <input type="checkbox" {...register('sharePointEmbeddedEnabled')} />
                                {" "}Usar SharePoint Embedded
                            </Rotulo>
                            <p style={{ color: "#666666" }}>
                                Ative individualmente para usar os novos Arquivos Editáveis e a Biblioteca.
                                Desmarcado mantém os links do SharePoint padrão. Depende da disponibilidade global;
                                desativar não exclui arquivos nem altera acessos a produtos.
                            </p>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Selecione um tipo</Rotulo>                                
                            <CampoSelect {...register('tipoCadastro')}>
                                <option value="FISICA">Pessoa Física</option>
                                <option value="JURIDICA">Pessoa Jurídica</option>
                            </CampoSelect>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Tipo</Rotulo>
                            <CampoSelect {...register('tipoclifor')}>
                                <option value="CLIENTE">CLIENTE</option>
                                <option value="FORNECEDOR">FORNECEDOR</option>
                                <option value="CLIFOR">AMBOS</option>                                
                            </CampoSelect>
                        </Grid>
                        <Grid item xs={12} md={4}>                            
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Rotulo>ID Usuário</Rotulo>
                            <Campo type="number" placeholder="" maxLength={50} {...register('idusuario')} />
                        </Grid>
                        {/* <Grid item xs={12} md={3}>
                            
                        </Grid> */}
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                                                         
                            <Rotulo>{nomesocial + " *"}</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={100} {...register('nomecomercial',{
                            required: 'Campo obrigatório',
                            minLength: {
                                value: 3,
                                message: 'Deve ter no mínimo 3 caracteres'
                            },
                            maxLength: {
                                value: 100,
                                message: 'Deve ter no máximo 100 caracteres'
                          }})} />
                            {errors.nomesocial && typeof errors.nomesocial.message === 'string' && <SpanErro>{errors.nomesocial.message}</SpanErro>}                            
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>{nomecomercial + " *"}</Rotulo>                                
                            <Campo type="text" placeholder="" {...register('nomesocial',{
                            required: 'Campo obrigatório',
                            minLength: {
                                value: 3,
                                message: 'Deve ter no mínimo 3 caracteres'
                            },
                            maxLength: {
                                value: 100,
                                message: 'Deve ter no máximo 100 caracteres'
                          }})} />
                            {errors.nomecomercial && typeof errors.nomecomercial.message === 'string' && <SpanErro>{errors.nomecomercial.message}</SpanErro>}                            
                        </Grid>                        
                        <Grid item xs={12} md={2}>
                            <ContainerInput>
                                <Rotulo>{cpfcnpj + " *"}</Rotulo>
                                <InputMaskCustomizado mask={maskCpfCnpj} maskChar={null} {...register('cpfcnpj', {
                                    required: 'Campo obrigatório',
                                    minLength: {
                                    value: watchTipoCadastro === 'FISICA' ? 14 : 18,
                                    message: `Favor preencher com um ${watchTipoCadastro === 'FISICA' ? "CPF" : "CNPJ"} válido`
                                    }
                                })} />
                                {errors.cpfcnpj && typeof errors.cpfcnpj.message === 'string' && <SpanErro>{errors.cpfcnpj.message}</SpanErro>}
                            </ContainerInput>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>E-mail *</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={100} {...register('email', {
                            required: "Email obrigatório",
                            pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                            message: 'Favor digitar um email válido'
                          }})} />
                            {errors.email && typeof errors.email.message === 'string' && <SpanErro>{errors.email.message}</SpanErro>}
                        </Grid>
                        {watchTipoCadastro === 'JURIDICA' && (
                            <>
                                <Grid item xs={12} md={2}>
                                    <Rotulo>Inscrição Estadual</Rotulo>                                
                                    <InputMaskCustomizado placeholder="" mask="999999999999" maskChar={null} {...register('inscricaoestadual', {
                                    maxLength: {
                                    value: 12,
                                    message: `Estecampo deve ter no máximo 12 caracteres`
                                    }})} />
                                    {errors.inscricaoestadual && <SpanErro>"Campo com erro"</SpanErro>}
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Rotulo>Inscrição Municipal</Rotulo>                                
                                    <InputMaskCustomizado placeholder="" mask="999999999999" maskChar={null} {...register('inscricaomunicipal', {
                                    maxLength: {
                                    value: 12,
                                    message: `Estecampo deve ter no máximo 12 caracteres`
                                    }})} />
                                    {errors.inscricaomunicipal && <SpanErro>"Campo com erro"</SpanErro>}
                                </Grid>
                            </>
                        )}
                        
                        
                        <Grid item xs={12} md={2}>
                            <Rotulo>Telefone</Rotulo>                                
                            <InputMaskCustomizado mask="(99) 99999-9999" maskChar={null} {...register('telefone', {
                                    minLength: {
                                    value: 14,
                                    message: `Favor digitar um telefone válido`
                                    }})} />
                            {errors.telefone && typeof errors.telefone.message === 'string' && <SpanErro>{errors.telefone.message}</SpanErro>}
                        </Grid>
                        
                        <Grid item xs={12} md={2}>
                        <ContainerInput>
                            <Rotulo>Data de nascimento</Rotulo>
                            <InputMaskCustomizado mask="99/99/9999" maskChar={null} {...register('datanascimento', {
                                pattern: {
                                    value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                    message: 'Favor digitar uma data válida'
                                },
                                validate: value => { if (value === '') return true;
                                    const dateParts = value.split("/");
                                    const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                                    return dateObject <= new Date() || 'A data não pode ser futura';
                                }
                            })} />
                            {errors.datanascimento && typeof errors.datanascimento.message === 'string' && <SpanErro>{errors.datanascimento.message}</SpanErro>}  
                        </ContainerInput>
                        </Grid>
                        {watchTipoCadastro === 'FISICA' && (
                            <>
                                <Grid item xs={3} md={1}>
                                    <Rotulo>Sexo *</Rotulo>                                
                                    <CampoSelect {...register('tipoGenero', {
                                    required: 'Campo obrigatório'})}>
                                        <option value=""></option>
                                        <option value="F">Feminino</option>
                                        <option value="M">Masculino</option>
                                    </CampoSelect>
                                    {errors.tipoGenero && typeof errors.tipoGenero.message === 'string' && <SpanErro>{errors.tipoGenero.message}</SpanErro>}
                                </Grid>    
                                <Grid item xs={3} md={2}>
                                    <Rotulo>Grau de Escolaridade</Rotulo>                                
                                    <CampoSelect {...register('escolaridade')}>
                                        <option value=""></option>
                                        <option value="EF_I">Ensino Fundamental I</option>
                                        <option value="EF_II">Ensino Fundamental II</option>
                                        <option value="EMI">Ensino Médio Incompleto</option>
                                        <option value="EMC">Ensino Médio Completo</option>
                                        <option value="ETI">Ensino Técnico Incompleto</option>
                                        <option value="ETC">Ensino Técnico Completo</option>
                                        <option value="ESI">Ensino Superior Incompleto</option>
                                        <option value="ESC">Ensino Superior Completo</option>
                                        <option value="PGI">Pós-graduação Incompleto</option>
                                        <option value="PGC">Pós-graduação Completo</option>
                                        <option value="MEI">Mestrado Incompleto</option>
                                        <option value="MEC">Mestrado Completo</option>
                                        <option value="DOI">Doutorado Incompleto</option>
                                        <option value="DOC">Doutorado Completo</option>
                                        <option value="PDI">Pós-doutorado Incompleto</option>
                                        <option value="PDC">Pós-doutorado Completo</option>
                                    </CampoSelect>                                    
                                </Grid>  
                                <Grid item xs={12} md={2}>
                                    <Rotulo>Formação Acadêmica</Rotulo>                                
                                    <Campo type="text" placeholder="" maxLength={100} {...register('formacaoacademica')} />                                                                
                                </Grid>
                                <Grid item xs={3} md={2}>
                                    <Rotulo>Estado Civil</Rotulo>                                
                                    <CampoSelect {...register('estadoCivil')}>
                                        <option value=""></option>
                                        <option value="solteiro">Solteiro(a)</option>
                                        <option value="casado">Casado(a)</option>
                                        <option value="divorciado">Divorciado(a)</option>
                                        <option value="viuvo">Viúvo(a)</option>
                                        <option value="separado">Separado(a) Judicialmente</option>
                                        <option value="uniao_estavel">União Estável</option>
                                    </CampoSelect>
                                </Grid> 
                                <Grid item xs={12} md={3}>
                                    <Rotulo>Ocupação Atual</Rotulo>
                                    <Campo type="text" placeholder="" maxLength={50} {...register('ocupacao')} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Rotulo>Link do Linkedin</Rotulo>
                                    <Campo type="text" placeholder="" maxLength={200} {...register('linkedinlink')} />
                                </Grid>
                                {/* <Grid item xs={12} md={6}>
                                    <Rotulo>Link de Foto do Linkedin</Rotulo>
                                    <Campo type="text" placeholder="" maxLength={200} {...register('linkedinfotolink')} />
                                </Grid>  */}
                                {/* <Grid item xs={12} md={6}>
                                <Rotulo>Foto do LinkedIn</Rotulo>
                                {linkedinfotolink && (
                                    <img
                                    src={linkedinfotolink}
                                    alt="LinkedIn Foto"
                                    style={{ width: '100%', height: 'auto' }}
                                    />
                                )}
                                </Grid> */}
                            </>
                        )}                        
                    </Grid>
                    <Titulo>Dados Endereço:</Titulo>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <Rotulo>País</Rotulo>
                            <Controller name="pais" control={control} defaultValue=""
                                render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()} {...field} value={countries.find(option => option?.value === watch('pais'))} options={countries} isSearchable/>)}
                            />
                        </Grid> 
                        <Grid item xs={12} md={3}>
                            <Rotulo>Estado (Sigla)</Rotulo>
                            <Controller name="uf" control={control} defaultValue=""
                                render={({ field }) => {                                    
                                    if (pais === 'BRASIL') {
                                        return (
                                        <SelectCustomizado styles={createCrmSelectStyles()}
                                            {...field}
                                            options={cidadeEstado.estados}
                                            value={cidadeEstado.estados.find(option => option?.value === watch('uf'))}
                                            isSearchable
                                            onChange={data => {
                                            field.onChange(data);
                                            setSelectedState(data as { value: string });                                            
                                            }}
                                        />
                                        );
                                    } else {                                       
                                        return <Campo type="text" maxLength={2} {...field} />;
                                    }
                                    }}
                                />                                
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Cidade</Rotulo>
                            <Controller name="cidade" control={control} defaultValue="" 
                                render={({ field }) => {
                                    // Se o país selecionado for Brasil, renderize um SelectCustomizado
                                    if (pais === 'BRASIL') {
                                      return <SelectCustomizado styles={createCrmSelectStyles()} {...field} options={cityOptions?.()} value={cityOptions?.().find(option => option?.value === watch('cidade'))} isSearchable />;
                                    } else {
                                      // Se o país selecionado não for Brasil, renderize um Campo
                                      return <Campo type="text" maxLength={100} {...field} />;
                                    }
                                  }}
                                />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>CEP</Rotulo>                                
                            <InputMaskCustomizado mask={pais === 'BRASIL' ? "99.999-999" : "999999999"} maskChar={null} value={watch("cep")} {...register('cep', {
                                    minLength: {
                                    value: 8,
                                    message: `Favor digitar um CEP válido`
                                    },
                                    maxLength: {
                                        value: 10,
                                        message: `Favor digitar um CEP válido`
                                        }})} />
                            {errors.cep && typeof errors.cep.message === 'string' && <SpanErro>{errors.cep.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Bairro</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={100} {...register('bairro')} />                                                                
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Logradouro</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={100} {...register('logradouro')} />                                                                
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Número</Rotulo>                                
                            <Campo type="number" placeholder="" {...register('numero')} />                                                                
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Rotulo>Complemento</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={100} {...register('complemento')} />                                                                
                        </Grid>                                         
                    </Grid>   
                    <BotaoCustomizado>Atualizar</BotaoCustomizado> 
                    <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    )
}