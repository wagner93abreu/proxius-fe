import './App.css';
import AppRoutes from './AppRoutes';
import ModalMensagens from './components/ModalMensagens';
import { ThemeProvider } from '@mui/material/styles';
import lightTheme from './styles/lightTheme';



function App() {

    return(
        <ThemeProvider theme={lightTheme}>
            <AppRoutes />
            <ModalMensagens />
        </ThemeProvider>
    )
}

export default App;