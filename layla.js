// ============================================================
//  LAYLA - Assistente Virtual do Motel Lamore
//  Versao 4.0 | Ourinhos/SP
// ============================================================

const http  = require('http');
const https = require('https');

const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  NUMERO_DONO:       '5543996066590',
  PORTA:             process.env.PORT || 3000,
};

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';
const sessoes   = {};

const PERIODOS =
  '📅 *Período Semana:*\nSegunda-feira às 6h até Quinta-feira às 18h\n' +
  '📅 *Período Fim de Semana:*\nQuinta-feira às 18h até Segunda-feira às 6h';

const FRASES_DECORACAO =
  '1 - Parabéns pelo seu aniversário\n' +
  '2 - Parabéns pelo nosso aniversário de casamento\n' +
  '3 - Felicidades aos noivos\n' +
  '4 - Eu te amo\n' +
  '5 - Quer casar comigo?\n' +
  '6 - Quer namorar comigo?\n' +
  '7 - Vamos brindar o amor\n' +
  '8 - Você me faz feliz';

const FRASES_LISTA = [
  'Parabéns pelo seu aniversário',
  'Parabéns pelo nosso aniversário de casamento',
  'Felicidades aos noivos',
  'Eu te amo',
  'Quer casar comigo?',
  'Quer namorar comigo?',
  'Vamos brindar o amor',
  'Você me faz feliz',
];

const VALORES_DECORACAO = {
  'Suíte Luxo':    { '2 horas': 'R$ 229 (semana) | R$ 259 (FDS)',  'Pernoite (12h)': 'R$ 329 (semana) | R$ 419 (FDS)' },
  'Suíte Hidro':   { '2 horas': 'R$ 379 (semana) | R$ 409 (FDS)',  'Pernoite (12h)': 'R$ 529 (semana) | R$ 559 (FDS)' },
  'Hidro Premium': { '2 horas': 'R$ 399 (semana) | R$ 429 (FDS)',  'Pernoite (12h)': 'R$ 549 (semana) | R$ 579 (FDS)' },
};

const TIMER_HUMANO_MS = 30 * 60 * 1000; // 30 minutos

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
    console.log(`[HUMANO ENCERRADO POR TIMEOUT] ${tel}`);
    enviarMensagem(tel, 'Olá! Sou a Layla, assistente virtual do *Motel Lamore* 🌹\n\nEstou de volta para te ajudar!\n\nDigite *menu* para ver as opções.');
  }, TIMER_HUMANO_MS);
}

function desativarModoHumano(tel) {
  const sessao = getSessao(tel);
  sessao.atendimentoHumano = false;
  sessao.etapa = 'menu';
  console.log(`[HUMANO ENCERRADO] ${tel} - Layla voltou a responder`);
  enviarMensagem(tel, 'Olá! Sou a Layla, assistente virtual do *Motel Lamore* 🌹\n\nCaso precise de algo mais, estou aqui para ajudar!\n\nDigite *menu* para ver as opções.');
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

function alertarDono(tipo, tel, msg, extras) {
  const hora   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reclamacao: '🔴', esquecido: '🟡', decoracao: '🟢' };
  const labels  = { reclamacao: 'Reclamação de cliente', esquecido: 'Item esquecido', decoracao: 'Reserva com decoração' };
  let alerta = `${icones[tipo]} *ALERTA LAMORE*\nTipo: ${labels[tipo]}\nCliente: ${tel}\nMensagem: "${msg}"\nHorário: ${hora}`;
  if (extras) alerta += `\n\nDados:\n${extras}`;
  enviarMensagem(CONFIG.NUMERO_DONO, alerta);
}

function contem(texto, palavras) {
  const t = texto.toLowerCase();
  return palavras.some(p => t.includes(p));
}

