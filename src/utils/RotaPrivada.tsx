import { Navigate, Outlet } from "react-router-dom";
import autenticaStore from "../stores/autentica.store"

const RotaPrivada = () => {

    const lslogin = localStorage.getItem('user')
    const lsToken = localStorage.getItem('authToken')
    if(lslogin != '' && lsToken != ''){

    }
   
    const {estaAutenticado} = autenticaStore;

    return (
        estaAutenticado ? <Outlet /> : <Navigate to="/login" />
    )
}

export default RotaPrivada;