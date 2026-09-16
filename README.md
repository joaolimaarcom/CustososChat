# CustosoChat

Um chat bem simples, feito pra conversar com um amigo, hospedado de graça no GitHub Pages.

Não tem servidor, não tem banco de dados, não precisa criar conta em nada: a conexão é
direta entre os dois navegadores (peer-to-peer via WebRTC, usando a [PeerJS](https://peerjs.com/)
só como "intermediária" para os dois se encontrarem). Isso significa que:

- As mensagens **não ficam salvas** em lugar nenhum — só aparecem enquanto os dois estão
  com a página aberta.
- Os dois precisam estar online ao mesmo tempo pra conversar.

## Como usar

1. Entre no site (link do GitHub Pages, veja abaixo).
2. Coloque seu nome.
3. Uma pessoa clica em **"Criar sala"** — vai aparecer um código de 6 letras/números.
4. Essa pessoa manda o código pro amigo (WhatsApp, por exemplo).
5. O amigo abre o mesmo site, vai na aba **"Entrar em uma sala"**, cola o código e clica
   em **Entrar**.
6. Prontinho, os dois já estão conectados e podem conversar.

Dá pra mandar texto, emoji, figurinha, foto, áudio e GIF; editar e apagar suas próprias
mensagens; reagir com emoji em qualquer mensagem; e ver quando o outro está digitando.

## Buscar GIFs (opcional)

O botão **GIF** busca GIFs de verdade usando a [API da Tenor](https://tenor.com/gifapi),
que é gratuita. Da primeira vez que você abrir o painel de GIFs, vai pedir uma chave:

1. Clique no link "Pegar chave grátis da Tenor" (leva 1 minuto, não pede cartão).
2. Cole a chave no campo e clique em Salvar.

Essa chave fica salva só no seu navegador (localStorage) — nunca é enviada pro GitHub nem
pro seu amigo, e cada pessoa precisa pegar a sua própria. Se não quiser usar isso, é só não
configurar: o resto do chat funciona normalmente sem a chave.

## Como publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Em **Branch**, selecione `main` (ou a branch principal) e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site fica disponível em:
   `https://joaolimaarcom.github.io/CustososChat/`

## Estrutura

- `index.html` — tela de entrar/criar sala e tela do chat.
- `style.css` — estilo (com suporte a modo escuro automático).
- `script.js` — lógica de conexão (PeerJS) e troca de mensagens.
