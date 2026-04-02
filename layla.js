// ============================================================
//  LAYLA — Assistente Virtual do Motel Lamore
//  Versão 1.0 | Ourinhos/SP
//  Para rodar: node layla.js
// ============================================================

const http = require('http');
const https = require('https');

// ============================================================
//  CONFIGURAÇÕES — PREENCHA ANTES DE LIGAR
// ============================================================
const CONFIG = {
  ZAPI_INSTANCE:  '3F10476A93B9C14397CFBA665B49BD70',   // Ex: "3EB0F1A2B3C4"
  ZAPI_TOKEN:     '060575DE041301E87AB1A483',          // Ex: "F1A2B3C4D5E6..."
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS', // Encontrado no painel Z-API
  NUMERO_DONO:    '5543996066590',      // Número do proprietário (não é revelado ao cliente)
  PORTA:          3000,                 // Porta local do servidor
};
// ============================================================

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';

// Estado por cliente { telefone: { etapa, dados } }
const sessoes = {};

function getSessao(tel) {
  if (!sessoes[tel]) sessoes[tel] = { etapa: 'menu', dados: {} };
  return sessoes[tel];
}

// ============================================================
//  ENVIO DE MENSAGEM VIA Z-API
// ============================================================
function enviarMensagem(telefone, texto) {
  const body = JSON.stringify({ phone: telefone, message: texto });
  const opts = {
    hostname: 'api.z-api.io',
    path: `/instances/${CONFIG.ZAPI_INSTANCE}/token/${CONFIG.ZAPI_TOKEN}/send-text`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': CONFIG.ZAPI_CLIENT_TOKEN,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  const req = https.request(opts, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log(`[ENVIADO → ${telefone}] status ${res.statusCode}`));
  });
  req.on('error', e => console.error('[ERRO envio]', e.message));
  req.write(body);
  req.end();
}

// ============================================================
//  ALERTA INTERNO AO DONO
// ============================================================
function alertarDono(tipo, telefoneCliente, mensagemCliente, dadosExtras) {
  const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reclamacao: '🔴', esquecido: '🟡', decoracao: '🟢' };
  const labels  = { reclamacao: 'Reclamação de cliente', esquecido: 'Item esquecido', decoracao: 'Reserva com decoração especial' };

  let alerta =
    `${icones[tipo]} *ALERTA LAMORE*\n` +
    `📌 Tipo: ${labels[tipo]}\n` +
    `👤 Cliente: ${telefoneCliente}\n` +
    `💬 Mensagem: "${mensagemCliente}"\n` +
    `⏰ ${hora}`;

  if (dadosExtras) alerta += `\n\n📋 *Dados da reserva:*\n${dadosExtras}`;

  enviarMensagem(CONFIG.NUMERO_DONO, alerta);
  console.log(`[ALERTA DONO] ${labels[tipo]} — cliente ${telefoneCliente}`);
}

