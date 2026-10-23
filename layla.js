// ============================================================
//  LAYLA v12 - Assistente Virtual (Sem Agente IA)
//  Motel Lamore | Ourinhos/SP
// ============================================================

const http  = require('http');
const https = require('https');

const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  NUMERO_DONO:       '5543996066590',
  PORTA:             process.env.PORT || 3000,
  TIMER_HUMANO_MS:   2 * 60 * 60 * 1000, // 2 horas
};

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';
const sessoes   = {};

const PERIODOS =
  '📅 *Período Semana:*\nSegunda-feira às 6h até Quinta-feira às 18h\n' +
  '📅 *Período Fim de Semana:*\nQuinta-feira às 18h até Segunda-feira às 6h';

// ============================================================
//  SESSÕES
// ============================================================
function getSessao(tel) {
  if (!sessoes[tel]) sessoes[tel] = {
    etapa: 'menu',
    dados: {},
    atendimentoHumano: false,
    timerHumano: null,
    fallbackCount: 0,
  };
  return sessoes[tel];
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
    res.on('end', () => console.log(`[ENVIADO -> ${telefone}] ${res.statusCode}`));
  });
  req.on('error', e => console.error('[ERRO envio]', e.message));
  req.write(body);
  req.end();
}

function alertarDono(tipo, tel, msg) {
  const hora   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reclamacao: '🔴', esquecido: '🟡', decoracao: '🟢' };
  const labels  = { reclamacao: 'Reclamação', esquecido: 'Item esquecido', decoracao: 'Reserva c/ decoração' };
  enviarMensagem(CONFIG.NUMERO_DONO,
    `${icones[tipo]} *ALERTA LAMORE*\nTipo: ${labels[tipo]}\nCliente: ${tel}\nMsg: "${msg}"\nHorário: ${hora}`
  );
}

function contem(texto, palavras) {
  const t = texto.toLowerCase();
  return palavras.some(p => t.includes(p));
}

// ============================================================
//  MODO HUMANO
// ============================================================
function ativarModoHumano(tel) {
  const s = getSessao(tel);
  s.atendimentoHumano = true;
  if (s.timerHumano) clearTimeout(s.timerHumano);
  _reiniciarTimerHumano(tel);
}

function _reiniciarTimerHumano(tel) {
  const s = getSessao(tel);
  if (s.timerHumano) clearTimeout(s.timerHumano);
  s.timerHumano = setTimeout(() => {
    s.atendimentoHumano = false;
    s.etapa = 'menu';
    s.dados = {};
    console.log(`[HUMANO ENCERRADO por inatividade (2h)] ${tel}`);
    // Sem mensagem automática — próxima mensagem do cliente recebe o menu normalmente
  }, CONFIG.TIMER_HUMANO_MS);
}

function desativarModoHumano(tel) {
  const s = getSessao(tel);
  if (s.timerHumano) clearTimeout(s.timerHumano);
  s.atendimentoHumano = false;
  s.etapa = 'menu';
  s.dados = {};
  console.log(`[HUMANO ENCERRADO manualmente] ${tel}`);
  // Sem mensagem automática
}

// ============================================================
//  TEXTOS
// ============================================================
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

const NOTA = '\n\n_Digite *menu* a qualquer momento para voltar ao início._';

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
  'Funcionamos *24 horas*, todos os dias!' + NOTA;

