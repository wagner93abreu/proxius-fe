import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { SvgIconComponent } from '@mui/icons-material';

const Container = styled.a<{ $nested: boolean; $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  min-height: ${({ $nested }) => ($nested ? '36px' : '42px')};
  margin: 0 12px 2px ${({ $nested }) => ($nested ? '32px' : '12px')};
  padding: 8px 12px;
  border-radius: 10px;
  background-color: ${({ $active }) => ($active ? 'rgba(20, 20, 20, 0.09)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#141414' : '#242424')};
  font-size: ${({ $nested }) => ($nested ? '14px' : '15px')};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  text-decoration: none;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: background-color 160ms ease, color 160ms ease;

  ${({ $active }) => $active && `
    &::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: #141414;
    }
  `}

  > svg {
    flex-shrink: 0;
    font-size: ${({ $nested }) => ($nested ? '18px' : '20px')};
    color: ${({ $active }) => ($active ? '#141414' : '#666666')};
    transition: color 160ms ease;
  }

  &:hover {
    background-color: rgba(20, 20, 20, 0.06);
    color: #141414;
  }

  &:hover > svg {
    color: #141414;
  }

  &:focus-visible {
    outline: 2px solid #141414;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

interface IItem {
  Text: string,
  href: string,
  icon?: SvgIconComponent,
  nested?: boolean,
  onNavigate?: () => void
}

const SidebarItem = ({ Text, href, icon: Icon, nested = false, onNavigate }: IItem) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [path, query = ''] = href.split('?');
  const active = location.pathname.replace(/\/+$/, '').toLowerCase() === `/${path}`.toLowerCase()
    && (query ? location.search === `?${query}` : !location.search);
  const handleAuxClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (event.button === 1) { // Botão do meio do mouse
      window.open(href, '_blank');
    }
  };
  const handleNavigate = () => {
    onNavigate?.();
    navigate(`/${href}`);
  };
  return (
    <Container
      role="link"
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      $nested={nested}
      $active={active}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter') handleNavigate();
      }}
      onAuxClick={handleAuxClick}
    >
      {Icon && <Icon aria-hidden="true" />}
      <span>{Text}</span>
    </Container>
  )
}

export default SidebarItem