// ============================================================
//  TEXTOS DAS SUÍTES
// ============================================================
const SUITES = {
  standart: {
    nome: 'Suíte Standart',
    texto:
      '🛏 *Suíte Standart*\n\n' +
      'Conforto e aconchego para uma pausa especial.\n\n' +
      '✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n' +
      '✅ Ducha higiênica _(não possui chuveiro)_\n' +
      '🚗 Estacionamento coberto e privativo\n\n' +
      '💰 *2 horas:*\n' +
      '📅 Semana _(seg 6h → qui 18h)_: R$ 50,00 (hora add. R$ 20)\n' +
      '📅 Fim de semana _(qui 18h → seg 6h)_: R$ 55,00 (hora add. R$ 20)\n\n' +
      '⏰ Entrada direta, 24 horas!\n\n' +
      '✨ _Dica: por apenas R$ 30 a mais a Suíte Luxo tem chuveiro e opção de pernoite. Digite *2* para conhecer!_',
    proxima: '2',
  },
  luxo: {
    nome: 'Suíte Luxo',
    texto:
      '✨ *Suíte Luxo*\n\n' +
      'Sofisticação e bem-estar com exclusividade.\n\n' +
      '✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n✅ Chuveiro\n' +
      '🚗 Estacionamento coberto e privativo\n\n' +
      '💰 *2 horas:*\n' +
      '📅 Semana _(seg 6h → qui 18h)_: R$ 80,00 (hora add. R$ 35)\n' +
      '📅 Fim de semana _(qui 18h → seg 6h)_: R$ 85,00 (hora add. R$ 35)\n\n' +
      '🌙 *Pernoite (12h):*\n' +
      '📅 Semana: R$ 179,00\n' +
      '📅 Fim de semana: R$ 269,00\n\n' +
      '🌹 Com decoração especial: a partir de R$ 329,00\n\n' +
      '✨ _Dica: a Suíte Hidro tem hidromassagem privativa — perfeita para relaxar a dois. Digite *4* para conhecer!_',
    proxima: '4',
  },
  hidro: {
    nome: 'Suíte Hidro',
    texto:
      '🛁 *Suíte Hidro*\n\n' +
      'Hidromassagem privativa para momentos inesquecíveis.\n\n' +
      '✅ Hidromassagem\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n' +
      '🚗 Estacionamento coberto e privativo\n\n' +
      '💰 *2 horas:*\n' +
      '📅 Semana _(seg 6h → qui 18h)_: R$ 149,00 (hora add. R$ 70)\n' +
      '📅 Fim de semana _(qui 18h → seg 6h)_: R$ 169,00 (hora add. R$ 70)\n\n' +
      '🌙 *Pernoite (12h):*\n' +
      '📅 Semana: R$ 299,00\n' +
      '📅 Fim de semana: R$ 419,00\n\n' +
      '🌹 Com decoração especial: a partir de R$ 529,00\n\n' +
      '✨ _Dica: para o máximo em exclusividade, a Hidro Premium é nossa suíte top. Digite *5* para conhecer!_',
    proxima: '5',
  },
  premium: {
    nome: 'Hidro Premium',
    texto:
      '👑 *Hidro Premium*\n\n' +
      'Nossa suíte mais exclusiva. Máximo em bem-estar e privacidade.\n\n' +
      '✅ Hidromassagem premium\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n' +
      '🚗 Estacionamento coberto e privativo\n\n' +
      '💰 *2 horas:*\n' +
      '📅 Semana _(seg 6h → qui 18h)_: R$ 165,00 (hora add. R$ 40)\n' +
      '📅 Fim de semana _(qui 18h → seg 6h)_: R$ 185,00 (hora add. R$ 40)\n\n' +
      '🌙 *Pernoite (12h):*\n' +
      '📅 Semana: R$ 329,00\n' +
      '📅 Fim de semana: R$ 439,00\n\n' +
      '🌹 Com decoração especial: a partir de R$ 549,00\n\n' +
      '🏆 A escolha perfeita para quem quer o melhor!',
    proxima: null,
  },
};

const HORARIOS =
  '📅 *Período Semana:*\n' +
  'Segunda-feira às 6h até Quinta-feira às 18h\n\n' +
  '📅 *Período Fim de Semana:*\n' +
  'Quinta-feira às 18h até Segunda-feira às 6h';

const MENU_PRINCIPAL =
  'Olá! Seja muito bem-vindo ao *Motel Lamore* 🌹\n\n' +
  'Somos referência em bem-estar e exclusividade em Ourinhos/SP.\n\n' +
  'Como posso te ajudar? Digite o número:\n\n' +
  '1️⃣ Ver suítes e preços\n' +
  '2️⃣ Suíte Standart\n' +
  '3️⃣ Suíte Luxo\n' +
  '4️⃣ Suíte Hidro\n' +
  '5️⃣ Hidro Premium\n' +
  '6️⃣ Ver fotos\n' +
  '7️⃣ Decoração especial\n' +
  '8️⃣ Disponibilidade de quartos\n' +
  '9️⃣ Como chegar\n' +
  '0️⃣ Falar com atendente';

const MENU_SUITES =
  '🌹 *Nossas suítes:*\n\n' +
  '🛏 *Standart* — a partir de R$ 50 (2h)\n' +
  '✨ *Luxo* — a partir de R$ 80 (2h) | R$ 179 (pernoite)\n' +
  '🛁 *Hidro* — a partir de R$ 149 (2h) | R$ 299 (pernoite)\n' +
  '👑 *Hidro Premium* — a partir de R$ 165 (2h) | R$ 329 (pernoite)\n\n' +
  '⏰ *Nossos períodos:*\n' +
  '📅 Semana: segunda às 6h → quinta às 18h\n' +
  '📅 Fim de semana: quinta às 18h → segunda às 6h\n\n' +
  'Digite o número da suíte para mais detalhes:\n' +
  '2 - Standart | 3 - Luxo | 4 - Hidro | 5 - Premium';