const SUITES = {
  confort:
    '🛋 *Suíte Confort* ✨ _Lançamento_\n\n' +
    'Design moderno e aconchegante para o casal que busca conforto com estilo.\n\n' +
    '✅ Ar-condicionado\n✅ Banheiro equipado com chuveiro\n✅ Design moderno e aconchegante\n' +
    '🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n• Semana: R$ 65,00 (hora adicional R$ 30)\n• Fim de semana: R$ 70,00 (hora adicional R$ 30)\n\n' +
    '🌙 *Pernoite (12h):*\n• Semana: R$ 180,00\n• Fim de semana: R$ 239,00\n\n' +
    PERIODOS + '\n\n' +
    '💡 _A suíte mais em conta do Lamore, sem abrir mão do conforto e do estilo!_' + NOTA,

  luxo:
    '✨ *Suíte Luxo*\n\n' +
    'Sofisticação e bem-estar com exclusividade.\n\n' +
    '✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n✅ Chuveiro\n🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n• Semana: R$ 80,00 / FDS: R$ 85,00 (hora adicional R$ 35)\n\n' +
    '🌙 *Pernoite (12h):*\n• Semana: R$ 179,00 / FDS: R$ 269,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 229,00\n\n' +
    '✨ _Dica: a Suíte Hidro tem hidromassagem privativa. Digite 4 para conhecer!_' + NOTA,

  hidro:
    '🛁 *Suíte Hidro*\n\n' +
    'Hidromassagem privativa para momentos inesquecíveis.\n\n' +
    '✅ Hidromassagem\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n• Semana: R$ 149,00 (hora adicional R$ 70) / FDS: R$ 169,00 (hora adicional R$ 80)\n\n' +
    '🌙 *Pernoite (12h):*\n• Semana: R$ 299,00 / FDS: R$ 419,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 379,00\n\n' +
    '✨ _Dica: para o máximo, a Hidro Premium é nossa suíte top. Digite 5 para conhecer!_' + NOTA,

  premium:
    '👑 *Hidro Premium*\n\n' +
    'Nossa suíte mais exclusiva. Máximo em bem-estar e privacidade.\n\n' +
    '✅ Hidromassagem premium\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n🚗 Estacionamento coberto e privativo\n\n' +
    '💰 *2 horas:*\n• Semana: R$ 165,00 (hora adicional R$ 80) / FDS: R$ 185,00 (hora adicional R$ 90)\n\n' +
    '🌙 *Pernoite (12h):*\n• Semana: R$ 329,00 / FDS: R$ 439,00\n\n' +
    PERIODOS + '\n\n' +
    '🌹 Com decoração especial: a partir de R$ 399,00\n\n' +
    '🏆 A escolha perfeita para quem quer o melhor!' + NOTA,
};

const DECORACAO =
  '🌹 *Decoração Especial Lamore*\n\n' +
  'Transformamos a suíte num cenário único e inesquecível:\n\n' +
  '🛏 Cobertor vermelho\n🛏 Lençol personalizado com frase à sua escolha\n' +
  '🎈 2 balões metálicos coração + 15 bexigas\n🌹 Pétalas de rosas artificiais e naturais\n' +
  '🕯 Velas decorativas LED + aparador\n🍫 2 pacotes de bombons\n' +
  '🛁 Toalhas e tapetes personalizados\n🍾 Espumante no balde com gelo + 2 taças\n\n' +
  '📌 *Reserva com mínimo 48h de antecedência.*\n\nPara reservar, digite *reservar*.' + NOTA;

const PERNOITE_INFO =
  '🌙 *Opções de Pernoite (12h)*\n\n' +
  '🛋 Confort — R$ 180 (semana) | R$ 239 (FDS)\n' +
  '✨ Luxo — R$ 179 (semana) | R$ 269 (FDS)\n' +
  '🛁 Hidro — R$ 299 (semana) | R$ 419 (FDS)\n' +
  '👑 Premium — R$ 329 (semana) | R$ 439 (FDS)\n\n' +
  PERIODOS + '\n\n' +
  'Qual suíte te interessa?\n2 - Confort | 3 - Luxo | 4 - Hidro | 5 - Premium' + NOTA;

// ============================================================
//  FLUXO DE RESERVA
// ============================================================
function querVoltar(texto) {
  const t = texto.trim().toLowerCase();
  return t === '0' || t === 'menu' || t === 'cancelar' || t === 'voltar';
}

