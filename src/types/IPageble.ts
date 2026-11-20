export default interface IPageable {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number; //pagina atual
    pageSize: number; //quantidade de elementos na pagina 
    paged: boolean;
    unpaged: boolean;
  }