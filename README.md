# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Modais de mensagens

O componente [ModalErro](src/components/ModalErro/index.tsx) usa o Dialog do MUI
e o tema claro do sistema para erros, avisos, informações e sucessos.
Os alertas nativos foram substituídos pelo serviço
[mostrarMensagem](src/stores/mensagem.store.ts), apresentado pelo
[ModalMensagens](src/components/ModalMensagens/index.tsx) na raiz da aplicação.
As mensagens são enfileiradas, permanecem abertas até serem fechadas e continuam
visíveis mesmo que o formulário de origem seja fechado ou a rota mude.
O antigo `AlertPortal` também usa esse serviço, sem fechamento automático.

Para visualizar sem chamar o backend, preencha login e senha e clique em
**Entrar** sem marcar o reCAPTCHA. O modal permanece aberto até ser fechado pelo
botão **Entendi**, pelo ícone de fechar, pela tecla Escape ou clicando fora dele.

Para novas mensagens, use `mostrarMensagem(erro)` ou
`mostrarMensagem("Registro salvo!", "success")`. As outras severidades são
`warning` e `info`. Quando uma ação precisar aguardar a leitura antes de continuar,
use `await mostrarMensagem(...)`; a Promise é resolvida ao fechar o modal.
Não sobrescreva `window.alert`. Confirmações de operações destrutivas e mensagens
inline de formulários mantêm seus fluxos próprios.
A redefinição de senha redireciona ao login somente após fechar o modal de sucesso.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
