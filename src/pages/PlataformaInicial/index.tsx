import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function PlataformaInicial() {
    return <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
            <Stack spacing={3}>
                <Typography component="h1" variant="h3">RH Integrado</Typography>
                <Typography>Plataforma de gestao para empresas. Cada empresa possui seu proprio ambiente de acesso.</Typography>
                <Typography>O acesso operacional da RH Sem Complicacoes foi separado do dominio principal. Utilize os mesmos usuarios e senhas da empresa no novo endereco local.</Typography>
                <Button component="a" href="http://rhsc.localhost:3000/login" variant="contained">Acessar RH Sem Complicacoes</Button>
                <Button component={Link} to="/wcmadmin">Administracao da plataforma</Button>
            </Stack>
        </Paper>
    </Container>;
}
