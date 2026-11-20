import { PeopleOutline } from "@mui/icons-material";
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import Tabela from "./Tabela";



export default function Clifor(){
    
    return(
        <Container>
          <Titulo icone={<PeopleOutline />}>Cadastro de Cliente/Fornecedor</Titulo>
          <Tabela/>
        </Container>
    )
}
