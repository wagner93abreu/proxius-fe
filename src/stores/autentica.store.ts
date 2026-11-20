import { makeObservable, observable, action, runInAction } from "mobx";
import http from "../http";
import { mostrarMensagem } from "./mensagem.store";

interface ILogin {
    login: string,
    token: string
}

class AutenticaStore {
    estaAutenticado = false;
    usuario: ILogin = {login: "", token: ""};

    constructor() {
        makeObservable(this, {
            estaAutenticado: observable,
            usuario: observable,
            login: action,
            logout: action
        })

        // Inicialização a partir do localStorage
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
        this.estaAutenticado = true;
        this.usuario = { login: storedUser, token: storedToken };
        }
    }

    isTokenExpired() {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
          const currentTime = Date.now();
          const loginTimeMillis = parseInt(loginTime, 10);
    
          // Verifica se já passaram 24 horas (24 horas * 60 minutos * 60 segundos * 1000 milissegundos)
          return currentTime - loginTimeMillis >= 24 * 60 * 60 * 1000;
        }
        return false;
      }


    login({login, token} : ILogin) {

        const axiosConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        };

        return http.get(`usuarios/login/${login}`, axiosConfig)
        .then(resposta => {
            runInAction(() => {
                this.estaAutenticado = true;
                this.usuario = {login, token};
            });
            localStorage.setItem('userID', resposta.data.id);
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', login);
            localStorage.setItem('loginTime', Date.now().toString());
            window.location.reload()
        })

        
    }

    logout(recarregar = true) {
        this.estaAutenticado = false;
        this.usuario = {login: "", token: ""}
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('userID');
        if (recarregar) window.location.reload()
        
    }
}

const autenticaStore = new AutenticaStore();

export default autenticaStore;

// Em algum ponto de sua aplicação (por exemplo, no componente principal)
if (autenticaStore.isTokenExpired()) {
    // Limpa o localStorage
    autenticaStore.logout(false);
    void mostrarMensagem("Sua sessão expirou. Por favor, faça login novamente.", "warning");
  }