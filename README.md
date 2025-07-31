## Sobre o Projeto

O **HealthAdmin** é uma solução moderna e inteligente para a gestão de materiais OPME em ambientes hospitalares. Desenvolvido com tecnologias de ponta, o sistema utiliza Inteligência Artificial para automatizar processos manuais e otimizar a reposição de materiais médicos.

### Principais Funcionalidades

- **Seleção de Hospital** - Interface intuitiva para seleção da unidade hospitalar
- **Upload Inteligente** - Carregamento múltiplo de documentos de consumo OPME
- **Processamento IA** - Extração automática de dados usando Google Gemini AI
- **Consolidação Automática** - Geração de pedidos de reposição consolidados
- **Exportação PDF** - Conversão instantânea para formato PDF profissional
- **Relatórios Estruturados** - Tabelas organizadas com dados processados

## Stack Tecnológica

### Frontend
- **React 19.1.0** - Biblioteca JavaScript para interfaces de usuário
- **TypeScript 5.7.2** - Superset tipado do JavaScript
- **Vite 6.3.5** - Build tool moderna e rápida

### Inteligência Artificial
- **Google Gemini AI** - Processamento e extração de dados
- **@google/genai** - SDK oficial do Google para IA

### Geração de Documentos
- **jsPDF 2.5.1** - Biblioteca para geração de PDFs
- **html2pdf.js 0.10.3** - Conversão HTML para PDF
- **jspdf-autotable 3.8.2** - Criação de tabelas em PDF

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM ou Yarn
- Chave API do Google Gemini

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/andrecordeiro89/HealthAdmin.git
   cd HealthAdmin
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   **Para Desenvolvimento:**
   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env
   
   # Edite o arquivo .env e adicione sua chave da API do Gemini
   # VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
   ```
   
   **Para Produção:**
   - Configure a variável `VITE_GEMINI_API_KEY` no seu provedor de hospedagem
   - Exemplos:
     - **Vercel**: Adicione em Project Settings > Environment Variables
     - **Netlify**: Adicione em Site Settings > Environment Variables
     - **GitHub Pages**: Use GitHub Secrets para Actions
   
   ⚠️ **Importante**: O arquivo `.env` não é enviado para o repositório por questões de segurança.

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   ```
   http://localhost:5173
   ```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## Estrutura do Projeto

```
📁 HealthAdmin/
├── 📄 App.tsx                 # Componente principal da aplicação
├── 📄 constants.ts            # Configurações e constantes
├── 📄 types.ts                # Definições de tipos TypeScript
├── 📄 index.tsx               # Ponto de entrada da aplicação
├── 📄 index.html              # Template HTML
├── 📁 components/             # Componentes reutilizáveis
├── 📁 services/               # Serviços e integrações
├── 📄 package.json            # Dependências e scripts
├── 📄 tsconfig.json           # Configuração TypeScript
├── 📄 vite.config.ts          # Configuração do Vite
└── 📄 .gitignore              # Arquivos ignorados pelo Git
```

## Como Usar

### 1. Seleção do Hospital
- Escolha a unidade hospitalar na interface inicial
- O sistema carregará as configurações específicas

### 2. Upload de Documentos
- Clique em "Upload" ou arraste os arquivos para a área designada
- Suporte a múltiplos formatos (PDF, imagens, etc.)
- Processamento automático em lote

### 3. Processamento IA
- A IA Gemini analisa automaticamente os documentos
- Extrai informações relevantes (produtos, quantidades, códigos)
- Valida e estrutura os dados

### 4. Geração do Pedido
- Visualize o pedido consolidado em formato HTML
- Revise as informações extraídas
- Faça ajustes manuais se necessário

### 5. Exportação
- Clique em "Gerar PDF" para exportar
- Download automático do arquivo formatado
- Pronto para envio aos fornecedores

## Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Roadmap

### Próximas Funcionalidades
- [ ] **Dashboard Analytics** - Relatórios de consumo e tendências
- [ ] **Integração ERP** - Conexão com sistemas hospitalares existentes
- [ ] **Notificações Push** - Alertas de estoque baixo e pedidos
- [ ] **Histórico Completo** - Rastreamento de todos os pedidos
- [ ] **Multi-hospitais** - Gestão centralizada de múltiplas unidades
- [ ] **API RESTful** - Endpoints para integrações externas

### Melhorias Técnicas
- [ ] **Testes Automatizados** - Cobertura completa de testes
- [ ] **PWA** - Aplicação progressiva para mobile
- [ ] **Docker** - Containerização para deploy
- [ ] **CI/CD** - Pipeline de integração contínua

## Segurança

- ✅ Validação de tipos com TypeScript
- ✅ Sanitização de dados de entrada
- ✅ Armazenamento seguro de chaves API
- ✅ HTTPS obrigatório em produção

## Troubleshooting

### Erro: "API_KEY for Gemini is not set in environment variables"

**Problema**: A chave da API do Gemini não está configurada corretamente.

**Soluções**:

1. **Em Desenvolvimento**:
   - Verifique se o arquivo `.env` existe na raiz do projeto
   - Confirme que a variável está definida como `VITE_GEMINI_API_KEY=sua_chave`
   - Reinicie o servidor de desenvolvimento (`npm run dev`)

2. **Em Produção**:
   - Configure a variável de ambiente `VITE_GEMINI_API_KEY` no seu provedor de hospedagem
   - Faça um novo deploy após configurar a variável
   - Verifique se a variável está visível no painel do provedor

3. **Verificação**:
   - Abra o console do navegador
   - Procure por "Debug: VITE_GEMINI_API_KEY = SET" nos logs
   - Se aparecer "NOT SET", a variável não está sendo carregada

### Outros Problemas Comuns

- **Build falha**: Verifique se todas as dependências estão instaladas (`npm install`)
- **Página em branco**: Verifique o console do navegador para erros JavaScript
- **Upload não funciona**: Verifique se a chave da API está configurada corretamente

## Suporte

Para suporte técnico ou dúvidas:

- **Email**: [andre_cordeiro@outlook.com.br](mailto:andre_cordeiro@outlook.com.br)
- **Issues**: [GitHub Issues](https://github.com/andrecordeiro89/HealthAdmin/issues)
- **Discussões**: [GitHub Discussions](https://github.com/andrecordeiro89/HealthAdmin/discussions)

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
     <p>© 2025 André Cordeiro - Todos os direitos reservados</p>
</div>
