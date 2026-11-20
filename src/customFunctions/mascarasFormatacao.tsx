// Funções de máscara

function maskCPF(value:string) {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function maskCNPJ(value:string) {
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function maskCEP(value:string) {
  return value.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function removeNotNumber(value: string) {
    // Remover todos os caracteres não numéricos
    return value.replace(/\D/g, '');
}

function transformDate(dateString: string) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
  }

  function transformDateBR(dateString: string) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
    }
  

function removeCEPMask(cep: string) {
  // Remover todos os caracteres não numéricos
  return cep.replace(/\D/g, '');
}

function applyCPForCNPJMask(value: string) {
  // Remover todos os caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length <= 11) {
    // Aplicar a máscara de CPF
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else {
    // Aplicar a máscara de CNPJ
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
}

function getCurrentDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Os meses são indexados a partir de 0 em JavaScript
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

const formataMoeda = (valor: string | number | undefined, moeda: string): string => {
  //console.log("ta entrando: " + moeda)
  if (typeof valor === 'undefined') return '';
  if (typeof valor === 'string') return valor;
  if(moeda === "REAL" || moeda === "BRL"){
    valor = `R$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }else if(moeda === "EURO" || moeda === "EUR"){
    valor = `U$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }else if(moeda === "DOLAR" || moeda === "USD"){
    valor = `€ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  //console.log("valor: "+valor)
  return valor.toString();   
}

const convertDouble = (value: string) => {

  if(typeof value === 'number'){
      return value;
  }
  if(value.indexOf("R$ ") != -1){
      value = value.replace("R$ ", "");
      value = value.replaceAll(".", "");
      value = value.replace(",", ".");
  }else if(value.indexOf("U$ ") != -1){  
      value = value.replace("U$ ", "");
      value = value.replaceAll(".", "");
      value = value.replace(",", ".");
  }else if(value.indexOf("€ ") != -1){
      value = value.replace("€ ", "");
      value = value.replaceAll(".", "");
      value = value.replace(",", ".");
  }

  return parseFloat(value);
}



export { removeNotNumber,maskCPF, maskCNPJ, maskCEP, transformDate, removeCEPMask, applyCPForCNPJMask, transformDateBR, getCurrentDate, formataMoeda, convertDouble };