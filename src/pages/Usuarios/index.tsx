import Botao from "../../components/Botao";
import Container from "../../components/Container";
import Tabela from "./Tabela";
import Titulo from "../../components/Titulo";
import ModalCadastro from "./ModalCadastro";
import { useEffect, useState } from "react";
import { PeopleOutline } from "@mui/icons-material";



export default function Usuarios(){
    
    const [ open, setOpen ] = useState(false);

  


    const handleOpen = () => {
      setOpen(true)
    }

    const handleClose =() => {
      setOpen(false)

    }


    /* useEffect(() => {
      if (!open) {
        //console.log('O estado "open" mudou para falso. Atualizando a Tabela.');
      }
    }, [open]); */


    return(
        <Container>
          <Titulo icone={<PeopleOutline />}>Painel de Usuários</Titulo>
          {/* <Botao onClick={() =>  handleOpen()}>Cadastrar usuario</Botao>
          <Botao onClick={() =>  alert("editar")}>Editar usuario</Botao>
          <Botao onClick={() =>  alert("usuario desativado")}>Desativar usuario</Botao>
          <ModalCadastro open={open} handleClose={handleClose} /> */}
          <Tabela/>

        </Container>
    )
}
