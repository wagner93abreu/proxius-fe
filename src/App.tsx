import './App.css';
import AppRoutes from './AppRoutes';
import ModalMensagens from './components/ModalMensagens';
import { ThemeProvider } from '@mui/material/styles';
import lightTheme from './styles/lightTheme';
import { PublicPhotoConfigProvider } from './PublicPhotoConfig';



function App() {

    return(
        <ThemeProvider theme={lightTheme}>
            <PublicPhotoConfigProvider>
                <AppRoutes />
                <ModalMensagens />
            </PublicPhotoConfigProvider>
        </ThemeProvider>
    )
}

export default App;