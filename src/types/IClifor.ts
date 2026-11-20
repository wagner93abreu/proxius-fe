import IEndereco from "./IEndereco";


export default interface IClifor {
    id: string | number | null;
    nomesocial: string;
    nomecomercial: string;
    cpfcnpj: string | null;
    inscricaoestadual: string | null;
    inscricaomunicipal: string | null;
    email: string | null,
    ddd?: string | null,
    telefone: string | null,
    datanascimento: string | null,
    genero: string | null,
    escolaridade: string | null,
    formacaoacademica: string | null,
    estadocivil: string | null,
    ocupacao: string | null,
    linkedinlink: string | null,
    linkedinfotolink: string | null,
    linkDrive?: string | null,
    sharePointEmbeddedEnabled?: boolean,
    clifor: string,
    idusuario: string | null,
    active: true,
    endereco: IEndereco;
  }


