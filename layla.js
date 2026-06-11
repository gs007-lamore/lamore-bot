// ============================================================
//  LAYLA ESPECIAL — DIA DOS NAMORADOS
//  Motel Lamore | Ourinhos/SP
//  Ativa: 11, 12 e madrugada do 13 de junho
// ============================================================

const http  = require('http');
const https = require('https');

const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  NUMERO_DONO:       '5543996066590',
  PORTA:             process.env.PORT || 3000,
  TIMER_HUMANO_MS:   30 * 60 * 1000,
};

const MAPS_URL = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const TEL_REC   = '(14) 3324-6489';
const sessoes   = {};

const NOTA_MENU = '\n\n_Digite *menu* a qualquer momento para voltar ao início._';

function getSessao(tel) {
  if (!sessoes[tel]) sessoes[tel] = { etapa: 'menu', dados: {}, atendimentoHumano: false, timerHumano: null };
  return sessoes[tel];
}

// ============================================================
//  MODO HUMANO
// ============================================================
function ativarModoHumano(tel) {
  const sessao = getSessao(tel);
  sessao.atendimentoHumano = true;
  renovarTimerHumano(tel);
  console.log(`[HUMANO ATIVO] ${tel}`);
}

function renovarTimerHumano(tel) {
  const sessao = getSessao(tel);
  if (sessao.timerHumano) clearTimeout(sessao.timerHumano);
  sessao.timerHumano = setTimeout(() => {
    sessao.atendimentoHumano = false;
    sessao.timerHumano = null;
    sessao.etapa = 'menu';
    console.log(`[HUMANO ENCERRADO] ${tel}`);
    enviarMensagem(tel,
      'Olá! Sou a Layla, assistente do *Motel Lamore* 🌹\n\n' +
      'Estou de volta para te ajudar.\n\n' +
      'Digite *menu* para ver nossas opções especiais de Dia dos Namorados.'
    );
  }, CONFIG.TIMER_HUMANO_MS);
}

function desativarModoHumano(tel) {
  const sessao = getSessao(tel);
  if (sessao.timerHumano) clearTimeout(sessao.timerHumano);
  sessao.timerHumano = null;
  sessao.atendimentoHumano = false;
  sessao.etapa = 'menu';
  console.log(`[HUMANO DESATIVADO] ${tel}`);
  enviarMensagem(tel,
    'Olá! Sou a Layla, assistente do *Motel Lamore* 🌹\n\n' +
    'Estou de volta para te ajudar.\n\n' +
    'Digite *menu* para ver nossas opções especiais de Dia dos Namorados.'
  );
}

// ============================================================
//  ENVIO DE MENSAGEM
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
    res.on('data', () => {});
    res.on('end', () => console.log(`[ENVIADO -> ${telefone}] status ${res.statusCode}`));
  });
  req.on('error', e => console.error('[ERRO]', e.message));
  req.write(body);
  req.end();
}

function alertarDono(tipo, tel, msg) {
  const hora  = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reserva: '🟢', atendente: '🔵', esquecido: '🟡', reclamacao: '🔴' };
  const labels  = { reserva: 'Reserva Dia dos Namorados', atendente: 'Solicitou atendente', esquecido: 'Item esquecido', reclamacao: 'Reclamação' };
  const alerta =
    `${icones[tipo]} *ALERTA LAMORE*\n` +
    `Tipo: ${labels[tipo]}\n` +
    `Cliente: ${tel}\n` +
    `Mensagem: "${msg}"\n` +
    `Horário: ${hora}`;
  enviarMensagem(CONFIG.NUMERO_DONO, alerta);
}

function contem(texto, palavras) {
  const t = texto.toLowerCase();
  return palavras.some(p => t.includes(p));
}

// ============================================================
//  TEXTOS ESPECIAIS — DIA DOS NAMORADOS
// ============================================================

const BOAS_VINDAS =
  '🌹 *Bem-vindo ao Motel Lamore*\n\n' +
  'O amor está no ar... e nós preparamos algo especial para vocês. 💫\n\n' +
  'Neste Dia dos Namorados, o *Lamore* se transforma num refúgio de romance, elegância e momentos que não se esquecem.\n\n' +
  '✨ _Todas as suítes com decoração especial inclusa_\n' +
  '🌹 _A partir das 18h do dia 11 até as 06h do dia 13 de junho_\n\n' +
  'Como posso te ajudar? Digite o número:\n\n' +
  '1 - Nossas suítes especiais\n' +
  '2 - Suíte Confort ✨ _Lançamento_\n' +
  '3 - Suíte Luxo\n' +
  '4 - Suíte Hidro\n' +
  '5 - Hidro Premium\n' +
  '6 - Ver fotos\n' +
  '7 - Informações e reservas\n' +
  '0 - Falar com atendente';

