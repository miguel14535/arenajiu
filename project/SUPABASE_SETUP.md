# Configuracao do Supabase

Este projeto agora pode sincronizar os dados com Supabase para que cadastros,
vendas, planos e produtos aparecam em outros navegadores/computadores.

## 1. Crie ou abra seu projeto no Supabase

No painel do Supabase, copie a URL do projeto:

Project Settings > API > Project URL

Ela se parece com:

```text
https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

## 2. Rode o SQL das tabelas

No Supabase, abra:

SQL Editor > New query

Cole e execute o conteudo deste arquivo:

```text
supabase/migrations/20260616000000_persistent_app_schema.sql
```

## 3. Configure as variaveis do projeto

Na raiz do projeto, crie um arquivo chamado `.env`.

Copie o conteudo de `.env.example` e troque a URL:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
```

Use apenas a Publishable key no frontend. Nao coloque a Secret key no projeto.

## 4. Rode o sistema

```bash
npm install
npm run dev
```

Ao abrir o sistema, ele busca os dados no Supabase antes de carregar a tela.
Quando voce cadastrar ou editar dados, ele salva localmente e sincroniza com o Supabase.

## Observacao de seguranca

Esta versao usa a chave publica no navegador e politicas abertas no Supabase
para manter o fluxo simples. Para uso publico na internet, o ideal e migrar
o login para Supabase Auth e fechar as politicas por usuario.
