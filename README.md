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

Dá pra mandar texto, emoji, figurinha, foto (inclusive GIFs do seu dispositivo, que mantêm
a animação), e áudio; editar e apagar suas próprias mensagens; reagir com emoji em qualquer
mensagem; e ver quando o outro está digitando.

## Se a conexão travar em "Conectando..."

Isso acontece quando o roteador de uma das duas pessoas bloqueia a conexão direta
(comum entre redes diferentes — costuma funcionar liso testando com duas abas no mesmo
computador, mas falhar entre cidades/redes diferentes). O app já tenta usar um
retransmissor gratuito (TURN) como plano B nesse caso; se mesmo assim travar por mais de
20 segundos, ele mostra um erro em vez de ficar carregando pra sempre — é só clicar em
Entrar de novo. Se continuar falhando, pode ser a rede de uma das duas pessoas bloqueando
WebRTC (comum em wi-fi de empresa/faculdade); tentar pelo 4G costuma resolver.

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