// ============================================================
//  TEXTOS DAS SUITES
// ============================================================
const SUITES = {
  confort:
    '🛋 *Suíte Confort* ✨ _Lançamento_\n\n' +
    'Design moderno e aconchegante para o casal que busca conforto com estilo.\n\n' +
    '✅ Ar-condicionado\n' +
    '✅ Banheiro equipado com chuveiro\n' +
    '✅ Design moderno e aconchegante\n' +
    '🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n' +
    '• Semana: R$ 65,00 (hora adicional R$ 30)\n' +
    '• Fim de semana: R$ 70,00 (hora adicional R$ 30)\n\n' +
    '🌙 *Pernoite (12h):*\n' +
    '• Semana: R$ 180,00\n' +
    '• Fim de semana: R$ 239,00\n\n' +
    PERIODOS + '\n\n' +
    '⏰ Entrada direta, 24 horas!\n\n' +
    '💡 _A suíte mais em conta do Lamore, sem abrir mão do conforto e do estilo!_\n\n' +
    '_Digite *menu* a qualquer momento para voltar ao início._',

  luxo:
    '✨ *Suíte Luxo*\n\n' +
    'Sofisticação e bem-estar com exclusividade.\n\n' +
    '✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n✅ Chuveiro\n' +
    '🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n' +
    '• Semana: R$ 80,00 / FDS: R$ 85,00 (hora adicional R$ 35)\n\n' +
    '🌙 *Pernoite (12h):*\n' +
    '• Semana: R$ 179,00 / FDS: R$ 269,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 229,00\n\n' +
    '✨ _Dica: a Suíte Hidro tem hidromassagem privativa. Digite 3 para conhecer!_\n\n_Digite *menu* a qualquer momento para voltar ao início._',

  hidro:
    '🛁 *Suíte Hidro*\n\n' +
    'Hidromassagem privativa para momentos inesquecíveis.\n\n' +
    '✅ Hidromassagem\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n' +
    '🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n' +
    '• Semana: R$ 149,00 (hora adicional R$ 70) / FDS: R$ 169,00 (hora adicional R$ 80)\n\n' +
    '🌙 *Pernoite (12h):*\n' +
    '• Semana: R$ 299,00 / FDS: R$ 419,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 379,00\n\n' +
    '✨ _Dica: para o máximo, a Hidro Premium é nossa suíte top. Digite 4 para conhecer!_\n\n_Digite *menu* a qualquer momento para voltar ao início._',

  premium:
    '👑 *Hidro Premium*\n\n' +
    'Nossa suíte mais exclusiva. Máximo em bem-estar e privacidade.\n\n' +
    '✅ Hidromassagem premium\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n' +
    '🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n' +
    '• Semana: R$ 165,00 (hora adicional R$ 80) / FDS: R$ 185,00 (hora adicional R$ 90)\n\n' +
    '🌙 *Pernoite (12h):*\n' +
    '• Semana: R$ 329,00 / FDS: R$ 439,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 399,00\n\n' +
    '🏆 A escolha perfeita para quem quer o melhor!\n\n_Digite *menu* a qualquer momento para voltar ao início._',
};

const MENU =
  'Olá! Seja muito bem-vindo ao *Motel Lamore* 🌹\n\n' +
  'Somos referência em bem-estar e exclusividade em Ourinhos/SP.\n\n' +
  'Como posso te ajudar? Digite o número:\n\n' +
  '1 - Horários e preços\n' +
  '2 - Suíte Confort ✨ _Lançamento_\n' +
  '3 - Suíte Luxo\n' +
  '4 - Suíte Hidro\n' +
  '5 - Hidro Premium\n' +
  '6 - Ver fotos\n' +
  '7 - Decoração especial\n' +
  '8 - Disponibilidade de suítes\n' +
  '9 - Fazer uma reserva\n' +
  '0 - Falar com atendente';

const HORARIOS_PRECOS =
  '⏰ *Horários e valores do Motel Lamore*\n\n' +
  PERIODOS + '\n\n' +
  '💰 *Valores por suíte:*\n\n' +
  '🛋 Confort — 2h: R$ 65 (semana) | R$ 70 (FDS)\n' +
  '             Pernoite: R$ 180 (semana) | R$ 239 (FDS)\n\n' +
  '✨ Luxo — 2h: R$ 80 (semana) | R$ 85 (FDS)\n' +
  '         Pernoite: R$ 179 (semana) | R$ 269 (FDS)\n\n' +
  '🛁 Hidro — 2h: R$ 149 (semana) | R$ 169 (FDS)\n' +
  '           Pernoite: R$ 299 (semana) | R$ 419 (FDS)\n\n' +
  '👑 Premium — 2h: R$ 165 (semana) | R$ 185 (FDS)\n' +
  '             Pernoite: R$ 329 (semana) | R$ 439 (FDS)\n\n' +
  'Funcionamos *24 horas*, todos os dias!\n\n_Digite *menu* a qualquer momento para voltar ao início._';

