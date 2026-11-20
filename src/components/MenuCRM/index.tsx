import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import MenuIcon from '@mui/icons-material/Menu';
import { ArchiveOutlined, ChecklistOutlined, GroupsOutlined, HandshakeOutlined, LabelOutlined, PersonSearchOutlined } from '@mui/icons-material';

interface AtendenteOption {
  value: string;
  label: string;
}

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  background-color: rgba(85, 8, 29, 0.06);
  color: #55081d;
  padding: 10px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  &:hover { background: rgba(85, 8, 29, 0.12); }
  &:focus-visible { outline: 2px solid #55081d; outline-offset: 2px; }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const DropdownContent = styled.div<{ $show: boolean }>`
  display: ${({ $show }) => ($show ? 'block' : 'none')};
  position: absolute;
  background-color: #fffdfa;
  border: 1px solid rgba(85, 8, 29, 0.12);
  border-radius: 16px;
  width: 280px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 88px);
  overflow-y: auto;
  padding: 8px;
  box-sizing: border-box;
  box-shadow: 0 16px 48px rgba(85, 8, 29, 0.16);
  z-index: 1;
  top: calc(100% + 14px);
  right: 0; /* Alinha a lateral direita do menu com a lateral direita do botão */
  animation: ${({ $show }) => ($show ? fadeIn : fadeOut)} 0.3s ease-in-out;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const DropdownItem = styled.button`
  color: #35252b;
  border: none;
  width: 100%;
  cursor: pointer;
  font: inherit;
  text-align: left;
  border-radius: 10px;
  padding: 12px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: transparent;
  > svg { color: #55081d; font-size: 20px; }
  &:hover {
    background-color: rgba(85, 8, 29, 0.06);
  }
  &:focus-visible { outline: 2px solid #55081d; outline-offset: -2px; }
`;

const FilterGroup = styled.div`
  padding: 12px 16px;
  border-top: 1px solid rgba(85, 8, 29, 0.12);
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: transparent;
`;

const FilterLabel = styled.label`
  color: #75656b;
  font-weight: 600;
  font-size: 0.85rem;
`;

const FilterSelect = styled.select`
  width: 100%;
  border: 1px solid rgba(85, 8, 29, 0.2);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fffdfa;
  color: #35252b;
  &:focus-visible { outline: 2px solid #55081d; }
`;

interface TagOption {
  value: string;
  label: string;
}

interface DropdownMenuProps {
  onSelect: (value: string) => void;
  atendenteValue: string;
  atendenteOptions: AtendenteOption[];
  onAtendenteChange: (value: string) => void;
  tagValue: string;
  tagOptions: TagOption[];
  onTagChange: (value: string) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onSelect,
  atendenteValue,
  atendenteOptions,
  onAtendenteChange,
  tagValue,
  tagOptions,
  onTagChange,
}) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setShow(!show);

  const handleSelect = (value: string) => {
    onSelect(value);
    setShow(false);
  };

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownButton onClick={toggleDropdown} aria-label="Opções do CRM" aria-expanded={show} aria-controls="crm-opcoes">
        <MenuIcon />
      </DropdownButton>
      <DropdownContent $show={show} id="crm-opcoes">
        <DropdownItem onClick={() => handleSelect('atividades')}><ChecklistOutlined aria-hidden="true" />Minhas Atividades</DropdownItem>
        {/* <DropdownItem onClick={() => handleSelect('leads')}><PersonSearchOutlined aria-hidden="true" />Gestão de Leads</DropdownItem>
        <DropdownItem onClick={() => handleSelect('clientes')}><GroupsOutlined aria-hidden="true" />Gestão de Clientes</DropdownItem>
        <DropdownItem onClick={() => handleSelect('parceiros')}><HandshakeOutlined aria-hidden="true" />Gestão de Parceiros</DropdownItem> */}
        <DropdownItem onClick={() => handleSelect('etiquetas')}><LabelOutlined aria-hidden="true" />Etiquetas</DropdownItem>
        <DropdownItem onClick={() => handleSelect('arquivados')}><ArchiveOutlined aria-hidden="true" />Arquivados</DropdownItem>
        <FilterGroup>
          <FilterLabel htmlFor="dropdown-filtro-atendente">Atendente</FilterLabel>
          <FilterSelect
            id="dropdown-filtro-atendente"
            value={atendenteValue}
            onChange={(event) => onAtendenteChange(event.target.value)}
          >
            <option value="">Todos</option>
            {atendenteOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="dropdown-filtro-tag">Tag</FilterLabel>
          <FilterSelect
            id="dropdown-filtro-tag"
            value={tagValue}
            onChange={(event) => onTagChange(event.target.value)}
          >
            <option value="">Todas</option>
            {tagOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FilterSelect>
        </FilterGroup>
      </DropdownContent>
    </DropdownContainer>
  );
};

export default DropdownMenu;