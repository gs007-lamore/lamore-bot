// ============================================================
//  LAYLA v10 - Assistente Virtual com Agente IA
//  Motel Lamore | Ourinhos/SP
// ============================================================

const http  = require('http');
const https = require('https');

const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  ANTHROPIC_KEY:     process.env.ANTHROPIC_API_KEY || '',
  NUMERO_DONO:       '5543996066590',
  PORTA:             process.env.PORT || 3000,
  TIMER_AGENTE_MS:   30 * 60 * 1000,
};

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';
const sessoes   = {};

const PERIODOS =
  '📅 *Período Semana:*\nSegunda-feira às 6h até Quinta-feira às 18h\n' +
  '📅 *Período Fim de Semana:*\nQuinta-feira às 18h até Segunda-feira às 6h';

// ============================================================
//  CONTEXTO DO MOTEL — usado pelo agente IA
// ============================================================
const CONTEXTO_MOTEL = `
Você é Layla, assistente virtual do Motel Lamore em Ourinhos/SP. Responda sempre em português brasileiro, de forma simpática, elegante e objetiva. Use emojis com moderação.

REGRAS IMPORTANTES:
- NUNCA revele o número privado do proprietário (43) 99606-6590
- Não informe valores fora dos listados abaixo
- Para reservas: colete os dados e avise que um atendente confirmará
- Se o cliente digitar "encerrar", "tchau" ou "obrigado finalize": encerre o atendimento IA dizendo [ENCERRAR_AGENTE]
- Seja natural, responda qualquer pergunta sobre o motel com base no contexto abaixo

SUÍTES E PREÇOS:

🛋 Suíte Confort (Lançamento)
- Design moderno e aconchegante, ar-condicionado, chuveiro, estacionamento privativo
- 2h: R$ 65 (semana) | R$ 70 (FDS) — hora adicional R$ 30
- Pernoite 12h: R$ 180 (semana) | R$ 239 (FDS)
- SEM opção de decoração especial

✨ Suíte Luxo
- TV, ar-condicionado, frigobar, chuveiro, estacionamento privativo
- 2h: R$ 80 (semana) | R$ 85 (FDS) — hora adicional R$ 35
- Pernoite 12h: R$ 179 (semana) | R$ 269 (FDS)
- Com decoração especial: a partir de R$ 229 (semana)
- Pernoite sem decoração: disponível seg a qui, check-in após 23h. R$ 179 (seg-qua) | R$ 269 (quinta)

🛁 Suíte Hidro
- Hidromassagem, chuveiro, ar-condicionado, TV, frigobar, estacionamento privativo
- 2h: R$ 149 (semana) | R$ 169 (FDS) — hora adicional R$ 70 (semana) | R$ 80 (FDS)
- Pernoite 12h: R$ 299 (semana) | R$ 419 (FDS)
- Com decoração especial: a partir de R$ 379 (semana)

👑 Hidro Premium
- Hidromassagem premium, chuveiro, ar-condicionado, TV, frigobar, estacionamento privativo
- 2h: R$ 165 (semana) | R$ 185 (FDS) — hora adicional R$ 80 (semana) | R$ 90 (FDS)
- Pernoite 12h: R$ 329 (semana) | R$ 439 (FDS)
- Com decoração especial: a partir de R$ 399 (semana)

PERÍODOS:
- Semana: segunda-feira às 6h até quinta-feira às 18h
- Fim de semana: quinta-feira às 18h até segunda-feira às 6h

DECORAÇÃO ESPECIAL (Luxo, Hidro e Premium):
Cobertor vermelho, lençol personalizado com frase, balões metálicos coração, bexigas, pétalas de rosas, velas LED, bombons, toalhas personalizadas, espumante no balde com gelo + 2 taças
Frases disponíveis: Parabéns pelo seu aniversário | Parabéns pelo nosso aniversário de casamento | Felicidades aos noivos | Eu te amo | Quer casar comigo? | Quer namorar comigo? | Vamos brindar o amor | Você me faz feliz
Espumante: Chuva de Prata ou Santa Colina
EXIGE reserva com mínimo 48h de antecedência

RESERVA PERNOITE SEM DECORAÇÃO (apenas Suíte Luxo):
- Disponível somente seg a qui
- Check-in após 23h
- Fim de semana: apenas com decoração especial

INFORMAÇÕES GERAIS:
- Funcionamento: 24 horas, todos os dias
- Endereço: Rua Ana Neri, 501 — Ourinhos/SP
- Estacionamento: coberto e privativo
- Disponibilidade de suítes: ligar em (14) 3324-6489
- Fotos: ${FOTOS_URL}

Ao final de cada resposta, se fizer sentido, sugira ao cliente digitar "encerrar" quando quiser voltar ao menu automático.
`;