const TODAS_SUITES =
  '🌹 *Nossas Suítes — Dia dos Namorados*\n\n' +
  'Neste fim de semana especial, *todas as suítes contam com decoração inclusa*:\n\n' +
  '🌹 Cobertor vermelho + lençol personalizado\n' +
  '🎈 Balões metálicos + bexigas coração\n' +
  '🌸 Pétalas de rosas naturais e artificiais\n' +
  '🕯 Velas decorativas LED\n' +
  '🍾 Espumante no balde com gelo + 2 taças\n' +
  '🍫 Bombons + toalhas e tapetes personalizados\n\n' +
  '⏰ *Disponível das 18h do dia 11 até as 06h do dia 13 de junho*\n\n' +
  '🌙 Pernoites liberados a partir das 01h do dia 13\n\n' +
  'Escolha sua suíte:\n\n' +
  '2 - Suíte Confort ✨ _Lançamento_\n' +
  '3 - Suíte Luxo\n' +
  '4 - Suíte Hidro\n' +
  '5 - Hidro Premium' + NOTA_MENU;

const SUITE_CONFORT =
  '✨ *Suíte Confort — Lançamento* 🎉\n\n' +
  'Nossa mais nova suíte chega em grande estilo para o Dia dos Namorados.\n\n' +
  '_Design moderno, ambiente aconchegante e tudo pensado para o casal que busca conforto com sofisticação._\n\n' +
  '✅ Ar-condicionado\n' +
  '✅ Banheiro equipado com chuveiro\n' +
  '✅ Design moderno e aconchegante\n' +
  '🚗 Estacionamento coberto e privativo\n\n' +
  '🌹 *Decoração especial inclusa neste fim de semana*\n\n' +
  '💡 _A suíte mais em conta do Lamore, sem abrir mão do charme e do romantismo._\n\n' +
  '📞 Valores e disponibilidade: consulte na recepção\n' +
  TEL_REC + NOTA_MENU;

const SUITE_LUXO =
  '✨ *Suíte Luxo*\n\n' +
  '_Onde a sofisticação encontra o romantismo._\n\n' +
  '✅ TV\n' +
  '✅ Ar-condicionado\n' +
  '✅ Frigobar\n' +
  '✅ Chuveiro\n' +
  '🚗 Estacionamento coberto e privativo\n\n' +
  '🌹 *Decoração especial inclusa neste fim de semana*\n\n' +
  '📞 Valores e disponibilidade: consulte na recepção\n' +
  TEL_REC + NOTA_MENU;

const SUITE_HIDRO =
  '🛁 *Suíte Hidro*\n\n' +
  '_Para os casais que querem transformar a noite em algo verdadeiramente inesquecível._\n\n' +
  '✅ Hidromassagem privativa\n' +
  '✅ Chuveiro\n' +
  '✅ Ar-condicionado\n' +
  '✅ TV\n' +
  '✅ Frigobar\n' +
  '🚗 Estacionamento coberto e privativo\n\n' +
  '🌹 *Decoração especial inclusa neste fim de semana*\n\n' +
  '💧 _A hidromassagem a dois é a escolha perfeita para relaxar e celebrar o amor._\n\n' +
  '📞 Valores e disponibilidade: consulte na recepção\n' +
  TEL_REC + NOTA_MENU;

const SUITE_PREMIUM =
  '👑 *Hidro Premium*\n\n' +
  '_A experiência mais exclusiva do Lamore. Para quem quer celebrar o amor sem limites._\n\n' +
  '✅ Hidromassagem premium\n' +
  '✅ Chuveiro\n' +
  '✅ Ar-condicionado\n' +
  '✅ TV\n' +
  '✅ Frigobar\n' +
  '🚗 Estacionamento coberto e privativo\n\n' +
  '🌹 *Decoração especial inclusa neste fim de semana*\n\n' +
  '👑 _Nossa suíte mais completa, pensada para noites que se tornam memórias._\n\n' +
  '📞 Valores e disponibilidade: consulte na recepção\n' +
  TEL_REC + NOTA_MENU;