const DECORACAO =
  '🌹 *Decoração Especial Lamore*\n\n' +
  'Transformamos a suíte num cenário único e inesquecível:\n\n' +
  '🛏 Cobertor vermelho\n' +
  '🛏 Lençol personalizado com frase à sua escolha\n' +
  '🎈 2 balões metálicos coração + 15 bexigas\n' +
  '🌹 Pétalas de rosas artificiais e naturais\n' +
  '🕯 Velas decorativas LED + aparador\n' +
  '🍫 2 pacotes de bombons\n' +
  '🛁 Toalhas e tapetes personalizados\n' +
  '🍾 Espumante no balde com gelo + 2 taças\n\n' +
  '📌 *Reserva com mínimo 48h de antecedência.*\n\n' +
  'Para reservar, digite *reservar*.\n\n_Digite *menu* a qualquer momento para voltar ao início._';

const PERNOITE_INFO =
  '🌙 *Opções de Pernoite (12h)*\n\n' +
  '🛋 Confort — R$ 180 (semana) | R$ 239 (FDS)\n' +
  '✨ Luxo — R$ 179 (semana) | R$ 269 (FDS)\n' +
  '🛁 Hidro — R$ 299 (semana) | R$ 419 (FDS)\n' +
  '👑 Premium — R$ 329 (semana) | R$ 439 (FDS)\n\n' +
  PERIODOS + '\n\n' +
  'Qual suíte te interessa?\n2 - Confort | 3 - Luxo | 4 - Hidro | 5 - Premium\n\n_Digite *menu* a qualquer momento para voltar ao início._';

// ============================================================
//  FLUXO DE RESERVA
// ============================================================
function processarReserva(tel, texto, sessao) {

  // Etapa 0: cliente escolhe o tipo de reserva
  if (sessao.etapa === 'reserva_tipo') {
    if (texto === '1' || contem(texto, ['decoracao','decoração','especial'])) {
      sessao.etapa = 'reserva_confirmar';
      enviarMensagem(tel,
        '🌹 *Reserva com Decoração Especial — Lamore*\n\n' +
        'Fazemos reservas *somente para suítes com decoração especial*.\n\n' +
        'Por isso pedimos *2 dias de antecedência* para preparar tudo com carinho para você. 🌹\n\n' +
        'Não realizamos reservas para suítes sem decoração especial.\n\n' +
        '📖 Confira nosso catálogo com todos os valores:\nhttps://wa.me/c/5514997915897\n\n' +
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado\n\n_Digite *menu* a qualquer momento para voltar ao início._'
      );
    } else if (texto === '2' || contem(texto, ['pernoite','sem decoracao','sem decoração','so pernoite','só pernoite'])) {
      sessao.etapa = 'reserva_pernoite_confirmar';
      enviarMensagem(tel,
        '🌙 *Reserva de Pernoite — Suíte Luxo*\n\n' +
        'Oferecemos reserva de pernoite sem decoração somente para a *Suíte Luxo*.\n\n' +
        '📋 *Condições importantes:*\n' +
        '⏰ Check-in liberado somente *após as 23h*\n' +
        '📅 Disponível apenas de *segunda a quinta-feira*\n' +
        '🚫 Para fins de semana, somente reservas com decoração especial\n\n' +
        '💰 *Valores Pernoite (12h):*\n' +
        '• Segunda a quarta-feira: R$ 179,00\n' +
        '• Quinta-feira: R$ 269,00 _(já considerado fim de semana)_\n\n' +
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado\n\n_Digite *menu* a qualquer momento para voltar ao início._'
      );
    } else {
      enviarMensagem(tel, 'Por favor, escolha uma opção:\n1 - Com decoração especial\n2 - Pernoite sem decoração (Suíte Luxo)');
    }
    return;
  }

  // Etapa 1b: cliente confirmou reserva de pernoite sem decoracao
  if (sessao.etapa === 'reserva_pernoite_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','pode','continuar','yes'])) {
      sessao.etapa = 'menu';
      enviarMensagem(tel,
        'Perfeito! 🌙\n\n' +
        'Um atendente irá entrar em contato em breve para confirmar sua reserva.\n\n' +
        'Aguarde! 😊'
      );
      alertarDono('decoracao', tel, 'Cliente deseja reserva de pernoite sem decoração — Suíte Luxo', null);
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
      enviarMensagem(tel, 'Tudo bem! Se precisar de algo mais é só me chamar 😊\n\nDigite *menu* para ver as opções.');
    }
    return;
  }

  // Etapa 1: cliente confirmou reserva com decoração
  if (sessao.etapa === 'reserva_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','pode','continuar','yes'])) {
      sessao.etapa = 'menu';
      enviarMensagem(tel,
        'Perfeito! 🌹\n\n' +
        'Um atendente irá entrar em contato em breve para prosseguir com sua reserva.\n\n' +
        'Aguarde!'
      );
      alertarDono('decoracao', tel, 'Cliente deseja fazer reserva com decoração especial', null);
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
      enviarMensagem(tel, 'Tudo bem! Se precisar de algo mais é só me chamar 😊\n\nDigite *menu* para ver as opções.');
    }
    return;
  }
}