const DECORACAO =
  '🌹 *Decoração Especial Lamore*\n\n' +
  'Transformamos a suíte num cenário único e inesquecível:\n\n' +
  '🛏 Cobertor vermelho\n' +
  '🛏 Lençol personalizado com frase à sua escolha:\n' +
  '   • Parabéns pelo seu aniversário\n' +
  '   • Parabéns pelo nosso aniversário de casamento\n' +
  '   • Felicidades aos noivos\n' +
  '   • Eu te amo\n' +
  '   • Quer casar comigo?\n' +
  '   • Quer namorar comigo?\n' +
  '   • Vamos brindar o amor\n' +
  '   • Você me faz feliz\n\n' +
  '🎈 2 balões metálicos coração + 15 bexigas\n' +
  '🌹 Pétalas de rosas artificiais e naturais\n' +
  '🕯 Velas decorativas LED + aparador\n' +
  '🍫 2 pacotes de bombons\n' +
  '🛁 Toalhas e tapetes personalizados\n' +
  '🍾 Espumante no balde com gelo + 2 taças\n\n' +
  '📌 *Reserva com mínimo 36h de antecedência.*\n\n' +
  'Para qual suíte você gostaria de reservar com decoração?\n' +
  '3 - Luxo | 4 - Hidro | 5 - Premium\n\n' +
  'Ou digite *reservar* para iniciar o agendamento agora.';

// ============================================================
//  PALAVRAS-CHAVE
// ============================================================
function contem(texto, palavras) {
  const t = texto.toLowerCase();
  return palavras.some(p => t.includes(p));
}

const KW_RECLAMACAO  = ['reclamação','reclamacao','reclamar','problema','péssimo','pessimo','horrível','horrible','insatisfeito','decepcionado','não gostei','nao gostei','sujo','quebrado','errado','ruim'];
const KW_ESQUECIDO   = ['esqueci','esquecido','esqueceu','deixei','objeto perdido','bolsa','carteira','celular','chave','documento','óculos','oculos','roupa','pertence'];
const KW_FOTO        = ['foto','fotos','imagem','imagens','ver','como é','como e','mostra','quero ver','aparência','aparencia'];
const KW_CHEGAR      = ['endereço','endereco','onde fica','localização','localizacao','como chegar','chegar','mapa','rua'];
const KW_DISPONIVEL  = ['disponível','disponivel','disponibilidade','tem quarto','tem vaga','livre','vago','ocupado'];
const KW_ATENDENTE   = ['atendente','humano','pessoa','falar com','quero falar','me ajuda'];
const KW_NUMERO_PRIV = ['número do dono','numero do dono','seu número','seu numero','número interno','43996','99606','número privado'];
const KW_RESERVAR    = ['reservar','reserva','agendar','quero reservar','decoração','decoracao'];
const KW_OI          = ['oi','olá','ola','bom dia','boa tarde','boa noite','boa noite','hello','hi','hey','menu','início','inicio','começo'];

// ============================================================
//  FLUXO DE COLETA DE DADOS PARA RESERVA COM DECORAÇÃO
// ============================================================
function processarReserva(tel, texto, sessao) {
  const etapa = sessao.etapa;

  if (etapa === 'reserva_suite') {
    sessao.dados.suite = texto;
    sessao.etapa = 'reserva_data';
    enviarMensagem(tel, '📅 Qual a *data e horário* desejados?\n_(Ex: 15/07/2025 às 20h)_');
    return;
  }
  if (etapa === 'reserva_data') {
    sessao.dados.data = texto;
    sessao.etapa = 'reserva_espumante';
    enviarMensagem(tel, '🍾 Qual espumante você prefere?\n\n1 - Chuva de Prata\n2 - Santa Colina');
    return;
  }
  if (etapa === 'reserva_espumante') {
    sessao.dados.espumante = texto === '1' ? 'Chuva de Prata' : texto === '2' ? 'Santa Colina' : texto;
    sessao.etapa = 'reserva_frase';
    enviarMensagem(tel, '💬 Qual *frase* você quer no lençol personalizado?\n\nExemplos:\n• Eu te amo\n• Parabéns pelo nosso aniversário\n• Quer casar comigo?\n\nOu escreva a sua própria! 😊');
    return;
  }
  if (etapa === 'reserva_frase') {
    sessao.dados.frase = texto;
    sessao.etapa = 'menu';

    const resumo =
      `📋 *Resumo da sua reserva:*\n\n` +
      `🛏 Suíte: ${sessao.dados.suite}\n` +
      `📅 Data/hora: ${sessao.dados.data}\n` +
      `🍾 Espumante: ${sessao.dados.espumante}\n` +
      `💬 Frase: "${sessao.dados.frase}"\n\n` +
      `✅ Dados recebidos! Um atendente irá confirmar sua reserva em breve. Obrigada! 🌹`;

    enviarMensagem(tel, resumo);

    const dadosAlerta =
      `🛏 Suíte: ${sessao.dados.suite}\n` +
      `📅 Data/hora: ${sessao.dados.data}\n` +
      `🍾 Espumante: ${sessao.dados.espumante}\n` +
      `💬 Frase: "${sessao.dados.frase}"`;

    alertarDono('decoracao', tel, 'Reserva com decoração solicitada', dadosAlerta);
    sessao.dados = {};
    return;
  }
}

