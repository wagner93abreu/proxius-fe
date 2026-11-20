import Avaliacao from "../../components/Avaliacao";
import Botao from "../../components/Botao";
import Container from "../../components/Container";
import Grafico from "../../components/Grafico";
import Tabela from "../../components/Tabela";
import Titulo from "../../components/Titulo";
import useDadosConsulta from "../../useDadosConsulta";
import useDadosProfissional from "../../useDadosProfissional";
import ModalCadastro from "./Modal";
import { useState } from 'react';


export default function Usuarios(){
    const { dados: consultas, erro: consultasErro } = useDadosConsulta();
    const { dados: profissionais, erro: profissionaisErro } = useDadosProfissional();
    const [ open, setOpen ] = useState(false);
  
    if (consultasErro || profissionaisErro) {
      //console.log("Ocorreu um erro na requisição")
    }

    const handleOpen = () => {
      setOpen(true)
    }

    const handleClose =() => {
      setOpen(false)
    }

    return(
        <Container>
          <Titulo>Área Administrativa</Titulo>
          <Botao onClick={() =>  handleOpen()}>Cadastrar usuario</Botao>
          <ModalCadastro open={open} handleClose={handleClose} />
          <Titulo imagem="consulta">Usuários</Titulo>
          <Tabela consultas={consultas} />
          <Titulo>Gráfico</Titulo>
          <Grafico consultas={consultas} profissionais={profissionais} />
          <Titulo>Avaliações</Titulo>
          <Avaliacao profissionais={profissionais}/>
        </Container>
    )
}
