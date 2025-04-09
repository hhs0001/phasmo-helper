# Configuração de Navegação e Páginas

Este diretório contém a configuração dinâmica do aplicativo para navegação e páginas.

## Como Usar

### Adicionar uma Nova Página

Para adicionar uma nova página ao aplicativo:

1. No arquivo `navigation.tsx`, adicione sua página ao objeto `pagesConfig`:

```tsx
export const pagesConfig = {
  // Páginas existentes...
  
  // Nova página
  minhaNovaPage: {
    title: "Minha Nova Página",
    url: "/minha-nova-pagina",
    icon: IconAlgumIcone, // Importe um ícone do tabler-icons-react
    component: () => <div className="p-4">Conteúdo da minha nova página</div>,
  },
};
```

2. Para adicionar essa página à navegação, inclua-a em uma das seções no objeto `navConfig`:

```tsx
export const navConfig = {
  // Configurações existentes...
  
  navMain: [
    // Itens existentes...
    pagesConfig.minhaNovaPage, // Adicione aqui para incluir na barra lateral principal
  ],
  
  // Ou adicione em navSecondary ou outra seção conforme necessário
};
```

### Estrutura de Dados

- `pagesConfig` - Contém a definição de todas as páginas disponíveis
- `navConfig` - Define como as páginas serão organizadas na navegação

### Propriedades de uma Página

- `title` - Título exibido na UI 
- `url` - URL usada para navegação (futuramente pode ser integrada com router)
- `icon` - O componente do ícone a ser exibido na navegação
- `component` - O componente React que será renderizado quando a página for selecionada

## Exemplo Avançado

Você também pode criar componentes maiores e separados para suas páginas:

```tsx
// src/pages/MinhaPagina.tsx
export function MinhaPagina() {
  return (
    <div className="p-4">
      <h1>Minha Página Personalizada</h1>
      <p>Conteúdo detalhado aqui...</p>
    </div>
  );
}

// Em navigation.tsx
import { MinhaPagina } from "@/pages/MinhaPagina";

export const pagesConfig = {
  // ...
  minhaPagina: {
    title: "Página Personalizada",
    url: "/personalizada",
    icon: IconCode,
    component: MinhaPagina,
  },
};
``` 