// ============================================================
//  PROCESSADOR PRINCIPAL DE MENSAGENS
// ============================================================
function processarMensagem(tel, textoOriginal) {
  const texto = textoOriginal.trim();
  const sessao = getSessao(tel);

  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa}`);

  // Bloquear revelação do número privado
  if (contem(texto, KW_NUMERO_PRIV)) {
    enviarMensagem(tel, 'Não tenho essa informação disponível 😊 Posso te ajudar com nossas suítes, preços ou agendamentos!');
    return;
  }

  // Fluxo de reserva ativo
  if (sessao.etapa.startsWith('reserva_')) {
    processarReserva(tel, texto, sessao);
    return;
  }

  // Reclamação
  if (contem(texto, KW_RECLAMACAO)) {
    alertarDono('reclamacao', tel, texto, null);
    enviarMensagem(tel,
      'Lamentamos muito que sua experiência não tenha sido a esperada 😔\n\n' +
      'Sua satisfação é muito importante para nós. Estou chamando um atendente agora para resolver isso da melhor forma possível. Aguarde!'
    );
    sessao.etapa = 'menu';
    return;
  }

  // Item esquecido
  if (contem(texto, KW_ESQUECIDO)) {
    alertarDono('esquecido', tel, texto, null);
    enviarMensagem(tel,
      'Que situação chata! Vamos te ajudar a recuperar seu item o quanto antes 😊\n\n' +
      'Estou chamando um atendente que irá verificar e providenciar a devolução. Aguarde!'
    );
    sessao.etapa = 'menu';
    return;
  }

  // Iniciar reserva com decoração por palavra-chave
  if (contem(texto, KW_RESERVAR) || texto === 'reservar') {
    sessao.etapa = 'reserva_suite';
    enviarMensagem(tel,
      '🌹 *Reserva com Decoração Especial*\n\n' +
      'Ótimo! Vou coletar os dados para garantir tudo certinho.\n\n' +
      'Para qual suíte você gostaria de reservar?\n' +
      '• Luxo\n• Hidro\n• Hidro Premium'
    );
    return;
  }

  // Fotos
  if (contem(texto, KW_FOTO) || texto === '6') {
    enviarMensagem(tel, `📸 *Galeria de fotos do Motel Lamore*\n\nConfira todas as nossas suítes em detalhes:\n${FOTOS_URL}`);
    sessao.etapa = 'menu';
    return;
  }

  // Como chegar
  if (contem(texto, KW_CHEGAR) || texto === '9') {
    enviarMensagem(tel,
      `📍 *Motel Lamore*\nRua Ana Neri, 501 — Ourinhos/SP\n\n` +
      `🚗 Estacionamento coberto e privativo, total discrição garantida.\n\n` +
      `Estamos abertos 24 horas! 😊\n\n` +
      `${MAPS_URL}`
    );
    sessao.etapa = 'menu';
    return;
  }

  // Disponibilidade
  if (contem(texto, KW_DISPONIVEL) || texto === '8') {
    enviarMensagem(tel,
      `Para verificar a disponibilidade em tempo real, entre em contato com nossa recepção:\n\n` +
      `📞 *${TEL_REC}*\n\nAtendemos 24 horas, todos os dias!`
    );
    sessao.etapa = 'menu';
    return;
  }

  // Atendente humano
  if (contem(texto, KW_ATENDENTE) || texto === '0') {
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde um momento, em breve alguém irá te responder 😊');
    alertarDono('reclamacao', tel, `Cliente solicitou atendente humano: "${texto}"`, null);
    sessao.etapa = 'menu';
    return;
  }

  // Decoração
  if (texto === '7' || contem(texto, ['decoração especial','decoracao especial'])) {
    enviarMensagem(tel, DECORACAO);
    sessao.etapa = 'menu';
    return;
  }

  // Menu de suítes
  if (texto === '1' || contem(texto, ['ver suítes','ver suites','suítes','suites','preços','precos'])) {
    enviarMensagem(tel, MENU_SUITES);
    sessao.etapa = 'menu';
    return;
  }

  // Suítes individuais
  if (texto === '2' || contem(texto, ['standart','standard','padrão','padrao'])) {
    enviarMensagem(tel, SUITES.standart.texto);
    sessao.etapa = 'menu';
    return;
  }
  if (contem(texto, ['horário','horario','preço','preco','valor','valores','período','periodo','horários','horarios'])) {
    enviarMensagem(tel,
      '⏰ *Horários e valores do Motel Lamore*\n\n' +
      '📅 *Período Semana:*\n' +
      'Segunda-feira às 6h até Quinta-feira às 18h\n\n' +
      '📅 *Período Fim de Semana:*\n' +
      'Quinta-feira às 18h até Segunda-feira às 6h\n\n' +
      '💰 *Valores por suíte:*\n\n' +
      '🛏 Standart — 2h: R$ 50 (semana) | R$ 55 (FDS)\n' +
      '✨ Luxo — 2h: R$ 80 (semana) | R$ 85 (FDS)\n' +
      '         Pernoite: R$ 179 (semana) | R$ 269 (FDS)\n' +
      '🛁 Hidro — 2h: R$ 149 (semana) | R$ 169 (FDS)\n' +
      '           Pernoite: R$ 299 (semana) | R$ 419 (FDS)\n' +
      '👑 Premium — 2h: R$ 165 (semana) | R$ 185 (FDS)\n' +
      '             Pernoite: R$ 329 (semana) | R$ 439 (FDS)\n\n' +
      'Funcionamos *24 horas*, todos os dias!'
    );
    sessao.etapa = 'menu';
    return;
  }

  if (texto === '3' || contem(texto, ['luxo','suite luxo','suíte luxo'])) {
    enviarMensagem(tel, SUITES.luxo.texto);
    sessao.etapa = 'menu';
    return;
  }
  if (texto === '4' || contem(texto, ['hidro','suite hidro','suíte hidro','hidromassagem'])) {
    enviarMensagem(tel, SUITES.hidro.texto);
    sessao.etapa = 'menu';
    return;
  }
  if (texto === '5' || contem(texto, ['premium','hidro premium','suite premium'])) {
    enviarMensagem(tel, SUITES.premium.texto);
    sessao.etapa = 'menu';
    return;
  }

  // Saudação / menu inicial
  if (contem(texto, KW_OI) || sessao.etapa === 'menu') {
    enviarMensagem(tel, MENU_PRINCIPAL);
    sessao.etapa = 'aguardando';
    return;
  }

  // Fallback
  enviarMensagem(tel,
    'Não entendi muito bem 😊\n\n' +
    'Digite um número do menu ou escreva o que precisa:\n\n' +
    '1 - Ver suítes | 6 - Fotos | 7 - Decoração\n8 - Disponibilidade | 9 - Como chegar | 0 - Atendente'
  );
}

// ============================================================
//  SERVIDOR HTTP — RECEBE WEBHOOK DO Z-API
// ============================================================
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // Ignorar mensagens enviadas pelo próprio bot
        if (payload.fromMe) { res.writeHead(200); res.end('ok'); return; }

        const tel   = payload.phone || payload.from || '';
        const texto = payload.text?.message || payload.body || '';

        if (tel && texto) processarMensagem(tel, texto);

      } catch (e) {
        console.error('[ERRO webhook]', e.message);
      }
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(200);
    res.end('Layla - Motel Lamore está online 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('');
  console.log('🌹 ============================================');
  console.log('   LAYLA — Assistente Virtual Motel Lamore');
  console.log('   Servidor rodando na porta ' + CONFIG.PORTA);
  console.log('   Webhook URL: http://SEU_IP:' + CONFIG.PORTA + '/webhook');
  console.log('🌹 ============================================');
  console.log('');
  if (CONFIG.ZAPI_INSTANCE === 'SEU_INSTANCE_ID') {
    console.log('⚠️  ATENÇÃO: Configure o arquivo layla.js com seus dados do Z-API antes de usar!');
    console.log('   Abra o arquivo layla.js e preencha a seção CONFIG no início do arquivo.');
    console.log('');
  }
});