// ============================================================
//  SESSÕES
// ============================================================
function getSessao(tel) {
  if (!sessoes[tel]) sessoes[tel] = {
    etapa: 'menu',
    dados: {},
    atendimentoHumano: false,
    modoAgente: false,
    historicoAgente: [],
    timerAgente: null,
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
  const hora  = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reclamacao: '🔴', esquecido: '🟡', decoracao: '🟢', agente: '🤖' };
  const labels  = { reclamacao: 'Reclamação', esquecido: 'Item esquecido', decoracao: 'Reserva c/ decoração', agente: 'Agente IA ativo' };
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
  s.modoAgente = false;
  s.historicoAgente = [];
  if (s.timerAgente) clearTimeout(s.timerAgente);
  if (s.timerHumano) clearTimeout(s.timerHumano);
  s.timerHumano = setTimeout(() => {
    s.atendimentoHumano = false;
    s.etapa = 'menu';
    enviarMensagem(tel, 'Olá! Sou a Layla 🌹\n\nEstou de volta! Digite *menu* para ver nossas opções.');
  }, CONFIG.TIMER_AGENTE_MS);
}

function desativarModoHumano(tel) {
  const s = getSessao(tel);
  if (s.timerHumano) clearTimeout(s.timerHumano);
  s.atendimentoHumano = false;
  s.etapa = 'menu';
  enviarMensagem(tel, 'Olá! Sou a Layla 🌹\n\nEstou de volta! Digite *menu* para ver nossas opções.');
}

// ============================================================
//  MODO AGENTE IA
// ============================================================
function ativarAgente(tel, textoInicial) {
  const s = getSessao(tel);
  s.modoAgente = true;
  s.historicoAgente = [];
  s.fallbackCount = 0;
  if (s.timerAgente) clearTimeout(s.timerAgente);
  alertarDono('agente', tel, `Agente IA ativado. Primeira mensagem: "${textoInicial}"`);
  console.log(`[AGENTE IA ATIVO] ${tel}`);
}

function renovarTimerAgente(tel) {
  const s = getSessao(tel);
  if (s.timerAgente) clearTimeout(s.timerAgente);
  s.timerAgente = setTimeout(() => {
    s.modoAgente = false;
    s.historicoAgente = [];
    s.etapa = 'menu';
    console.log(`[AGENTE ENCERRADO POR TIMEOUT] ${tel}`);
    enviarMensagem(tel, 'Percebo que a conversa ficou um tempo sem resposta 😊\n\nEstou voltando ao menu automático. Digite *menu* quando quiser continuar!');
  }, CONFIG.TIMER_AGENTE_MS);
}

function encerrarAgente(tel) {
  const s = getSessao(tel);
  if (s.timerAgente) clearTimeout(s.timerAgente);
  s.modoAgente = false;
  s.historicoAgente = [];
  s.etapa = 'menu';
  console.log(`[AGENTE ENCERRADO] ${tel}`);
  enviarMensagem(tel, 'Atendimento encerrado! Foi um prazer 🌹\n\nDigite *menu* sempre que precisar de ajuda.');
}