// ============================================================
//  PROCESSADOR PRINCIPAL
// ============================================================
function processarMensagem(tel, textoOriginal, fromMe) {
  const texto  = textoOriginal.trim();
  const sessao = getSessao(tel);

  // Mensagem enviada pelo dono/atendente (fromMe=true)
  if (fromMe) {
    if (texto === '0') {
      // Dono envia "0" para liberar a Layla
      if (sessao.atendimentoHumano) desativarModoHumano(tel);
    } else {
      // Qualquer outra mensagem do dono ativa o modo humano e renova o timer de 30 min
      if (!sessao.atendimentoHumano) {
        ativarModoHumano(tel);
        console.log(`[HUMANO ATIVADO AUTOMATICAMENTE] ${tel}`);
      } else {
        renovarTimerHumano(tel);
        console.log(`[TIMER RENOVADO] ${tel}`);
      }
    }
    return;
  }

  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa} | humano: ${sessao.atendimentoHumano}`);

  // Cliente digita menu interrompe qualquer fluxo
  if (!fromMe && (texto === 'menu' || texto === 'Menu' || texto === 'MENU')) {
    sessao.etapa = 'aguardando';
    enviarMensagem(tel, MENU);
    return;
  }

  // Se atendimento humano ativo, Layla não responde
  if (sessao.atendimentoHumano) {
    console.log(`[IGNORADO] ${tel} - atendimento humano ativo`);
    return;
  }

  // Proteção número privado
  if (contem(texto, ['numero do dono','seu numero','numero interno','43996','99606','numero privado'])) {
    enviarMensagem(tel, 'Não tenho essa informação disponível 😊 Posso te ajudar com suítes, preços ou agendamentos!');
    return;
  }

  // Fluxo de reserva ativo
  if (sessao.etapa.startsWith('reserva_')) { processarReserva(tel, texto, sessao); return; }

  // Reclamação
  if (contem(texto, ['reclamacao','reclamação','reclamar','problema','pessimo','péssimo','horrivel','horrível','insatisfeito','nao gostei','não gostei','sujo','quebrado','ruim'])) {
    alertarDono('reclamacao', tel, texto, null);
    enviarMensagem(tel, 'Lamentamos muito que sua experiência não tenha sido a esperada 😔\n\nSua satisfação é muito importante para nós. Estou chamando um atendente agora. Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Item esquecido
  if (contem(texto, ['esqueci','esquecido','deixei','bolsa','carteira','celular','chave','documento','oculos','óculos','roupa','pertence'])) {
    alertarDono('esquecido', tel, texto, null);
    enviarMensagem(tel, 'Que situação chata! Vamos te ajudar a recuperar seu item o quanto antes 😊\n\nEstou chamando um atendente. Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Atendente humano
  if (contem(texto, ['atendente','humano','falar com','quero falar','me ajuda']) || texto === '0') {
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde um momento 😊\n\nAssim que ele finalizar o atendimento, estarei aqui novamente!');
    alertarDono('reclamacao', tel, `Solicitou atendente humano: "${texto}"`, null);
    ativarModoHumano(tel);
    return;
  }

  // Reserva — opção 9 ou palavras-chave
  if (contem(texto, ['reservar','reserva','agendar']) || texto === 'reservar' || texto === '9') {
    sessao.etapa = 'reserva_tipo';
    enviarMensagem(tel,
      '🌹 *Reservas — Motel Lamore*\n\n' +
      'Que tipo de reserva você deseja fazer?\n\n' +
      '1 - Com decoração especial 🎀\n' +
      '2 - Pernoite sem decoração 🌙'
    );
    return;
  }

  // Pernoite / dormir
  if (contem(texto, ['pernoite','passar a noite','pra noite','para a noite','so dormir','só dormir','ficar a noite','noite toda','noite inteira','dormir'])) {
    enviarMensagem(tel, PERNOITE_INFO);
    return;
  }

  // Fotos
  if (contem(texto, ['foto','fotos','imagem','mostra','galeria']) || texto === '6') {
    enviarMensagem(tel, `📸 *Galeria de fotos do Motel Lamore*\n\nConfira todas as nossas suítes:\n${FOTOS_URL}\n\n_Digite *menu* a qualquer momento para voltar ao início._`);
    return;
  }

  // Como chegar — só por palavras-chave, não mais pelo menu
  if (contem(texto, ['endereco','endereço','onde fica','localizacao','localização','como chegar','chegar','mapa'])) {
    enviarMensagem(tel, `📍 *Motel Lamore*\nRua Ana Neri, 501 — Ourinhos/SP\n\n🚗 Estacionamento coberto e privativo.\n\nAbertos 24 horas! 😊\n\n${MAPS_URL}\n\n_Digite *menu* a qualquer momento para voltar ao início._`);
    return;
  }

  // Disponibilidade
  if (contem(texto, ['disponivel','disponível','disponibilidade','tem suite','tem vaga','livre','vago']) || texto === '8') {
    enviarMensagem(tel, `Para verificar disponibilidade em tempo real:\n\n📞 *${TEL_REC}*\n\nAtendemos 24 horas!\n\n_Digite *menu* a qualquer momento para voltar ao início._`);
    return;
  }

  // Decoração
  if (texto === '7' || contem(texto, ['decoracao','decoração'])) { enviarMensagem(tel, DECORACAO); return; }

  // Horários e preços
  if (texto === '1' || contem(texto, ['horario','horário','preco','preço','valor','valores'])) { enviarMensagem(tel, HORARIOS_PRECOS); return; }

  // Suítes
  if (texto === '2' || contem(texto, ['confort','conforto'])) { enviarMensagem(tel, SUITES.confort); return; }
  if (texto === '3' || contem(texto, ['luxo'])) { enviarMensagem(tel, SUITES.luxo); return; }
  if (texto === '4' || contem(texto, ['hidro','hidromassagem'])) { enviarMensagem(tel, SUITES.hidro); return; }
  if (texto === '5' || contem(texto, ['premium'])) { enviarMensagem(tel, SUITES.premium); return; }

  // Saudação / menu
  // Cliente digita menu em qualquer momento
  if (texto === 'menu' || texto === 'Menu' || texto === 'MENU') {
    enviarMensagem(tel, MENU);
    sessao.etapa = 'aguardando';
    return;
  }

  if (contem(texto, ['oi','olá','ola','bom dia','boa tarde','boa noite','inicio','início']) || sessao.etapa === 'menu') {
    enviarMensagem(tel, MENU);
    sessao.etapa = 'aguardando';
    return;
  }

  // Fallback
  enviarMensagem(tel, 'Não entendi muito bem 😊\n\nDigite um número:\n1-Preços | 5-Fotos | 6-Decoração\n7-Disponibilidade | 8-Reservas | 0-Atendente');
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
    res.writeHead(200); res.end('Layla - Motel Lamore online 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('\n🌹 ============================================');
  console.log('   LAYLA - Assistente Virtual Motel Lamore');
  console.log('   Porta: ' + CONFIG.PORTA);
  console.log('🌹 ============================================\n');
});