const INFO_RESERVAS =
  '🌹 *Informações — Dia dos Namorados*\n\n' +
  '📅 *Período especial:*\n' +
  'Das 18h do dia 11 até as 06h do dia 13 de junho\n\n' +
  '🌙 *Pernoites:*\n' +
  'Liberados a partir das 01h do dia 13 de junho\n\n' +
  '🌹 *Decoração especial:*\n' +
  'Inclusa em todas as suítes durante o período especial\n\n' +
  '💰 *Valores:*\n' +
  'Consulte diretamente na recepção — não informamos valores pelo WhatsApp nesta data especial\n\n' +
  '📞 ' + TEL_REC + '\n\n' +
  'Para reservar, entre em contato com nossa recepção ou venha nos visitar!\n\n' +
  '📍 Rua Ana Neri, 501 — Ourinhos/SP' + NOTA_MENU;

const VALORES_MSG =
  '💰 Nesta data especial, os valores são consultados diretamente na recepção.\n\n' +
  'Queremos que a surpresa seja completa — do valor à experiência! 🌹\n\n' +
  '📞 ' + TEL_REC + '\n\n' +
  '📍 Rua Ana Neri, 501 — Ourinhos/SP\n\n' +
  '_Estamos abertos 24 horas e prontos para recebê-los!_' + NOTA_MENU;

const PROVOCACAO =
  '🌹 *O Lamore tem um convite especial para você...*\n\n' +
  'Imagine um ambiente preparado com todo o romantismo que vocês merecem.\n' +
  'Pétalas. Velas. Espumante. E a companhia perfeita. 💫\n\n' +
  'Tudo pronto. Só falta você dizer sim. 😉\n\n' +
  'Venha descobrir o que preparamos para este Dia dos Namorados.\n\n' +
  '📞 ' + TEL_REC + '\n' +
  '📍 Rua Ana Neri, 501 — Ourinhos/SP\n\n' +
  '_A noite mais especial do ano começa aqui._ 🌹' + NOTA_MENU;