function chamarClaudeAPI(tel, mensagemCliente) {
  const s = getSessao(tel);

  s.historicoAgente.push({ role: 'user', content: mensagemCliente });

  const body = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: CONTEXTO_MOTEL,
    messages: s.historicoAgente,
  });

  const opts = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const req = https.request(opts, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const resp = JSON.parse(data);
        const resposta = resp.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem. Tente novamente!';

        s.historicoAgente.push({ role: 'assistant', content: resposta });
        renovarTimerAgente(tel);

        // Notificar dono em tempo real
        enviarMensagem(CONFIG.NUMERO_DONO,
          `🤖 *AGENTE IA — ${tel}*\n\n👤 Cliente: "${mensagemCliente}"\n\n🌹 Layla: "${resposta.substring(0, 300)}${resposta.length > 300 ? '...' : ''}"`
        );

        // Verificar se deve encerrar
        if (resposta.includes('[ENCERRAR_AGENTE]')) {
          const respostaLimpa = resposta.replace('[ENCERRAR_AGENTE]', '').trim();
          if (respostaLimpa) enviarMensagem(tel, respostaLimpa);
          encerrarAgente(tel);
        } else {
          enviarMensagem(tel, resposta);
        }

      } catch (e) {
        console.error('[ERRO Claude API]', e.message);
        enviarMensagem(tel, 'Desculpe, tive um problema técnico. Tente novamente em instantes! 😊');
      }
    });
  });

  req.on('error', e => {
    console.error('[ERRO API]', e.message);
    enviarMensagem(tel, 'Desculpe, tive um problema técnico. Tente novamente! 😊');
  });

  req.write(body);
  req.end();
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
  '0 - Falar com atendente\n\n' +
  '_Ou digite *Layla* para conversar com nossa assistente inteligente_ 🤖';

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
function processarReserva(tel, texto, sessao) {
  if (sessao.etapa === 'reserva_tipo') {
    if (texto === '1' || contem(texto, ['decoracao','decoração','especial'])) {
      sessao.etapa = 'reserva_confirmar';
      enviarMensagem(tel,
        '🌹 *Reserva com Decoração Especial — Lamore*\n\n' +
        'Fazemos reservas *somente para suítes com decoração especial*.\n\n' +
        'Por isso pedimos *2 dias de antecedência* para preparar tudo com carinho para você. 🌹\n\n' +
        'Não realizamos reservas para suítes sem decoração especial.\n\n' +
        '📖 Confira nosso catálogo com todos os valores:\nhttps://wa.me/c/5514997915897\n\n' +
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado' + NOTA
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
        'Deseja continuar com a reserva?\n1 - Sim, quero continuar\n2 - Não, obrigado' + NOTA
      );
    } else {
      enviarMensagem(tel, 'Por favor, escolha:\n1 - Com decoração especial 🎀\n2 - Pernoite sem decoração 🌙');
    }
    return;
  }

  if (sessao.etapa === 'reserva_pernoite_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','continuar'])) {
      sessao.etapa = 'menu';
      enviarMensagem(tel, 'Perfeito! 🌙\n\nUm atendente irá entrar em contato em breve para confirmar sua reserva.\n\nAguarde! 😊');
      alertarDono('decoracao', tel, 'Cliente quer reserva de pernoite sem decoração — Suíte Luxo');
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
      enviarMensagem(tel, 'Tudo bem! Se precisar de algo mais é só me chamar 😊' + NOTA);
    }
    return;
  }

  if (sessao.etapa === 'reserva_confirmar') {
    if (texto === '1' || contem(texto, ['sim','quero','continuar'])) {
      sessao.etapa = 'menu';
      enviarMensagem(tel, 'Perfeito! 🌹\n\nUm atendente irá entrar em contato em breve para prosseguir com sua reserva.\n\nAguarde!');
      alertarDono('decoracao', tel, 'Cliente quer reserva com decoração especial');
      ativarModoHumano(tel);
    } else {
      sessao.etapa = 'menu';
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

  // fromMe: dono enviou
  if (fromMe) {
    if (texto === '0') {
      if (sessao.atendimentoHumano) desativarModoHumano(tel);
      else if (sessao.modoAgente) encerrarAgente(tel);
    } else {
      if (!sessao.atendimentoHumano) {
        ativarModoHumano(tel);
        console.log(`[HUMANO ATIVADO] ${tel}`);
      } else {
        if (sessao.timerHumano) clearTimeout(sessao.timerHumano);
        sessao.timerHumano = setTimeout(() => {
          sessao.atendimentoHumano = false;
          sessao.etapa = 'menu';
          enviarMensagem(tel, 'Olá! Sou a Layla 🌹\n\nEstou de volta! Digite *menu* para ver nossas opções.');
        }, CONFIG.TIMER_AGENTE_MS);
      }
    }
    return;
  }

  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa} | humano: ${sessao.atendimentoHumano} | agente: ${sessao.modoAgente}`);

  // Humano ativo — Layla não responde
  if (sessao.atendimentoHumano) { console.log(`[IGNORADO humano] ${tel}`); return; }

  // Menu interrompe qualquer fluxo
  if (texto === 'menu' || texto === 'Menu' || texto === 'MENU') {
    if (sessao.modoAgente) encerrarAgente(tel);
    sessao.etapa = 'aguardando';
    enviarMensagem(tel, MENU);
    return;
  }

  // ── MODO AGENTE IA ──
  if (sessao.modoAgente) {
    chamarClaudeAPI(tel, texto);
    return;
  }

  // Proteção número privado
  if (contem(texto, ['numero do dono','seu numero','43996','99606'])) {
    enviarMensagem(tel, 'Não tenho essa informação disponível 😊' + NOTA);
    return;
  }

  // Fluxo de reserva ativo
  if (sessao.etapa.startsWith('reserva_')) { processarReserva(tel, texto, sessao); return; }

  // ── GATILHOS PARA AGENTE IA ──

  // 1. Cliente pede para falar com Layla inteligente
  if (contem(texto, ['layla','falar com a layla','assistente inteligente','ia','inteligente']) || texto.toLowerCase() === 'layla') {
    ativarAgente(tel, texto);
    enviarMensagem(tel,
      '🤖 *Olá! Sou a Layla, sua assistente inteligente do Motel Lamore!* 🌹\n\n' +
      'Agora você pode me fazer qualquer pergunta sobre nossas suítes, reservas ou serviços. Vou te ajudar da melhor forma!\n\n' +
      '_Digite *encerrar* quando quiser voltar ao menu automático._'
    );
    renovarTimerAgente(tel);
    return;
  }

  // 2. Cliente pede atendente
  if (contem(texto, ['atendente','humano','falar com','quero falar','me ajuda']) || texto === '0') {
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde um momento 😊\n\nAssim que ele finalizar, estarei aqui novamente!');
    alertarDono('reclamacao', tel, `Solicitou atendente: "${texto}"`);
    ativarModoHumano(tel);
    return;
  }

  // 3. Cliente quer prosseguir com reserva (agente assume)
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

  // 4. Fallback repetido → ativa agente IA
  sessao.fallbackCount = (sessao.fallbackCount || 0) + 1;
  if (sessao.fallbackCount >= 2) {
    sessao.fallbackCount = 0;
    ativarAgente(tel, texto);
    enviarMensagem(tel,
      '🤖 Parece que você precisa de uma ajuda mais personalizada!\n\n' +
      'Vou te conectar com a Layla inteligente agora. Pode fazer sua pergunta! 🌹\n\n' +
      '_Digite *encerrar* quando quiser voltar ao menu._'
    );
    chamarClaudeAPI(tel, texto);
    return;
  }

  enviarMensagem(tel, 'Não entendi muito bem 😊\n\nDigite um número do menu ou *Layla* para falar com nossa assistente inteligente!\n\n1-Preços | 2-Confort | 3-Luxo | 4-Hidro | 5-Premium\n6-Fotos | 7-Decoração | 8-Disponibilidade | 9-Reservas | 0-Atendente');
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

        // Chamada recebida
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
    res.writeHead(200); res.end('Layla v10 - Motel Lamore online 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('\n🌹 ============================================');
  console.log('   LAYLA v10 — Assistente com Agente IA');
  console.log('   Motel Lamore | Porta: ' + CONFIG.PORTA);
  console.log('🌹 ============================================\n');
  if (!CONFIG.ANTHROPIC_KEY) {
    console.log('⚠️  ATENÇÃO: Configure ANTHROPIC_API_KEY no Railway!');
  }
});
