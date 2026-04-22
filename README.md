# PostaAe

Laboratório técnico isolado para consolidar o domínio sobre
a Fetch API e manipulação dinâmica do DOM com JavaScript Vanilla.

## Tecnologias

- JSON Server → backend simulado
- Nginx → servidor de arquivos estáticos + proxy
- Docker + Docker Compose → infraestrutura

## Como rodar localmente

1. Ter Docker instalado
2. Clonar o repositório
3. Executar `docker-compose up -d`
4. Acessar `http://localhost`

## Operações HTTP cobertas

- GET → buscar postagens e comentários
- POST → criar postagem e comentário
- PATCH → curtir e editar postagem
- DELETE → remover postagem
