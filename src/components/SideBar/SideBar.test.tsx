import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '.';
import http from '../../http';

const SidebarHarness = () => {
  const [active, setActive] = useState(true);
  const location = useLocation();
  return (
    <>
      {active && <Sidebar active={active} setActive={setActive} />}
      <output aria-label="Rota atual">{location.pathname}{location.search}</output>
    </>
  );
};

jest.mock('../../http', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../../stores/autentica.store', () => ({
  __esModule: true,
  default: { usuario: { login: 'admin' }, logout: jest.fn() },
}));

describe('Sidebar', () => {
  beforeEach(() => {
    (http.get as jest.Mock).mockResolvedValue({ data: { papel: 'ADMIN' } });
  });

  it('exibe os itens com ícones e destaca a página atual', async () => {
    render(
      <MemoryRouter initialEntries={['/painelDeControle']}>
        <Sidebar active setActive={jest.fn()} />
      </MemoryRouter>,
    );

    const painel = await screen.findByRole('link', { name: 'Painel de Controle' });
    expect(painel).toHaveAttribute('aria-current', 'page');
    expect(within(painel).getByTestId('AdminPanelSettingsOutlinedIcon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: 'Sair' })).getByTestId('LogoutOutlinedIcon')).toBeInTheDocument();
  });

  it.each([
    ['Home', '/home'], ['Meu Perfil', '/meuPerfil'], ['Comissões', '/comissao'],
    ['PRECRM', '/precrm'], ['CRM', '/crm'],
    ['Gestão de Leads', '/crm?panel=leads'], ['Gestão de Clientes', '/crm?panel=clientes'],
    ['Gestão de Parceiros', '/crm?panel=parceiros'],
    ['Dashboard', '/dashboardResumo'], ['Funil de Vendas', '/metricasVendas'],
    ['Cliente e Fornecedor', '/cliFor'], ['Vendas', '/vendas'], ['Produtos', '/produtos'],
    ['Templates de Contratos', '/templatesContrato'], ['Painel de NF', '/painelNF'],
    ['Financeiro', '/financeiro'], ['Painel de Controle', '/painelDeControle'],
  ])('fecha ao clicar em %s e preserva a rota', async (name, route) => {
    render(<MemoryRouter initialEntries={['/home']}><SidebarHarness /></MemoryRouter>);
    await screen.findByRole('link', { name: 'Painel de Controle' });
    fireEvent.click(screen.getByRole('link', { name }));
    expect(screen.queryByRole('navigation', { name: 'Menu principal' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Rota atual')).toHaveTextContent(route);
  });

  it('fecha ao selecionar com Enter um submenu do CRM', async () => {
    render(<MemoryRouter initialEntries={['/crm?panel=leads']}><SidebarHarness /></MemoryRouter>);
    await screen.findByRole('link', { name: 'Painel de Controle' });
    fireEvent.keyDown(screen.getByRole('link', { name: 'Gestão de Clientes' }), { key: 'Enter' });
    expect(screen.queryByRole('navigation', { name: 'Menu principal' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Rota atual')).toHaveTextContent('/crm?panel=clientes');
  });

  it('preserva a abertura em nova aba com o botão do meio', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    try {
      render(<MemoryRouter initialEntries={['/home']}><SidebarHarness /></MemoryRouter>);
      await screen.findByRole('link', { name: 'Painel de Controle' });
      fireEvent(screen.getByRole('link', { name: 'Meu Perfil' }), new MouseEvent('auxclick', { bubbles: true, button: 1 }));
      expect(open).toHaveBeenCalledWith('meuPerfil', '_blank');
      expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
      expect(screen.getByLabelText('Rota atual')).toHaveTextContent('/home');
    } finally {
      open.mockRestore();
    }
  });
});