// ============================================================
//  PROCESSADOR PRINCIPAL
// ============================================================
function processarMensagem(tel, textoOriginal, fromMe) {
  const texto  = textoOriginal.trim();
  const sessao = getSessao(tel);

  // fromMe: dono enviou mensagem
  if (fromMe) {
    if (texto === '0') {
      if (sessao.atendimentoHumano) desativarModoHumano(tel);
    } else {
      if (!sessao.atendimentoHumano) {
        ativarModoHumano(tel);
        console.log(`[HUMANO ATIVADO] ${tel}`);
      } else {
        renovarTimerHumano(tel);
      }
    }
    return;
  }

  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa} | humano: ${sessao.atendimentoHumano}`);

  if (sessao.atendimentoHumano) { console.log(`[IGNORADO] ${tel}`); return; }

  // Menu em qualquer momento
  if (texto === 'menu' || texto === 'Menu' || texto === 'MENU') {
    sessao.etapa = 'aguardando';
    enviarMensagem(tel, BOAS_VINDAS);
    return;
  }

  // Proteção número privado
  if (contem(texto, ['numero do dono','seu numero','43996','99606'])) {
    enviarMensagem(tel, 'Não tenho essa informação disponível 😊' + NOTA_MENU);
    return;
  }

  // Valores / preços
  if (contem(texto, ['valor','valores','preco','preço','quanto','custa','custo','tabela'])) {
    enviarMensagem(tel, VALORES_MSG);
    return;
  }

  // Reclamação
  if (contem(texto, ['reclamacao','reclamação','reclamar','pessimo','péssimo','horrivel','horrível','nao gostei','não gostei','sujo','quebrado','ruim'])) {
    alertarDono('reclamacao', tel, texto);
    enviarMensagem(tel, 'Lamentamos muito 😔 Vou chamar um atendente agora para resolver isso. Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Item esquecido
  if (contem(texto, ['esqueci','esquecido','deixei','bolsa','carteira','celular','chave','documento','oculos','óculos','roupa'])) {
    alertarDono('esquecido', tel, texto);
    enviarMensagem(tel, 'Que situação! Vou chamar um atendente para te ajudar 😊 Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Atendente
  if (contem(texto, ['atendente','humano','falar com','quero falar']) || texto === '0') {
    alertarDono('atendente', tel, `Solicitou atendente: "${texto}"`);
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde um momento 😊\n\nAssim que finalizar, estarei aqui novamente!' + NOTA_MENU);
    ativarModoHumano(tel);
    return;
  }

  // Reservas / quero reservar
  if (contem(texto, ['reservar','reserva','agendar','quero ir','quero visitar']) || texto === '7') {
    alertarDono('reserva', tel, `Cliente interessado em reserva: "${texto}"`);
    enviarMensagem(tel, INFO_RESERVAS);
    return;
  }

  // Fotos
  if (contem(texto, ['foto','fotos','imagem','ver','mostra','galeria']) || texto === '6') {
    enviarMensagem(tel, '📸 *Galeria de fotos do Motel Lamore*\n\nConfira nossas suítes:\n' + FOTOS_URL + NOTA_MENU);
    return;
  }

  // Suítes
  if (texto === '1' || contem(texto, ['suites','suítes','todas','opcoes','opções'])) {
    enviarMensagem(tel, TODAS_SUITES);
    return;
  }
  if (texto === '2' || contem(texto, ['confort','conforto'])) {
    enviarMensagem(tel, SUITE_CONFORT);
    return;
  }
  if (texto === '3' || contem(texto, ['luxo'])) {
    enviarMensagem(tel, SUITE_LUXO);
    return;
  }
  if (texto === '4' || (contem(texto, ['hidro']) && !contem(texto, ['premium']))) {
    enviarMensagem(tel, SUITE_HIDRO);
    return;
  }
  if (texto === '5' || contem(texto, ['premium'])) {
    enviarMensagem(tel, SUITE_PREMIUM);
    return;
  }

  // Como chegar / endereço
  if (contem(texto, ['endereco','endereço','onde fica','localizacao','localização','como chegar','chegar','mapa'])) {
    enviarMensagem(tel, '📍 *Motel Lamore*\nRua Ana Neri, 501 — Ourinhos/SP\n\n🚗 Estacionamento coberto e privativo.\n\nAbertos 24 horas! 😊\n\n' + MAPS_URL + NOTA_MENU);
    return;
  }

  // Pernoite
  if (contem(texto, ['pernoite','passar a noite','dormir','noite toda','noite inteira'])) {
    enviarMensagem(tel,
      '🌙 *Pernoites — Dia dos Namorados*\n\n' +
      'Neste fim de semana especial, os pernoites estão disponíveis *a partir das 01h do dia 13 de junho*.\n\n' +
      '🌹 Todas as suítes com decoração especial inclusa.\n\n' +
      '📞 Valores e disponibilidade: ' + TEL_REC + NOTA_MENU
    );
    return;
  }

  // Decoração
  if (contem(texto, ['decoracao','decoração','decora'])) {
    enviarMensagem(tel,
      '🌹 *Decoração Especial — Dia dos Namorados*\n\n' +
      'Preparamos algo muito especial para vocês nesta data... 💫\n\n' +
      'Venha descobrir pessoalmente. A surpresa faz parte da experiência! 😉\n\n' +
      '📞 ' + TEL_REC + '\n' +
      '📍 Rua Ana Neri, 501 — Ourinhos/SP\n\n' +
      '_Estamos abertos 24 horas e prontos para recebê-los!_' + NOTA_MENU
    );
    return;
  }

  // Saudação / menu inicial
  if (contem(texto, ['oi','olá','ola','bom dia','boa tarde','boa noite','inicio','início','começo']) || sessao.etapa === 'menu') {
    enviarMensagem(tel, BOAS_VINDAS);
    sessao.etapa = 'aguardando';
    return;
  }

  // Mensagem provocativa para textos não identificados
  enviarMensagem(tel, PROVOCACAO);
}

// ============================================================
//  SERVIDOR HTTP
// ============================================================
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const tel    = payload.phone || payload.from || '';
        const texto  = payload.text?.message || payload.body || '';
        const fromMe = payload.fromMe || false;
        if (tel && texto) processarMensagem(tel, texto, fromMe);
      } catch (e) { console.error('[ERRO]', e.message); }
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(200); res.end('Layla Dia dos Namorados — Motel Lamore 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('\n🌹 ============================================');
  console.log('   LAYLA ESPECIAL — DIA DOS NAMORADOS');
  console.log('   Motel Lamore | Porta: ' + CONFIG.PORTA);
  console.log('🌹 ============================================\n');
});
