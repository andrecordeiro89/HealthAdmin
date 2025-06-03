# Guia de Design HealthAdmin

## 1. **Cores Principais**
- **Primário:** Gradiente de roxo para azul (`from-purple-500 to-indigo-600`)
- **Secundário:** Gradiente de roxo claro para azul claro (`from-purple-400 to-indigo-500`)
- **Ação leve:** Gradiente de roxo claro para azul muito claro (`from-purple-100 to-indigo-200`)
- **Perigo:** Gradiente de vermelho (`from-red-500 to-red-700`)
- **Fundo:** `bg-white`, `bg-gray-50`, `bg-indigo-50`
- **Texto:** `text-slate-700`, `text-indigo-700`, `text-white` para botões

## 2. **Tipografia**
- **Fonte base:** `'Inter', 'Roboto', 'Montserrat', sans-serif`
- **Títulos:** `font-bold`, tamanhos grandes (`text-2xl`, `text-3xl`)
- **Corpo:** `text-base`, `text-sm`, `text-xs` para detalhes
- **Uso de `font-semibold` para destaques**

## 3. **Botões**
- **Primário:**  
  ```js
  import { buttonPrimary } from './components/uiClasses';
  <button className={buttonPrimary}>Ação</button>
  ```
- **Secundário:**  
  ```js
  import { buttonSecondary } from './components/uiClasses';
  <button className={buttonSecondary}>Ação</button>
  ```
- **Leve:**  
  ```js
  import { buttonLight } from './components/uiClasses';
  <button className={buttonLight}>Ação</button>
  ```
- **Perigo:**  
  ```js
  import { buttonDanger } from './components/uiClasses';
  <button className={buttonDanger}>Excluir</button>
  ```
- **Todos os botões têm foco visível, sombra, transição suave, e estados `:hover`, `:disabled` padronizados.**

## 4. **Inputs e Labels**
- **Input base:**  
  ```js
  import { inputBase } from './components/uiClasses';
  <input className={inputBase} />
  ```
- **Label base:**  
  ```js
  import { labelBase } from './components/uiClasses';
  <label className={labelBase}>Nome</label>
  ```
- **Textareas também usam `inputBase` + altura customizada.**

## 5. **Tabelas e Listas**
- **Cabeçalho:**  
  ```js
  import { tableHeader } from './components/uiClasses';
  <th className={tableHeader}>Coluna</th>
  ```
- **Célula:**  
  ```js
  import { tableCell } from './components/uiClasses';
  <td className={tableCell}>Valor</td>
  ```
- **Zebra striping:**  
  ```js
  import { zebraRow } from './components/uiClasses';
  <tr className={zebraRow}>...</tr>
  ```

## 6. **Modais**
- **Centralizados, com sombra forte, fundo escurecido, animação de entrada.**
- **Fechamento por ESC, clique fora ou botão.**
- **Classe base:**  
  ```js
  import { modalBase } from './components/uiClasses';
  <div className={modalBase}>...</div>
  ```

## 7. **Alertas**
- **Tipos:** Sucesso, Erro, Aviso, Informação.
- **Ícone à esquerda, cor de fundo e borda conforme tipo, botão de fechar acessível.**
- **Uso:**  
  ```js
  import { Alert, AlertType } from './components/Alert';
  <Alert message="Mensagem" type={AlertType.Success} />
  ```

## 8. **Microinterações**
- **Transições suaves em botões, modais, inputs.**
- **Foco visível em todos os elementos interativos.**
- **Tooltips e `title` em todos os botões de ação.**
- **Feedback visual imediato para loading, erro, sucesso.**

## 9. **Acessibilidade**
- **Navegação por teclado garantida.**
- **Contraste alto em botões e alertas.**
- **Uso de `aria-label` e `role` onde necessário.**
- **Foco visível sempre.**

## 10. **Responsividade**
- **Layout otimizado para desktop/notebook (mínimo 1024px).**
- **Componentes se adaptam para telas menores, mas não é mobile-first.**
- **Scrolls internos em listas/tabelas longas.**

## 11. **Exemplo de Uso em Componente**
```jsx
import { buttonPrimary, inputBase, labelBase, tableHeader, tableCell, zebraRow } from './components/uiClasses';

<form>
  <label className={labelBase} htmlFor="nome">Nome</label>
  <input className={inputBase} id="nome" />
  <button className={buttonPrimary}>Salvar</button>
</form>

<table>
  <thead>
    <tr>
      <th className={tableHeader}>Coluna</th>
    </tr>
  </thead>
  <tbody>
    <tr className={zebraRow}>
      <td className={tableCell}>Valor</td>
    </tr>
  </tbody>
</table>
```

## 12. **Dicas Finais**
- **Nunca use classes Tailwind diretamente em botões, inputs, tabelas, etc. Use sempre as constantes de `uiClasses.ts`.**
- **Se precisar de uma nova variação, adicione no utilitário e comunique a equipe.**
- **Mantenha o foco em clareza, conforto visual e acessibilidade.**
- **Consulte este guia antes de criar ou alterar qualquer componente visual.**

## NOVO PADRÃO: Barras de Feedback/Status
- Sempre posicionar barras de feedback (Alert/status) imediatamente abaixo do header, sem margem ou padding extra.
- Usar paddings verticais mínimos (ex: py-0.5 ou py-1).
- Botões da barra devem ser compactos (altura mínima, fonte menor).
- O conteúdo principal deve vir logo após a barra, com espaçamento mínimo (ex: 8px).
- Isso garante simetria, aproveitamento de tela e feedbacks sempre visíveis. 