function processarReserva(tel, texto, sessao) {
  if (querVoltar(texto)) {
    sessao.etapa = 'aguardando';
    sessao.dados = {};
    enviarMensagem(tel, MENU);
    return;
  }

  if (sessao.etapa === 'reserva_tipo') {
    if (texto === '1' || contem(texto, ['decoracao','decoração','especial'])) {
      sessao.etapa = 'reserva_confirmar';
      enviarMensagem(tel,
        '🌹 *Reserva com Decoração Especial — Lamore*\n\n' +
        'Fazemos reservas *somente para suítes com decoração especial*.\n\n' +
        'Por isso pedimos *2 dias de antecedência* para preparar tudo com carinho para você. 🌹\n\n' +
        'Não realizamos reservas para suítes sem decoração especial.\n\n' +
        '📖 Confira nosso catálogo com todos os valores:\nhttps://wa.me/c/5514997915897\n\n' +
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado\n0 - Voltar ao menu' + NOTA
      );
    } else if (texto === '2' || contem(texto, ['pernoite','sem decoracao','sem decoração'])) {
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
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado\n0 - Voltar ao menu' + NOTA
      );
    } else {
      enviarMensagem(tel, 'Por favor, escolha:\n1 - Com decoração especial 🎀\n2 - Pernoite sem decoração 🌙\n0 - Voltar ao menu');
    }
    return;
  }

  if (sessao.etapa === 'reserva_pernoite_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','continuar'])) {
      sessao.etapa = 'menu';
      sessao.dados = {};
      enviarMensagem(tel, 'Perfeito! 🌙\n\nUm atendente irá entrar em contato em breve para confirmar sua reserva.\n\nAguarde! 😊');
      alertarDono('decoracao', tel, 'Cliente quer reserva de pernoite sem decoração — Suíte Luxo');
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
      sessao.dados = {};
      enviarMensagem(tel, 'Tudo bem! Se precisar de algo mais é só me chamar 😊' + NOTA);
    }
    return;
  }

  if (sessao.etapa === 'reserva_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','continuar'])) {
      sessao.etapa = 'menu';
      sessao.dados = {};
      enviarMensagem(tel, 'Perfeito! 🌹\n\nUm atendente irá entrar em contato em breve para prosseguir com sua reserva.\n\nAguarde!');
      alertarDono('decoracao', tel, 'Cliente quer reserva com decoração especial');
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
      sessao.dados = {};
      enviarMensagem(tel, 'Tudo bem! Se precisar de algo mais é só me chamar 😊' + NOTA);
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

  // fromMe: atendente enviou mensagem pelo WhatsApp do motel
  if (fromMe) {
    if (texto.toLowerCase() === 'atendimento finalizado') {
      // Encerra modo humano silenciosamente
      if (sessao.atendimentoHumano) desativarModoHumano(tel);
      return;
    }
    if (texto === '0') {
      if (sessao.atendimentoHumano) desativarModoHumano(tel);
    } else {
      if (!sessao.atendimentoHumano) {
        ativarModoHumano(tel);
        console.log(`[HUMANO ATIVADO] ${tel}`);
      } else {
        // Atendente continua no atendimento — reinicia o timer de 2h
        _reiniciarTimerHumano(tel);
      }
    }
    return;
  }

  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa} | humano: ${sessao.atendimentoHumano}`);

  // Humano ativo — Layla não responde
  if (sessao.atendimentoHumano) { console.log(`[IGNORADO humano] ${tel}`); return; }

  // Menu interrompe qualquer fluxo
  if (texto.toLowerCase() === 'menu') {
    sessao.etapa = 'aguardando';
    sessao.dados = {};
    enviarMensagem(tel, MENU);
    return;
  }

  // Proteção número privado
  if (contem(texto, ['numero do dono','seu numero','43996','99606'])) {
    enviarMensagem(tel, 'Não tenho essa informação disponível 😊' + NOTA);
    return;
  }

  // Fluxo de reserva ativo
  if (sessao.etapa.startsWith('reserva_')) { processarReserva(tel, texto, sessao); return; }

  // Solicitar atendente humano
  if (contem(texto, ['atendente','humano','falar com','quero falar','me ajuda']) || texto === '0') {
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde um momento 😊\n\nAssim que ele finalizar, estarei aqui novamente!');
    alertarDono('reclamacao', tel, `Solicitou atendente: "${texto}"`);
    ativarModoHumano(tel);
    return;
  }

  // Reserva
  if (contem(texto, ['reservar','reserva','agendar']) || texto === 'reservar' || texto === '9') {
    sessao.etapa = 'reserva_tipo';
    enviarMensagem(tel,
      '🌹 *Reservas — Motel Lamore*\n\n' +
      'Que tipo de reserva você deseja fazer?\n\n' +
      '1 - Com decoração especial 🎀\n' +
      '2 - Pernoite sem decoração 🌙\n' +
      '0 - Voltar ao menu'
    );
    return;
  }

  // Reclamação
  if (contem(texto, ['reclamacao','reclamação','reclamar','pessimo','péssimo','horrivel','insatisfeito','nao gostei','não gostei','sujo','quebrado','ruim'])) {
    alertarDono('reclamacao', tel, texto);
    enviarMensagem(tel, 'Lamentamos muito 😔\n\nEstou chamando um atendente agora. Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Item esquecido
  if (contem(texto, ['esqueci','esquecido','deixei','bolsa','carteira','celular','chave','documento','oculos','óculos','roupa'])) {
    alertarDono('esquecido', tel, texto);
    enviarMensagem(tel, 'Que situação! Estou chamando um atendente para te ajudar 😊 Aguarde!');
    ativarModoHumano(tel);
    return;
  }

  // Pernoite
  if (contem(texto, ['pernoite','passar a noite','so dormir','só dormir','noite toda','noite inteira','dormir'])) {
    enviarMensagem(tel, PERNOITE_INFO); return;
  }

  // Fotos
  if (contem(texto, ['foto','fotos','imagem','mostra','galeria']) || texto === '6') {
    enviarMensagem(tel, `📸 *Galeria de fotos do Motel Lamore*\n\nConfira todas as nossas suítes:\n${FOTOS_URL}` + NOTA); return;
  }

  // Como chegar
  if (contem(texto, ['endereco','endereço','onde fica','localizacao','localização','como chegar','chegar','mapa'])) {
    enviarMensagem(tel, `📍 *Motel Lamore*\nRua Ana Neri, 501 — Ourinhos/SP\n\n🚗 Estacionamento coberto e privativo.\n\nAbertos 24 horas! 😊\n\n${MAPS_URL}` + NOTA); return;
  }

  // Disponibilidade
  if (contem(texto, ['disponivel','disponível','disponibilidade','tem suite','tem vaga','livre','vago']) || texto === '8') {
    enviarMensagem(tel, `Para verificar disponibilidade:\n\n📞 *${TEL_REC}*\n\nAtendemos 24 horas!` + NOTA); return;
  }

  // Decoração
  if (texto === '7' || contem(texto, ['decoracao','decoração'])) { enviarMensagem(tel, DECORACAO); return; }

  // Horários e preços
  if (texto === '1' || contem(texto, ['horario','horário','preco','preço','valor','valores'])) { enviarMensagem(tel, HORARIOS_PRECOS); return; }

  // Suítes
  if (texto === '2' || contem(texto, ['confort','conforto'])) { enviarMensagem(tel, SUITES.confort); return; }
  if (texto === '3' || contem(texto, ['luxo'])) { enviarMensagem(tel, SUITES.luxo); return; }
  if (texto === '4' || (contem(texto, ['hidro']) && !contem(texto, ['premium']))) { enviarMensagem(tel, SUITES.hidro); return; }
  if (texto === '5' || contem(texto, ['premium'])) { enviarMensagem(tel, SUITES.premium); return; }

  // Saudação
  if (contem(texto, ['oi','olá','ola','bom dia','boa tarde','boa noite','inicio','início']) || sessao.etapa === 'menu') {
    enviarMensagem(tel, MENU); sessao.etapa = 'aguardando'; return;
  }

  // Fallback
  sessao.fallbackCount = (sessao.fallbackCount || 0) + 1;
  if (sessao.fallbackCount >= 2) {
    sessao.fallbackCount = 0;
    enviarMensagem(tel, 'Não consegui entender sua dúvida 😊\n\nQuer falar com um atendente?\n\n0 - Sim, chamar atendente\n\nOu digite *menu* para ver as opções.');
    return;
  }

  enviarMensagem(tel, 'Não entendi muito bem 😊\n\nDigite um número do menu:\n\n1-Preços | 2-Confort | 3-Luxo | 4-Hidro | 5-Premium\n6-Fotos | 7-Decoração | 8-Disponibilidade | 9-Reservas | 0-Atendente');
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
        const tipo   = payload.type || payload.messageType || '';

        // Chamada recebida — não atende, manda mensagem
        if (tel && !fromMe && (tipo === 'call' || tipo === 'ReceivedCall' || payload.isCall)) {
          console.log(`[CHAMADA RECUSADA] ${tel}`);
          setTimeout(() => {
            enviarMensagem(tel,
              'Olá! 😊\n\n' +
              'Não atendemos por ligação. Por favor, envie uma mensagem que te respondemos rapidinho!\n\n' +
              'Digite *menu* para ver nossas opções. 🌹'
            );
          }, 2000);
        } else if (tel && texto) {
          processarMensagem(tel, texto, fromMe);
        }
      } catch (e) { console.error('[ERRO]', e.message); }
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(200); res.end('Layla v12 - Motel Lamore online 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('\n🌹 ============================================');
  console.log('   LAYLA v12 — Assistente Virtual (Sem IA)');
  console.log('   Motel Lamore | Porta: ' + CONFIG.PORTA);
  console.log('🌹 ============================================\n');
});
